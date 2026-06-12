export function isValidUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("URL is required");
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  if (!isValidUrl(withProtocol)) {
    throw new Error("Invalid URL");
  }
  return withProtocol;
}

const BLOCKED_HOSTS = new Set([
  "localhost",
  "0.0.0.0",
  "::1",
  "169.254.169.254", // cloud metadata
  "metadata.google.internal",
]);

/**
 * Guard against SSRF: reject URLs pointing at loopback, private, link-local,
 * or cloud-metadata hosts before the agent is told to fetch them.
 */
export function assertPublicUrl(input: string): void {
  let host: string;
  try {
    host = new URL(input).hostname.toLowerCase();
  } catch {
    throw new Error("Invalid URL");
  }

  const bare = host.replace(/^\[|\]$/g, ""); // strip IPv6 brackets

  if (
    BLOCKED_HOSTS.has(bare) ||
    bare.endsWith(".local") ||
    bare.endsWith(".internal") ||
    /^127\./.test(bare) ||
    /^10\./.test(bare) ||
    /^192\.168\./.test(bare) ||
    /^169\.254\./.test(bare) ||
    /^(?:0|::)$/.test(bare) ||
    bare.startsWith("fe80:") || // IPv6 link-local
    bare.startsWith("fc") || // IPv6 unique-local
    bare.startsWith("fd")
  ) {
    throw new Error("That URL is not allowed");
  }

  const m = bare.match(/^172\.(\d+)\./);
  if (m) {
    const octet = Number(m[1]);
    if (octet >= 16 && octet <= 31) {
      throw new Error("That URL is not allowed");
    }
  }
}
