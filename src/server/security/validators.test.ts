import { describe, expect, it } from "vitest";
import { normalizeSiteConfig } from "@/shared/siteConfig";
import { optionalSafeUrlSchema, safeHttpUrlSchema, safeNavPathSchema, slugSchema } from "@/shared/validators";

describe("security validators", () => {
  it("accepts only http and https URLs in safeHttpUrlSchema", () => {
    expect(safeHttpUrlSchema.safeParse("https://blog.lyuy.top").success).toBe(true);
    expect(safeHttpUrlSchema.safeParse("http://localhost:5173").success).toBe(true);
    expect(safeHttpUrlSchema.safeParse("javascript:alert(1)").success).toBe(false);
    expect(safeHttpUrlSchema.safeParse("data:text/html,<script>alert(1)</script>").success).toBe(false);
    expect(safeHttpUrlSchema.safeParse("/relative/path").success).toBe(false);
  });

  it("allows empty or relative paths in optionalSafeUrlSchema", () => {
    expect(optionalSafeUrlSchema.safeParse("").success).toBe(true);
    expect(optionalSafeUrlSchema.safeParse("/api/media/uploads/2026/11/a.png").success).toBe(true);
    expect(optionalSafeUrlSchema.safeParse("//evil.com/x.png").success).toBe(false);
    expect(optionalSafeUrlSchema.safeParse("javascript:void(0)").success).toBe(false);
  });

  it("validates navigation paths safely", () => {
    expect(safeNavPathSchema.safeParse("/blog").success).toBe(true);
    expect(safeNavPathSchema.safeParse("https://github.com/yang208115").success).toBe(true);
    expect(safeNavPathSchema.safeParse("//evil.com").success).toBe(false);
    expect(safeNavPathSchema.safeParse("javascript:alert(1)").success).toBe(false);
  });

  it("enforces clean lowercase kebab slugs", () => {
    expect(slugSchema.safeParse("hello-world-2026").success).toBe(true);
    expect(slugSchema.safeParse("Hello_World").success).toBe(false);
    expect(slugSchema.safeParse("a--b").success).toBe(false);
    expect(slugSchema.safeParse("-leading").success).toBe(false);
  });

  it("normalizes legacy siteConfig by stripping aiConfig and placeholder URLs", () => {
    const normalized = normalizeSiteConfig({
      title: "旧站点",
      bgImages: ["https://dmoe.cc/random.php"],
      defaultPostCover: "https://dmoe.cc/random.php",
      social: {
        github: "https://github.com/yang208115",
        demo: "https://edge.nekro.ai",
      },
      aiConfig: {
        apiKey: "sk-secret-leak",
        model: "gpt-4.1-mini",
      },
    });

    expect("aiConfig" in normalized).toBe(false);
    expect(normalized.defaultPostCover).toBe("");
    expect(normalized.social.demo).toBe("");
    expect(normalized.heroImage).toBe("/anime-night-studio.png");
  });
});
