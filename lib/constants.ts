/**
 * Abuse-prevention knobs. Edit these values and rebuild to change limits.
 * Kept dependency-free so it is safe to import from middleware (edge runtime).
 */

export const RATE_LIMITS = {
  /** Layer 1: max requests per IP per minute across all pages + API routes. */
  globalPerMinute: 100,

  /** Layer 2: max report generations per IP within the rolling window. */
  generationsPerIpPerDay: 10,

  /** Hard ceiling on total generations (all IPs) within the rolling window — caps LLM cost. */
  globalGenerationsPerDay: 200,

  /** Max simultaneous in-flight generations a single IP can have queued/running. */
  perIpConcurrentGenerations: 1,

  /** Sliding window for the per-minute global throttle (ms). */
  windowMs: 60_000,

  /** Rolling window for the daily generation quotas (ms). */
  dayMs: 24 * 60 * 60 * 1000,
} as const;

/** Page size for the admin reports API. */
export const API_PAGE_SIZE = 50;

/**
 * IPs that bypass ALL rate limits and generation quotas (e.g. your office/VPN).
 * Add the IPs you want exempted here. Loopback is included for local dev.
 */
export const BYPASS_IPS: string[] = [
  "127.0.0.1",
  "::1",
  // "203.0.113.10",  // <- add your IP(s) here
];
