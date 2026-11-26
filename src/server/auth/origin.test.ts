import { describe, expect, it, vi } from "vitest";

vi.mock("cloudflare:workers", () => ({
  env: {},
}));

import { assertSameOriginWithBase } from "./origin.server";

describe("assertSameOriginWithBase", () => {
  it("allows GET and HEAD requests unconditionally", () => {
    const req = new Request("http://localhost:5173/api/posts", {
      method: "GET",
      headers: {
        origin: "https://evil.com",
        "sec-fetch-site": "cross-site",
      },
    });
    expect(() => assertSameOriginWithBase(req, "https://blog.lyuy.top")).not.toThrow();
  });

  it("rejects cross-site POST requests via sec-fetch-site", () => {
    const req = new Request("http://localhost:5173/api/upload", {
      method: "POST",
      headers: {
        origin: "http://localhost:5173",
        "sec-fetch-site": "cross-site",
      },
    });
    expect(() => assertSameOriginWithBase(req, "http://localhost:5173")).toThrow("禁止跨站请求");
  });

  it("allows local dev requests when Origin matches request.url even if APP_BASE_URL uses another port", () => {
    for (const port of ["5173", "5174"]) {
      const req = new Request(`http://localhost:${port}/_serverFn/preview`, {
        method: "POST",
        headers: {
          origin: `http://localhost:${port}`,
          "sec-fetch-site": "same-origin",
        },
      });
      expect(() => assertSameOriginWithBase(req, "http://localhost:8787")).not.toThrow();
    }
  });

  it("allows loopback 127.0.0.1 and localhost interchangeability on the same port", () => {
    const req = new Request("http://localhost:5173/_serverFn/preview", {
      method: "POST",
      headers: {
        origin: "http://127.0.0.1:5173",
      },
    });
    expect(() => assertSameOriginWithBase(req, "http://localhost:8787")).not.toThrow();
  });

  it("rejects cross-origin requests from untrusted external origins", () => {
    const prodReq = new Request("https://blog.lyuy.top/_serverFn/preview", {
      method: "POST",
      headers: { origin: "https://evil.com" },
    });
    expect(() => assertSameOriginWithBase(prodReq, "https://blog.lyuy.top")).toThrow("请求来源校验失败");

    const localReq = new Request("http://localhost:5173/_serverFn/preview", {
      method: "POST",
      headers: { origin: "https://evil.com" },
    });
    expect(() => assertSameOriginWithBase(localReq, "http://localhost:5173")).toThrow("请求来源校验失败");
  });

  it("rejects cross-port loopback requests when port does not match request.url or APP_BASE_URL", () => {
    const req = new Request("http://localhost:5173/_serverFn/preview", {
      method: "POST",
      headers: { origin: "http://localhost:9999" },
    });
    expect(() => assertSameOriginWithBase(req, "http://localhost:5173")).toThrow("请求来源校验失败");
  });

  it("allows reverse-proxied production requests whose Origin matches APP_BASE_URL", () => {
    const req = new Request("http://127.0.0.1:8787/_serverFn/preview", {
      method: "POST",
      headers: {
        origin: "https://blog.lyuy.top",
        "sec-fetch-site": "same-origin",
      },
    });
    expect(() => assertSameOriginWithBase(req, "https://blog.lyuy.top")).not.toThrow();
  });
});
