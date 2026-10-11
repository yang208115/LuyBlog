import { OpenAPIHono } from "@hono/zod-openapi";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import comment from "./comment";

const moderate = vi.hoisted(() => vi.fn(async () => ({ flagged: false, reason: null as string | null })));

vi.mock("../services/ai", () => ({ moderateCommentWithConfig: moderate }));
vi.mock("./siteConfig", () => ({ getSiteConfig: vi.fn(async () => ({ aiConfig: {} })) }));

const now = new Date("2026-01-01T00:00:00Z");

/**
 * `gets` 按调用顺序依次作为每次 `select().from().where().get()` 的返回值：
 * 评论目标 → 父评论（如有）→ 一分钟内评论数 → 重复内容。
 */
function createDb(gets: unknown[]) {
  const queue = [...gets];
  const insertedValues: unknown[] = [];
  const db = {
    query: {
      userSessions: { findFirst: vi.fn(async () => ({ userId: "user-1" })) },
      users: { findFirst: vi.fn(async () => ({ id: "user-1", role: "user", status: "active", username: "u", avatarUrl: null })) },
    },
    select: vi.fn(() => ({
      from: () => ({ where: () => ({ get: async () => queue.shift() }) }),
    })),
    insert: vi.fn(() => ({
      values: (values: Record<string, unknown>) => {
        insertedValues.push(values);
        return {
          returning: async () => [{ id: "c-new", postId: "p1", createdAt: now, updatedAt: now, ...values }],
        };
      },
    })),
  };
  return { db, insertedValues };
}

function createApp(db: unknown) {
  return new OpenAPIHono<any>()
    .use("*", async (c, next) => {
      c.set("db", db);
      await next();
    })
    .route("/", comment);
}

function post(body: Record<string, unknown>) {
  return {
    method: "POST",
    headers: { Authorization: "Bearer token", "Content-Type": "application/json" },
    body: JSON.stringify({ targetType: "post", targetSlug: "hello", content: "写得不错", ...body }),
  };
}

const target = { id: "p1", slug: "hello" };

beforeEach(() => {
  moderate.mockClear();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("comment creation", () => {
  it("creates a top-level comment when under the rate limit", async () => {
    const { db, insertedValues } = createDb([target, { value: 1 }, undefined]);
    const response = await createApp(db).request("/", post({}), {});

    expect(response.status).toBe(200);
    expect(insertedValues).toHaveLength(1);
    expect(moderate).toHaveBeenCalledTimes(1);
  });

  it("rejects a reply whose parent does not exist", async () => {
    const { db } = createDb([target, undefined]);
    const response = await createApp(db).request("/", post({ parentId: "missing" }), {});

    expect(response.status).toBe(404);
    expect(moderate).not.toHaveBeenCalled();
  });

  it("rejects a reply whose parent belongs to another post", async () => {
    const parent = { id: "c1", targetType: "post", targetSlug: "other", parentId: null };
    const { db } = createDb([target, parent]);
    const response = await createApp(db).request("/", post({ parentId: "c1" }), {});

    expect(response.status).toBe(400);
    expect(moderate).not.toHaveBeenCalled();
  });

  it("rejects replies to replies (single-level nesting only)", async () => {
    const parent = { id: "c2", targetType: "post", targetSlug: "hello", parentId: "c1" };
    const { db } = createDb([target, parent]);
    const response = await createApp(db).request("/", post({ parentId: "c2" }), {});

    expect(response.status).toBe(400);
    expect(moderate).not.toHaveBeenCalled();
  });

  it("accepts a reply to a top-level comment on the same post", async () => {
    const parent = { id: "c1", targetType: "post", targetSlug: "hello", parentId: null };
    const { db, insertedValues } = createDb([target, parent, { value: 0 }, undefined]);
    const response = await createApp(db).request("/", post({ parentId: "c1" }), {});

    expect(response.status).toBe(200);
    expect(insertedValues[0]).toMatchObject({ parentId: "c1" });
  });

  it("returns 429 without calling AI moderation when the user is over the rate limit", async () => {
    const { db, insertedValues } = createDb([target, { value: 5 }]);
    const response = await createApp(db).request("/", post({}), {});

    expect(response.status).toBe(429);
    expect(insertedValues).toHaveLength(0);
    expect(moderate).not.toHaveBeenCalled();
  });

  it("rejects identical content from the same user without calling AI moderation", async () => {
    const { db, insertedValues } = createDb([target, { value: 0 }, { id: "c-old" }]);
    const response = await createApp(db).request("/", post({}), {});

    expect(response.status).toBe(409);
    expect(insertedValues).toHaveLength(0);
    expect(moderate).not.toHaveBeenCalled();
  });
});
