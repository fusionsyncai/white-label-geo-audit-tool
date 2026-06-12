import fs from "node:fs/promises";
import path from "node:path";
import { config } from "./config";

export const DEFAULT_SCORE_SUBTEXT =
  "AI Search Visibility Score — how visible this site is to ChatGPT, Perplexity, Gemini, and Google AI Overviews.";

export type Branding = {
  companyName: string;
  accentColor: string;
  logoPath: string;
  contact: string;
  scoreSubtext: string;
  ctaText: string;
};

export function defaultCtaText(companyName: string, contact: string): string {
  return `Want help fixing these issues? Contact ${companyName} at ${contact}`;
}

export function defaultBranding(): Branding {
  return {
    companyName: config.defaultBrand.companyName,
    accentColor: config.defaultBrand.accentColor,
    logoPath: config.defaultBrand.logoPath,
    contact: config.defaultBrand.contact,
    scoreSubtext: DEFAULT_SCORE_SUBTEXT,
    ctaText: defaultCtaText(
      config.defaultBrand.companyName,
      config.defaultBrand.contact
    ),
  };
}

export async function logoToDataUri(logoPath: string): Promise<string> {
  const ext = path.extname(logoPath).toLowerCase();
  const buf = await fs.readFile(logoPath);
  const mime =
    ext === ".svg"
      ? "image/svg+xml"
      : ext === ".png"
        ? "image/png"
        : ext === ".jpg" || ext === ".jpeg"
          ? "image/jpeg"
          : "application/octet-stream";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

export async function resolveBranding(
  overrides?: Partial<Branding>
): Promise<Branding> {
  const base = defaultBranding();
  const companyName = overrides?.companyName?.trim() || base.companyName;
  const contact = overrides?.contact?.trim() || base.contact;
  const branding: Branding = {
    companyName,
    accentColor: overrides?.accentColor?.trim() || base.accentColor,
    logoPath: overrides?.logoPath || base.logoPath,
    contact,
    scoreSubtext: overrides?.scoreSubtext?.trim() || DEFAULT_SCORE_SUBTEXT,
    ctaText:
      overrides?.ctaText?.trim() || defaultCtaText(companyName, contact),
  };
  return branding;
}

export function scoreColor(score: number | null, accent: string): string {
  if (score === null) return accent;
  if (score >= 80) return "#16a34a";
  if (score >= 65) return "#2563eb";
  if (score >= 50) return "#d97706";
  if (score >= 35) return "#ea580c";
  return "#dc2626";
}
