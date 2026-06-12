import { NextResponse, type NextRequest } from "next/server";
import { RATE_LIMITS, BYPASS_IPS } from "@/lib/constants";
import { getClientIp } from "@/lib/ip";

// In-memory fixed-window counter. The app runs as a single container/process,
// so module-scoped state is shared across all requests. A redeploy resets it,
// which is harmless for a 1-minute window.
const hits = new Map<string, { count: number; windowStart: number }>();

function prune(now: number): void {
  if (hits.size < 10_000) return;
  for (const [ip, entry] of hits) {
    if (now - entry.windowStart >= RATE_LIMITS.windowMs) hits.delete(ip);
  }
}

export function middleware(request: NextRequest) {
  const ip = getClientIp(request.headers);
  if (BYPASS_IPS.includes(ip)) return NextResponse.next();

  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now - entry.windowStart >= RATE_LIMITS.windowMs) {
    prune(now);
    hits.set(ip, { count: 1, windowStart: now });
    return NextResponse.next();
  }

  entry.count++;
  if (entry.count > RATE_LIMITS.globalPerMinute) {
    const retryAfter = Math.ceil(
      (entry.windowStart + RATE_LIMITS.windowMs - now) / 1000
    );
    return new NextResponse("Too many requests. Please slow down.", {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(retryAfter, 1)),
        "Content-Type": "text/plain",
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  // Throttle pages + API, but skip static assets and metadata files.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
