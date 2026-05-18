import { OpenAPIHono } from "@hono/zod-openapi";
import { and, desc, eq } from "drizzle-orm";
import { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { comments, posts, users } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { moderateCommentWithConfig } from "../services/ai";
import type { Bindings } from "../types";
import { getSiteConfig } from "./siteConfig";
import { z } from "@hono/zod-openapi";

type Variables = {
  db: DrizzleD1Database<typeof schema>;
  user?: typeof users.$inferSelect;
};

const app = new OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>();
const protectedRoutes = new OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>();
const CreateTargetCommentSchema = z.object({
  targetType: z.literal("post"),
  targetSlug: z.string().trim().min(1).max(120),
  parentId: z.string().trim().min(1).max(128).optional(),
  content: z.string().trim().min(1).max(1000),
});

async function targetExists(db: DrizzleD1Database<typeof schema>, targetSlug: string) {
  return db.select({ id: posts.id, slug: posts.slug }).from(posts).where(and(eq(posts.slug, targetSlug), eq(posts.status, "published"))).get();
}

app.get("/", async (c) => {
  const db = c.get("db");
  const targetType = c.req.query("targetType");
  const targetSlug = c.req.query("targetSlug");
  if (targetType !== "post") {
    return c.json({ code: 400, message: "targetType 不合法" }, 400);
  }
  if (!targetSlug) {
    return c.json({ code: 400, message: "targetSlug 不能为空" }, 400);
  }

  const rows = await db
    .select({
      id: comments.id,
      postId: comments.postId,
      targetType: comments.targetType,
      targetSlug: comments.targetSlug,
      parentId: comments.parentId,
      userId: comments.userId,
      content: comments.content,
      status: comments.status,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      username: users.username,
      avatarUrl: users.avatarUrl,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(and(eq(comments.targetType, targetType), eq(comments.targetSlug, targetSlug), eq(comments.status, "visible")))
    .orderBy(desc(comments.createdAt));

  return c.json(
    rows.map((row) => ({
      id: row.id,
      postId: row.postId,
      targetType: row.targetType,
      targetSlug: row.targetSlug,
      parentId: row.parentId,
      userId: row.userId,
      content: row.content,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      user: {
        id: row.userId,
        username: row.username,
        avatarUrl: row.avatarUrl,
      },
    })),
  );
});

protectedRoutes.use("/*", authMiddleware);

protectedRoutes.post("/", async (c) => {
  const db = c.get("db");
  const currentUser = c.get("user");
  if (!currentUser) return c.json({ code: 401, message: "用户未认证" }, 401);

  const json = await c.req.json().catch(() => null);
  const parsed = CreateTargetCommentSchema.safeParse(json);
  if (!parsed.success) {
    return c.json({ code: 400, message: "评论内容不合法" }, 400);
  }
  const { targetType, targetSlug, parentId, content } = parsed.data;

  const target = await targetExists(db, targetSlug);
  if (!target) {
    return c.json({ code: 404, message: "评论目标不存在" }, 404);
  }

  const config = await getSiteConfig(db);
  const moderation = await moderateCommentWithConfig(config.aiConfig, content);
  const [created] = await db
    .insert(comments)
    .values({
      postId: target.id,
      targetType,
      targetSlug,
      parentId,
      userId: currentUser.id,
      content,
      status: moderation.flagged ? "hidden" : "visible",
      updatedAt: new Date(),
    })
    .returning();

  return c.json({
    id: created.id,
    postId: created.postId,
    targetType: created.targetType,
    targetSlug: created.targetSlug,
    parentId: created.parentId,
    userId: created.userId,
    content: created.content,
    status: created.status,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
    user: {
      id: currentUser.id,
      username: currentUser.username,
      avatarUrl: currentUser.avatarUrl,
    },
  });
});

protectedRoutes.delete("/:id", async (c) => {
  const db = c.get("db");
  const currentUser = c.get("user");
  if (!currentUser) {
    return c.json({ code: 401, message: "用户未认证" }, 401);
  }
  const id = c.req.param("id");

  const comment = await db.select().from(comments).where(eq(comments.id, id)).get();

  if (!comment) {
    return c.json({ code: 404, message: "评论不存在" }, 404);
  }

  if (comment.userId !== currentUser.id && currentUser.role !== "admin") {
    return c.json({ code: 403, message: "无权限删除该评论" }, 403);
  }

  await db.delete(comments).where(eq(comments.id, id));

  return c.json({ success: true, message: "评论已删除" });
});

export default new OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>()
  .route("/", app)
  .route("/", protectedRoutes);
