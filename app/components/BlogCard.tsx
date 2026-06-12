import Link from "next/link";
import type { Post } from "@/lib/blog";

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function BlogCard({ post }: { post: Post }) {
  const { frontmatter, readingMinutes, href } = post;
  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      <div className="flex items-center gap-2 text-xs font-medium text-blue-600">
        <span className="rounded-full bg-blue-50 px-2.5 py-1 uppercase tracking-wide">
          {frontmatter.category}
        </span>
        <span className="text-slate-400">{readingMinutes} min read</span>
      </div>
      <h3 className="mt-4 font-heading text-lg font-semibold leading-snug text-slate-900 group-hover:text-blue-700">
        {frontmatter.title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
        {frontmatter.description}
      </p>
      <div className="mt-5 flex items-center justify-between text-xs text-slate-400">
        <span>{formatDate(frontmatter.publishedAt)}</span>
        <span className="font-medium text-blue-600 group-hover:translate-x-0.5">
          Read &rarr;
        </span>
      </div>
    </Link>
  );
}
