import { describe, expect, it } from "vitest";
import { sha256Hex } from "../security/rateLimit";
import {
  constantTimeEqual,
  formatCookieHeader,
  generateSecureToken,
  isAdminGithubId,
  parseCookieHeader,
  sanitizeNextPath,
} from "./session";

describe("auth session helpers", () => {
  it("generates 256-bit hex tokens and deterministic sha256 digests", async () => {
    const tokenA = generateSecureToken();
    const tokenB = generateSecureToken();
    expect(tokenA).toMatch(/^[a-f0-9]{64}$/);
    expect(tokenA).not.toBe(tokenB);

    const hashA = await sha256Hex(tokenA);
    const hashA2 = await sha256Hex(tokenA);
    expect(hashA).toMatch(/^[a-f0-9]{64}$/);
    expect(hashA).toBe(hashA2);
    expect(hashA).not.toBe(tokenA);
  });

  it("compares strings in constant time", () => {
    expect(constantTimeEqual("abc123", "abc123")).toBe(true);
    expect(constantTimeEqual("abc123", "abc124")).toBe(false);
    expect(constantTimeEqual("abc", "abcd")).toBe(false);
  });

  it("sanitizes OAuth redirect next paths against open redirects", () => {
    expect(sanitizeNextPath("/blog/hello")).toBe("/blog/hello");
    expect(sanitizeNextPath("/admin/posts?page=2")).toBe("/admin/posts?page=2");
    expect(sanitizeNextPath("//evil.com")).toBe("/");
    expect(sanitizeNextPath("https://evil.com")).toBe("/");
    expect(sanitizeNextPath("/\\evil.com")).toBe("/");
    expect(sanitizeNextPath("/foo\r\nbar")).toBe("/");
    expect(sanitizeNextPath(undefined)).toBe("/");
  });

  it("matches comma-separated ADMIN_GITHUB_ID values", () => {
    expect(isAdminGithubId("132762661", "132762661")).toBe(true);
    expect(isAdminGithubId("42", "100, 42 , 99")).toBe(true);
    expect(isAdminGithubId("42", "132762661")).toBe(false);
    expect(isAdminGithubId("42", "")).toBe(false);
  });

  it("parses and formats HttpOnly cookies properly", () => {
    const header = "foo=bar; luy_session=tok%20123; other=1";
    expect(parseCookieHeader(header, "luy_session")).toBe("tok 123");
    expect(parseCookieHeader(header, "missing")).toBeNull();

    const formatted = formatCookieHeader("luy_session", "abc", { maxAge: 3600, secure: true });
    expect(formatted).toContain("luy_session=abc");
    expect(formatted).toContain("HttpOnly");
    expect(formatted).toContain("SameSite=Lax");
    expect(formatted).toContain("Secure");
  });
});
