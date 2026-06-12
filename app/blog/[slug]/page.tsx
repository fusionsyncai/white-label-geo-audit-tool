import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "../../components/SiteChrome";
import { MdxContent } from "../../components/MdxContent";
import { BlogCard } from "../../components/BlogCard";
import { getAllPosts, getPost, getRelatedPosts } from "@/lib/blog";
import { absoluteUrl, siteConfig } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.frontmatter.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  const { frontmatter } = post;
  const url = absoluteUrl(post.href);
  const ogImage = frontmatter.ogImage ?? frontmatter.coverImage ?? siteConfig.ogImage;

  return {
    title: frontmatter.title,
    description: frontmatter.description,
    keywords: frontmatter.tags,
    alternates: { canonical: url },
    openGraph: {
      title: frontmatter.title,
      description: frontmatter.description,
      url,
      type: "article",
      publishedTime: frontmatter.publishedAt,
      modifiedTime: frontmatter.updatedAt ?? frontmatter.publishedAt,
      authors: [frontmatter.author],
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: frontmatter.title,
      description: frontmatter.description,
      images: [ogImage],
    },
  };
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post || post.frontmatter.draft) notFound();

  const { frontmatter } = post;
  const related = getRelatedPosts(slug);
  const url = absoluteUrl(post.href);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: frontmatter.title,
    description: frontmatter.description,
    datePublished: frontmatter.publishedAt,
    dateModified: frontmatter.updatedAt ?? frontmatter.publishedAt,
    author: { "@type": "Organization", name: frontmatter.author },
    publisher: {
      "@type": "Organization",
      name: siteConfig.organization.name,
      url: siteConfig.organization.url,
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    keywords: frontmatter.tags.join(", "),
  };

  return (
    <div className="flex min-h-full flex-col bg-white text-slate-900">
      <SiteHeader />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-6 py-12">
          <Link
            href="/blog"
            className="text-sm text-slate-500 transition hover:text-slate-800"
          >
            &larr; All articles
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-medium text-blue-600">
            <span className="rounded-full bg-blue-50 px-2.5 py-1 uppercase tracking-wide">
              {frontmatter.category}
            </span>
            <span className="text-slate-400">
              {formatDate(frontmatter.publishedAt)} · {post.readingMinutes} min
              read
            </span>
          </div>

          <h1 className="mt-4 font-heading text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">
            {frontmatter.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            {frontmatter.description}
          </p>

          <hr className="mt-8 border-slate-200" />

          <div className="mt-2">
            <MdxContent source={post.body} />
          </div>

          {/* Tool CTA */}
          <div className="mt-12 rounded-2xl border border-blue-200 bg-linear-to-br from-blue-50 to-indigo-50 p-7">
            <h2 className="font-heading text-xl font-bold text-slate-900">
              Run a free white-label GEO audit
            </h2>
            <p className="mt-2 text-slate-600">
              Stop guessing what AI engines see. Drop any URL, get a full GEO
              report, and export a branded PDF you can send to clients in
              minutes.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-6 py-3 text-center text-sm font-semibold text-white transition hover:from-blue-500 hover:to-indigo-500"
              >
                Generate my free report
              </Link>
              <a
                href={siteConfig.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Book an AI audit call
              </a>
            </div>
          </div>
        </article>

        {related.length > 0 && (
          <section className="border-t border-slate-100 bg-slate-50/60">
            <div className="mx-auto max-w-5xl px-6 py-14">
              <h2 className="font-heading text-2xl font-bold text-slate-900">
                Keep reading
              </h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((p) => (
                  <BlogCard key={p.frontmatter.slug} post={p} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
