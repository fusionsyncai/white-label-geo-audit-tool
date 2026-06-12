import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";

const prettyCodeOptions = {
  theme: "github-light",
  keepBackground: false,
};

function Anchor({ href = "", ...props }: ComponentPropsWithoutRef<"a">) {
  const isInternal = href.startsWith("/") || href.startsWith("#");
  if (isInternal) {
    return (
      <Link
        href={href}
        className="font-medium text-blue-600 underline decoration-blue-300 underline-offset-2 hover:text-blue-700"
        {...props}
      />
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-blue-600 underline decoration-blue-300 underline-offset-2 hover:text-blue-700"
      {...props}
    />
  );
}

const components = {
  a: Anchor,
  h2: (props: ComponentPropsWithoutRef<"h2">) => (
    <h2
      className="mt-12 scroll-mt-24 font-heading text-2xl font-bold text-slate-900"
      {...props}
    />
  ),
  h3: (props: ComponentPropsWithoutRef<"h3">) => (
    <h3
      className="mt-8 scroll-mt-24 font-heading text-xl font-semibold text-slate-900"
      {...props}
    />
  ),
  h4: (props: ComponentPropsWithoutRef<"h4">) => (
    <h4
      className="mt-6 scroll-mt-24 font-heading text-lg font-semibold text-slate-900"
      {...props}
    />
  ),
  p: (props: ComponentPropsWithoutRef<"p">) => (
    <p className="mt-5 leading-relaxed text-slate-700" {...props} />
  ),
  ul: (props: ComponentPropsWithoutRef<"ul">) => (
    <ul
      className="mt-5 list-disc space-y-2 pl-6 text-slate-700 marker:text-slate-400"
      {...props}
    />
  ),
  ol: (props: ComponentPropsWithoutRef<"ol">) => (
    <ol
      className="mt-5 list-decimal space-y-2 pl-6 text-slate-700 marker:text-slate-400"
      {...props}
    />
  ),
  li: (props: ComponentPropsWithoutRef<"li">) => (
    <li className="leading-relaxed" {...props} />
  ),
  blockquote: (props: ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      className="mt-6 border-l-4 border-blue-500 bg-blue-50/60 px-5 py-3 text-slate-700 italic"
      {...props}
    />
  ),
  strong: (props: ComponentPropsWithoutRef<"strong">) => (
    <strong className="font-semibold text-slate-900" {...props} />
  ),
  hr: () => <hr className="my-10 border-slate-200" />,
  table: (props: ComponentPropsWithoutRef<"table">) => (
    <div className="mt-6 overflow-x-auto">
      <table
        className="w-full border-collapse text-left text-sm"
        {...props}
      />
    </div>
  ),
  th: (props: ComponentPropsWithoutRef<"th">) => (
    <th
      className="border-b border-slate-300 bg-slate-50 px-4 py-2 font-semibold text-slate-900"
      {...props}
    />
  ),
  td: (props: ComponentPropsWithoutRef<"td">) => (
    <td className="border-b border-slate-200 px-4 py-2 text-slate-700" {...props} />
  ),
  code: (props: ComponentPropsWithoutRef<"code">) => (
    <code
      className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-slate-800"
      {...props}
    />
  ),
  pre: (props: ComponentPropsWithoutRef<"pre">) => (
    <pre
      className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm [&_code]:bg-transparent [&_code]:p-0"
      {...props}
    />
  ),
};

export function MdxContent({ source }: { source: string }) {
  return (
    <MDXRemote
      source={source}
      components={components}
      options={{
        parseFrontmatter: false,
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [
            rehypeSlug,
            [
              rehypeAutolinkHeadings,
              { behavior: "wrap", properties: { className: ["no-underline"] } },
            ],
            [rehypePrettyCode, prettyCodeOptions],
          ],
          format: "mdx",
        },
      }}
    />
  );
}
