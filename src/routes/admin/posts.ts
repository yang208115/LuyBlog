import { desc, eq, sql } from "drizzle-orm";
import { posts } from "../../db/schema";
import { CreatePostSchema, UpdatePostSchema } from "../../../common/validators/admin.schema";
import { createAdminApp, jsonArray, parseJsonArray, iso } from "./shared";

const app = createAdminApp();

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

  const totalRow = await db
    .select({ count: sql<number>`count(*)` })
    .from(posts)
    .get();

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
  const categories = [
    ...new Set(rows.map((row) => row.category?.trim()).filter((item): item is string => Boolean(item))),
  ].sort((a, b) => a.localeCompare(b, "zh-CN"));
  const tags = [
    ...new Set(
      rows
        .flatMap((row) => parseJsonArray(row.tags))
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b, "zh-CN"));
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
      publishedAt: nextStatus === "published" ? (existing.publishedAt ?? new Date()) : null,
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

export default app;
