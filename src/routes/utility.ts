import { OpenAPIHono } from "@hono/zod-openapi";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import type { Bindings } from "../types";
import { chatWithConfig } from "../services/ai";
import { getSiteConfig } from "./siteConfig";
import { authMiddleware } from "../middleware/auth";
import { adminMiddleware } from "../middleware/admin";

type Variables = {
  db: DrizzleD1Database<typeof schema>;
  user: typeof schema.users.$inferSelect;
};

const app = new OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>();
const protectedRoutes = new OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>();
protectedRoutes.use("/*", authMiddleware, adminMiddleware);

app.get("/test", (c) => c.text("喵！我能通！"));

protectedRoutes.post("/chat", async (c) => {
  const config = await getSiteConfig(c.get("db"));
  const aiConfig = config.aiConfig;

  const body = (await c.req.json().catch(() => ({}))) as { message?: string; messages?: Array<{ role: string; content: string }> };
  const rawMessages = body.messages?.length
    ? body.messages
    : body.message
      ? [{ role: "user", content: body.message }]
      : [];
  const messages = rawMessages
    .slice(-20)
    .filter((item): item is { role: "user" | "assistant"; content: string } =>
      (item.role === "user" || item.role === "assistant") && typeof item.content === "string",
    );
  if (!messages.length || messages.some((item) => !item.content.trim() || item.content.length > 4000)) {
    return c.json({ code: 400, message: "message 不能为空" }, 400);
  }

  try {
    const text = await chatWithConfig(aiConfig, messages);
    return c.json({ reply: text, message: text });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI 请求失败";
    return c.json({ code: 502, message }, 502);
  }
});

app.get("/weather", async (c) => {
  const key = c.env.QWEATHER_KEY;
  const location = c.req.query("location") || c.req.query("city");
  if (!location) return c.json({ code: 400, message: "location 不能为空" }, 400);
  if (!key) return c.json({ code: 503, message: "天气密钥未配置" }, 503);

  try {
    const lookup = await fetch(
      `https://geoapi.qweather.com/v2/city/lookup?location=${encodeURIComponent(location)}&key=${key}`,
    );
    if (!lookup.ok) return c.json({ code: lookup.status, message: "城市查询失败" }, 502);
    const lookupData = (await lookup.json()) as { location?: Array<{ id: string; name: string }> };
    const id = lookupData.location?.[0]?.id;
    if (!id) return c.json({ code: 404, message: "城市不存在" }, 404);

    const weather = await fetch(`https://devapi.qweather.com/v7/weather/now?location=${id}&key=${key}`);
    if (!weather.ok) return c.json({ code: weather.status, message: "天气查询失败" }, 502);
    const weatherData = (await weather.json()) as Record<string, unknown>;
    return c.json(weatherData);
  } catch {
    return c.json({ code: 502, message: "天气请求失败" }, 502);
  }
});

export default app;
export { protectedRoutes as protectedUtilityRoutes };
