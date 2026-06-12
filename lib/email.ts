import { Resend } from "resend";
import { config } from "./config";
import { absoluteUrl, siteConfig } from "./site";

let client: Resend | null = null;

export function isEmailEnabled(): boolean {
  return Boolean(config.resendApiKey);
}

function getClient(): Resend | null {
  if (!config.resendApiKey) return null;
  if (!client) client = new Resend(config.resendApiKey);
  return client;
}

type NotifyOptions = {
  to: string;
  uuid: string;
  url: string;
  status: "done" | "error";
};

export async function sendReportReadyEmail(opts: NotifyOptions): Promise<void> {
  const resend = getClient();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping notification");
    return;
  }

  const reportUrl = absoluteUrl(`/report/${opts.uuid}`);
  const isError = opts.status === "error";

  const subject = isError
    ? `Your GEO audit for ${opts.url} couldn't be completed`
    : `Your GEO audit for ${opts.url} is ready`;

  const heading = isError
    ? "We hit a snag running your audit"
    : "Your AI search visibility report is ready";

  const body = isError
    ? `Unfortunately the audit for <strong>${opts.url}</strong> didn't finish. You can head back and try again.`
    : `The AI search visibility audit for <strong>${opts.url}</strong> is done. Open it to view your score, customize the white-label branding, and download the PDF.`;

  const ctaLabel = isError ? "Try again" : "View your report";

  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;">
        <p style="margin:0 0 4px;font-size:13px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#2563eb;">FusionSync AI</p>
        <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0f172a;">${heading}</h1>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569;">${body}</p>
        <a href="${reportUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px;">${ctaLabel}</a>
        <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;">Or paste this link into your browser:<br/><a href="${reportUrl}" style="color:#2563eb;word-break:break-all;">${reportUrl}</a></p>
      </div>
      <p style="margin:20px 0 0;text-align:center;font-size:12px;color:#94a3b8;">
        Sent by ${siteConfig.shortName}. You received this because you requested a notification for this audit.
      </p>
    </div>
  </body>
</html>`;

  const text = `${heading}\n\n${opts.url}\n\n${ctaLabel}: ${reportUrl}`;

  try {
    await resend.emails.send({
      from: config.emailFrom,
      to: opts.to,
      subject,
      html,
      text,
    });
  } catch (err) {
    console.error("[email] failed to send notification:", err);
  }
}
