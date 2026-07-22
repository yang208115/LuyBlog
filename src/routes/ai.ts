import { OpenAPIHono } from "@hono/zod-openapi";
import { and, eq, ne } from "drizzle-orm";
import {
  AiChatSchema,
  AiCompletePostSchema,
  AiGenerateSummarySchema,
  AiModerateCommentSchema,
  AiSuggestTitleSchema,
} from "../../common/validators/ai.schema";
import { authMiddleware } from "../middleware/auth";
import { adminMiddleware } from "../middleware/admin";
import {
  chatWithConfig,
  completePostWithConfig,
  generateSummaryWithConfig,
  makeUniqueSlug,
  moderateCommentWithConfig,
  suggestTitlesWithConfig,
} from "../services/ai";
import { getSiteConfig } from "./siteConfig";
import type { Bindings } from "../types";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { posts } from "../db/schema";

type Variables = {
  db: DrizzleD1Database<typeof schema>;
  user: typeof schema.users.$inferSelect;
};

const app = new OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>();
app.use("/*", authMiddleware, adminMiddleware);

function aiError(error: unknown): { message: string; status: 500 | 502 | 503 } {
  const message = error instanceof Error ? error.message : "AI 调用失败";
  if (message === "AI 服务未配置 API Key") return { message, status: 503 };
  if (message.startsWith("AI 服务调用失败") || message.startsWith("AI 服务返回非 JSON")) {
    return { message, status: 502 };
  }
  return { message, status: 500 };
}

function parseTags(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

async function getTaxonomy(db: DrizzleD1Database<typeof schema>) {
  const rows = await db.select({ category: posts.category, tags: posts.tags }).from(posts);
  return {
    categories: [...new Set(rows.map((row) => row.category?.trim()).filter((item): item is string => Boolean(item)))].sort(),
    tags: [...new Set(rows.flatMap((row) => parseTags(row.tags)).map((tag) => tag.trim()).filter(Boolean))].sort(),
  };
}

app.post("/generate-summary", async (c) => {
  const parsed = AiGenerateSummarySchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ code: 400, message: "参数不合法" }, 400);

  try {
    const config = await getSiteConfig(c.get("db"));
    const { title, contentMd } = parsed.data;
    const summary = await generateSummaryWithConfig(config.aiConfig, title, contentMd);
    return c.json({ summary });
  } catch (error) {
    const { message, status } = aiError(error);
    return c.json({ code: status, message }, status);
  }
});

app.post("/suggest-title", async (c) => {
  const parsed = AiSuggestTitleSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ code: 400, message: "参数不合法" }, 400);

  try {
    const config = await getSiteConfig(c.get("db"));
    const { contentMd, count } = parsed.data;
    const titles = await suggestTitlesWithConfig(config.aiConfig, contentMd, count);
    return c.json({ titles });
  } catch (error) {
    const { message, status } = aiError(error);
    return c.json({ code: status, message }, status);
  }
});

app.post("/chat", async (c) => {
  const parsed = AiChatSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ code: 400, message: "问答参数不合法" }, 400);

  try {
    const config = await getSiteConfig(c.get("db"));
    const reply = await chatWithConfig(config.aiConfig, parsed.data.messages, parsed.data.context);
    return c.json({ reply });
  } catch (error) {
    const { message, status } = aiError(error);
    return c.json({ code: status, message }, status);
  }
});

app.post("/complete-post", async (c) => {
  const parsed = AiCompletePostSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ code: 400, message: "文章补全参数不合法" }, 400);

  try {
    const db = c.get("db");
    const config = await getSiteConfig(db);
    const result = await completePostWithConfig(
      config.aiConfig,
      parsed.data.fields,
      parsed.data.context,
      await getTaxonomy(db),
    );

    if (result.slug) {
      result.slug = await makeUniqueSlug(result.slug, async (slug) => {
        const condition = parsed.data.postId
          ? and(eq(posts.slug, slug), ne(posts.id, parsed.data.postId))
          : eq(posts.slug, slug);
        return Boolean(await db.select({ id: posts.id }).from(posts).where(condition).get());
      });
    }
    return c.json(result);
  } catch (error) {
    const { message, status } = aiError(error);
    return c.json({ code: status, message }, status);
  }
});

app.post("/moderate-comment", async (c) => {
  const parsed = AiModerateCommentSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ code: 400, message: "参数不合法" }, 400);

  const config = await getSiteConfig(c.get("db"));
  const result = await moderateCommentWithConfig(config.aiConfig, parsed.data.content);
  return c.json({
    flagged: result.flagged,
    reason: result.reason,
    suggestedStatus: result.flagged ? "hidden" : "visible",
  });
});

export default app;
