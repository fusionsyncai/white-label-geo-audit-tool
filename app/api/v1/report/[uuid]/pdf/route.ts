import fs from "node:fs/promises";
import { initDb, getReport } from "@/lib/db";
import { reportPdfPath } from "@/lib/config";
import { rerenderPdf, saveUploadedLogo } from "@/lib/jobs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function streamPdf(uuid: string, download: boolean) {
  const pdfPath = reportPdfPath(uuid);
  try {
    const buf = await fs.readFile(pdfPath);
    return new Response(buf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": download
          ? `attachment; filename="geo-audit-${uuid}.pdf"`
          : `inline; filename="geo-audit-${uuid}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json({ error: "PDF not ready" }, { status: 404 });
  }
}

export async function GET(
  request: Request,
  ctx: { params: Promise<{ uuid: string }> }
) {
  await initDb();
  const { uuid } = await ctx.params;
  const report = await getReport(uuid);

  if (!report) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (report.status !== "done") {
    return Response.json(
      { error: "Report not ready", status: report.status },
      { status: 409 }
    );
  }

  const { searchParams } = new URL(request.url);
  const download = searchParams.get("download") === "1";
  return streamPdf(uuid, download);
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ uuid: string }> }
) {
  await initDb();
  const { uuid } = await ctx.params;
  const report = await getReport(uuid);

  if (!report) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (!report.markdown) {
    return Response.json({ error: "Report not ready" }, { status: 409 });
  }

  const form = await request.formData();
  const companyName = String(form.get("companyName") || "").trim() || undefined;
  const accentColor = String(form.get("accentColor") || "").trim() || undefined;
  const contact = String(form.get("contact") || "").trim() || undefined;
  const scoreSubtext =
    String(form.get("scoreSubtext") || "").trim() || undefined;
  const ctaText = String(form.get("ctaText") || "").trim() || undefined;
  const logoFile = form.get("logo");

  let logoPath: string | undefined;
  if (logoFile instanceof File && logoFile.size > 0) {
    const buffer = Buffer.from(await logoFile.arrayBuffer());
    logoPath = await saveUploadedLogo(uuid, buffer, logoFile.name);
  } else if (report.logo_path) {
    logoPath = report.logo_path;
  }

  await rerenderPdf(uuid, {
    companyName,
    accentColor,
    logoPath,
    contact,
    scoreSubtext,
    ctaText,
  });

  const download = form.get("download") === "1";
  return streamPdf(uuid, download);
}
