import { desc, eq } from "drizzle-orm";
import { projects } from "../../db/schema";
import { CreateProjectSchema, UpdateProjectSchema } from "../../../common/validators/admin.schema";
import { createAdminApp, jsonArray, parseJsonArray } from "./shared";

const app = createAdminApp();

app.get("/projects", async (c) => {
  const db = c.get("db");
  const rows = await db.select().from(projects).orderBy(projects.sortOrder, desc(projects.updatedAt));
  return c.json({
    items: rows.map((row) => ({
      ...row,
      tags: parseJsonArray(row.tags),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
  });
});

app.post("/projects", async (c) => {
  const db = c.get("db");
  const parsed = CreateProjectSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: 400, message: "项目参数不合法" }, 400);
  const [created] = await db
    .insert(projects)
    .values({
      ...parsed.data,
      description: parsed.data.description ?? null,
      icon: parsed.data.icon ?? null,
      githubUrl: parsed.data.githubUrl ?? null,
      tags: jsonArray(parsed.data.tags),
      updatedAt: new Date(),
    })
    .returning();
  return c.json(created);
});

app.patch("/projects/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const parsed = UpdateProjectSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: 400, message: "项目参数不合法" }, 400);
  const existing = await db.select().from(projects).where(eq(projects.id, id)).get();
  if (!existing) return c.json({ code: 404, message: "项目不存在" }, 404);
  const [updated] = await db
    .update(projects)
    .set({
      name: parsed.data.name ?? existing.name,
      description: parsed.data.description !== undefined ? parsed.data.description : existing.description,
      icon: parsed.data.icon !== undefined ? parsed.data.icon : existing.icon,
      githubUrl: parsed.data.githubUrl !== undefined ? parsed.data.githubUrl : existing.githubUrl,
      tags: parsed.data.tags !== undefined ? jsonArray(parsed.data.tags) : existing.tags,
      sortOrder: parsed.data.sortOrder ?? existing.sortOrder,
      status: parsed.data.status ?? existing.status,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, id))
    .returning();
  return c.json(updated);
});

app.delete("/projects/:id", async (c) => {
  const db = c.get("db");
  await db.delete(projects).where(eq(projects.id, c.req.param("id")));
  return c.json({ success: true });
});

export default app;
