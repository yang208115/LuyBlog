import { describe, expect, it } from "vitest";
import {
  buildScrollAnchors,
  extractMarkdownHeadingRatios,
  mapScrollPosition,
  normalizeHeadingText,
} from "./scrollSync";

describe("scrollSync", () => {
  it("normalizes inline markdown syntax and skips fenced code comments when extracting headings", () => {
    const md = [
      "# **RFC 6238** `TOTP` [原理](https://example.com) ###",
      "",
      "```python",
      "# 这是 Python 注释，不是标题",
      "def totp():",
      "    return 123456",
      "```",
      "",
      "~~~bash",
      "# 另一个围栏代码块注释",
      "echo ok",
      "~~~",
      "",
      "## 30 秒后会怎样？",
    ].join("\n");

    expect(normalizeHeadingText("**RFC 6238** `TOTP` [原理](https://example.com)")).toBe(
      "rfc 6238 totp 原理",
    );

    const ratios = extractMarkdownHeadingRatios(md, 60);
    expect(ratios.map((item) => item.text)).toEqual(["rfc 6238 totp 原理", "30 秒后会怎样？"]);
    expect(ratios[0]?.ratio).toBe(0);
    expect(ratios[1]?.ratio).toBeGreaterThan(0.8);
    expect(ratios[1]?.ratio).toBeLessThan(1);
  });

  it("performs piecewise linear interpolation symmetrically between editor and preview anchors", () => {
    const anchors = buildScrollAnchors({
      headingRatios: [
        { text: "第一章", ratio: 0.2 },
        { text: "第二章", ratio: 0.5 },
      ],
      previewHeadings: [
        { text: "第一章", top: 600 },
        { text: "第二章", top: 1500 },
      ],
      editorScrollHeight: 2000,
      editorMaxScroll: 1400,
      previewMaxScroll: 2400,
    });

    // Anchors: (0,0) -> (400,600) -> (1000,1500) -> (1400,2400)
    expect(anchors).toEqual([
      { editor: 0, preview: 0 },
      { editor: 400, preview: 600 },
      { editor: 1000, preview: 1500 },
      { editor: 1400, preview: 2400 },
    ]);

    expect(mapScrollPosition(anchors, 400, "editorToPreview")).toBe(600);
    expect(mapScrollPosition(anchors, 700, "editorToPreview")).toBe(1050);
    expect(mapScrollPosition(anchors, 1200, "editorToPreview")).toBe(1950);

    expect(mapScrollPosition(anchors, 600, "previewToEditor")).toBe(400);
    expect(mapScrollPosition(anchors, 1050, "previewToEditor")).toBe(700);
    expect(mapScrollPosition(anchors, 1950, "previewToEditor")).toBe(1200);
  });

  it("falls back to proportional mapping when there are no headings and guards zero maxScroll", () => {
    const proportionalAnchors = buildScrollAnchors({
      headingRatios: [],
      previewHeadings: [],
      editorScrollHeight: 1000,
      editorMaxScroll: 500,
      previewMaxScroll: 1500,
    });

    expect(proportionalAnchors).toEqual([
      { editor: 0, preview: 0 },
      { editor: 500, preview: 1500 },
    ]);
    expect(mapScrollPosition(proportionalAnchors, 250, "editorToPreview")).toBe(750);
    expect(mapScrollPosition(proportionalAnchors, 750, "previewToEditor")).toBe(250);
    expect(mapScrollPosition(proportionalAnchors, -50, "editorToPreview")).toBe(0);
    expect(mapScrollPosition(proportionalAnchors, 9999, "editorToPreview")).toBe(1500);

    const zeroAnchors = buildScrollAnchors({
      headingRatios: [{ text: "标题", ratio: 0.5 }],
      previewHeadings: [{ text: "标题", top: 100 }],
      editorScrollHeight: 400,
      editorMaxScroll: 0,
      previewMaxScroll: 500,
    });
    const mapped = mapScrollPosition(zeroAnchors, 100, "editorToPreview");
    expect(Number.isNaN(mapped)).toBe(false);
    expect(mapped).toBe(0);
  });

  it("matches duplicate headings in order and filters out-of-range or non-monotonic anchors", () => {
    const anchors = buildScrollAnchors({
      headingRatios: [
        { text: "小结", ratio: 0.1 },
        { text: "正常章节", ratio: 0.4 },
        { text: "小结", ratio: 0.8 },
      ],
      previewHeadings: [
        { text: "小结", top: 200 },
        { text: "正常章节", top: 180 }, // 非单调（小于前一个 top），应被过滤
        { text: "小结", top: 1800 }, // 超出 previewMaxScroll，应被过滤
      ],
      editorScrollHeight: 1000,
      editorMaxScroll: 600,
      previewMaxScroll: 1200,
    });

    expect(anchors).toEqual([
      { editor: 0, preview: 0 },
      { editor: 100, preview: 200 },
      { editor: 600, preview: 1200 },
    ]);
  });
});
