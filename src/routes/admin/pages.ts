import { desc, eq } from "drizzle-orm";
import { pages } from "../../db/schema";
import { CreatePageSchema, UpdatePageSchema } from "../../../common/validators/admin.schema";
import { createAdminApp } from "./shared";

const app = createAdminApp();

app.get("/pages", async (c) => {
  const db = c.get("db");
  const rows = await db.select().from(pages).orderBy(desc(pages.updatedAt));
  return c.json({
    items: rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
  });
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

export default app;
