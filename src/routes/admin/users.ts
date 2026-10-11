import { and, desc, eq, sql } from "drizzle-orm";
import { users } from "../../db/schema";
import { UpdateUserRoleSchema, UpdateUserStatusSchema } from "../../../common/validators/admin.schema";
import { createAdminApp } from "./shared";

const app = createAdminApp();

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

  const totalRow = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .get();

  return c.json({ items: rows, pagination: { page, pageSize, total: Number(totalRow?.count ?? 0) } });
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
