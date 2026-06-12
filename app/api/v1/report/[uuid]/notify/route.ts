import { getReport, initDb, setNotifyEmail } from "@/lib/db";
import { notifyReportReady } from "@/lib/jobs";
import { isEmailEnabled } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(
  request: Request,
  ctx: { params: Promise<{ uuid: string }> }
) {
  if (!isEmailEnabled()) {
    return Response.json(
      { error: "Email notifications are not enabled." },
      { status: 503 }
    );
  }

  await initDb();
  const { uuid } = await ctx.params;

  let email = "";
  try {
    const body = (await request.json()) as { email?: string };
    email = (body.email ?? "").trim().toLowerCase();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return Response.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const report = await getReport(uuid);
  if (!report) {
    return Response.json({ error: "Report not found" }, { status: 404 });
  }

  await setNotifyEmail(uuid, email);

  // If the report already finished, send right away.
  if (report.status === "done" || report.status === "error") {
    await notifyReportReady(uuid);
    return Response.json({ ok: true, sent: true });
  }

  return Response.json({ ok: true, sent: false });
}
