import { createMiddleware } from "hono/factory";
import type { Bindings } from "../types";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as drizzleSchema from "../db/schema";

type Variables = {
  db: DrizzleD1Database<typeof drizzleSchema>;
  user: typeof drizzleSchema.users.$inferSelect;
};

export const adminMiddleware = createMiddleware<{
  Bindings: Bindings;
  Variables: Variables;
}>(async (c, next) => {
  const user = c.get("user");

  if (!user || user.role !== "admin") {
    return c.json({ success: false, message: "需要管理员权限" }, 403);
  }

  await next();
});
