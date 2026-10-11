import { desc, eq } from "drizzle-orm";
import { navItems } from "../../db/schema";
import {
  CreateNavItemSchema,
  ReorderNavItemsSchema,
  UpdateNavItemSchema,
} from "../../../common/validators/admin.schema";
import { seedDefaultNavItems } from "../navigation";
import { createAdminApp } from "./shared";

const app = createAdminApp();

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

export default app;
