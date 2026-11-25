import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { stripMarkdownExcerpt } from "../markdown/render";
import type { AppDatabase } from "./index";
import { friendLinks, moments, pages, posts, projects } from "./schema";

export type SearchEntityType = "post" | "page" | "moment" | "project" | "friend";

export type SearchEntryInput = {
  entityType: SearchEntityType;
  entityId: string;
  url: string;
  publishedAt: number;
  title: string;
  body: string;
  tags: string;
};

export type SearchResultItem = {
  id: string;
  type: SearchEntityType;
  title: string;
  excerpt: string | null;
  url: string;
  date: string | null;
  meta: string[];
};

function parseStringArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export async function syncSearchEntry(db: AppDatabase, entry: SearchEntryInput): Promise<void> {
  await db.run(
    sql`DELETE FROM search_fts WHERE entity_type = ${entry.entityType} AND entity_id = ${entry.entityId}`,
  );
  await db.run(
    sql`INSERT INTO search_fts (entity_type, entity_id, url, published_at, title, body, tags)
        VALUES (${entry.entityType}, ${entry.entityId}, ${entry.url}, ${String(entry.publishedAt)}, ${entry.title}, ${entry.body}, ${entry.tags})`,
  );
}

export async function deleteSearchEntry(
  db: AppDatabase,
  entityType: SearchEntityType,
  entityId: string,
): Promise<void> {
  await db.run(sql`DELETE FROM search_fts WHERE entity_type = ${entityType} AND entity_id = ${entityId}`);
}

export async function rebuildSearchIndex(db: AppDatabase): Promise<{ indexed: number }> {
  await db.run(sql`DELETE FROM search_fts`);

  const [postRows, pageRows, momentRows, projectRows, friendRows] = await Promise.all([
    db.select().from(posts).where(eq(posts.status, "published")),
    db.select().from(pages).where(eq(pages.status, "published")),
    db.select().from(moments).where(eq(moments.status, "published")),
    db.select().from(projects).where(eq(projects.status, "published")),
    db.select().from(friendLinks).where(eq(friendLinks.status, "published")),
  ]);

  let indexed = 0;

  for (const post of postRows) {
    const tags = [post.category, ...parseStringArray(post.tags)].filter(Boolean).join(" ");
    await syncSearchEntry(db, {
      entityType: "post",
      entityId: post.id,
      url: `/blog/${post.slug}`,
      publishedAt: (post.publishedAt ?? post.createdAt).getTime(),
      title: post.title,
      body: `${post.summary ?? ""}\n${stripMarkdownExcerpt(post.contentMd, 4000)}`,
      tags,
    });
    indexed += 1;
  }

  for (const page of pageRows) {
    await syncSearchEntry(db, {
      entityType: "page",
      entityId: page.id,
      url: `/${page.slug}`,
      publishedAt: page.updatedAt.getTime(),
      title: page.title,
      body: stripMarkdownExcerpt(page.contentMd, 4000),
      tags: "页面",
    });
    indexed += 1;
  }

  for (const moment of momentRows) {
    await syncSearchEntry(db, {
      entityType: "moment",
      entityId: moment.id,
      url: `/moments#${moment.slug}`,
      publishedAt: (moment.publishedAt ?? moment.createdAt).getTime(),
      title: moment.location ? `瞬间 · ${moment.location}` : "瞬间",
      body: stripMarkdownExcerpt(moment.contentMd, 2000),
      tags: moment.location ?? "瞬间",
    });
    indexed += 1;
  }

  for (const project of projectRows) {
    await syncSearchEntry(db, {
      entityType: "project",
      entityId: project.id,
      url: "/projects",
      publishedAt: project.updatedAt.getTime(),
      title: project.name,
      body: project.description ?? "",
      tags: parseStringArray(project.tags).join(" "),
    });
    indexed += 1;
  }

  for (const friend of friendRows) {
    await syncSearchEntry(db, {
      entityType: "friend",
      entityId: friend.id,
      url: friend.url,
      publishedAt: friend.updatedAt.getTime(),
      title: friend.name,
      body: `${friend.description ?? ""} ${friend.url}`,
      tags: "友链",
    });
    indexed += 1;
  }

  return { indexed };
}

function escapeFtsPhrase(term: string): string {
  return `"${term.replace(/"/g, '""')}"`;
}

function escapeLikePattern(term: string): string {
  return `%${term.replace(/[\\%_]/g, "\\$&")}%`;
}

function buildSnippet(body: string, keyword: string, maxLength = 140): string | null {
  const clean = body.replace(/\s+/g, " ").trim();
  if (!clean) return null;
  const idx = clean.toLowerCase().indexOf(keyword.toLowerCase());
  const start = idx > 32 ? idx - 32 : 0;
  const chunk = clean.slice(start, start + maxLength).trim();
  return `${start > 0 ? "…" : ""}${chunk}${start + maxLength < clean.length ? "…" : ""}`;
}

async function fallbackLikeSearch(
  db: AppDatabase,
  keyword: string,
  limit: number,
): Promise<SearchResultItem[]> {
  const pattern = escapeLikePattern(keyword);
  const [postRows, pageRows, momentRows, projectRows, friendRows] = await Promise.all([
    db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        summary: posts.summary,
        category: posts.category,
        tags: posts.tags,
        publishedAt: posts.publishedAt,
        createdAt: posts.createdAt,
      })
      .from(posts)
      .where(
        and(
          eq(posts.status, "published"),
          or(
            like(posts.title, pattern),
            like(posts.summary, pattern),
            like(posts.category, pattern),
            like(posts.tags, pattern),
            like(posts.contentMd, pattern),
          ),
        ),
      )
      .orderBy(desc(posts.publishedAt), desc(posts.createdAt))
      .limit(limit),
    db
      .select({
        id: pages.id,
        title: pages.title,
        slug: pages.slug,
        contentMd: pages.contentMd,
        updatedAt: pages.updatedAt,
      })
      .from(pages)
      .where(
        and(eq(pages.status, "published"), or(like(pages.title, pattern), like(pages.contentMd, pattern))),
      )
      .limit(10),
    db
      .select({
        id: moments.id,
        slug: moments.slug,
        location: moments.location,
        contentMd: moments.contentMd,
        publishedAt: moments.publishedAt,
        createdAt: moments.createdAt,
      })
      .from(moments)
      .where(
        and(
          eq(moments.status, "published"),
          or(like(moments.contentMd, pattern), like(moments.location, pattern)),
        ),
      )
      .orderBy(desc(moments.publishedAt), desc(moments.createdAt))
      .limit(15),
    db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.status, "published"),
          or(like(projects.name, pattern), like(projects.description, pattern), like(projects.tags, pattern)),
        ),
      )
      .limit(10),
    db
      .select()
      .from(friendLinks)
      .where(
        and(
          eq(friendLinks.status, "published"),
          or(
            like(friendLinks.name, pattern),
            like(friendLinks.description, pattern),
            like(friendLinks.url, pattern),
          ),
        ),
      )
      .limit(10),
  ]);

  return [
    ...postRows.map((p) => ({
      id: p.id,
      type: "post" as const,
      title: p.title,
      excerpt: p.summary,
      url: `/blog/${p.slug}`,
      date: (p.publishedAt ?? p.createdAt).toISOString(),
      meta: [p.category, ...parseStringArray(p.tags)].filter(Boolean) as string[],
    })),
    ...pageRows.map((pg) => ({
      id: pg.id,
      type: "page" as const,
      title: pg.title,
      excerpt: stripMarkdownExcerpt(pg.contentMd, 140),
      url: `/${pg.slug}`,
      date: pg.updatedAt.toISOString(),
      meta: ["页面"],
    })),
    ...momentRows.map((m) => ({
      id: m.id,
      type: "moment" as const,
      title: m.location ? `瞬间 · ${m.location}` : "瞬间",
      excerpt: stripMarkdownExcerpt(m.contentMd, 140),
      url: `/moments#${m.slug}`,
      date: (m.publishedAt ?? m.createdAt).toISOString(),
      meta: m.location ? [m.location] : ["瞬间"],
    })),
    ...projectRows.map((pr) => ({
      id: pr.id,
      type: "project" as const,
      title: pr.name,
      excerpt: pr.description,
      url: "/projects",
      date: pr.updatedAt.toISOString(),
      meta: parseStringArray(pr.tags),
    })),
    ...friendRows.map((fr) => ({
      id: fr.id,
      type: "friend" as const,
      title: fr.name,
      excerpt: fr.description ?? fr.url,
      url: fr.url,
      date: fr.updatedAt.toISOString(),
      meta: ["友链"],
    })),
  ]
    .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime())
    .slice(0, limit);
}

export async function searchContent(
  db: AppDatabase,
  rawKeyword: string,
  limit = 30,
): Promise<SearchResultItem[]> {
  const keyword = rawKeyword.trim();
  if (!keyword) return [];

  if (keyword.length < 3) {
    return fallbackLikeSearch(db, keyword, limit);
  }

  try {
    const ftsQuery = escapeFtsPhrase(keyword);
    const result = await db.all<{
      entity_type: SearchEntityType;
      entity_id: string;
      url: string;
      published_at: string;
      title: string;
      body: string;
      tags: string;
    }>(
      sql`SELECT entity_type, entity_id, url, published_at, title, body, tags
          FROM search_fts
          WHERE search_fts MATCH ${ftsQuery}
          ORDER BY bm25(search_fts)
          LIMIT ${limit}`,
    );

    if (result.length > 0) {
      return result.map((row) => {
        const ts = Number(row.published_at);
        return {
          id: row.entity_id,
          type: row.entity_type,
          title: row.title,
          excerpt: buildSnippet(row.body, keyword),
          url: row.url,
          date: Number.isFinite(ts) && ts > 0 ? new Date(ts).toISOString() : null,
          meta: row.tags ? row.tags.split(/\s+/).filter(Boolean).slice(0, 4) : [],
        };
      });
    }
  } catch (err) {
    console.warn("[Search] FTS5 query fallback:", err);
  }

  return fallbackLikeSearch(db, keyword, limit);
}
