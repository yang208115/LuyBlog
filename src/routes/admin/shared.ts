import { OpenAPIHono } from "@hono/zod-openapi";
import { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../../db/schema";
import type { users } from "../../db/schema";
import type { Bindings } from "../../types";

export type Variables = {
  db: DrizzleD1Database<typeof schema>;
  user?: typeof users.$inferSelect;
};

export type AdminEnv = { Bindings: Bindings; Variables: Variables };

export function createAdminApp() {
  return new OpenAPIHono<AdminEnv>();
}

export function jsonArray(values: string[]) {
  return JSON.stringify(values);
}

export function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function iso(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}
