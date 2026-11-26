import { describe, expect, it } from "vitest";
import { verifyTurnstileToken } from "./turnstile";

describe("turnstile siteverify", () => {
  it("allows bypass only in local dev when both secret and siteKey are empty", async () => {
    const res = await verifyTurnstileToken({
      token: "",
      expectedAction: "comment_create",
      env: { APP_BASE_URL: "http://localhost:5173", TURNSTILE_SECRET: "", TURNSTILE_SITE_KEY: "" },
    });
    expect(res).toEqual({ ok: true });
  });

  it("rejects empty token in production even if APP_BASE_URL is unset or non-local", async () => {
    const res = await verifyTurnstileToken({
      token: "",
      expectedAction: "comment_create",
      env: {
        APP_BASE_URL: "https://blog.lyuy.top",
        TURNSTILE_SECRET: "secret",
        TURNSTILE_HOSTNAMES: "blog.lyuy.top",
      },
    });
    expect(res.ok).toBe(false);
  });

  it("rejects mismatched action or unapproved hostname", async () => {
    const mockFetch = async () =>
      new Response(JSON.stringify({ success: true, action: "other_action", hostname: "blog.lyuy.top" }), {
        status: 200,
      });

    const badAction = await verifyTurnstileToken({
      token: "valid-token",
      expectedAction: "comment_create",
      env: {
        APP_BASE_URL: "https://blog.lyuy.top",
        TURNSTILE_SECRET: "secret",
        TURNSTILE_HOSTNAMES: "blog.lyuy.top",
      },
      fetchImpl: mockFetch,
    });
    expect(badAction.ok).toBe(false);

    const mockBadHost = async () =>
      new Response(JSON.stringify({ success: true, action: "comment_create", hostname: "evil.example" }), {
        status: 200,
      });
    const badHost = await verifyTurnstileToken({
      token: "valid-token",
      expectedAction: "comment_create",
      env: {
        APP_BASE_URL: "https://blog.lyuy.top",
        TURNSTILE_SECRET: "secret",
        TURNSTILE_HOSTNAMES: "blog.lyuy.top",
      },
      fetchImpl: mockBadHost,
    });
    expect(badHost.ok).toBe(false);
  });

  it("fails closed on network error or non-200 status", async () => {
    const res500 = await verifyTurnstileToken({
      token: "tok",
      expectedAction: "friend_link_apply",
      env: {
        APP_BASE_URL: "https://blog.lyuy.top",
        TURNSTILE_SECRET: "secret",
        TURNSTILE_HOSTNAMES: "blog.lyuy.top",
      },
      fetchImpl: async () => new Response("error", { status: 502 }),
    });
    expect(res500.ok).toBe(false);

    const resErr = await verifyTurnstileToken({
      token: "tok",
      expectedAction: "friend_link_apply",
      env: {
        APP_BASE_URL: "https://blog.lyuy.top",
        TURNSTILE_SECRET: "secret",
        TURNSTILE_HOSTNAMES: "blog.lyuy.top",
      },
      fetchImpl: async () => {
        throw new Error("timeout");
      },
    });
    expect(resErr.ok).toBe(false);
  });

  it("accepts verified token matching action and hostname", async () => {
    const res = await verifyTurnstileToken({
      token: "tok",
      expectedAction: "comment_create",
      remoteIp: "1.2.3.4",
      env: {
        APP_BASE_URL: "https://blog.lyuy.top",
        TURNSTILE_SECRET: "secret",
        TURNSTILE_HOSTNAMES: "blog.lyuy.top",
      },
      fetchImpl: async () =>
        new Response(JSON.stringify({ success: true, action: "comment_create", hostname: "blog.lyuy.top" }), {
          status: 200,
        }),
    });
    expect(res).toEqual({ ok: true });
  });
});
