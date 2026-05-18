import { OpenAPIHono } from "@hono/zod-openapi";
import { and, desc, eq, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { friendLinks, moments, pages, posts, projects } from "../db/schema";
import type { Bindings } from "../types";
import { ApplyFriendLinkSchema } from "../../common/validators/admin.schema";

type Variables = {
  db: DrizzleD1Database<typeof schema>;
};

const app = new OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>();

function iso(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

function safeJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function momentDto(row: typeof moments.$inferSelect) {
  return {
    id: row.id,
    slug: row.slug,
    contentMd: row.contentMd,
    location: row.location,
    images: safeJson<string[]>(row.images, []),
    frontmatter: safeJson<Record<string, unknown>>(row.frontmatter, {}),
    status: row.status,
    publishedAt: iso(row.publishedAt),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

app.get("/moments", async (c) => {
  const db = c.get("db");
  const rows = await db
    .select()
    .from(moments)
    .where(eq(moments.status, "published"))
    .orderBy(desc(moments.publishedAt), desc(moments.createdAt));
  return c.json(rows.map(momentDto));
});

app.get("/pages/:slug", async (c) => {
  const db = c.get("db");
  const slug = c.req.param("slug");
  const row = await db
    .select()
    .from(pages)
    .where(and(eq(pages.slug, slug), eq(pages.status, "published")))
    .get();
  if (!row) return c.json({ code: 404, message: "页面不存在" }, 404);
  return c.json({
    id: row.id,
    slug: row.slug,
    title: row.title,
    contentMd: row.contentMd,
    frontmatter: safeJson<Record<string, unknown>>(row.frontmatter, {}),
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
});

app.get("/projects", async (c) => {
  const db = c.get("db");
  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.status, "published"))
    .orderBy(projects.sortOrder, desc(projects.createdAt));
  return c.json(
    rows.map((row) => ({
      ...row,
      tags: safeJson<string[]>(row.tags, []),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
  );
});

app.get("/friend-links", async (c) => {
  const db = c.get("db");
  const rows = await db
    .select()
    .from(friendLinks)
    .where(eq(friendLinks.status, "published"))
    .orderBy(friendLinks.sortOrder, desc(friendLinks.createdAt));
  return c.json(
    rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
  );
});

type SearchResultType = "post" | "page" | "moment" | "project" | "friend";

type SearchResult = {
  id: string;
  type: SearchResultType;
  title: string;
  excerpt: string | null;
  url: string;
  date: string | null;
  meta: string[];
};

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

function excerptFor(value: string | null | undefined, keyword: string, maxLength = 140): string | null {
  const text = stripMarkdown(value ?? "");
  if (!text) return null;

  const lowerText = text.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  const index = lowerKeyword ? lowerText.indexOf(lowerKeyword) : -1;
  const start = index > 32 ? index - 32 : 0;
  const excerpt = text.slice(start, start + maxLength).trim();
  const prefix = start > 0 ? "..." : "";
  const suffix = start + maxLength < text.length ? "..." : "";
  return `${prefix}${excerpt}${suffix}`;
}

function includesKeyword(values: Array<string | null | undefined>, keyword: string): boolean {
  const lowerKeyword = keyword.toLowerCase();
  return values.some((value) => String(value ?? "").toLowerCase().includes(lowerKeyword));
}

app.get("/search", async (c) => {
  const db = c.get("db");
  const keyword = (c.req.query("q") || "").trim();
  const limit = Math.min(50, Math.max(1, Number(c.req.query("limit") || "30")));

  if (!keyword) {
    return c.json({ items: [], query: keyword, total: 0 });
  }

  const [postRows, pageRows, momentRows, projectRows, friendRows] = await Promise.all([
    db
      .select()
      .from(posts)
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.publishedAt), desc(posts.createdAt))
      .limit(200),
    db
      .select()
      .from(pages)
      .where(eq(pages.status, "published"))
      .orderBy(desc(pages.updatedAt))
      .limit(80),
    db
      .select()
      .from(moments)
      .where(eq(moments.status, "published"))
      .orderBy(desc(moments.publishedAt), desc(moments.createdAt))
      .limit(120),
    db
      .select()
      .from(projects)
      .where(eq(projects.status, "published"))
      .orderBy(projects.sortOrder, desc(projects.createdAt))
      .limit(80),
    db
      .select()
      .from(friendLinks)
      .where(eq(friendLinks.status, "published"))
      .orderBy(friendLinks.sortOrder, desc(friendLinks.createdAt))
      .limit(120),
  ]);

  const results: SearchResult[] = [
    ...postRows
      .filter((post) =>
        includesKeyword([post.title, post.summary, post.category, post.tags, post.contentMd], keyword),
      )
      .map((post) => ({
        id: post.id,
        type: "post" as const,
        title: post.title,
        excerpt: excerptFor(post.summary || post.contentMd, keyword),
        url: `/blog/${post.slug}`,
        date: iso(post.publishedAt || post.createdAt),
        meta: [post.category, ...safeJson<string[]>(post.tags, [])].filter(Boolean) as string[],
      })),
    ...pageRows
      .filter((page) => includesKeyword([page.title, page.contentMd], keyword))
      .map((page) => ({
        id: page.id,
        type: "page" as const,
        title: page.title,
        excerpt: excerptFor(page.contentMd, keyword),
        url: `/${page.slug}`,
        date: iso(page.updatedAt),
        meta: ["页面"],
      })),
    ...momentRows
      .filter((moment) => includesKeyword([moment.contentMd, moment.location], keyword))
      .map((moment) => ({
        id: moment.id,
        type: "moment" as const,
        title: moment.location ? `瞬间 · ${moment.location}` : "瞬间",
        excerpt: excerptFor(moment.contentMd, keyword),
        url: "/moments",
        date: iso(moment.publishedAt || moment.createdAt),
        meta: moment.location ? [moment.location] : ["动态"],
      })),
    ...projectRows
      .filter((project) => includesKeyword([project.name, project.description, project.tags], keyword))
      .map((project) => ({
        id: project.id,
        type: "project" as const,
        title: project.name,
        excerpt: excerptFor(project.description, keyword),
        url: "/projects",
        date: iso(project.updatedAt),
        meta: safeJson<string[]>(project.tags, []),
      })),
    ...friendRows
      .filter((friend) => includesKeyword([friend.name, friend.description, friend.url], keyword))
      .map((friend) => ({
        id: friend.id,
        type: "friend" as const,
        title: friend.name,
        excerpt: excerptFor(friend.description || friend.url, keyword),
        url: friend.url,
        date: iso(friend.updatedAt),
        meta: ["友链"],
      })),
  ]
    .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime())
    .slice(0, limit);

  return c.json({ items: results, query: keyword, total: results.length });
});

app.post("/friend-links/apply", async (c) => {
  const db = c.get("db");
  const parsed = ApplyFriendLinkSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: 400, message: "友链申请参数不合法" }, 400);
  await db.insert(friendLinks).values({
    name: parsed.data.name,
    description: parsed.data.description,
    url: parsed.data.url,
    avatarUrl: parsed.data.avatarUrl,
    sortOrder: 0,
    status: "draft",
    updatedAt: new Date(),
  });
  return c.json({ success: true });
});

app.get("/activity", async (c) => {
  const db = c.get("db");
  const [postRows, momentRows] = await Promise.all([
    db
      .select({
        type: sql<string>`'post'`,
        title: posts.title,
        slug: posts.slug,
        summary: posts.summary,
        date: posts.publishedAt,
      })
      .from(posts)
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.publishedAt), desc(posts.createdAt))
      .limit(20),
    db
      .select({
        type: sql<string>`'moment'`,
        title: moments.slug,
        slug: moments.slug,
        summary: moments.contentMd,
        date: moments.publishedAt,
      })
      .from(moments)
      .where(eq(moments.status, "published"))
      .orderBy(desc(moments.publishedAt), desc(moments.createdAt))
      .limit(20),
  ]);

  return c.json(
    [...postRows, ...momentRows]
      .map((item) => ({
        ...item,
        date: iso(item.date),
      }))
      .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()),
  );
});

export default app;
