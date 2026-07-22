import { afterEach, describe, expect, it, vi } from "vitest";
import { AiChatSchema, AiCompletePostSchema } from "../../common/validators/ai.schema";
import { completePostWithConfig, makeUniqueSlug, normalizeSlug } from "./ai";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AI writing schemas", () => {
  const context = { title: "标题", slug: "", summary: "", category: "", tags: [], contentMd: "正文" };

  it("accepts up to 20 user and assistant messages", () => {
    const messages = Array.from({ length: 20 }, (_, index) => ({
      role: index % 2 ? ("assistant" as const) : ("user" as const),
      content: `消息 ${index}`,
    }));
    expect(AiChatSchema.safeParse({ messages, context }).success).toBe(true);
    expect(AiChatSchema.safeParse({ messages: [...messages, messages[0]], context }).success).toBe(false);
  });

  it("rejects oversized messages and empty post completion input", () => {
    expect(AiChatSchema.safeParse({ messages: [{ role: "user", content: "x".repeat(4001) }], context }).success).toBe(false);
    expect(
      AiCompletePostSchema.safeParse({
        fields: ["slug"],
        context: { ...context, title: "", contentMd: "" },
      }).success,
    ).toBe(false);
  });
});

describe("AI post completion", () => {
  it("normalizes ASCII slugs and adds a suffix when a slug exists", async () => {
    expect(normalizeSlug("  Hello, TypeScript World!  ")).toBe("hello-typescript-world");
    const used = new Set(["hello-world", "hello-world-2"]);
    await expect(makeUniqueSlug("Hello World", async (slug) => used.has(slug))).resolves.toBe("hello-world-3");
  });

  it("parses structured metadata and removes duplicate tags", async () => {
    const summary = "这是一段用于验证人工智能文章元信息补全能力的中文摘要，它会概括文章主题、主要内容和读者能够获得的信息，同时保持表达清晰、自然且足够完整，确保长度符合博客展示信息的要求。";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: `\`\`\`json\n${JSON.stringify({ titles: ["标题一", "标题一", "标题二"], slug: "AI Writing Tips", summary, category: "开发", tags: ["AI", "AI", "写作"] })}\n\`\`\``,
                },
              },
            ],
          }),
          { headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    const result = await completePostWithConfig(
      { apiKey: "key", baseUrl: "https://example.com/v1", model: "model", maxTokens: 800, temperature: 0.5 },
      ["titles", "slug", "summary", "category", "tags"],
      { title: "标题", slug: "", summary: "", category: "", tags: [], contentMd: "正文" },
      { categories: ["开发"], tags: ["AI"] },
    );

    expect(result).toEqual({
      titles: ["标题一", "标题二"],
      slug: "ai-writing-tips",
      summary,
      category: "开发",
      tags: ["AI", "写作"],
    });
  });

  it("rejects malformed model output", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ choices: [{ message: { content: "不是 JSON" } }] }), {
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(
      completePostWithConfig(
        { apiKey: "key" },
        ["slug"],
        { title: "标题", slug: "", summary: "", category: "", tags: [], contentMd: "正文" },
        { categories: [], tags: [] },
      ),
    ).rejects.toThrow("格式无效");
  });
});
