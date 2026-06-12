import { Pool } from "pg";
import { config } from "./config";

export type ReportStatus =
  | "queued"
  | "auditing"
  | "rendering"
  | "done"
  | "error";

export type ReportRow = {
  uuid: string;
  url: string;
  status: ReportStatus;
  markdown: string | null;
  score: number | null;
  score_label: string | null;
  error: string | null;
  company_name: string | null;
  accent_color: string | null;
  logo_path: string | null;
  contact: string | null;
  score_subtext: string | null;
  cta_text: string | null;
  ip: string | null;
  notify_email: string | null;
  email_notified: boolean;
  created_at: Date;
  updated_at: Date;
};

const ACTIVE_STATUSES = ["queued", "auditing", "rendering"];

let pool: Pool | null = null;
let initialized = false;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: config.databaseUrl });
  }
  return pool;
}

export async function initDb(): Promise<void> {
  if (initialized) return;
  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS reports (
      uuid UUID PRIMARY KEY,
      url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      markdown TEXT,
      score INTEGER,
      score_label TEXT,
      error TEXT,
      company_name TEXT,
      accent_color TEXT,
      logo_path TEXT,
      contact TEXT,
      score_subtext TEXT,
      cta_text TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS reports_status_idx ON reports(status);
    CREATE INDEX IF NOT EXISTS reports_created_at_idx ON reports(created_at DESC);
    ALTER TABLE reports ADD COLUMN IF NOT EXISTS contact TEXT;
    ALTER TABLE reports ADD COLUMN IF NOT EXISTS score_subtext TEXT;
    ALTER TABLE reports ADD COLUMN IF NOT EXISTS cta_text TEXT;
    ALTER TABLE reports ADD COLUMN IF NOT EXISTS ip TEXT;
    ALTER TABLE reports ADD COLUMN IF NOT EXISTS notify_email TEXT;
    ALTER TABLE reports ADD COLUMN IF NOT EXISTS email_notified BOOLEAN NOT NULL DEFAULT FALSE;
    CREATE INDEX IF NOT EXISTS reports_ip_status_idx ON reports(ip, status);

    CREATE TABLE IF NOT EXISTS generation_events (
      id BIGSERIAL PRIMARY KEY,
      ip TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS generation_events_ip_created_idx
      ON generation_events(ip, created_at DESC);
    CREATE INDEX IF NOT EXISTS generation_events_created_idx
      ON generation_events(created_at DESC);
  `);
  initialized = true;
}

export async function recordGeneration(ip: string): Promise<void> {
  await initDb();
  await getPool().query(`INSERT INTO generation_events (ip) VALUES ($1)`, [ip]);
}

export async function countGenerationsByIpSince(
  ip: string,
  since: Date
): Promise<number> {
  await initDb();
  const result = await getPool().query<{ count: string }>(
    `SELECT COUNT(*)::int AS count FROM generation_events WHERE ip = $1 AND created_at >= $2`,
    [ip, since]
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function countGlobalGenerationsSince(since: Date): Promise<number> {
  await initDb();
  const result = await getPool().query<{ count: string }>(
    `SELECT COUNT(*)::int AS count FROM generation_events WHERE created_at >= $1`,
    [since]
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function countActiveReportsByIp(ip: string): Promise<number> {
  await initDb();
  const result = await getPool().query<{ count: string }>(
    `SELECT COUNT(*)::int AS count FROM reports WHERE ip = $1 AND status = ANY($2)`,
    [ip, ACTIVE_STATUSES]
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function createReport(
  uuid: string,
  url: string,
  ip?: string
): Promise<void> {
  await initDb();
  await getPool().query(
    `INSERT INTO reports (uuid, url, status, ip) VALUES ($1, $2, 'queued', $3)`,
    [uuid, url, ip ?? null]
  );
}

export async function updateReport(
  uuid: string,
  fields: Partial<
    Pick<
      ReportRow,
      | "status"
      | "markdown"
      | "score"
      | "score_label"
      | "error"
      | "company_name"
      | "accent_color"
      | "logo_path"
      | "contact"
      | "score_subtext"
      | "cta_text"
    >
  >
): Promise<void> {
  await initDb();
  const sets: string[] = ["updated_at = NOW()"];
  const values: unknown[] = [];
  let i = 1;

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      sets.push(`${key} = $${i++}`);
      values.push(value);
    }
  }

  values.push(uuid);
  await getPool().query(
    `UPDATE reports SET ${sets.join(", ")} WHERE uuid = $${i}`,
    values
  );
}

export async function setNotifyEmail(
  uuid: string,
  email: string
): Promise<void> {
  await initDb();
  await getPool().query(
    `UPDATE reports SET notify_email = $1, updated_at = NOW() WHERE uuid = $2`,
    [email, uuid]
  );
}

export async function markEmailNotified(uuid: string): Promise<void> {
  await initDb();
  await getPool().query(
    `UPDATE reports SET email_notified = TRUE, updated_at = NOW() WHERE uuid = $1`,
    [uuid]
  );
}

export type ReportSummary = Omit<ReportRow, "markdown"> & {
  has_markdown: boolean;
};

export async function listReports(
  limit: number,
  offset: number
): Promise<{ rows: ReportSummary[]; total: number }> {
  await initDb();
  const db = getPool();
  const [rows, count] = await Promise.all([
    db.query<ReportSummary>(
      `SELECT
         uuid, url, status, score, score_label, error,
         company_name, accent_color, logo_path, contact,
         score_subtext, cta_text, ip, notify_email, email_notified,
         (markdown IS NOT NULL) AS has_markdown,
         created_at, updated_at
       FROM reports
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
    db.query<{ count: string }>(`SELECT COUNT(*)::int AS count FROM reports`),
  ]);
  return { rows: rows.rows, total: Number(count.rows[0]?.count ?? 0) };
}

export async function getReport(uuid: string): Promise<ReportRow | null> {
  await initDb();
  const result = await getPool().query<ReportRow>(
    `SELECT * FROM reports WHERE uuid = $1`,
    [uuid]
  );
  return result.rows[0] ?? null;
}
