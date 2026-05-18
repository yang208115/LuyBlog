import { OpenAPIHono } from "@hono/zod-openapi";
import {
  AiGenerateSummarySchema,
  AiModerateCommentSchema,
  AiSuggestTitleSchema,
} from "../../common/validators/ai.schema";
import { authMiddleware } from "../middleware/auth";
import { adminMiddleware } from "../middleware/admin";
import { generateSummaryWithConfig, moderateCommentWithConfig, suggestTitlesWithConfig } from "../services/ai";
import { getSiteConfig } from "./siteConfig";
import type { Bindings } from "../types";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";

type Variables = {
  db: DrizzleD1Database<typeof schema>;
  user: typeof schema.users.$inferSelect;
};

const app = new OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>();
app.use("/*", authMiddleware, adminMiddleware);

app.post("/generate-summary", async (c) => {
  const parsed = AiGenerateSummarySchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ code: 400, message: "参数不合法" }, 400);
  }

  try {
    const config = await getSiteConfig(c.get("db"));
    const { title, contentMd } = parsed.data;
    const summary = await generateSummaryWithConfig(config.aiConfig, title, contentMd);
    return c.json({ summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI 调用失败";
    return c.json({ code: 500, message }, 500);
  }
});

app.post("/suggest-title", async (c) => {
  const parsed = AiSuggestTitleSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ code: 400, message: "参数不合法" }, 400);
  }

  try {
    const config = await getSiteConfig(c.get("db"));
    const { contentMd, count } = parsed.data;
    const titles = await suggestTitlesWithConfig(config.aiConfig, contentMd, count);
    return c.json({ titles });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI 调用失败";
    return c.json({ code: 500, message }, 500);
  }
});

app.post("/moderate-comment", async (c) => {
  const parsed = AiModerateCommentSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ code: 400, message: "参数不合法" }, 400);
  }

  const config = await getSiteConfig(c.get("db"));
  const result = await moderateCommentWithConfig(config.aiConfig, parsed.data.content);
  return c.json({
    flagged: result.flagged,
    reason: result.reason,
    suggestedStatus: result.flagged ? "hidden" : "visible",
  });
});

export default app;
