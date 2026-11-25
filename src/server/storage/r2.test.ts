import { describe, expect, it } from "vitest";
import { detectImageMagicBytes } from "./r2";

describe("r2 magic bytes detection", () => {
  it("detects PNG, JPEG, GIF, WebP and AVIF headers", () => {
    expect(
      detectImageMagicBytes(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])),
    ).toBe("image/png");
    expect(detectImageMagicBytes(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe(
      "image/jpeg",
    );
    expect(detectImageMagicBytes(new TextEncoder().encode("GIF89a123456"))).toBe("image/gif");
    expect(detectImageMagicBytes(new TextEncoder().encode("RIFF\x00\x00\x00\x00WEBP"))).toBe("image/webp");
    expect(
      detectImageMagicBytes(new Uint8Array([0, 0, 0, 20, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66])),
    ).toBe("image/avif");
  });

  it("rejects spoofed HTML/SVG/text content", () => {
    expect(detectImageMagicBytes(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
    expect(detectImageMagicBytes(new TextEncoder().encode("<html><script>1</script></html>"))).toBeNull();
    expect(detectImageMagicBytes(new Uint8Array([1, 2, 3]))).toBeNull();
  });
});
