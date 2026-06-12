# White-Label GEO Audit Report Generator — Project Doc

> Status: **DRAFT — bird's-eye plan agreed, ready to start** · Last updated: 2026-06-12
> Shared source of truth. We edit it as decisions get made.

---

## 1. One-liner

A **free, authless** agency tool (think TinyPNG-style: land, use, done — no signup): paste a prospect's URL, get the comprehensive GEO audit report on screen, then download it as a **white-label PDF** branded with the agency's logo, accent color, and "Prepared by [Agency]".

**Target keyword:** `Free GEO Audit Tool`. Secondary: `GEO Audit Report Generator`, `White Label AI SEO Report Generator`.

**Users:** agency founders, B2B growth marketers, SDRs.

---

## 2. Architecture (core shift)

The AI engine is a **headless `cursor-agent` CLI session** inside the container, running the **geo-seo-claude skills as-is** to produce the comprehensive **markdown** report. The Next.js app is a **bridge** (HTTP → agent → markdown → branded PDF), mirroring the proven pattern in `fusionsync/fusionsyncai/telegram-bridge` (`src/cursor-agent.ts` spawns `cursor-agent -p --output-format json [--resume <sid>] "<prompt>"`, parses stdout).

**We do NOT rebuild the report.** The geo skills already generate a 6-page, client-ready audit (exec summary, weighted score breakdown, severity-tagged issues, per-category deep dives, platform readiness, 30-day plan, appendix). We use that output directly. Reference example: `~/Desktop/geo-audit-fusionsyncai.pdf`.

### Pipeline

```
Browser
  │  POST /api/v1/agent/generate-report { url }
  ▼
Next.js API (bridge) — mint uuid (token) · insert job (Postgres) · enqueue · 202 { uuid }
  ▼
Worker — spawn cursor-agent (cwd=/data/work/<uuid>, geo skills loaded)
  │        → agent runs the GEO audit → writes GEO-AUDIT-REPORT.md
  │        → parse score/label from header · status=done · store markdown (Postgres + /data)
  ▼
Browser  GET /api/v1/report/<uuid>  (poll → render markdown on screen)
  ▼  Branding console (logo, accent color, agency name, contact)
  ▼  POST /api/v1/report/<uuid>/pdf { branding }
  ▼
Worker — pandoc (white-label template) + headless Chrome → branded GEO-REPORT.pdf → download
```

### Division of labor
- **`cursor-agent` = audit only.** Runs geo skills, writes `GEO-AUDIT-REPORT.md`. The report body is the skill's output, untouched.
- **Backend = orchestration + persistence + branded PDF.** Mints token, runs agent, stores markdown, and renders the white-label PDF deterministically (branding never touches the LLM).
- **Browser = display + branding inputs.** Renders markdown, collects logo/color/name, triggers PDF.

---

## 3. The report (use as-is) & the PDF (white-label the wrapper)

- **Content artifact:** `GEO-AUDIT-REPORT.md` from the geo skills — comprehensive markdown, used verbatim.
- **PDF pipeline (from `geo-report-pdf` skill):**
  `pandoc <md> --template <white-label-template.html> --css <style.css> --metadata <cover fields> -o report.html`, then headless Chrome `--print-to-pdf`.
- **White-label = template parametrization** (the body is unchanged). We fork the skill's template and add metadata: `agency_name`, `agency_logo`, `accent_color`, `agency_contact`, plus the existing `brand_name/domain/geo_score/date`. The template already color-codes score cells and severity-tags findings; we drive the accent color and inject the agency logo on the cover + footer.
- **We bundle our own forked template in the app** (deterministic, per-request branding) rather than mutating the global skill template.

---

## 4. API surface (draft)

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/v1/agent/generate-report` | Validate URL, mint `uuid`, create job, enqueue → `202 { uuid }` |
| `GET` | `/api/v1/report/:uuid` | Poll `pending\|running\|done\|error`; returns markdown + parsed score when done |
| `POST` | `/api/v1/report/:uuid/pdf` | Body = branding (logo, accentColor, agencyName, contact) → returns branded PDF |
| `GET` | `/api/v1/report/:uuid/stream` | (optional) SSE live progress |

- `uuid` doubles as the **access token**. Reports are **not** in `public/` — served via these routes only.
- **No user auth** (free tool), but **abuse guardrails** required (see §8).

---

## 5. Storage & state

- **Postgres** `reports`: `uuid (pk)`, `url`, `status`, `markdown text`, `score int`, `score_label`, `error`, `created_at`, `updated_at`.
- **Volume** `/data`: `work/<uuid>/` (agent scratch cwd) + `reports/<uuid>/` (`GEO-AUDIT-REPORT.md`, generated `report.html`/`report.pdf`).
- Source of truth for the report text = Postgres `markdown`; files are the agent artifact + render inputs.
- **Retention:** TBD (e.g. purge DB row + `/data/<uuid>` after N days).

---

## 6. Skills inside the agent — INTEGRATION NOTE

- ⚠️ `curl … install.sh | bash` installs for **Claude Code** (`~/.claude/skills`, `~/.claude/agents`, `/geo` slash-commands). **`cursor-agent` loads from a different place** (`.cursor/` / `AGENTS.md`). So we must **verify/adapt** how the geo skills load into `cursor-agent` — likely: copy the skill markdown + python scripts into the agent's working dir / load path and drive via `AGENTS.md` + a focused prompt, not `/geo`.
- Skills shell out to **python scripts** (`fetch_page.py`, `citability_scorer.py`, …) → image needs **Python + scripts + deps**.
- The PDF step needs **pandoc + headless Chrome** in the image.
- **Sandbox:** agent cwd = `/data/work/<uuid>` (never app source); audit is read-only.

---

## 7. Tech stack

- **Framework:** Next.js 16 (App Router) + React 19 + Tailwind 4 — *scaffolded.* (⚠️ breaking changes vs old docs; verify against `node_modules/next/dist/docs/`.)
- **AI engine:** `cursor-agent` CLI (headless) + geo skills; spawned via the telegram-bridge pattern; auth via `CURSOR_API_KEY`.
- **Bridge:** Node `child_process.spawn`; agent writes markdown; worker reads it.
- **Markdown render (UI):** `react-markdown` (+ gfm).
- **PDF:** pandoc + headless Chrome, white-label template (server-side).
- **DB:** PostgreSQL.
- **Queue:** v1 in-process worker + concurrency cap; later Redis + BullMQ.
- **Container:** Docker Compose — image = Node + Python + `cursor-agent` + geo skills + pandoc + Chrome.

---

## 8. Free + authless: abuse guardrails (IMPORTANT)

Unlike a local image compressor, **every run costs real LLM money + minutes of compute on our `CURSOR_API_KEY`**. Authless + public = anyone can drain tokens. Required guardrails (no login):
- Per-IP **rate limit** + **daily cap**.
- Global **concurrency limit** on simultaneous agent runs (queue the rest).
- Optional lightweight challenge (e.g. Turnstile) if abuse appears.
- Per-job **timeout** + cost ceiling.

Decision needed: how strict (e.g. N audits/IP/day, M concurrent globally).

---

## 9. Bird's-eye build plan (phased)

**Phase 0 — Engine spike (de-risk the unknowns) ← start here**
- Get `cursor-agent` running headless with `CURSOR_API_KEY`.
- Make the geo skills load in `cursor-agent`; produce `GEO-AUDIT-REPORT.md` for a test URL from a scratch dir.
- Reproduce the pandoc + Chrome → PDF step locally.
- ✅ Validates the whole engine before app plumbing.

**Phase 1 — Bridge + job pipeline**
- Postgres + `reports` table. `POST /generate-report` (mint uuid, enqueue, spawn agent). Worker runs audit → store markdown + score. `GET /report/:uuid` poll.

**Phase 2 — UI**
- Keyword-optimized landing, URL input, progress state, on-screen markdown report.

**Phase 3 — White-label PDF**
- Forked template + branding modal (logo, accent color, agency name, contact). `POST /report/:uuid/pdf` → pandoc + Chrome → branded download.

**Phase 4 — Dockerize**
- Compose: `web` + `db`; image with Node + Python + cursor-agent + skills + pandoc + Chrome; `/data` + `pgdata` volumes; env (`CURSOR_API_KEY`, `DATABASE_URL`).

**Phase 5 — Hardening**
- Abuse guardrails (§8), retention/cleanup, error states, SSE progress (optional), split web/worker (optional).

---

## 10. Scope

**MVP (v1):** Phases 0–4 + basic guardrails. Authless. Single URL. Comprehensive markdown on screen + white-label PDF download.
**Later (v2+):** SSE progress, Redis queue + worker split, headless-Chrome sidecar/screenshots, saved/shareable reports, monetization.
**Not doing:** rebuilding the report schema, reports in `public/`, end-user accounts, multi-page crawl in MVP.

---

## 11. Open questions
1. **Guardrails strictness:** audits/IP/day + global concurrency cap numbers?
2. **Retention:** how long to keep reports/PDFs?
3. **Branding timing:** confirm "audit first, brand after" (recommended) vs branding entered up-front.
4. **Skill loading in cursor-agent:** to be verified in Phase 0 (the main unknown).

---

## 12. Decisions log
- 2026-06-12 — `geo-seo-claude` skills used **as-is** for the audit; report artifact = comprehensive **markdown**, not a custom JSON schema.
- 2026-06-12 — PDF = **pandoc + headless Chrome**, **white-label via template parametrization** (server-side). *Reverses* earlier client-side react-pdf decision (logo now uploaded at PDF step).
- 2026-06-12 — AI engine = headless `cursor-agent` + geo skills, bridged over HTTP (telegram-bridge pattern), dockerized.
- 2026-06-12 — **Async** job: `POST` mints `uuid` → agent → `GET` polls.
- 2026-06-12 — Reports via **token-checked API route**, **not** `public/`; backed by **Postgres** + `/data` volume.
- 2026-06-12 — **Authless free tool**; abuse guardrails (rate limit + concurrency cap) instead of login.
- 2026-06-12 — `install.sh` targets **Claude Code**, not cursor-agent; skill loading into cursor-agent to be verified in Phase 0.
