import { OpenAPIHono } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { comments, users } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import type { Bindings } from "../types";

type Variables = {
  db: DrizzleD1Database<typeof schema>;
  user?: typeof users.$inferSelect;
};

const app = new OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>();
app.use("/*", authMiddleware);

app.delete("/:id", async (c) => {
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

export default app;
