import { randomUUID } from "node:crypto";
import {
  countActiveReportsByIp,
  countGenerationsByIpSince,
  countGlobalGenerationsSince,
  initDb,
  recordGeneration,
} from "@/lib/db";
import { enqueueReport } from "@/lib/jobs";
import { assertPublicUrl, normalizeUrl } from "@/lib/validate";
import { getClientIp } from "@/lib/ip";
import { BYPASS_IPS, RATE_LIMITS } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function tooMany(error: string, retryAfterSeconds?: number) {
  const headers: Record<string, string> = {};
  if (retryAfterSeconds) headers["Retry-After"] = String(retryAfterSeconds);
  return Response.json({ error }, { status: 429, headers });
}

export async function POST(request: Request) {
  try {
    await initDb();
    const body = (await request.json()) as { url?: string };
    const url = normalizeUrl(body.url ?? "");
    assertPublicUrl(url);

    const ip = getClientIp(request.headers);
    const bypass = BYPASS_IPS.includes(ip);

    if (!bypass) {
      const since = new Date(Date.now() - RATE_LIMITS.dayMs);
      const [activeCount, ipCount, globalCount] = await Promise.all([
        countActiveReportsByIp(ip),
        countGenerationsByIpSince(ip, since),
        countGlobalGenerationsSince(since),
      ]);

      if (activeCount >= RATE_LIMITS.perIpConcurrentGenerations) {
        return tooMany(
          "You already have an audit in progress. Please wait for it to finish before starting another."
        );
      }
      if (ipCount >= RATE_LIMITS.generationsPerIpPerDay) {
        return tooMany(
          `Daily limit reached — you can generate up to ${RATE_LIMITS.generationsPerIpPerDay} audits per day. Please try again later.`,
          Math.ceil(RATE_LIMITS.dayMs / 1000)
        );
      }
      if (globalCount >= RATE_LIMITS.globalGenerationsPerDay) {
        return Response.json(
          {
            error:
              "This free tool is at capacity for today. Please try again tomorrow.",
          },
          { status: 503 }
        );
      }
    }

    const uuid = randomUUID();
    if (!bypass) await recordGeneration(ip);
    await enqueueReport(uuid, url, ip);

    return Response.json({ uuid }, { status: 202 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    return Response.json({ error: message }, { status: 400 });
  }
}
