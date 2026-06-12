"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AuditForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/v1/agent/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to start audit");
      }
      router.push(`/report/${data.uuid}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="yourprospect.com"
          required
          className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Starting…" : "Run Free Audit"}
        </button>
      </form>

      {error && (
        <p className="mt-4 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}

      <p className="mt-4 text-sm text-slate-400">
        No signup required · Powered by autonomous AI agents
      </p>
    </div>
  );
}
