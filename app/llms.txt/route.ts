import { getAllPosts } from "@/lib/blog";
import { absoluteUrl, siteConfig } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  const posts = getAllPosts();

  const lines: string[] = [
    `# ${siteConfig.name}`,
    "",
    `> ${siteConfig.description}`,
    "",
    "Free white-label AI SEO & GEO report generator. Drop a URL and export a branded PDF audit of a site's visibility across Google AI Overviews, ChatGPT, Perplexity, and Gemini. Built by FusionSync AI.",
    "",
    "## Core",
    `- [GEO Report Generator (free tool)](${absoluteUrl("/")}): Generate a white-label AI search visibility audit for any website.`,
    `- [GEO & AI Search Blog](${absoluteUrl("/blog")}): Guides on Generative Engine Optimization.`,
    "",
    "## Guides",
    ...posts.map(
      (p) =>
        `- [${p.frontmatter.title}](${p.absoluteUrl}): ${p.frontmatter.description}`
    ),
    "",
    "## About FusionSync AI",
    `- [FusionSync AI](${siteConfig.fusionsyncUrl}): Inbound sales infrastructure — AI lead response, voice agents, and CRM automation.`,
    `- [Book an AI audit call](${siteConfig.bookingUrl})`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
