import { describe, expect, it } from "vitest";
import { calculateReadingTime, renderMarkdown } from "./render";

describe("markdown rendering pipeline", () => {
  it("sanitizes dangerous raw HTML and javascript links", async () => {
    const md = [
      "# Hello",
      "",
      '<script>alert("xss")</script>',
      '<img src="https://example.com/a.png" onerror="alert(1)" />',
      "",
      "[click](javascript:alert(1))",
      "",
      '<a href="javascript:alert(2)">raw</a>',
    ].join("\n");

    const result = await renderMarkdown(md);
    expect(result.html).not.toContain("<script");
    expect(result.html).not.toContain("onerror");
    expect(result.html).not.toContain("javascript:");
    expect(result.html).toContain('src="https://example.com/a.png"');
    expect(result.html).toContain("click");
    expect(result.html).toContain("raw");
  });

  it("extracts h2/h3 TOC and highlights code blocks with Shiki", async () => {
    const md = ["## 第一节", "", "### 子标题", "", "```ts", "const hello: string = 'world';", "```"].join(
      "\n",
    );

    const result = await renderMarkdown(md);
    expect(result.toc).toEqual([
      { id: "第一节", text: "第一节", depth: 2 },
      { id: "子标题", text: "子标题", depth: 3 },
    ]);
    expect(result.html).toContain("code-block");
    expect(result.html).toContain("code-copy-btn");
    expect(result.html).toContain("shiki");
  });

  it("computes reading time for CJK and English content", () => {
    expect(calculateReadingTime("短文章")).toBe(1);
    const longCjk = "测".repeat(1200);
    expect(calculateReadingTime(longCjk)).toBe(4);
  });
});
