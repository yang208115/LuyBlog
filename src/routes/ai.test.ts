import { OpenAPIHono } from "@hono/zod-openapi";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultSiteConfig } from "../../frontend/src/config/siteConfig";
import { posts, siteSettings } from "../db/schema";
import ai from "./ai";

const context = { title: "测试文章", slug: "", summary: "", category: "", tags: [], contentMd: "正文" };

function createDb(role: "admin" | "user" = "admin", withApiKey = true) {
  return {
    query: {
      userSessions: { findFirst: vi.fn(async () => ({ userId: "user-1" })) },
      users: {
        findFirst: vi.fn(async () => ({ id: "user-1", role, status: "active" })),
      },
    },
    select: vi.fn((fields?: Record<string, unknown>) => ({
      from: (table: unknown) => {
        if (table === siteSettings) {
          return {
            where: () => ({
              get: async () => ({
                value: JSON.stringify({
                  ...defaultSiteConfig,
                  aiConfig: { ...defaultSiteConfig.aiConfig, apiKey: withApiKey ? "test-key" : "" },
                }),
              }),
            }),
          };
        }
        if (table === posts && fields && "category" in fields) return Promise.resolve([]);
        return { where: () => ({ get: async () => undefined }) };
      },
    })),
  };
}

function createApp(db: ReturnType<typeof createDb>) {
  return new OpenAPIHono<any>()
    .use("*", async (c, next) => {
      c.set("db", db);
      await next();
    })
    .route("/", ai);
}

function request(body: unknown, token = "token") {
  return {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AI routes", () => {
  it("requires authentication and administrator access", async () => {
    const unauthorized = await createApp(createDb()).request("/chat", { method: "POST" }, {});
    expect(unauthorized.status).toBe(401);

    const forbidden = await createApp(createDb("user")).request(
      "/chat",
      request({ messages: [{ role: "user", content: "你好" }], context }),
      {},
    );
    expect(forbidden.status).toBe(403);
  });

  it("returns 503 when the AI key is missing", async () => {
    const response = await createApp(createDb("admin", false)).request(
      "/chat",
      request({ messages: [{ role: "user", content: "你好" }], context }),
      {},
    );
    expect(response.status).toBe(503);
  });

  it("keeps multi-turn message order in the upstream request", async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) =>
      new Response(JSON.stringify({ choices: [{ message: { content: "回答" } }] }), {
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const messages = [
      { role: "user" as const, content: "第一问" },
      { role: "assistant" as const, content: "第一答" },
      { role: "user" as const, content: "第二问" },
    ];

    const response = await createApp(createDb()).request("/chat", request({ messages, context }), {});
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ reply: "回答" });
    const upstreamBody = JSON.parse(String(fetchMock.mock.calls[0][1]?.body)) as { messages: Array<{ role: string; content: string }> };
    expect(upstreamBody.messages.slice(1).map(({ role, content }) => ({ role, content }))).toEqual(messages);
  });

  it("generates only the requested completion fields", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ choices: [{ message: { content: '{"slug":"My New Post"}' } }] }), {
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    const response = await createApp(createDb()).request(
      "/complete-post",
      request({ fields: ["slug"], context }),
      {},
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ slug: "my-new-post" });
  });
});
