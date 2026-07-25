import { describe, expect, it } from "vitest";
import { createMomentSlug } from "./momentSlug";

describe("createMomentSlug", () => {
  it("creates a moment slug with an eight-character suffix", () => {
    expect(createMomentSlug()).toMatch(/^moment-[a-z0-9]{8}$/);
  });

  it("creates a fresh slug each time", () => {
    const slugs = new Set(Array.from({ length: 20 }, () => createMomentSlug()));

    expect(slugs.size).toBe(20);
  });
});
