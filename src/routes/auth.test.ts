import { describe, expect, it, vi } from "vitest";
import auth from "./auth";

function createDb() {
  return {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}

function env() {
  return {
    GITHUB_CLIENT_ID: "client-id",
    GITHUB_CLIENT_SECRET: "client-secret",
    APP_BASE_URL: "http://localhost:8787",
    NODE_ENV: "development",
  };
}

describe("auth routes", () => {
  it("sets an HttpOnly OAuth state cookie when creating the GitHub login URL", async () => {
    const response = await auth.request("/github", {}, { ...env(), DB: {} });
    const body = (await response.json()) as { data: { state: string; authUrl: string } };

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("github_oauth_state=");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(new URL(body.data.authUrl).searchParams.get("state")).toBe(body.data.state);
  });

  it("rejects callback requests when the OAuth state does not match the cookie", async () => {
    const response = await auth.request(
      "/github/callback?code=abc&state=bad",
      {
        headers: {
          Cookie: "github_oauth_state=expected",
        },
      },
      { ...env(), DB: {}, db: createDb() },
    );
    const body = (await response.json()) as { success: boolean; message: string };

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toContain("state");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
