"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SiteHeader, SiteFooter } from "../../components/SiteChrome";

type ReportStatus = {
  uuid: string;
  url: string;
  status: "queued" | "auditing" | "rendering" | "done" | "error";
  score: number | null;
  scoreLabel: string | null;
  error: string | null;
  companyName?: string | null;
  accentColor?: string | null;
  contact?: string | null;
  scoreSubtext?: string | null;
  ctaText?: string | null;
  emailEnabled?: boolean;
  notifyEmailSet?: boolean;
};

const DEFAULT_SCORE_SUBTEXT =
  "AI Search Visibility Score — how visible this site is to ChatGPT, Perplexity, Gemini, and Google AI Overviews.";

const STATUS_LABELS: Record<string, string> = {
  queued: "Queued…",
  auditing: "Running GEO audit with AI agent…",
  rendering: "Generating your branded PDF…",
  done: "Report ready",
  error: "Something went wrong",
};

const STEPS = [
  { key: "queued", label: "Queued" },
  { key: "auditing", label: "Auditing site" },
  { key: "rendering", label: "Rendering PDF" },
  { key: "done", label: "Ready" },
];

function scoreTone(score: number) {
  if (score >= 70) return "text-emerald-600";
  if (score >= 40) return "text-amber-600";
  return "text-red-600";
}

export default function ReportPage() {
  const params = useParams<{ uuid: string }>();
  const uuid = params.uuid;

  const [status, setStatus] = useState<ReportStatus | null>(null);
  const [companyName, setCompanyName] = useState("FusionSync AI");
  const [accentColor, setAccentColor] = useState("#2563eb");
  const [website, setWebsite] = useState("");
  const [scoreSubtext, setScoreSubtext] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [branding, setBranding] = useState(false);
  const [pdfKey, setPdfKey] = useState(0);
  const [email, setEmail] = useState("");
  const [notifyState, setNotifyState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [notifyError, setNotifyError] = useState("");

  const poll = useCallback(async () => {
    const res = await fetch(`/api/v1/report/${uuid}/status`);
    if (!res.ok) return;
    const data = (await res.json()) as ReportStatus;
    setStatus(data);
    if (data.companyName) setCompanyName(data.companyName);
    if (data.accentColor) setAccentColor(data.accentColor);
    if (data.contact) setWebsite(data.contact);
    if (data.scoreSubtext) setScoreSubtext(data.scoreSubtext);
    if (data.ctaText) setCtaText(data.ctaText);
    return data.status;
  }, [uuid]);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    async function loop() {
      const s = await poll();
      if (!active) return;
      if (s && !["done", "error"].includes(s)) {
        timer = setTimeout(loop, 3000);
      }
    }

    void loop();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [poll]);

  async function applyBranding(download = false) {
    setBranding(true);
    try {
      const form = new FormData();
      form.set("companyName", companyName);
      form.set("accentColor", accentColor);
      form.set("contact", website);
      form.set("scoreSubtext", scoreSubtext);
      form.set("ctaText", ctaText);
      if (logoFile) form.set("logo", logoFile);
      if (download) form.set("download", "1");

      const res = await fetch(`/api/v1/report/${uuid}/pdf`, {
        method: "POST",
        body: form,
      });

      if (download) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `geo-audit-${uuid}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        setPdfKey((k) => k + 1);
      }
    } finally {
      setBranding(false);
    }
  }

  async function submitNotify(e: React.FormEvent) {
    e.preventDefault();
    setNotifyState("saving");
    setNotifyError("");
    try {
      const res = await fetch(`/api/v1/report/${uuid}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setNotifyState("error");
        setNotifyError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setNotifyState("saved");
    } catch {
      setNotifyState("error");
      setNotifyError("Network error. Please try again.");
    }
  }

  const isReady = status?.status === "done";
  const isError = status?.status === "error";
  const pdfUrl = `/api/v1/report/${uuid}/pdf?t=${pdfKey}`;
  const activeStep = STEPS.findIndex((s) => s.key === status?.status);

  return (
    <div className="flex min-h-full flex-col bg-slate-50 text-slate-900">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
            GEO Audit
          </p>
          <h1 className="mt-1 font-heading text-2xl font-bold break-all text-slate-900 sm:text-3xl">
            {status?.url || "…"}
          </h1>
        </div>

        {/* Progress / status */}
        {!isReady && !isError && (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
              <p className="mt-6 font-heading text-lg font-semibold text-slate-900">
                {status
                  ? STATUS_LABELS[status.status] || status.status
                  : "Loading…"}
              </p>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                This can take a few minutes. Each audit runs in a fresh AI agent
                session that browses and analyzes the site end to end.
              </p>
            </div>

            <ol className="mx-auto mt-10 flex max-w-xl items-center justify-between gap-2">
              {STEPS.map((s, i) => {
                const done = activeStep > i;
                const current = activeStep === i;
                return (
                  <li
                    key={s.key}
                    className="flex flex-1 flex-col items-center gap-2 text-center"
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition ${
                        done
                          ? "border-blue-600 bg-blue-600 text-white"
                          : current
                            ? "border-blue-600 bg-blue-50 text-blue-600"
                            : "border-slate-300 bg-white text-slate-400"
                      }`}
                    >
                      {done ? "✓" : i + 1}
                    </span>
                    <span
                      className={`text-xs ${
                        current
                          ? "font-semibold text-slate-900"
                          : "text-slate-500"
                      }`}
                    >
                      {s.label}
                    </span>
                  </li>
                );
              })}
            </ol>

            {status?.emailEnabled && (
              <div className="mx-auto mt-10 max-w-md border-t border-slate-100 pt-8">
                {notifyState === "saved" || status?.notifyEmailSet ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-center">
                    <p className="text-sm font-semibold text-emerald-700">
                      You&apos;re all set ✓
                    </p>
                    <p className="mt-1 text-sm text-emerald-600">
                      We&apos;ll email you a link as soon as your report is
                      ready. You can safely close this tab.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-center font-heading text-sm font-semibold text-slate-900">
                      Don&apos;t want to wait?
                    </p>
                    <p className="mt-1 text-center text-sm text-slate-500">
                      Drop your email and we&apos;ll send you a link the moment
                      it&apos;s ready.
                    </p>
                    <form
                      onSubmit={submitNotify}
                      className="mt-4 flex flex-col gap-2 sm:flex-row"
                    >
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@agency.com"
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                      <button
                        type="submit"
                        disabled={notifyState === "saving"}
                        className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
                      >
                        {notifyState === "saving" ? "Saving…" : "Notify me"}
                      </button>
                    </form>
                    {notifyState === "error" && (
                      <p className="mt-2 text-center text-sm text-red-600">
                        {notifyError}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {isError && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="font-heading text-lg font-semibold text-red-700">
              Something went wrong
            </p>
            <p className="mx-auto mt-2 max-w-lg text-sm text-red-600">
              {status?.error || "Audit failed"}
            </p>
            <a
              href="/"
              className="mt-6 inline-block rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Try another URL
            </a>
          </div>
        )}

        {isReady && (
          <>
            {status?.score !== null && status?.score !== undefined && (
              <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-baseline gap-1">
                  <span
                    className={`font-heading text-5xl font-extrabold ${scoreTone(
                      status.score
                    )}`}
                  >
                    {status.score}
                  </span>
                  <span className="text-lg text-slate-400">/100</span>
                </div>
                <div>
                  <p className="font-heading font-semibold text-slate-900">
                    AI Search Visibility Score
                  </p>
                  {status.scoreLabel && (
                    <p className="text-sm text-slate-500">{status.scoreLabel}</p>
                  )}
                </div>
              </div>
            )}

            <div className="mb-6 grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[1fr_280px]">
              <div>
                <h2 className="font-heading text-lg font-semibold text-slate-900">
                  White-label branding
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Defaults to FusionSync AI. Add your agency logo and details to
                  re-render the PDF.
                </p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="font-medium text-slate-700">
                      Company name
                    </span>
                    <input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="font-medium text-slate-700">
                      Accent color
                    </span>
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="mt-1.5 h-10 w-full cursor-pointer rounded-lg border border-slate-300 bg-white"
                    />
                  </label>
                  <label className="block text-sm sm:col-span-2">
                    <span className="font-medium text-slate-700">
                      Website URL (optional)
                    </span>
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://your-agency.com"
                      className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </label>
                  <label className="block text-sm sm:col-span-2">
                    <span className="font-medium text-slate-700">
                      Score subtext (optional)
                    </span>
                    <textarea
                      value={scoreSubtext}
                      onChange={(e) => setScoreSubtext(e.target.value)}
                      placeholder={DEFAULT_SCORE_SUBTEXT}
                      rows={2}
                      className="mt-1.5 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </label>
                  <label className="block text-sm sm:col-span-2">
                    <span className="font-medium text-slate-700">
                      Footer / CTA text (optional)
                    </span>
                    <textarea
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      placeholder={`Want help fixing these issues? Contact ${
                        companyName || "Your Agency"
                      } at ${website || "your-website.com"}`}
                      rows={2}
                      className="mt-1.5 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </label>
                  <label className="block text-sm sm:col-span-2">
                    <span className="font-medium text-slate-700">
                      Logo (optional)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setLogoFile(e.target.files?.[0] ?? null)
                      }
                      className="mt-1.5 w-full text-sm text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-slate-700 hover:file:bg-slate-200"
                    />
                  </label>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => applyBranding(false)}
                  disabled={branding}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  {branding ? "Updating…" : "Apply branding"}
                </button>
                <button
                  onClick={() => applyBranding(true)}
                  disabled={branding}
                  className="rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50"
                >
                  Download PDF
                </button>
                <a
                  href={`/api/v1/report/${uuid}/pdf?download=1`}
                  className="rounded-lg px-4 py-3 text-center text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  Download current PDF
                </a>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <iframe
                key={pdfKey}
                src={pdfUrl}
                title="GEO Audit Report PDF"
                className="h-[80vh] w-full"
              />
            </div>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
