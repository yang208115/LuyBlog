import { OpenAPIHono } from "@hono/zod-openapi";
import { desc, eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { navItems } from "../db/schema";
import type { Bindings } from "../types";

type Variables = {
  db: DrizzleD1Database<typeof schema>;
};

export const defaultNavItems = [
  { id: "nav_home", label: "首页", path: "/", sortOrder: 0, status: "enabled" as const },
  { id: "nav_blog", label: "归档", path: "/blog", sortOrder: 10, status: "enabled" as const },
  { id: "nav_search", label: "搜索", path: "/search", sortOrder: 20, status: "enabled" as const },
  { id: "nav_moments", label: "瞬间", path: "/moments", sortOrder: 30, status: "enabled" as const },
  { id: "nav_projects", label: "项目", path: "/projects", sortOrder: 40, status: "enabled" as const },
  { id: "nav_music", label: "音乐", path: "/music", sortOrder: 50, status: "enabled" as const },
  { id: "nav_friends", label: "友链", path: "/friends", sortOrder: 60, status: "enabled" as const },
  { id: "nav_about", label: "关于", path: "/about", sortOrder: 70, status: "enabled" as const },
];

export async function ensureNavItemsTable(db: DrizzleD1Database<typeof schema>) {
  await db.run(
    "CREATE TABLE IF NOT EXISTS nav_items (id text PRIMARY KEY NOT NULL, label text NOT NULL, path text NOT NULL, sort_order integer DEFAULT 0 NOT NULL, status text DEFAULT 'enabled' NOT NULL, created_at integer DEFAULT (strftime('%s', 'now')) NOT NULL, updated_at integer DEFAULT (strftime('%s', 'now')) NOT NULL)",
  );
  await db.run("CREATE INDEX IF NOT EXISTS nav_items_status_sort_idx ON nav_items (status, sort_order)");
}

export async function seedDefaultNavItems(db: DrizzleD1Database<typeof schema>) {
  await ensureNavItemsTable(db);
  const countRow = await db.select().from(navItems).limit(1).get();
  if (countRow) return;

  const now = new Date();
  await db.insert(navItems).values(
    defaultNavItems.map((item) => ({
      ...item,
      createdAt: now,
      updatedAt: now,
    })),
  );
}

export async function getPublicNavItems(db: DrizzleD1Database<typeof schema>) {
  await seedDefaultNavItems(db);
  const rows = await db
    .select()
    .from(navItems)
    .where(eq(navItems.status, "enabled"))
    .orderBy(navItems.sortOrder, desc(navItems.createdAt));

  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    path: row.path,
    sortOrder: row.sortOrder,
  }));
}

const app = new OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>();

app.get("/navigation", async (c) => {
  const db = c.get("db");
  return c.json(await getPublicNavItems(db));
});

export default app;
