import { OpenAPIHono } from "@hono/zod-openapi";
import { and, desc, eq, sql } from "drizzle-orm";
import { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { comments, posts, users } from "../db/schema";
import { CreateCommentSchema } from "../../common/validators/blog.schema";
import { authMiddleware } from "../middleware/auth";
import { moderateCommentWithConfig } from "../services/ai";
import { getSiteConfig } from "./siteConfig";
import type { Bindings } from "../types";

type Variables = {
  db: DrizzleD1Database<typeof schema>;
  user?: typeof users.$inferSelect;
};

const app = new OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>();
const protectedRoutes = new OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>();

protectedRoutes.use("/*", authMiddleware);

app.get("/", async (c) => {
  const db = c.get("db");
  const page = Math.max(1, Number(c.req.query("page") || "1"));
  const pageSize = Math.min(50, Math.max(1, Number(c.req.query("pageSize") || "10")));

  const rows = await db
    .select()
    .from(posts)
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.publishedAt), desc(posts.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const totalRow = await db
    .select({ count: sql<number>`count(*)`, totalViews: sql<number>`coalesce(sum(${posts.viewCount}), 0)` })
    .from(posts)
    .where(eq(posts.status, "published"))
    .get();

  return c.json({
    items: rows.map((post) => ({
      id: post.id,
      authorId: post.authorId,
      title: post.title,
      slug: post.slug,
      summary: post.summary,
      cover: post.cover,
      tags: post.tags,
      category: post.category,
      readingTime: post.readingTime,
      viewCount: post.viewCount,
      frontmatter: post.frontmatter,
      contentMd: post.contentMd,
      status: post.status,
      publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    })),
    pagination: {
      page,
      pageSize,
      total: Number(totalRow?.count ?? 0),
      totalViews: Number(totalRow?.totalViews ?? 0),
    },
  });
});

app.get("/:slug", async (c) => {
  const db = c.get("db");
  const slug = c.req.param("slug");

  const post = await db
    .select()
    .from(posts)
    .where(and(eq(posts.slug, slug), eq(posts.status, "published")))
    .get();

  if (!post) {
    return c.json({ code: 404, message: "文章不存在" }, 404);
  }

  const [viewedPost] = await db
    .update(posts)
    .set({ viewCount: sql`${posts.viewCount} + 1` })
    .where(eq(posts.id, post.id))
    .returning({ viewCount: posts.viewCount });

  return c.json({
    id: post.id,
    authorId: post.authorId,
    title: post.title,
    slug: post.slug,
    summary: post.summary,
    cover: post.cover,
    tags: post.tags,
    category: post.category,
    readingTime: post.readingTime,
    viewCount: viewedPost?.viewCount ?? post.viewCount + 1,
    frontmatter: post.frontmatter,
    contentMd: post.contentMd,
    status: post.status,
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  });
});

app.get("/:id/comments", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");

  const post = await db.select({ id: posts.id, slug: posts.slug }).from(posts).where(eq(posts.id, id)).get();
  if (!post) {
    return c.json({ code: 404, message: "文章不存在" }, 404);
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
    .where(and(eq(comments.postId, id), eq(comments.status, "visible")))
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

protectedRoutes.post("/:id/comments", async (c) => {
  const db = c.get("db");
  const currentUser = c.get("user");
  if (!currentUser) {
    return c.json({ code: 401, message: "用户未认证" }, 401);
  }
  const id = c.req.param("id");
  const parsed = CreateCommentSchema.safeParse(await c.req.json());

  if (!parsed.success) {
    return c.json({ code: 400, message: "评论内容不合法" }, 400);
  }

  const post = await db
    .select({ id: posts.id, slug: posts.slug })
    .from(posts)
    .where(and(eq(posts.id, id), eq(posts.status, "published")))
    .get();

  if (!post) {
    return c.json({ code: 404, message: "文章不存在或未发布" }, 404);
  }

  const config = await getSiteConfig(db);
  const moderation = await moderateCommentWithConfig(config.aiConfig, parsed.data.content);
  const status = moderation.flagged ? "hidden" : "visible";

  const [created] = await db
    .insert(comments)
    .values({
      postId: id,
      targetType: "post",
      targetSlug: post.slug,
      userId: currentUser.id,
      content: parsed.data.content,
      status,
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

export default new OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>()
  .route("/", app)
  .route("/", protectedRoutes);
