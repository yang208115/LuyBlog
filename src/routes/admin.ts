import { OpenAPIHono } from "@hono/zod-openapi";
import { and, desc, eq, sql } from "drizzle-orm";
import { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { comments, friendLinks, moments, musicTracks, navItems, pages, posts, projects, users } from "../db/schema";
import {
  CreateNavItemSchema,
  CreateFriendLinkSchema,
  CreateMomentSchema,
  CreateMusicTrackSchema,
  CreatePageSchema,
  CreatePostSchema,
  CreateProjectSchema,
  ReorderNavItemsSchema,
  UpdateCommentStatusSchema,
  UpdateFriendLinkSchema,
  UpdateMomentSchema,
  UpdateMusicTrackSchema,
  UpdateNavItemSchema,
  UpdatePageSchema,
  UpdatePostSchema,
  UpdateProjectSchema,
  SiteConfigSchema,
  UpdateUserRoleSchema,
  UpdateUserStatusSchema,
} from "../../common/validators/admin.schema";
import { authMiddleware } from "../middleware/auth";
import { adminMiddleware } from "../middleware/admin";
import type { Bindings } from "../types";
import { ensureSiteSettingsTable, getSiteConfig, SITE_CONFIG_KEY } from "./siteConfig";
import { seedDefaultNavItems } from "./navigation";

type Variables = {
  db: DrizzleD1Database<typeof schema>;
  user?: typeof users.$inferSelect;
};

const app = new OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>();
app.use("/*", authMiddleware, adminMiddleware);

function jsonArray(values: string[]) {
  return JSON.stringify(values);
}

function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function iso(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

app.get("/stats", async (c) => {
  const db = c.get("db");
  const [postCount, momentCount, projectCount, pageCount, friendLinkCount, musicCount, commentCount, userCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(posts).get(),
    db.select({ count: sql<number>`count(*)` }).from(moments).get(),
    db.select({ count: sql<number>`count(*)` }).from(projects).get(),
    db.select({ count: sql<number>`count(*)` }).from(pages).get(),
    db.select({ count: sql<number>`count(*)` }).from(friendLinks).get(),
    db.select({ count: sql<number>`count(*)` }).from(musicTracks).get(),
    db.select({ count: sql<number>`count(*)` }).from(comments).get(),
    db.select({ count: sql<number>`count(*)` }).from(users).get(),
  ]);
  return c.json({
    posts: Number(postCount?.count ?? 0),
    moments: Number(momentCount?.count ?? 0),
    projects: Number(projectCount?.count ?? 0),
    pages: Number(pageCount?.count ?? 0),
    friendLinks: Number(friendLinkCount?.count ?? 0),
    music: Number(musicCount?.count ?? 0),
    comments: Number(commentCount?.count ?? 0),
    users: Number(userCount?.count ?? 0),
  });
});

app.get("/site-config", async (c) => {
  const db = c.get("db");
  return c.json(await getSiteConfig(db));
});

app.put("/site-config", async (c) => {
  const db = c.get("db");
  const parsed = SiteConfigSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: 400, message: "站点配置参数不合法" }, 400);

  const value = JSON.stringify(parsed.data);
  await ensureSiteSettingsTable(db);
  await db
    .insert(schema.siteSettings)
    .values({ key: SITE_CONFIG_KEY, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: schema.siteSettings.key, set: { value, updatedAt: new Date() } });

  return c.json(parsed.data);
});

app.get("/nav-items", async (c) => {
  const db = c.get("db");
  await seedDefaultNavItems(db);
  const rows = await db.select().from(navItems).orderBy(navItems.sortOrder, desc(navItems.createdAt));
  return c.json({
    items: rows.map((row) => ({
      id: row.id,
      label: row.label,
      path: row.path,
      sortOrder: row.sortOrder,
      status: row.status,
      updatedAt: row.updatedAt.toISOString(),
    })),
  });
});

app.post("/nav-items", async (c) => {
  const db = c.get("db");
  await seedDefaultNavItems(db);
  const parsed = CreateNavItemSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: 400, message: "导航参数不合法" }, 400);
  const now = new Date();
  const [created] = await db
    .insert(navItems)
    .values({ ...parsed.data, createdAt: now, updatedAt: now })
    .returning();
  return c.json({
    ...created,
    updatedAt: created.updatedAt.toISOString(),
  });
});

app.patch("/nav-items/reorder", async (c) => {
  const db = c.get("db");
  await seedDefaultNavItems(db);
  const parsed = ReorderNavItemsSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: 400, message: "导航排序参数不合法" }, 400);

  const now = new Date();
  await Promise.all(
    parsed.data.ids.map((id, index) =>
      db
        .update(navItems)
        .set({ sortOrder: index * 10, updatedAt: now })
        .where(eq(navItems.id, id)),
    ),
  );

  return c.json({ success: true });
});

app.patch("/nav-items/:id", async (c) => {
  const db = c.get("db");
  await seedDefaultNavItems(db);
  const parsed = UpdateNavItemSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: 400, message: "导航参数不合法" }, 400);
  const [updated] = await db
    .update(navItems)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(navItems.id, c.req.param("id")))
    .returning();
  if (!updated) return c.json({ code: 404, message: "导航不存在" }, 404);
  return c.json({
    ...updated,
    updatedAt: updated.updatedAt.toISOString(),
  });
});

app.delete("/nav-items/:id", async (c) => {
  const db = c.get("db");
  await seedDefaultNavItems(db);
  await db.delete(navItems).where(eq(navItems.id, c.req.param("id")));
  return c.json({ success: true });
});

app.get("/posts", async (c) => {
  const db = c.get("db");
  const page = Math.max(1, Number(c.req.query("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, Number(c.req.query("pageSize") || "10")));

  const rows = await db
    .select()
    .from(posts)
    .orderBy(desc(posts.updatedAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const totalRow = await db.select({ count: sql<number>`count(*)` }).from(posts).get();

  return c.json({
    items: rows.map((row) => ({
      ...row,
      tags: parseJsonArray(row.tags),
      publishedAt: iso(row.publishedAt),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
    pagination: { page, pageSize, total: Number(totalRow?.count ?? 0) },
  });
});

app.get("/post-taxonomy", async (c) => {
  const rows = await c.get("db").select({ category: posts.category, tags: posts.tags }).from(posts);
  const categories = [...new Set(rows.map((row) => row.category?.trim()).filter((item): item is string => Boolean(item)))].sort(
    (a, b) => a.localeCompare(b, "zh-CN"),
  );
  const tags = [...new Set(rows.flatMap((row) => parseJsonArray(row.tags)).map((tag) => tag.trim()).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, "zh-CN"),
  );
  return c.json({ categories, tags });
});

app.post("/posts", async (c) => {
  const db = c.get("db");
  const currentUser = c.get("user");
  if (!currentUser) {
    return c.json({ code: 401, message: "用户未认证" }, 401);
  }
  const parsed = CreatePostSchema.safeParse(await c.req.json());

  if (!parsed.success) {
    return c.json({ code: 400, message: "文章参数不合法" }, 400);
  }

  const payload = parsed.data;
  const exists = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, payload.slug)).get();
  if (exists) {
    return c.json({ code: 400, message: "slug 已存在" }, 400);
  }

  const now = new Date();
  const [created] = await db
    .insert(posts)
    .values({
      authorId: currentUser.id,
      title: payload.title,
      slug: payload.slug,
      summary: payload.summary ?? null,
      cover: payload.cover ?? null,
      tags: jsonArray(payload.tags),
      category: payload.category ?? null,
      contentMd: payload.contentMd,
      status: payload.status,
      publishedAt: payload.status === "published" ? now : null,
      updatedAt: now,
    })
    .returning();

  return c.json(created);
});

app.patch("/posts/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const parsed = UpdatePostSchema.safeParse(await c.req.json());

  if (!parsed.success) {
    return c.json({ code: 400, message: "更新参数不合法" }, 400);
  }

  const payload = parsed.data;
  const existing = await db.select().from(posts).where(eq(posts.id, id)).get();
  if (!existing) {
    return c.json({ code: 404, message: "文章不存在" }, 404);
  }

  if (payload.slug && payload.slug !== existing.slug) {
    const slugExists = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, payload.slug)).get();
    if (slugExists) {
      return c.json({ code: 400, message: "slug 已存在" }, 400);
    }
  }

  const nextStatus = payload.status ?? existing.status;

  const [updated] = await db
    .update(posts)
    .set({
      title: payload.title ?? existing.title,
      slug: payload.slug ?? existing.slug,
      summary: payload.summary !== undefined ? payload.summary : existing.summary,
      cover: payload.cover !== undefined ? payload.cover : existing.cover,
      tags: payload.tags !== undefined ? jsonArray(payload.tags) : existing.tags,
      category: payload.category !== undefined ? payload.category : existing.category,
      contentMd: payload.contentMd ?? existing.contentMd,
      status: nextStatus,
      publishedAt: nextStatus === "published" ? existing.publishedAt ?? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, id))
    .returning();

  return c.json(updated);
});

app.delete("/posts/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");

  const existing = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, id)).get();
  if (!existing) {
    return c.json({ code: 404, message: "文章不存在" }, 404);
  }

  await db.delete(posts).where(eq(posts.id, id));
  return c.json({ success: true, message: "文章已删除" });
});

app.get("/moments", async (c) => {
  const db = c.get("db");
  const rows = await db.select().from(moments).orderBy(desc(moments.updatedAt));
  return c.json({
    items: rows.map((row) => ({
      ...row,
      images: parseJsonArray(row.images),
      publishedAt: iso(row.publishedAt),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
  });
});

app.post("/moments", async (c) => {
  const db = c.get("db");
  const parsed = CreateMomentSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: 400, message: "瞬间参数不合法" }, 400);

  const exists = await db.select({ id: moments.id }).from(moments).where(eq(moments.slug, parsed.data.slug)).get();
  if (exists) return c.json({ code: 400, message: "slug 已存在" }, 400);

  const now = new Date();
  const [created] = await db
    .insert(moments)
    .values({
      slug: parsed.data.slug,
      contentMd: parsed.data.contentMd,
      location: parsed.data.location ?? null,
      images: jsonArray(parsed.data.images),
      frontmatter: "{}",
      status: parsed.data.status,
      publishedAt: parsed.data.status === "published" ? now : null,
      updatedAt: now,
    })
    .returning();
  return c.json(created);
});

app.patch("/moments/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const parsed = UpdateMomentSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: 400, message: "瞬间参数不合法" }, 400);

  const existing = await db.select().from(moments).where(eq(moments.id, id)).get();
  if (!existing) return c.json({ code: 404, message: "瞬间不存在" }, 404);
  if (parsed.data.slug && parsed.data.slug !== existing.slug) {
    const exists = await db.select({ id: moments.id }).from(moments).where(eq(moments.slug, parsed.data.slug)).get();
    if (exists) return c.json({ code: 400, message: "slug 已存在" }, 400);
  }

  const nextStatus = parsed.data.status ?? existing.status;
  const [updated] = await db
    .update(moments)
    .set({
      slug: parsed.data.slug ?? existing.slug,
      contentMd: parsed.data.contentMd ?? existing.contentMd,
      location: parsed.data.location !== undefined ? parsed.data.location : existing.location,
      images: parsed.data.images !== undefined ? jsonArray(parsed.data.images) : existing.images,
      status: nextStatus,
      publishedAt: nextStatus === "published" ? existing.publishedAt ?? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(moments.id, id))
    .returning();
  return c.json(updated);
});

app.delete("/moments/:id", async (c) => {
  const db = c.get("db");
  await db.delete(moments).where(eq(moments.id, c.req.param("id")));
  return c.json({ success: true });
});

app.get("/projects", async (c) => {
  const db = c.get("db");
  const rows = await db.select().from(projects).orderBy(projects.sortOrder, desc(projects.updatedAt));
  return c.json({
    items: rows.map((row) => ({
      ...row,
      tags: parseJsonArray(row.tags),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
  });
});

app.post("/projects", async (c) => {
  const db = c.get("db");
  const parsed = CreateProjectSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: 400, message: "项目参数不合法" }, 400);
  const [created] = await db
    .insert(projects)
    .values({
      ...parsed.data,
      description: parsed.data.description ?? null,
      icon: parsed.data.icon ?? null,
      githubUrl: parsed.data.githubUrl ?? null,
      tags: jsonArray(parsed.data.tags),
      updatedAt: new Date(),
    })
    .returning();
  return c.json(created);
});

app.patch("/projects/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const parsed = UpdateProjectSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: 400, message: "项目参数不合法" }, 400);
  const existing = await db.select().from(projects).where(eq(projects.id, id)).get();
  if (!existing) return c.json({ code: 404, message: "项目不存在" }, 404);
  const [updated] = await db
    .update(projects)
    .set({
      name: parsed.data.name ?? existing.name,
      description: parsed.data.description !== undefined ? parsed.data.description : existing.description,
      icon: parsed.data.icon !== undefined ? parsed.data.icon : existing.icon,
      githubUrl: parsed.data.githubUrl !== undefined ? parsed.data.githubUrl : existing.githubUrl,
      tags: parsed.data.tags !== undefined ? jsonArray(parsed.data.tags) : existing.tags,
      sortOrder: parsed.data.sortOrder ?? existing.sortOrder,
      status: parsed.data.status ?? existing.status,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, id))
    .returning();
  return c.json(updated);
});

app.delete("/projects/:id", async (c) => {
  const db = c.get("db");
  await db.delete(projects).where(eq(projects.id, c.req.param("id")));
  return c.json({ success: true });
});

app.get("/pages", async (c) => {
  const db = c.get("db");
  const rows = await db.select().from(pages).orderBy(desc(pages.updatedAt));
  return c.json({ items: rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() })) });
});

app.post("/pages", async (c) => {
  const db = c.get("db");
  const parsed = CreatePageSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: 400, message: "页面参数不合法" }, 400);
  const exists = await db.select({ id: pages.id }).from(pages).where(eq(pages.slug, parsed.data.slug)).get();
  if (exists) return c.json({ code: 400, message: "slug 已存在" }, 400);
  const [created] = await db
    .insert(pages)
    .values({ ...parsed.data, frontmatter: "{}", updatedAt: new Date() })
    .returning();
  return c.json(created);
});

app.patch("/pages/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const parsed = UpdatePageSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: 400, message: "页面参数不合法" }, 400);
  const existing = await db.select().from(pages).where(eq(pages.id, id)).get();
  if (!existing) return c.json({ code: 404, message: "页面不存在" }, 404);
  if (parsed.data.slug && parsed.data.slug !== existing.slug) {
    const exists = await db.select({ id: pages.id }).from(pages).where(eq(pages.slug, parsed.data.slug)).get();
    if (exists) return c.json({ code: 400, message: "slug 已存在" }, 400);
  }
  const [updated] = await db
    .update(pages)
    .set({
      slug: parsed.data.slug ?? existing.slug,
      title: parsed.data.title ?? existing.title,
      contentMd: parsed.data.contentMd ?? existing.contentMd,
      status: parsed.data.status ?? existing.status,
      updatedAt: new Date(),
    })
    .where(eq(pages.id, id))
    .returning();
  return c.json(updated);
});

app.delete("/pages/:id", async (c) => {
  const db = c.get("db");
  await db.delete(pages).where(eq(pages.id, c.req.param("id")));
  return c.json({ success: true });
});

app.get("/friend-links", async (c) => {
  const db = c.get("db");
  const rows = await db.select().from(friendLinks).orderBy(friendLinks.sortOrder, desc(friendLinks.updatedAt));
  return c.json({ items: rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() })) });
});

app.post("/friend-links", async (c) => {
  const db = c.get("db");
  const parsed = CreateFriendLinkSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: 400, message: "友链参数不合法" }, 400);
  const [created] = await db
    .insert(friendLinks)
    .values({
      ...parsed.data,
      description: parsed.data.description ?? null,
      avatarUrl: parsed.data.avatarUrl ?? null,
      updatedAt: new Date(),
    })
    .returning();
  return c.json(created);
});

app.patch("/friend-links/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const parsed = UpdateFriendLinkSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: 400, message: "友链参数不合法" }, 400);
  const existing = await db.select().from(friendLinks).where(eq(friendLinks.id, id)).get();
  if (!existing) return c.json({ code: 404, message: "友链不存在" }, 404);
  const [updated] = await db
    .update(friendLinks)
    .set({
      name: parsed.data.name ?? existing.name,
      description: parsed.data.description !== undefined ? parsed.data.description : existing.description,
      url: parsed.data.url ?? existing.url,
      avatarUrl: parsed.data.avatarUrl !== undefined ? parsed.data.avatarUrl : existing.avatarUrl,
      sortOrder: parsed.data.sortOrder ?? existing.sortOrder,
      status: parsed.data.status ?? existing.status,
      updatedAt: new Date(),
    })
    .where(eq(friendLinks.id, id))
    .returning();
  return c.json(updated);
});

app.delete("/friend-links/:id", async (c) => {
  const db = c.get("db");
  await db.delete(friendLinks).where(eq(friendLinks.id, c.req.param("id")));
  return c.json({ success: true });
});

app.get("/comments", async (c) => {
  const db = c.get("db");
  const page = Math.max(1, Number(c.req.query("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, Number(c.req.query("pageSize") || "10")));

  const rows = await db
    .select({
      id: comments.id,
      postId: comments.postId,
      userId: comments.userId,
      content: comments.content,
      status: comments.status,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      username: users.username,
      postTitle: posts.title,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .innerJoin(posts, eq(comments.postId, posts.id))
    .orderBy(desc(comments.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const totalRow = await db.select({ count: sql<number>`count(*)` }).from(comments).get();

  return c.json({ items: rows, pagination: { page, pageSize, total: Number(totalRow?.count ?? 0) } });
});

app.patch("/comments/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const parsed = UpdateCommentStatusSchema.safeParse(await c.req.json());

  if (!parsed.success) {
    return c.json({ code: 400, message: "评论状态不合法" }, 400);
  }

  const [updated] = await db
    .update(comments)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(eq(comments.id, id))
    .returning();

  if (!updated) {
    return c.json({ code: 404, message: "评论不存在" }, 404);
  }

  return c.json(updated);
});

app.get("/users", async (c) => {
  const db = c.get("db");
  const page = Math.max(1, Number(c.req.query("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, Number(c.req.query("pageSize") || "10")));

  const rows = await db
    .select({
      id: users.id,
      githubId: users.githubId,
      username: users.username,
      email: users.email,
      avatarUrl: users.avatarUrl,
      role: users.role,
      status: users.status,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const totalRow = await db.select({ count: sql<number>`count(*)` }).from(users).get();

  return c.json({ items: rows, pagination: { page, pageSize, total: Number(totalRow?.count ?? 0) } });
});

app.get("/music-tracks", async (c) => {
  const db = c.get("db");
  const rows = await db.select().from(musicTracks).orderBy(musicTracks.sortOrder, desc(musicTracks.updatedAt));
  return c.json({
    items: rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
  });
});

app.post("/music-tracks", async (c) => {
  const db = c.get("db");
  const parsed = CreateMusicTrackSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: 400, message: "歌曲参数不合法" }, 400);

  const [created] = await db
    .insert(musicTracks)
    .values({
      ...parsed.data,
      updatedAt: new Date(),
    })
    .returning();
  return c.json(created);
});

app.patch("/music-tracks/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const parsed = UpdateMusicTrackSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: 400, message: "歌曲参数不合法" }, 400);

  const existing = await db.select().from(musicTracks).where(eq(musicTracks.id, id)).get();
  if (!existing) return c.json({ code: 404, message: "歌曲不存在" }, 404);

  const [updated] = await db
    .update(musicTracks)
    .set({
      ...parsed.data,
      updatedAt: new Date(),
    })
    .where(eq(musicTracks.id, id))
    .returning();
  return c.json(updated);
});

app.delete("/music-tracks/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  await db.delete(musicTracks).where(eq(musicTracks.id, id));
  return c.json({ success: true });
});

app.patch("/users/:id/role", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const currentUser = c.get("user");
  const parsed = UpdateUserRoleSchema.safeParse(await c.req.json());

  if (!parsed.success) {
    return c.json({ code: 400, message: "角色参数不合法" }, 400);
  }

  if (currentUser?.id === id && parsed.data.role !== "admin") {
    return c.json({ code: 400, message: "不能移除自己的管理员权限" }, 400);
  }

  const [updated] = await db
    .update(users)
    .set({ role: parsed.data.role, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();

  if (!updated) {
    return c.json({ code: 404, message: "用户不存在" }, 404);
  }

  return c.json(updated);
});

app.patch("/users/:id/status", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const currentUser = c.get("user");
  const parsed = UpdateUserStatusSchema.safeParse(await c.req.json());

  if (!parsed.success) {
    return c.json({ code: 400, message: "状态参数不合法" }, 400);
  }

  if (currentUser?.id === id && parsed.data.status !== "active") {
    return c.json({ code: 400, message: "不能禁用自己的账户" }, 400);
  }

  const [updated] = await db
    .update(users)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(and(eq(users.id, id)))
    .returning();

  if (!updated) {
    return c.json({ code: 404, message: "用户不存在" }, 404);
  }

  return c.json(updated);
});

export default app;
