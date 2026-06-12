const rawSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://geo-report.fusionsync.ai";

export const siteConfig = {
  name: "FusionSync AI Report Generator",
  shortName: "FusionSync AI",
  url: rawSiteUrl.replace(/\/$/, ""),
  title:
    "Free White-Label AI SEO & GEO Report Generator | FusionSync",
  description:
    "Generate custom, branded PDF reports on Google AI Overviews, Perplexity, and ChatGPT visibility. Drop your prospect's URL and export an actionable white-label GEO audit.",
  primaryKeyword: "White Label AI SEO Report Generator",
  keywords: [
    "white label ai seo report generator",
    "google ai overview audit tool",
    "free geo audit report tool",
    "llm visibility scanner",
    "generative engine optimization",
    "AI search visibility",
  ],
  bookingUrl: "https://cal.com/fusionsyncai/ai-audit",
  fusionsyncUrl: "https://www.fusionsync.ai",
  fusionsyncServicesUrl: "https://www.fusionsync.ai/services",
  repoUrl: "https://github.com/zubair-trabzada/geo-seo-claude",
  repoAuthor: "Zubair Trabzada",
  ogImage: "/og.png",
  organization: {
    name: "FusionSync AI",
    url: "https://www.fusionsync.ai",
  },
} as const;

export function absoluteUrl(path = ""): string {
  if (!path) return siteConfig.url;
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
}
