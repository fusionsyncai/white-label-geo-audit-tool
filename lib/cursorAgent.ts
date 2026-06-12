import { type ChildProcess, spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { config } from "./config";

export type AgentResult = {
  reply: string;
  sessionId: string | null;
  exitCode: number;
};

export function parseAgentJson(
  stdout: string,
  stderr: string
): { reply: string; sessionId: string | null } {
  const raw = stdout.trim();
  const fallback = raw || stderr.trim();

  if (!raw) return { reply: fallback, sessionId: null };

  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    if (typeof data === "object" && data !== null) {
      const reply =
        String(
          data.result ??
            data.response ??
            data.output ??
            data.message ??
            fallback
        ) || fallback;
      const sid = data.session_id ?? data.sessionId ?? data.session;
      const sessionId = typeof sid === "string" ? sid : null;
      return { reply, sessionId };
    }
  } catch {
    const last = raw.split("\n").filter(Boolean).pop();
    if (last) {
      try {
        const data = JSON.parse(last) as Record<string, unknown>;
        const reply = String(data.result ?? data.response ?? fallback);
        const sid = data.session_id ?? data.sessionId;
        const sessionId = typeof sid === "string" ? sid : null;
        return { reply, sessionId };
      } catch {
        /* fall through */
      }
    }
  }

  return { reply: fallback, sessionId: null };
}

/**
 * Spawn a fresh cursor-agent session (never uses --resume).
 */
export function runCursorAgent(
  prompt: string,
  cwd: string,
  onProc?: (proc: ChildProcess) => void
): Promise<AgentResult> {
  const cmd = [
    config.cursorAgentBin,
    "-p",
    "--model",
    config.cursorModel,
    "--output-format",
    "json",
  ];

  if (config.autoApprove) {
    cmd.push("--force", "--trust");
  }
  if (config.approveMcps) {
    cmd.push("--approve-mcps");
  }

  // Intentionally no --resume: each API call is a new session.
  cmd.push(prompt);

  const env = { ...process.env };
  if (config.cursorApiKey) {
    env.CURSOR_API_KEY = config.cursorApiKey;
  }
  const homeDir = process.env.HOME?.startsWith("/nonexistent")
    ? path.join(config.dataDir, "home")
    : process.env.HOME || path.join(config.dataDir, "home");
  env.HOME = homeDir;
  env.XDG_CONFIG_HOME = process.env.XDG_CONFIG_HOME || path.join(homeDir, ".config");
  env.XDG_CACHE_HOME = process.env.XDG_CACHE_HOME || path.join(homeDir, ".cache");
  env.XDG_DATA_HOME = process.env.XDG_DATA_HOME || path.join(homeDir, ".local", "share");

  return new Promise((resolve, reject) => {
    fs.mkdir(path.join(homeDir, ".cursor", "projects"), { recursive: true })
      .then(() => fs.mkdir(env.XDG_CONFIG_HOME!, { recursive: true }))
      .then(() => fs.mkdir(env.XDG_CACHE_HOME!, { recursive: true }))
      .then(() => fs.mkdir(env.XDG_DATA_HOME!, { recursive: true }))
      .then(() => {
    const proc = spawn(cmd[0]!, cmd.slice(1), {
      cwd,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    onProc?.(proc);

    const chunks: Buffer[] = [];
    const errChunks: Buffer[] = [];
    proc.stdout?.on("data", (d: Buffer) => chunks.push(d));
    proc.stderr?.on("data", (d: Buffer) => errChunks.push(d));

    proc.on("error", (err) => reject(err));
    proc.on("close", (code) => {
      const stdout = Buffer.concat(chunks).toString("utf8");
      const stderr = Buffer.concat(errChunks).toString("utf8");
      const { reply, sessionId } = parseAgentJson(stdout, stderr);
      resolve({
        reply,
        sessionId,
        exitCode: code ?? 0,
      });
    });
      })
      .catch(reject);
  });
}
