"use client";

import { useState } from "react";

const emailTemplate = `Subject: quick look at [Prospect Company Name]'s ChatGPT visibility

Hey [Name],

I ran a rapid AI search audit on your domain this morning and noticed your architecture is currently invisible to Perplexity and ChatGPT search models (your site is actively blocking OAI-SearchBot).

I generated a quick 3-page action plan showing the exact structural and code changes your team needs to make to get cited in Google AI Overviews this month.

I've attached the white-label PDF audit to this email - let me know if you want to hop on a quick call to talk about how to push these fixes to your production environment.

Best,
[Your Name]`;

export function CopyEmailTemplate() {
  const [copied, setCopied] = useState(false);

  async function copyText() {
    await navigator.clipboard.writeText(emailTemplate);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-xl">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-2 text-xs font-medium text-slate-400">
            cold-email.txt
          </span>
        </div>
        <button
          type="button"
          onClick={copyText}
          className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          {copied ? "Copied!" : "Copy Text"}
        </button>
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap p-5 font-mono text-sm leading-relaxed text-slate-200">
        {emailTemplate}
      </pre>
    </div>
  );
}
