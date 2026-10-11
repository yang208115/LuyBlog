import { desc, eq, sql } from "drizzle-orm";
import { comments, posts, users } from "../../db/schema";
import { UpdateCommentStatusSchema } from "../../../common/validators/admin.schema";
import { createAdminApp } from "./shared";

const app = createAdminApp();

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

  const totalRow = await db
    .select({ count: sql<number>`count(*)` })
    .from(comments)
    .get();

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

export default app;
