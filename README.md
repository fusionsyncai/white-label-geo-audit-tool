# GEO Report Generator

Free, authless **white-label GEO audit tool** for agencies. Paste a prospect URL, run a comprehensive AI search visibility audit via `cursor-agent` + geo skills, and download a branded PDF.

## Quick start (Docker)

1. Copy env and set your Cursor API key:

```bash
cp .env.example .env
# Edit .env and set CURSOR_API_KEY=cursor_...
```

2. Build and run:

```bash
docker compose up --build
```

3. Open [http://localhost:3000](http://localhost:3000), enter a URL, and wait on the report page for the audit to complete.

## User flow

1. **Landing** — enter prospect URL
2. **Processing** — `/report/<uuid>` polls job status (`queued` → `auditing` → `rendering` → `done`)
3. **Result** — embedded PDF + download; optional white-label branding (company name, logo, accent color)

Each `POST /api/v1/agent/generate-report` spawns a **fresh** `cursor-agent` session (no `--resume`).

## API

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/v1/agent/generate-report` | `{ "url": "https://example.com" }` → `202 { uuid }` |
| `GET` | `/api/v1/report/:uuid/status` | Poll job status |
| `GET` | `/api/v1/report/:uuid/pdf` | Stream PDF (`?download=1` to attach) |
| `POST` | `/api/v1/report/:uuid/pdf` | Re-render with branding (multipart: `companyName`, `accentColor`, `logo`) |

## Local dev (without Docker)

Requires: Node 22, Postgres, `cursor-agent`, Chrome/Chromium, Python 3 + geo-skill deps.

```bash
npm install
cp .env.example .env.local
# Set DATABASE_URL=postgresql://geo:geo@localhost:5433/geo_reports
docker compose up db -d   # or your own Postgres
npm run dev
```

## Project structure

- `lib/cursorAgent.ts` — spawns fresh cursor-agent sessions (telegram-bridge pattern)
- `lib/geoAudit.ts` — audit prompt + markdown parsing
- `lib/jobs.ts` — async job orchestration
- `lib/pdf.ts` — markdown → HTML → headless Chrome PDF
- `geo-skill/` — vendored GEO audit skills + scripts
- `templates/` — white-label PDF HTML/CSS templates

## Docs

See [docs/project.md](docs/project.md) for architecture and product decisions.
