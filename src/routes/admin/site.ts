import * as schema from "../../db/schema";
import { sql } from "drizzle-orm";
import { comments, friendLinks, moments, pages, posts, projects, users } from "../../db/schema";
import { SiteConfigSchema } from "../../../common/validators/admin.schema";
import { ensureSiteSettingsTable, getSiteConfig, SITE_CONFIG_KEY } from "../siteConfig";
import { createAdminApp } from "./shared";

const app = createAdminApp();

app.get("/stats", async (c) => {
  const db = c.get("db");
  const [postCount, momentCount, projectCount, pageCount, friendLinkCount, commentCount, userCount] = await Promise.all(
    [
      db
        .select({ count: sql<number>`count(*)` })
        .from(posts)
        .get(),
      db
        .select({ count: sql<number>`count(*)` })
        .from(moments)
        .get(),
      db
        .select({ count: sql<number>`count(*)` })
        .from(projects)
        .get(),
      db
        .select({ count: sql<number>`count(*)` })
        .from(pages)
        .get(),
      db
        .select({ count: sql<number>`count(*)` })
        .from(friendLinks)
        .get(),
      db
        .select({ count: sql<number>`count(*)` })
        .from(comments)
        .get(),
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .get(),
    ],
  );
  return c.json({
    posts: Number(postCount?.count ?? 0),
    moments: Number(momentCount?.count ?? 0),
    projects: Number(projectCount?.count ?? 0),
    pages: Number(pageCount?.count ?? 0),
    friendLinks: Number(friendLinkCount?.count ?? 0),
    comments: Number(commentCount?.count ?? 0),
    users: Number(userCount?.count ?? 0),
  });
});

app.get("/site-config", async (c) => {
  const db = c.get("db");
  return c.json(await getSiteConfig(db));
});

app.put("/site-config", async (c) => {
  const db = c.get("db");
  const parsed = SiteConfigSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: 400, message: "站点配置参数不合法" }, 400);

  const value = JSON.stringify(parsed.data);
  await ensureSiteSettingsTable(db);
  await db
    .insert(schema.siteSettings)
    .values({ key: SITE_CONFIG_KEY, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: schema.siteSettings.key, set: { value, updatedAt: new Date() } });

  return c.json(parsed.data);
});

export default app;
