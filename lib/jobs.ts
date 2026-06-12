import fs from "node:fs/promises";
import path from "node:path";
import { config, jobDir } from "./config";
import {
  createReport,
  getReport,
  markEmailNotified,
  updateReport,
} from "./db";
import { runGeoAudit } from "./geoAudit";
import { renderReportPdf } from "./pdf";
import { sendReportReadyEmail } from "./email";

export async function notifyReportReady(uuid: string): Promise<void> {
  const report = await getReport(uuid);
  if (!report || !report.notify_email || report.email_notified) return;
  if (report.status !== "done" && report.status !== "error") return;

  await sendReportReadyEmail({
    to: report.notify_email,
    uuid,
    url: report.url,
    status: report.status,
  });
  await markEmailNotified(uuid);
}

const activeJobs = new Set<string>();
let runningCount = 0;
const waitQueue: Array<() => void> = [];

async function acquireSlot(): Promise<void> {
  if (runningCount < config.maxConcurrentAudits) {
    runningCount++;
    return;
  }
  await new Promise<void>((resolve) => waitQueue.push(resolve));
  runningCount++;
}

function releaseSlot(): void {
  runningCount--;
  const next = waitQueue.shift();
  if (next) next();
}

export async function enqueueReport(
  uuid: string,
  url: string,
  ip?: string
): Promise<void> {
  await createReport(uuid, url, ip);
  void processReport(uuid, url);
}

async function processReport(uuid: string, url: string): Promise<void> {
  if (activeJobs.has(uuid)) return;
  activeJobs.add(uuid);

  await acquireSlot();
  try {
    await updateReport(uuid, { status: "auditing" });

    const { markdown, parsed } = await runGeoAudit(uuid, url);

    await updateReport(uuid, {
      status: "rendering",
      markdown,
      score: parsed.score,
      score_label: parsed.scoreLabel,
    });

    await renderReportPdf(uuid, markdown);

    await updateReport(uuid, { status: "done" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await updateReport(uuid, { status: "error", error: message });
  } finally {
    activeJobs.delete(uuid);
    releaseSlot();
    void notifyReportReady(uuid).catch((e) =>
      console.error("[notify] failed:", e)
    );
  }
}

export async function rerenderPdf(
  uuid: string,
  branding: {
    companyName?: string;
    accentColor?: string;
    logoPath?: string;
    contact?: string;
    scoreSubtext?: string;
    ctaText?: string;
  }
): Promise<string> {
  const report = await getReport(uuid);
  if (!report?.markdown) {
    throw new Error("Report markdown not found");
  }

  await updateReport(uuid, {
    company_name: branding.companyName ?? report.company_name,
    accent_color: branding.accentColor ?? report.accent_color,
    logo_path: branding.logoPath ?? report.logo_path,
    contact: branding.contact ?? report.contact,
    score_subtext: branding.scoreSubtext ?? report.score_subtext,
    cta_text: branding.ctaText ?? report.cta_text,
    status: "rendering",
  });

  try {
    const pdfPath = await renderReportPdf(uuid, report.markdown, {
      companyName: branding.companyName ?? report.company_name ?? undefined,
      accentColor: branding.accentColor ?? report.accent_color ?? undefined,
      logoPath: branding.logoPath ?? report.logo_path ?? undefined,
      contact: branding.contact ?? report.contact ?? undefined,
      scoreSubtext: branding.scoreSubtext ?? report.score_subtext ?? undefined,
      ctaText: branding.ctaText ?? report.cta_text ?? undefined,
    });
    await updateReport(uuid, { status: "done" });
    return pdfPath;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await updateReport(uuid, { status: "error", error: message });
    throw err;
  }
}

export async function saveUploadedLogo(
  uuid: string,
  buffer: Buffer,
  filename: string
): Promise<string> {
  const ext = path.extname(filename) || ".png";
  const dir = jobDir(uuid);
  await fs.mkdir(dir, { recursive: true });
  const logoPath = path.join(dir, `logo${ext}`);
  await fs.writeFile(logoPath, buffer);
  await updateReport(uuid, { logo_path: logoPath });
  return logoPath;
}
