import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import matter from "gray-matter";
import readingTime from "reading-time";
import { z } from "zod";
import { absoluteUrl } from "./site";

const POSTS_DIR = path.join(process.cwd(), "content", "blog");

const frontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  slug: z.string().min(1),
  publishedAt: z.string().min(1),
  updatedAt: z.string().optional(),
  author: z.string().default("FusionSync AI"),
  category: z.string().default("GEO"),
  tags: z.array(z.string()).default([]),
  coverImage: z.string().optional(),
  ogImage: z.string().optional(),
  featured: z.boolean().default(false),
  draft: z.boolean().default(false),
});

export type PostFrontmatter = z.infer<typeof frontmatterSchema>;

export type Post = {
  frontmatter: PostFrontmatter;
  body: string;
  readingMinutes: number;
  href: string;
  absoluteUrl: string;
};

function safeReadDir(dir: string): string[] {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [];
  }
}

function loadPost(file: string): Post {
  const slug = file.replace(/\.mdx?$/, "");
  const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
  const { content, data } = matter(raw);
  const frontmatter = frontmatterSchema.parse({ slug, ...data });

  if (frontmatter.slug !== slug) {
    throw new Error(
      `Frontmatter slug "${frontmatter.slug}" does not match filename "${slug}"`
    );
  }

  const href = `/blog/${slug}`;
  return {
    frontmatter,
    body: content,
    readingMinutes: Math.max(1, Math.round(readingTime(content).minutes)),
    href,
    absoluteUrl: absoluteUrl(href),
  };
}

export const getAllPosts = cache((includeDrafts = false): Post[] => {
  const files = safeReadDir(POSTS_DIR).filter((f) => f.endsWith(".mdx"));
  return files
    .map(loadPost)
    .filter((p) => includeDrafts || !p.frontmatter.draft)
    .sort(
      (a, b) =>
        new Date(b.frontmatter.publishedAt).getTime() -
        new Date(a.frontmatter.publishedAt).getTime()
    );
});

export function getPost(slug: string): Post | null {
  return getAllPosts(true).find((p) => p.frontmatter.slug === slug) ?? null;
}

export function getFeaturedPosts(limit = 3): Post[] {
  const posts = getAllPosts();
  const featured = posts.filter((p) => p.frontmatter.featured);
  const pool = featured.length > 0 ? featured : posts;
  return pool.slice(0, limit);
}

export function getRelatedPosts(slug: string, limit = 3): Post[] {
  const current = getPost(slug);
  if (!current) return [];
  const others = getAllPosts().filter((p) => p.frontmatter.slug !== slug);

  const scored = others
    .map((p) => {
      let score = 0;
      if (p.frontmatter.category === current.frontmatter.category) score += 2;
      const overlap = p.frontmatter.tags.filter((t) =>
        current.frontmatter.tags.includes(t)
      ).length;
      score += overlap;
      return { post: p, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.post);
}
