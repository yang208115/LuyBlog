import { OpenAPIHono } from "@hono/zod-openapi";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { defaultSiteConfig, normalizeSiteConfig, toPublicSiteConfig } from "../../frontend/src/config/siteConfig";
import * as schema from "../db/schema";
import { siteSettings } from "../db/schema";
import type { Bindings } from "../types";

type Variables = {
  db: DrizzleD1Database<typeof schema>;
};

const SITE_CONFIG_KEY = "siteConfig";

const app = new OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>();

function isMissingSiteSettingsTable(error: unknown) {
  return error instanceof Error && error.message.includes("no such table: site_settings");
}

export async function ensureSiteSettingsTable(db: DrizzleD1Database<typeof schema>) {
  await db.run(
    "CREATE TABLE IF NOT EXISTS site_settings (key text PRIMARY KEY NOT NULL, value text NOT NULL, updated_at integer DEFAULT (strftime('%s', 'now')) NOT NULL)",
  );
}

export async function getSiteConfig(db: DrizzleD1Database<typeof schema>) {
  let row: typeof siteSettings.$inferSelect | undefined;
  try {
    row = await db.select().from(siteSettings).where(eq(siteSettings.key, SITE_CONFIG_KEY)).get();
  } catch (error) {
    if (!isMissingSiteSettingsTable(error)) throw error;
    return defaultSiteConfig;
  }

  if (!row) return defaultSiteConfig;

  try {
    return normalizeSiteConfig(JSON.parse(row.value));
  } catch {
    return defaultSiteConfig;
  }
}

app.get("/site-config", async (c) => {
  const db = c.get("db");
  return c.json(toPublicSiteConfig(await getSiteConfig(db)));
});

export default app;
export { SITE_CONFIG_KEY };
