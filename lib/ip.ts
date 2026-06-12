/**
 * Resolve the real client IP from request headers.
 *
 * Production is served behind nginx, which should set:
 *   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
 *   proxy_set_header X-Real-IP $remote_addr;
 *
 * We read X-Forwarded-For first (the left-most hop is the client), then fall
 * back to Cloudflare / X-Real-IP. Only trust these behind a proxy you control.
 */
export function getClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    headers.get("cf-connecting-ip")?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}
