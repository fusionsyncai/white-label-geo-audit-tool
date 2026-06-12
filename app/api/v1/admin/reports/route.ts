import { timingSafeEqual } from "node:crypto";
import { config } from "@/lib/config";
import { listReports } from "@/lib/db";
import { API_PAGE_SIZE } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authorized(request: Request): boolean {
  const secret = config.apiSecret;
  if (!secret) return false; // fail closed when no secret configured

  const header = request.headers.get("authorization")?.trim() ?? "";
  const provided = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : header;

  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const pageRaw = Number(searchParams.get("page") ?? "1");
  const page =
    Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;
  const perPage = API_PAGE_SIZE;
  const offset = (page - 1) * perPage;

  const { rows, total } = await listReports(perPage, offset);
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return Response.json({
    data: rows,
    pagination: { page, perPage, total, totalPages },
  });
}
