# SEO & GEO Strategy — FusionSync AI Report Generator

This document is the core SEO/GEO strategy for our free white-label GEO audit tool. It is adapted from the original Gemini-recommended spec, with two key changes baked in:

- **Domain:** the tool lives on its own subdomain, `https://geo-report.fusionsync.ai` (not `fusionsync.ai/tools/...`).
- **Primary CTA / booking link:** `https://cal.com/fusionsyncai/ai-audit`.

The strategy is a classic **hub-and-spoke** model: one cornerstone "hub" (the free tool) supported by "spoke" blog articles that capture problem-aware search traffic, funnel it into the tool, and bridge high-intent visitors to FusionSync's core services.

---

## 1. Positioning & Keywords

- **Product:** Free, authless, white-label GEO/AI-SEO PDF report generator for agencies, consultants, and B2B SDRs.
- **Primary keyword:** `White Label AI SEO Report Generator`
- **Secondary keywords:**
  - `google ai overview audit tool`
  - `free geo audit report tool`
  - `llm visibility scanner`
  - `generative engine optimization`

---

## 2. Hub Page (the tool) — `geo-report.fusionsync.ai/`

The landing page **is** the cornerstone. It targets the primary keyword directly.

| Element | Value |
| --- | --- |
| URL | `https://geo-report.fusionsync.ai/` |
| Meta title | `Free White-Label AI SEO & GEO Report Generator \| FusionSync` |
| Meta description | `Generate custom, branded PDF reports on Google AI Overviews, Perplexity, and ChatGPT visibility. Drop your prospect's URL and export an actionable white-label GEO audit.` |
| H1 | `Instantly generate white-label AI SEO & GEO audit reports` |
| H2 (sub) | `Close agency clients faster. Drop a URL, add your own logo, and export a polished PDF action plan for Google AI Overviews, ChatGPT, and Perplexity visibility.` |

**Implemented in code:** `app/page.tsx` + `lib/site.ts`. Meta title/description, OG, and canonical are set via the Next.js Metadata API in `app/layout.tsx` and `app/page.tsx`.

---

## 3. Spoke Blog Strategy

Blog spokes live **on the tool subdomain** at `geo-report.fusionsync.ai/blog/...` (keeps the funnel fully self-contained). The blog is MDX-based (`content/blog/*.mdx`), rendered via `next-mdx-remote/rsc`.

Each spoke: solves a precise problem → introduces the free tool as the immediate diagnostic next step (Tool CTA) → bridges to FusionSync's automation services for enterprise-scale execution (Enterprise CTA) and the booking link.

| # | Target keyword | Slug | Status |
| --- | --- | --- | --- |
| Hub/Pillar | `what is generative engine optimization (geo)` | `/blog/what-is-generative-engine-optimization-geo` | ✅ Published |
| Spoke 1 | `how to rank in google ai overviews` | `/blog/how-to-rank-in-google-ai-overviews` | ✅ Published |
| Spoke 2 | `how to get cited by perplexity and chatgpt` | `/blog/how-to-get-cited-by-perplexity-and-chatgpt` | ✅ Published |
| Spoke 3 | `how to optimize content for llms` | `/blog/how-to-optimize-content-for-llms` | ✅ Published |

### Standard CTAs (reuse across spokes)

- **Tool CTA:** *"Don't guess what AI engines see. Use our free White-Label AI SEO Report Generator to print an instant, client-ready audit."* → links to `/`.
- **Enterprise CTA:** *"Need to scale this across thousands of pages? See how FusionSync engineers automation layers for AI search."* → links to `fusionsync.ai/services`.
- **Booking CTA:** *"Book an AI audit call."* → `https://cal.com/fusionsyncai/ai-audit`.

### Future spoke ideas

- `white label seo report generator for agencies`
- `how to use ai overview audits for client acquisition`
- `chatgpt vs perplexity vs gemini for brand visibility`
- `geo audit checklist`
- `llms.txt explained`

---

## 4. Blog Authoring Guide

Create a new post at `content/blog/<slug>.mdx`. Frontmatter (validated by Zod in `lib/blog.ts`):

```yaml
---
title: "Post Title"
description: "One-sentence meta description used for SEO + OG."
slug: "post-title"            # must match the filename
publishedAt: "2026-06-12"
updatedAt: "2026-06-12"        # optional
author: "FusionSync AI"
category: "Strategy"
tags: ["GEO", "AI search"]
featured: true                  # featured posts surface on the landing page
draft: false                    # drafts are excluded from listings/sitemap
---
```

- Up to 3 `featured: true` posts appear in the landing "GEO Playbook" section.
- Each post auto-generates: canonical URL, OpenGraph/Twitter tags, `BlogPosting` JSON-LD, reading time, and related posts (by category + tag overlap).
- Internal links: use `/` for the tool, `/blog/<slug>` for cross-links (rendered as Next `<Link>`), and full URLs for external (open in new tab).

---

## 5. Structured Data (JSON-LD)

| Page | Schema | Location |
| --- | --- | --- |
| Hub / landing | `SoftwareApplication` (free, white-label, featureList) | `app/page.tsx` |
| Blog post | `BlogPosting` (author, dates, publisher, keywords) | `app/blog/[slug]/page.tsx` |

The `SoftwareApplication` block declares the tool as a free `BusinessApplication` authored by FusionSync AI, with a `featureList` covering white-label PDFs, Google AI Overview diagnostics, Perplexity/ChatGPT citation insights, and LLM crawler checks.

---

## 6. Internal Linking Engine

```
[Spoke Articles (organic / AI-search traffic)]
     │
     ├──► Tool CTA ───────► [Hub Page: Free GEO Tool /]
     │                              │
     └──► Enterprise CTA ───────────┴──► [FusionSync.ai services + cal.com booking]
```

- **Flow:** organic search lands on a spoke → spoke validates the pain point → reader runs the free audit on the hub → the hub + PDF bridge to FusionSync's consulting services and the booking link.
- Landing page links out to `/blog` and surfaces 3 featured posts. Each post links back to the tool and to related posts. The footer/header expose Blog + Book-a-call globally.

---

## 7. Technical SEO (implemented in this app)

| Asset | File | Notes |
| --- | --- | --- |
| Global metadata + `metadataBase` | `app/layout.tsx` | Title template, OG, Twitter, robots defaults |
| Per-page metadata | `app/page.tsx`, `app/blog/**` | Canonicals + OG per route |
| `sitemap.xml` | `app/sitemap.ts` | Home, `/blog`, every published post |
| `robots.txt` | `app/robots.ts` | Allows all; disallows `/api/` and `/report/`; points to sitemap |
| `llms.txt` | `app/llms.txt/route.ts` | Curated map of the tool + all guides for AI systems |
| Site constants | `lib/site.ts` | Single source of truth: domain, booking link, repo, keywords |

> **Note on `/report/` being disallowed:** report pages are per-UUID, ephemeral, and user-specific — not useful for indexing. The hub and blog carry the SEO weight.

### Configuration

Set the production domain via env so canonicals/sitemap/OG resolve correctly:

```bash
NEXT_PUBLIC_SITE_URL=https://geo-report.fusionsync.ai
```

Defaults to `https://geo-report.fusionsync.ai` if unset.

---

## 8. Launch Checklist

- [ ] Point DNS for `geo-report.fusionsync.ai` at the deployment.
- [ ] Set `NEXT_PUBLIC_SITE_URL=https://geo-report.fusionsync.ai` in production env.
- [ ] Add a real `public/og.png` (1200×630) for social cards (referenced as `siteConfig.ogImage`).
- [ ] Verify the subdomain in Google Search Console; submit `sitemap.xml`.
- [ ] Confirm `robots.txt`, `sitemap.xml`, and `llms.txt` resolve in production.
- [ ] Validate `SoftwareApplication` + `BlogPosting` JSON-LD in Google's Rich Results Test.
- [ ] Publish remaining spokes and interlink them.
- [ ] Track citation share in ChatGPT/Perplexity/AI Overviews for target queries monthly.
