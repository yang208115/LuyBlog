import { describe, expect, it } from "vitest";
import app from "./index";

function env() {
  return {
    NODE_ENV: "production",
    APP_BASE_URL: "https://blog.example.com",
    VITE_PORT: "5173",
    DB: {},
    ASSETS: {
      fetch: () => new Response("missing", { status: 404 }),
    },
  };
}

describe("worker entry", () => {
  it("does not allow arbitrary origins in production CORS", async () => {
    const response = await app.request(
      "/api/site-config",
      {
        method: "OPTIONS",
        headers: {
          Origin: "https://evil.example.com",
          "Access-Control-Request-Method": "GET",
        },
      },
      env(),
    );

    expect(response.headers.get("access-control-allow-origin")).not.toBe("https://evil.example.com");
  });

  it("allows the configured production origin in CORS", async () => {
    const response = await app.request(
      "/api/site-config",
      {
        method: "OPTIONS",
        headers: {
          Origin: "https://blog.example.com",
          "Access-Control-Request-Method": "GET",
        },
      },
      env(),
    );

    expect(response.headers.get("access-control-allow-origin")).toBe("https://blog.example.com");
  });
});
