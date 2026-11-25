import { eq } from "drizzle-orm";
import { defaultSiteConfig, normalizeSiteConfig, type SiteConfig } from "@/shared/siteConfig";
import type { AppDatabase } from "../db";
import { siteSettings } from "../db/schema";

export const SITE_CONFIG_KEY = "siteConfig";

export async function getSiteConfig(db: AppDatabase): Promise<SiteConfig> {
  const row = await db.select().from(siteSettings).where(eq(siteSettings.key, SITE_CONFIG_KEY)).get();
  if (!row) return defaultSiteConfig;
  try {
    return normalizeSiteConfig(JSON.parse(row.value));
  } catch {
    return defaultSiteConfig;
  }
}

export async function saveSiteConfig(db: AppDatabase, config: SiteConfig): Promise<SiteConfig> {
  const normalized = normalizeSiteConfig(config);
  const value = JSON.stringify(normalized);
  const now = new Date();
  await db
    .insert(siteSettings)
    .values({ key: SITE_CONFIG_KEY, value, updatedAt: now })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: { value, updatedAt: now },
    });
  return normalized;
}
