import { env } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { moments, pages, posts } from "@/server/db/schema";

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function dateOnly(date: Date): string {
  return date.toISOString().split("T")[0] ?? "";
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const db = getDb();
        const baseUrl = (env.APP_BASE_URL || new URL(request.url).origin).replace(/\/+$/, "");

        const [postRows, pageRows, latestMoment] = await Promise.all([
          db
            .select({
              slug: posts.slug,
              updatedAt: posts.updatedAt,
              publishedAt: posts.publishedAt,
              createdAt: posts.createdAt,
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
              updatedAt: moments.updatedAt,
              publishedAt: moments.publishedAt,
              createdAt: moments.createdAt,
            })
            .from(moments)
            .where(eq(moments.status, "published"))
            .orderBy(desc(moments.publishedAt), desc(moments.createdAt))
            .limit(1)
            .get(),
        ]);

        const today = dateOnly(new Date());
        const entries: Array<{ loc: string; lastmod: string; changefreq: string; priority: string }> = [
          { loc: `${baseUrl}/`, lastmod: today, changefreq: "daily", priority: "1.0" },
          { loc: `${baseUrl}/blog`, lastmod: today, changefreq: "daily", priority: "0.9" },
          {
            loc: `${baseUrl}/moments`,
            lastmod: latestMoment
              ? dateOnly(latestMoment.updatedAt ?? latestMoment.publishedAt ?? latestMoment.createdAt)
              : today,
            changefreq: "daily",
            priority: "0.7",
          },
          { loc: `${baseUrl}/projects`, lastmod: today, changefreq: "weekly", priority: "0.7" },
          { loc: `${baseUrl}/friends`, lastmod: today, changefreq: "weekly", priority: "0.6" },
          { loc: `${baseUrl}/about`, lastmod: today, changefreq: "monthly", priority: "0.6" },
        ];

        const seen = new Set(entries.map((e) => e.loc));
        for (const p of postRows) {
          const loc = `${baseUrl}/blog/${p.slug}`;
          if (seen.has(loc)) continue;
          seen.add(loc);
          entries.push({
            loc,
            lastmod: dateOnly(p.updatedAt ?? p.publishedAt ?? p.createdAt),
            changefreq: "monthly",
            priority: "0.8",
          });
        }
        for (const pg of pageRows) {
          const loc = `${baseUrl}/${pg.slug}`;
          if (seen.has(loc)) continue;
          seen.add(loc);
          entries.push({
            loc,
            lastmod: dateOnly(pg.updatedAt ?? pg.createdAt),
            changefreq: "monthly",
            priority: "0.6",
          });
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (item) => `  <url>
    <loc>${xmlEscape(item.loc)}</loc>
    <lastmod>${item.lastmod}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`;

        return new Response(xml, {
          status: 200,
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=86400",
          },
        });
      },
    },
  },
});
