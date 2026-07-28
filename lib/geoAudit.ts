import fs from "node:fs/promises";
import path from "node:path";
import { config, reportMarkdownPath, workDir } from "./config";
import { runCursorAgent } from "./cursorAgent";

export type ParsedScore = {
  score: number | null;
  scoreLabel: string | null;
  brandName: string | null;
  domain: string | null;
};

export function buildAuditPrompt(url: string): string {
  return `You are running a comprehensive GEO (Generative Engine Optimization) audit for: ${url}

Follow the GEO audit methodology in AGENTS.md and geo-skill/SKILL.md.

Requirements:
1. Perform a full GEO audit of the website (crawlers, schema, content/E-E-A-T, technical, platform readiness).
2. Use the python scripts in geo-skill/scripts/ when helpful (fetch_page.py, citability_scorer.py, etc.).
3. Write the complete client-ready report to GEO-AUDIT-REPORT.md in the current working directory.
4. The report must include: Executive Summary, Overall GEO Score (0-100), Score Breakdown table, Critical/High/Medium/Low priority issues, category deep dives, platform optimization, quick wins, and a 30-day action plan.
5. Do not generate a PDF — only GEO-AUDIT-REPORT.md.
6. When finished, confirm the file path GEO-AUDIT-REPORT.md exists.`;
}

export function parseScoreFromMarkdown(markdown: string): ParsedScore {
  let score: number | null = null;
  let scoreLabel: string | null = null;
  let brandName: string | null = null;
  let domain: string | null = null;

  const scoreMatch =
    markdown.match(/Overall GEO Score:\s*(\d+(?:\.\d+)?)\s*\/\s*100/i) ||
    markdown.match(/GEO (?:Readiness )?Score:\s*(\d+(?:\.\d+)?)\s*\/\s*100/i) ||
    markdown.match(/## Overall GEO Score:\s*(\d+(?:\.\d+)?)\s*\/\s*100/i);
  if (scoreMatch) {
    score = Math.round(Number(scoreMatch[1]));
  }

  const labelMatch = markdown.match(
    /Overall GEO Score:.*?\(([^)]+)\)/i
  );
  if (labelMatch) {
    scoreLabel = labelMatch[1].trim();
  }

  const titleMatch = markdown.match(
    /GEO Audit Report:\s*(.+)/i
  );
  if (titleMatch) {
    brandName = titleMatch[1].trim();
  }

  const urlMatch =
    markdown.match(/\*\*URL:\*\*\s*(https?:\/\/[^\s]+)/i) ||
    markdown.match(/URL:\s*(https?:\/\/[^\s]+)/i);
  if (urlMatch) {
    domain = urlMatch[1].trim();
  }

  return { score, scoreLabel, brandName, domain };
}

async function ensureWorkEnvironment(uuid: string): Promise<string> {
  const dir = workDir(uuid);
  await fs.mkdir(dir, { recursive: true });

  // Symlink or copy geo-skill into work dir so agent can reference it
  const skillLink = path.join(dir, "geo-skill");
  try {
    await fs.access(skillLink);
  } catch {
    await fs.symlink(config.geoSkillPath, skillLink, "dir");
  }

  // AGENTS.md in cwd for cursor-agent
  const agentsMd = path.join(dir, "AGENTS.md");
  try {
    await fs.access(agentsMd);
  } catch {
    const source = path.join(config.geoSkillPath, "AGENTS.md");
    try {
      await fs.copyFile(source, agentsMd);
    } catch {
      await fs.writeFile(agentsMd, buildDefaultAgentsMd(), "utf8");
    }
  }

  return dir;
}

function buildDefaultAgentsMd(): string {
  return `# GEO Audit Agent

You are a GEO (Generative Engine Optimization) audit agent.

Read geo-skill/SKILL.md for the full audit methodology.
Read geo-skill/agents/ for specialized subagent instructions.
Read geo-skill/skills/ for detailed skill procedures.

Your deliverable is GEO-AUDIT-REPORT.md — a comprehensive, client-ready markdown report.
`;
}

async function runAuditWithModel(
  uuid: string,
  prompt: string,
  cwd: string,
  model: string
): Promise<{
  markdownPath: string;
  markdown: string;
  parsed: ParsedScore;
}> {
  console.log(`[geo-audit] running cursor-agent with model=${model} uuid=${uuid}`);
  const result = await runCursorAgent(prompt, cwd, model);

  if (result.exitCode !== 0 && !result.reply.trim()) {
    throw new Error(
      `cursor-agent (${model}) exited with code ${result.exitCode}: ${result.reply || "no output"}`
    );
  }

  // Report may be written to cwd or job dir
  const candidates = [
    path.join(cwd, "GEO-AUDIT-REPORT.md"),
    reportMarkdownPath(uuid),
  ];

  let markdown = "";
  let foundPath = "";

  for (const candidate of candidates) {
    try {
      markdown = await fs.readFile(candidate, "utf8");
      foundPath = candidate;
      break;
    } catch {
      /* try next */
    }
  }

  if (!markdown) {
    throw new Error(
      `GEO-AUDIT-REPORT.md not found after agent run (model=${model}). Agent reply: ${result.reply.slice(0, 500)}`
    );
  }

  const dest = reportMarkdownPath(uuid);
  if (foundPath !== dest) {
    await fs.writeFile(dest, markdown, "utf8");
  }

  const parsed = parseScoreFromMarkdown(markdown);
  return { markdownPath: dest, markdown, parsed };
}

export async function runGeoAudit(uuid: string, url: string): Promise<{
  markdownPath: string;
  markdown: string;
  parsed: ParsedScore;
}> {
  const cwd = await ensureWorkEnvironment(uuid);
  const outDir = path.dirname(reportMarkdownPath(uuid));
  await fs.mkdir(outDir, { recursive: true });

  const prompt = buildAuditPrompt(url);
  const { cursorPrimaryModel, cursorFallbackModel } = config;

  try {
    return await runAuditWithModel(uuid, prompt, cwd, cursorPrimaryModel);
  } catch (primaryErr) {
    if (cursorPrimaryModel === cursorFallbackModel) {
      throw primaryErr;
    }
    console.warn(
      `[geo-audit] model ${cursorPrimaryModel} failed for uuid=${uuid}, retrying with ${cursorFallbackModel}: ${
        primaryErr instanceof Error ? primaryErr.message : String(primaryErr)
      }`
    );
    return runAuditWithModel(uuid, prompt, cwd, cursorFallbackModel);
  }
}
