import { desc, eq } from "drizzle-orm";
import { friendLinks } from "../../db/schema";
import { CreateFriendLinkSchema, UpdateFriendLinkSchema } from "../../../common/validators/admin.schema";
import { createAdminApp } from "./shared";

const app = createAdminApp();

app.get("/friend-links", async (c) => {
  const db = c.get("db");
  const rows = await db.select().from(friendLinks).orderBy(friendLinks.sortOrder, desc(friendLinks.updatedAt));
  return c.json({
    items: rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
  });
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

export default app;
