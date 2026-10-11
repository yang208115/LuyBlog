import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MarkdownView } from "./MarkdownView";

function render(content: string) {
  return renderToStaticMarkup(<MarkdownView content={content} />);
}

describe("MarkdownView sanitizing", () => {
  it("strips script tags and inline event handlers from raw HTML", () => {
    const html = render('hello <script>alert(1)</script>\n\n<img src="https://example.com/a.png" onerror="alert(2)" alt="a">');

    expect(html).not.toContain("<script");
    expect(html).not.toContain("onerror");
    expect(html).toContain('src="https://example.com/a.png"');
  });

  it("drops iframes and javascript: links", () => {
    const html = render('<iframe src="https://example.com"></iframe>\n\n[x](javascript:alert(1))');

    expect(html).not.toContain("<iframe");
    expect(html).not.toContain("javascript:");
  });

  it("does not turn escaped markup back into real tags", () => {
    const html = render("&lt;script&gt;alert(1)&lt;/script&gt;");

    expect(html).not.toContain("<script");
    expect(html).toContain("&lt;script&gt;");
  });

  it("keeps ordinary markdown, code block language classes and GFM tables", () => {
    const html = render("# Title\n\n```ts\nconst a = 1;\n```\n\n| a | b |\n|---|---|\n| 1 | 2 |");

    expect(html).toContain("<h1>");
    expect(html).toContain('class="language-ts"');
    expect(html).toContain("<table>");
  });
});
