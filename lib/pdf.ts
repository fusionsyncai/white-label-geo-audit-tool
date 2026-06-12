import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { marked } from "marked";
import {
  config,
  reportHtmlPath,
  reportPdfPath,
} from "./config";
import {
  type Branding,
  logoToDataUri,
  resolveBranding,
  scoreColor,
} from "./branding";
import { parseScoreFromMarkdown } from "./geoAudit";

async function readTemplate(name: string): Promise<string> {
  return fs.readFile(path.join(config.templatesDir, name), "utf8");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function postProcessHtml(html: string): string {
  // Color-code XX/100 in tables
  return html.replace(/(\d+(?:\.\d+)?)\/100/g, (match, num) => {
    const n = Number(num);
    let color = "#dc2626";
    if (n >= 80) color = "#16a34a";
    else if (n >= 65) color = "#2563eb";
    else if (n >= 50) color = "#d97706";
    else if (n >= 35) color = "#ea580c";
    return `<span class="score-cell" style="color:${color};font-weight:700">${match}</span>`;
  });
}

export async function renderReportPdf(
  uuid: string,
  markdown: string,
  brandingOverrides?: Partial<Branding>
): Promise<string> {
  const branding = await resolveBranding(brandingOverrides);
  const parsed = parseScoreFromMarkdown(markdown);
  const logoDataUri = await logoToDataUri(branding.logoPath);
  const bodyHtml = postProcessHtml(await marked.parse(markdown));
  const css = await readTemplate("report.css");
  const template = await readTemplate("report-template.html");

  const score = parsed.score;
  const badgeColor = scoreColor(score, branding.accentColor);

  const html = template
    .replace(/\{\{CSS\}\}/g, css)
    .replace(/\{\{ACCENT_COLOR\}\}/g, branding.accentColor)
    .replace(/\{\{COMPANY_NAME\}\}/g, escapeHtml(branding.companyName))
    .replace(/\{\{CONTACT\}\}/g, escapeHtml(branding.contact))
    .replace(/\{\{LOGO_DATA_URI\}\}/g, logoDataUri)
    .replace(/\{\{BRAND_NAME\}\}/g, escapeHtml(parsed.brandName || "Prospect"))
    .replace(/\{\{DOMAIN\}\}/g, escapeHtml(parsed.domain || ""))
    .replace(
      /\{\{GEO_SCORE\}\}/g,
      score !== null ? String(score) : "—"
    )
    .replace(
      /\{\{SCORE_LABEL\}\}/g,
      escapeHtml(parsed.scoreLabel || "Audit Complete")
    )
    .replace(/\{\{BADGE_COLOR\}\}/g, badgeColor)
    .replace(/\{\{SCORE_SUBTEXT\}\}/g, escapeHtml(branding.scoreSubtext))
    .replace(/\{\{COVER_CTA\}\}/g, escapeHtml(branding.ctaText))
    .replace(/\{\{BODY_HTML\}\}/g, bodyHtml);

  const htmlPath = reportHtmlPath(uuid);
  const pdfPath = reportPdfPath(uuid);
  await fs.mkdir(path.dirname(htmlPath), { recursive: true });
  await fs.writeFile(htmlPath, html, "utf8");

  await printPdf(htmlPath, pdfPath);
  return pdfPath;
}

function printPdf(htmlPath: string, pdfPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const fileUrl = `file://${htmlPath}`;
    const args = [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      `--print-to-pdf=${pdfPath}`,
      "--print-to-pdf-no-header",
      "--no-pdf-header-footer",
      "--virtual-time-budget=8000",
      fileUrl,
    ];

    const proc = spawn(config.chromeBin, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    const errChunks: Buffer[] = [];
    proc.stderr?.on("data", (d: Buffer) => errChunks.push(d));

    proc.on("error", reject);
    proc.on("close", async (code) => {
      if (code !== 0) {
        const stderr = Buffer.concat(errChunks).toString("utf8");
        reject(new Error(`Chrome PDF print failed (code ${code}): ${stderr}`));
        return;
      }
      try {
        await fs.access(pdfPath);
        resolve();
      } catch {
        reject(new Error("PDF file was not created"));
      }
    });
  });
}
