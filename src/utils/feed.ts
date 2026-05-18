import { desc, eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { seoConfig, generatePageUrl } from "../config/seo";
import * as schema from "../db/schema";
import { moments, pages, posts } from "../db/schema";

type Database = DrizzleD1Database<typeof schema>;

type FeedUrl = {
  loc: string;
  lastmod: Date;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
};

type RssItem = {
  title: string;
  link: string;
  description: string;
  pubDate: Date;
  guid: string;
  categories?: string[];
};

function absoluteUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${seoConfig.siteUrl.replace(/\/$/, "")}${normalizedPath === "/" ? "" : normalizedPath}`;
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function safeJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function stripMarkdown(value: string): string {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[#>*_~\-|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function excerpt(value: string | null | undefined, maxLength = 220): string {
  const text = stripMarkdown(value ?? "");
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

function dateOnly(date: Date): string {
  return date.toISOString().split("T")[0];
}

async function getSitemapUrls(db: Database): Promise<FeedUrl[]> {
  const [postRows, pageRows, momentRows] = await Promise.all([
    db
      .select({
        slug: posts.slug,
        publishedAt: posts.publishedAt,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.publishedAt), desc(posts.createdAt))
      .limit(1000),
    db
      .select({
        slug: pages.slug,
        updatedAt: pages.updatedAt,
        createdAt: pages.createdAt,
      })
      .from(pages)
      .where(eq(pages.status, "published"))
      .orderBy(desc(pages.updatedAt))
      .limit(300),
    db
      .select({
        publishedAt: moments.publishedAt,
        createdAt: moments.createdAt,
        updatedAt: moments.updatedAt,
      })
      .from(moments)
      .where(eq(moments.status, "published"))
      .orderBy(desc(moments.publishedAt), desc(moments.createdAt))
      .limit(1),
  ]);

  const staticUrls = Object.entries(seoConfig.pages).map(([path, config]) => ({
    loc: generatePageUrl(path),
    lastmod: new Date(),
    changefreq: config.changefreq || "monthly",
    priority: config.priority || 0.5,
  }));

  const dynamicUrls: FeedUrl[] = [
    ...postRows.map((post) => ({
      loc: absoluteUrl(`/blog/${post.slug}`),
      lastmod: post.updatedAt || post.publishedAt || post.createdAt,
      changefreq: "monthly" as const,
      priority: 0.8,
    })),
    ...pageRows.map((page) => ({
      loc: absoluteUrl(`/${page.slug}`),
      lastmod: page.updatedAt || page.createdAt,
      changefreq: "monthly" as const,
      priority: 0.6,
    })),
    ...momentRows.map((moment) => ({
      loc: absoluteUrl("/moments"),
      lastmod: moment.updatedAt || moment.publishedAt || moment.createdAt,
      changefreq: "daily" as const,
      priority: 0.7,
    })),
  ];

  return [...staticUrls, ...dynamicUrls];
}

export async function generateDynamicSitemapXml(db: Database): Promise<string> {
  const urls = await getSitemapUrls(db);
  const seen = new Set<string>();
  const entries = urls
    .filter((item) => {
      if (seen.has(item.loc)) return false;
      seen.add(item.loc);
      return true;
    })
    .map(
      (item) => `  <url>
    <loc>${xmlEscape(item.loc)}</loc>
    <lastmod>${dateOnly(item.lastmod)}</lastmod>
    <changefreq>${item.changefreq || "monthly"}</changefreq>
    <priority>${item.priority ?? 0.5}</priority>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;
}

async function getRssItems(db: Database): Promise<RssItem[]> {
  const rows = await db
    .select({
      title: posts.title,
      slug: posts.slug,
      summary: posts.summary,
      contentMd: posts.contentMd,
      tags: posts.tags,
      category: posts.category,
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.publishedAt), desc(posts.createdAt))
    .limit(50);

  return rows.map((post) => ({
    title: post.title,
    link: absoluteUrl(`/blog/${post.slug}`),
    description: excerpt(post.summary || post.contentMd),
    pubDate: post.publishedAt || post.createdAt,
    guid: absoluteUrl(`/blog/${post.slug}`),
    categories: [post.category, ...safeJson<string[]>(post.tags, [])].filter(Boolean) as string[],
  }));
}

export async function generateRssXml(db: Database): Promise<string> {
  const items = await getRssItems(db);
  const latestDate = items[0]?.pubDate || new Date();
  const itemXml = items
    .map(
      (item) => `    <item>
      <title>${xmlEscape(item.title)}</title>
      <link>${xmlEscape(item.link)}</link>
      <guid isPermaLink="true">${xmlEscape(item.guid)}</guid>
      <description>${xmlEscape(item.description)}</description>
      <pubDate>${item.pubDate.toUTCString()}</pubDate>
${(item.categories || []).map((category) => `      <category>${xmlEscape(category)}</category>`).join("\n")}
    </item>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(seoConfig.siteName)}</title>
    <link>${xmlEscape(seoConfig.siteUrl)}</link>
    <description>${xmlEscape(seoConfig.description)}</description>
    <language>${xmlEscape(seoConfig.language)}</language>
    <lastBuildDate>${latestDate.toUTCString()}</lastBuildDate>
    <atom:link href="${xmlEscape(absoluteUrl("/rss.xml"))}" rel="self" type="application/rss+xml" />
${itemXml}
  </channel>
</rss>`;
}
