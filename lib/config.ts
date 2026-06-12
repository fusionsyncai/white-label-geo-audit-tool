import path from "node:path";

function envFlag(name: string, defaultValue = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultValue;
  return ["1", "true", "yes", "on"].includes(raw.trim().toLowerCase());
}

const projectRoot = process.cwd();

export const config = {
  projectRoot,
  dataDir: process.env.DATA_DIR?.trim() || path.join(projectRoot, ".data"),
  databaseUrl:
    process.env.DATABASE_URL?.trim() ||
    "postgresql://geo:geo@localhost:5432/geo_reports",
  cursorApiKey: process.env.CURSOR_API_KEY?.trim() || "",
  cursorAgentBin: process.env.CURSOR_AGENT_BIN?.trim() || "cursor-agent",
  cursorModel: process.env.CURSOR_AGENT_MODEL?.trim() || "auto",
  autoApprove: envFlag("CURSOR_AGENT_AUTO_APPROVE", true),
  approveMcps: envFlag("CURSOR_AGENT_APPROVE_MCPS", true),
  geoSkillPath:
    process.env.GEO_SKILL_PATH?.trim() ||
    path.join(projectRoot, "geo-skill"),
  chromeBin:
    process.env.CHROME_BIN?.trim() ||
    (process.platform === "darwin"
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : "chromium"),
  maxConcurrentAudits: Number(process.env.MAX_CONCURRENT_AUDITS || "2"),
  resendApiKey: process.env.RESEND_API_KEY?.trim() || "",
  emailFrom:
    process.env.EMAIL_FROM?.trim() ||
    "FusionSync AI <reports@geo-report.fusionsync.ai>",
  apiSecret: process.env.API_SECRET?.trim() || "",
  defaultBrand: {
    companyName: process.env.DEFAULT_BRAND_NAME?.trim() || "FusionSync AI",
    accentColor: process.env.DEFAULT_ACCENT_COLOR?.trim() || "#2563eb",
    logoPath:
      process.env.DEFAULT_LOGO_PATH?.trim() ||
      path.join(projectRoot, "public", "brand", "fusionsync-logo.svg"),
    contact:
      process.env.DEFAULT_BRAND_CONTACT?.trim() || "https://www.fusionsync.ai",
  },
  templatesDir: path.join(projectRoot, "templates"),
};

export function jobDir(uuid: string): string {
  return path.join(config.dataDir, "reports", uuid);
}

export function workDir(uuid: string): string {
  return path.join(config.dataDir, "work", uuid);
}

export function reportMarkdownPath(uuid: string): string {
  return path.join(jobDir(uuid), "GEO-AUDIT-REPORT.md");
}

export function reportPdfPath(uuid: string): string {
  return path.join(jobDir(uuid), "report.pdf");
}

export function reportHtmlPath(uuid: string): string {
  return path.join(jobDir(uuid), "report.html");
}
