import { env } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";
import { desc, eq } from "drizzle-orm";
import { getSiteConfig } from "@/server/config/siteConfig";
import { getDb } from "@/server/db";
import { posts } from "@/server/db/schema";
import { stripMarkdownExcerpt } from "@/server/markdown/render";

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function parseTags(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export const Route = createFileRoute("/rss.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const db = getDb();
        const baseUrl = (env.APP_BASE_URL || new URL(request.url).origin).replace(/\/+$/, "");
        const [siteConfig, postRows] = await Promise.all([
          getSiteConfig(db),
          db
            .select()
            .from(posts)
            .where(eq(posts.status, "published"))
            .orderBy(desc(posts.publishedAt), desc(posts.createdAt))
            .limit(50),
        ]);

        const latestDate = postRows[0]?.publishedAt ?? postRows[0]?.createdAt ?? new Date();
        const itemsXml = postRows
          .map((post) => {
            const link = `${baseUrl}/blog/${post.slug}`;
            const pubDate = (post.publishedAt ?? post.createdAt).toUTCString();
            const descText = post.summary || stripMarkdownExcerpt(post.contentMd, 220);
            const categories = [post.category, ...parseTags(post.tags)].filter(Boolean) as string[];
            return `    <item>
      <title>${xmlEscape(post.title)}</title>
      <link>${xmlEscape(link)}</link>
      <guid isPermaLink="true">${xmlEscape(link)}</guid>
      <description>${xmlEscape(descText)}</description>
      <pubDate>${pubDate}</pubDate>
${categories.map((cat) => `      <category>${xmlEscape(cat)}</category>`).join("\n")}
    </item>`;
          })
          .join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(siteConfig.title)}</title>
    <link>${xmlEscape(baseUrl)}</link>
    <description>${xmlEscape(siteConfig.bio || siteConfig.subtitle)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${latestDate.toUTCString()}</lastBuildDate>
    <atom:link href="${xmlEscape(`${baseUrl}/rss.xml`)}" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`;

        return new Response(xml, {
          status: 200,
          headers: {
            "Content-Type": "application/rss+xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
