import { OpenAPIHono } from "@hono/zod-openapi";
import { and, desc, eq, sql } from "drizzle-orm";
import { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { comments, posts, users } from "../db/schema";
import {
  CreatePostSchema,
  UpdateCommentStatusSchema,
  UpdatePostSchema,
  UpdateUserRoleSchema,
  UpdateUserStatusSchema,
} from "../../common/validators/admin.schema";
import { authMiddleware } from "../middleware/auth";
import { adminMiddleware } from "../middleware/admin";
import type { Bindings } from "../types";

type Variables = {
  db: DrizzleD1Database<typeof schema>;
  user?: typeof users.$inferSelect;
};

const app = new OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>();
app.use("/*", authMiddleware, adminMiddleware);

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

  return c.json({ items: rows, pagination: { page, pageSize, total: Number(totalRow?.count ?? 0) } });
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

app.patch("/users/:id/role", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const parsed = UpdateUserRoleSchema.safeParse(await c.req.json());

  if (!parsed.success) {
    return c.json({ code: 400, message: "角色参数不合法" }, 400);
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
  const parsed = UpdateUserStatusSchema.safeParse(await c.req.json());

  if (!parsed.success) {
    return c.json({ code: 400, message: "状态参数不合法" }, 400);
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
