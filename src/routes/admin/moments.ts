import { desc, eq } from "drizzle-orm";
import { moments } from "../../db/schema";
import { CreateMomentSchema, UpdateMomentSchema } from "../../../common/validators/admin.schema";
import { createAdminApp, jsonArray, parseJsonArray, iso } from "./shared";

const app = createAdminApp();

app.get("/moments", async (c) => {
  const db = c.get("db");
  const rows = await db.select().from(moments).orderBy(desc(moments.updatedAt));
  return c.json({
    items: rows.map((row) => ({
      ...row,
      images: parseJsonArray(row.images),
      publishedAt: iso(row.publishedAt),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
  });
});

app.post("/moments", async (c) => {
  const db = c.get("db");
  const parsed = CreateMomentSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: 400, message: "瞬间参数不合法" }, 400);

  const exists = await db.select({ id: moments.id }).from(moments).where(eq(moments.slug, parsed.data.slug)).get();
  if (exists) return c.json({ code: 400, message: "slug 已存在" }, 400);

  const now = new Date();
  const [created] = await db
    .insert(moments)
    .values({
      slug: parsed.data.slug,
      contentMd: parsed.data.contentMd,
      location: parsed.data.location ?? null,
      images: jsonArray(parsed.data.images),
      frontmatter: "{}",
      status: parsed.data.status,
      publishedAt: parsed.data.status === "published" ? now : null,
      updatedAt: now,
    })
    .returning();
  return c.json(created);
});

app.patch("/moments/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const parsed = UpdateMomentSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: 400, message: "瞬间参数不合法" }, 400);

  const existing = await db.select().from(moments).where(eq(moments.id, id)).get();
  if (!existing) return c.json({ code: 404, message: "瞬间不存在" }, 404);
  if (parsed.data.slug && parsed.data.slug !== existing.slug) {
    const exists = await db.select({ id: moments.id }).from(moments).where(eq(moments.slug, parsed.data.slug)).get();
    if (exists) return c.json({ code: 400, message: "slug 已存在" }, 400);
  }

  const nextStatus = parsed.data.status ?? existing.status;
  const [updated] = await db
    .update(moments)
    .set({
      slug: parsed.data.slug ?? existing.slug,
      contentMd: parsed.data.contentMd ?? existing.contentMd,
      location: parsed.data.location !== undefined ? parsed.data.location : existing.location,
      images: parsed.data.images !== undefined ? jsonArray(parsed.data.images) : existing.images,
      status: nextStatus,
      publishedAt: nextStatus === "published" ? (existing.publishedAt ?? new Date()) : null,
      updatedAt: new Date(),
    })
    .where(eq(moments.id, id))
    .returning();
  return c.json(updated);
});

app.delete("/moments/:id", async (c) => {
  const db = c.get("db");
  await db.delete(moments).where(eq(moments.id, c.req.param("id")));
  return c.json({ success: true });
});

export default app;
