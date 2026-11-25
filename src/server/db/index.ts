import { env } from "cloudflare:workers";
import { type DrizzleD1Database, drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type AppDatabase = DrizzleD1Database<typeof schema>;

export function getDb(binding: D1Database = env.DB): AppDatabase {
  return drizzle(binding, { schema });
}
