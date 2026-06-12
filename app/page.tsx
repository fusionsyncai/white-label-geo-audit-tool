import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "./components/SiteChrome";
import { AuditForm } from "./components/AuditForm";
import { BlogCard } from "./components/BlogCard";
import { CopyEmailTemplate } from "./components/CopyEmailTemplate";
import { getFeaturedPosts } from "@/lib/blog";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  alternates: { canonical: siteConfig.url },
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.url,
    type: "website",
  },
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "White-Label AI SEO & GEO Report Generator",
  operatingSystem: "All",
  applicationCategory: "BusinessApplication",
  browserRequirements: "Requires HTML5",
  url: siteConfig.url,
  author: {
    "@type": "Organization",
    name: siteConfig.organization.name,
    url: siteConfig.organization.url,
  },
  offers: { "@type": "Offer", price: "0.00", priceCurrency: "USD" },
  description:
    "An agency-grade GEO and AI Overview optimization tool that scans website architecture against LLM crawlers and generates custom white-label PDF audit reports.",
  featureList: [
    "White-label PDF customization with custom agency logos",
    "Google AI Overview visibility diagnostics",
    "Perplexity and ChatGPT citation audit insights",
    "Technical LLM crawler optimization checks",
  ],
};

const scoreRows = [
  ["AI Citability", "74"],
  ["Brand Authority", "58"],
  ["Content & E-E-A-T", "72"],
  ["Technical", "85"],
  ["Structured Data", "92"],
  ["Platform", "76"],
];

const platformRows = [
  ["Google AI Overviews", "78"],
  ["ChatGPT Search", "76"],
  ["Perplexity AI", "62"],
  ["Google Gemini", "75"],
  ["Bing Copilot", "70"],
];

export default function Home() {
  const featured = getFeaturedPosts(3);

  return (
    <div className="flex min-h-full flex-col bg-white text-slate-900">
      <SiteHeader />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            aria-hidden="true"
          >
            <div className="absolute left-1/2 -top-40 h-112 w-176 -translate-x-1/2 rounded-full bg-linear-to-tr from-blue-200 via-indigo-200 to-violet-200 opacity-60 blur-3xl" />
          </div>

          <div className="mx-auto max-w-3xl px-6 pb-16 pt-20 text-center sm:pt-28">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Free White-Label GEO Audit Tool
            </span>

            <h1 className="mt-6 font-heading text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-6xl">
              Instantly generate{" "}
              <span className="bg-linear-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                white-label AI SEO &amp; GEO
              </span>{" "}
              audit reports
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
              Close agency clients faster. Drop a prospect&apos;s URL, slap your
              own agency branding on the cover page, and export a beautiful,
              pitch-ready PDF action plan for Google AI Overviews, ChatGPT, and
              Perplexity visibility.
            </p>

            <div className="mt-9">
              <AuditForm />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-y border-slate-100 bg-slate-50/60">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <h2 className="text-center font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
              From URL to client-ready report in 3 steps
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Paste a URL",
                  body: "Enter your prospect's website. No account, no setup — just the link.",
                },
                {
                  step: "02",
                  title: "AI runs the audit",
                  body: "An autonomous agent analyzes crawlers, schema, content, and platform readiness.",
                },
                {
                  step: "03",
                  title: "Download branded PDF",
                  body: "Upload your agency logo, pick your brand accent color, and export a high-converting, presentation-ready PDF report.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <span className="font-heading text-sm font-bold text-blue-600">
                    {item.step}
                  </span>
                  <h3 className="mt-2 font-heading text-lg font-semibold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PDF preview */}
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
              Built for Cold Outreach &amp; Client Pitches
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Don&apos;t drop messy raw links or boring screenshots into your
              prospect&apos;s inbox. This tool generates a beautifully
              structured, highly visual 3-page PDF action plan. It&apos;s built
              specifically to be attached straight to your cold emails, dropped
              into Slack, or shared during a discovery call.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-[1.1fr_0.9fr_0.9fr]">
            <div className="group relative min-h-96 overflow-hidden rounded-3xl bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 p-7 text-white shadow-2xl shadow-slate-200 transition duration-300 hover:-translate-y-1 hover:rotate-1 hover:shadow-blue-200">
              <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-blue-400 to-transparent opacity-70" />
              <div className="flex items-start justify-between">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">
                  <span className="h-3 w-3 rounded-full bg-blue-500" />
                  FusionSync AI
                </div>
                <div className="text-right text-xs text-slate-300">
                  <p>Prepared by</p>
                  <p className="mt-1 font-semibold text-white">Acme Agency</p>
                  <p>https://acme.example</p>
                </div>
              </div>
              <h3 className="mt-16 font-heading text-3xl font-bold">
                GEO Audit Report
              </h3>
              <div className="mt-10 flex h-32 w-32 flex-col items-center justify-center rounded-full border-4 border-blue-500/80 bg-blue-500/10 shadow-lg shadow-blue-500/20">
                <span className="font-heading text-5xl font-extrabold text-blue-400">
                  74
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Audit Complete
                </span>
              </div>
              <p className="mt-8 max-w-sm text-sm text-slate-300">
                Custom subtext: this is how AI engines see your site.
              </p>
              <div className="absolute bottom-7 left-7 right-7 h-px bg-white/10" />
            </div>

            <div className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100 transition duration-300 hover:-translate-y-1 hover:-rotate-1 hover:shadow-blue-100">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Page 2
              </p>
              <h3 className="mt-3 font-heading text-xl font-bold text-slate-900">
                Overall GEO Score
              </h3>
              <div className="mt-4 flex items-end gap-2">
                <span className="font-heading text-5xl font-extrabold text-emerald-600">
                  74
                </span>
                <span className="pb-2 text-sm text-slate-400">/100 - Good</span>
              </div>
              <div className="mt-6 space-y-3">
                {scoreRows.map(([label, score]) => (
                  <div key={label}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium text-slate-600">{label}</span>
                      <span className="text-slate-400">{score}/100</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-linear-to-r from-blue-500 to-indigo-500"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100 transition duration-300 hover:-translate-y-1 hover:rotate-1 hover:shadow-blue-100">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Page 3
              </p>
              <h3 className="mt-3 font-heading text-xl font-bold text-slate-900">
                AI Visibility Dashboard
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Readiness by platform, with the highest-priority fixes surfaced
                first.
              </p>
              <div className="mt-6 space-y-3">
                {platformRows.map(([label, score]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <span className="text-sm font-medium text-slate-700">
                      {label}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                      {score}/100
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* What it checks */}
        <section className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-center font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
            What the audit covers
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
            A full Generative Engine Optimization (GEO) assessment, scored 0–100
            across the signals AI engines actually use.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "AI Crawler Access",
                body: "Auditing whether OAI-SearchBot, PerplexityBot, ClaudeBot, and Google-Extended are safely unblocked in robots.txt.",
              },
              {
                title: "Citability",
                body: "How quotable the content is for AI answers and citations.",
              },
              {
                title: "Schema & Structured Data",
                body: "JSON-LD coverage that helps AI understand the brand and pages.",
              },
              {
                title: "Content & E-E-A-T",
                body: "Experience, expertise, authority, and trust signals.",
              },
              {
                title: "Technical Foundations",
                body: "SSR, performance, security, and crawlability basics.",
              },
              {
                title: "Platform Readiness",
                body: "Tailored readiness for ChatGPT, Perplexity, Gemini, and AI Overviews.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-blue-200 hover:shadow-md"
              >
                <h3 className="font-heading text-base font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Outreach template */}
        <section className="border-y border-slate-100 bg-slate-50/60">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                Instant outreach utility
              </p>
              <h2 className="mt-3 font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
                How to Use This Report for Client Acquisition
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                Generate your branded PDF audit, copy this 3-sentence script,
                and drop it into your prospect&apos;s inbox.
              </p>
            </div>
            <CopyEmailTemplate />
          </div>
        </section>

        {/* Featured blog */}
        {featured.length > 0 && (
          <section className="border-t border-slate-100 bg-slate-50/60">
            <div className="mx-auto max-w-5xl px-6 py-16">
              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <h2 className="font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
                    The GEO Playbook
                  </h2>
                  <p className="mt-2 max-w-xl text-slate-600">
                    Research-backed guides on getting your site seen and cited
                    by AI search engines.
                  </p>
                </div>
                <Link
                  href="/blog"
                  className="shrink-0 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  View all articles &rarr;
                </Link>
              </div>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((post) => (
                  <BlogCard key={post.frontmatter.slug} post={post} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FusionSync CTA */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-slate-900 to-indigo-950 px-8 py-14 text-center shadow-xl sm:px-16">
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl"
              aria-hidden="true"
            />
            <p className="font-heading text-sm font-semibold uppercase tracking-wider text-blue-300">
              Built by FusionSync AI
            </p>
            <h2 className="mx-auto mt-3 max-w-2xl font-heading text-3xl font-bold text-white sm:text-4xl">
              Winning AI search is step one. Converting that traffic is step two.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-300">
              FusionSync AI installs the inbound sales infrastructure that turns
              attention into booked revenue — instant lead response, AI voice
              agents, and CRM automation across Instagram, WhatsApp, web, and
              calls. Stop letting high-intent leads leak out of your funnel.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={siteConfig.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-white px-7 py-3.5 text-base font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Book a discovery call
              </a>
              <a
                href={siteConfig.fusionsyncServicesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/25 px-7 py-3.5 text-base font-semibold text-white transition hover:bg-white/10"
              >
                See what we build
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
