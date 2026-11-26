import { eq } from "drizzle-orm";
import type { AppDatabase } from "../db";
import { rateLimits } from "../db/schema";

export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function hashIp(ip: string): Promise<string> {
  return (await sha256Hex(`ip:${ip}`)).slice(0, 32);
}

/**
 * 基于 D1 的通用固定窗口限流，返回 true 表示放行，false 表示超限
 */
export async function checkRateLimit(
  db: AppDatabase,
  key: string,
  limit: number,
  windowMs: number,
  nowMs = Date.now(),
): Promise<boolean> {
  const existing = await db.select().from(rateLimits).where(eq(rateLimits.key, key)).get();

  if (!existing || existing.resetAt <= nowMs) {
    await db
      .insert(rateLimits)
      .values({ key, count: 1, resetAt: nowMs + windowMs })
      .onConflictDoUpdate({
        target: rateLimits.key,
        set: { count: 1, resetAt: nowMs + windowMs },
      });
    return true;
  }

  if (existing.count >= limit) {
    return false;
  }

  await db
    .update(rateLimits)
    .set({ count: existing.count + 1 })
    .where(eq(rateLimits.key, key));

  return true;
}
