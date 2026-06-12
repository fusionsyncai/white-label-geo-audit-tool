import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "../components/SiteChrome";
import { BlogCard } from "../components/BlogCard";
import { getAllPosts } from "@/lib/blog";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "GEO & AI Search Blog | FusionSync",
  description:
    "Tactical guides on Generative Engine Optimization (GEO): ranking in Google AI Overviews, getting cited by ChatGPT and Perplexity, and optimizing content for LLMs.",
  alternates: { canonical: absoluteUrl("/blog") },
  openGraph: {
    title: "GEO & AI Search Blog | FusionSync",
    description:
      "Tactical guides on Generative Engine Optimization (GEO) for agencies and B2B operators.",
    url: absoluteUrl("/blog"),
    type: "website",
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();
  const [lead, ...rest] = posts;

  return (
    <div className="flex min-h-full flex-col bg-white text-slate-900">
      <SiteHeader />

      <main className="flex-1">
        <section className="border-b border-slate-100 bg-slate-50/60">
          <div className="mx-auto max-w-5xl px-6 py-16 text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              The GEO Playbook
            </p>
            <h1 className="mt-3 font-heading text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Win the AI search era
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              Research-backed guides on Generative Engine Optimization — how to
              get your site seen, parsed, and cited by ChatGPT, Perplexity,
              Gemini, and Google AI Overviews.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-indigo-500"
            >
              Run a free GEO audit
            </Link>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-6 py-14">
          {posts.length === 0 ? (
            <p className="text-center text-slate-500">
              No articles published yet. Check back soon.
            </p>
          ) : (
            <>
              {lead && (
                <Link
                  href={lead.href}
                  className="group mb-12 block rounded-3xl border border-slate-200 bg-white p-8 transition hover:border-blue-200 hover:shadow-md sm:p-10"
                >
                  <div className="flex items-center gap-2 text-xs font-medium text-blue-600">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 uppercase tracking-wide">
                      Featured
                    </span>
                    <span className="text-slate-400">
                      {lead.readingMinutes} min read
                    </span>
                  </div>
                  <h2 className="mt-4 font-heading text-2xl font-bold leading-tight text-slate-900 group-hover:text-blue-700 sm:text-3xl">
                    {lead.frontmatter.title}
                  </h2>
                  <p className="mt-3 max-w-3xl text-slate-600">
                    {lead.frontmatter.description}
                  </p>
                  <span className="mt-5 inline-block text-sm font-semibold text-blue-600">
                    Read the guide &rarr;
                  </span>
                </Link>
              )}

              {rest.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((post) => (
                    <BlogCard key={post.frontmatter.slug} post={post} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
