import { initDb, getReport } from "@/lib/db";
import { isEmailEnabled } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ uuid: string }> }
) {
  await initDb();
  const { uuid } = await ctx.params;
  const report = await getReport(uuid);

  if (!report) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({
    uuid: report.uuid,
    url: report.url,
    status: report.status,
    score: report.score,
    scoreLabel: report.score_label,
    error: report.error,
    companyName: report.company_name,
    accentColor: report.accent_color,
    contact: report.contact,
    scoreSubtext: report.score_subtext,
    ctaText: report.cta_text,
    emailEnabled: isEmailEnabled(),
    notifyEmailSet: Boolean(report.notify_email),
    createdAt: report.created_at,
    updatedAt: report.updated_at,
  });
}
