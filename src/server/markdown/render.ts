import type { Element, ElementContent, Root } from "hast";
import { toString as hastToString } from "hast-util-to-string";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema, type Options as SanitizeOptions } from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { createHighlighterCore, type HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import langBash from "shiki/langs/bash.mjs";
import langCss from "shiki/langs/css.mjs";
import langDiff from "shiki/langs/diff.mjs";
import langDockerfile from "shiki/langs/dockerfile.mjs";
import langGo from "shiki/langs/go.mjs";
import langHtml from "shiki/langs/html.mjs";
import langJavascript from "shiki/langs/javascript.mjs";
import langJson from "shiki/langs/json.mjs";
import langJsx from "shiki/langs/jsx.mjs";
import langMarkdown from "shiki/langs/markdown.mjs";
import langPython from "shiki/langs/python.mjs";
import langRust from "shiki/langs/rust.mjs";
import langSql from "shiki/langs/sql.mjs";
import langToml from "shiki/langs/toml.mjs";
import langTsx from "shiki/langs/tsx.mjs";
import langTypescript from "shiki/langs/typescript.mjs";
import langYaml from "shiki/langs/yaml.mjs";
import themeGithubLight from "shiki/themes/github-light.mjs";
import themeTokyoNight from "shiki/themes/tokyo-night.mjs";
import { unified } from "unified";

export type TocItem = {
  id: string;
  text: string;
  depth: 2 | 3;
};

export type RenderedMarkdown = {
  html: string;
  toc: TocItem[];
  readingTime: number;
};

const LANG_ALIASES: Record<string, string> = {
  ts: "typescript",
  js: "javascript",
  py: "python",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  yml: "yaml",
  md: "markdown",
  docker: "dockerfile",
};

const SUPPORTED_LANGS = new Set([
  "typescript",
  "tsx",
  "javascript",
  "jsx",
  "python",
  "bash",
  "json",
  "yaml",
  "sql",
  "html",
  "css",
  "markdown",
  "rust",
  "go",
  "dockerfile",
  "toml",
  "diff",
]);

let highlighterPromise: Promise<HighlighterCore> | null = null;

function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [themeGithubLight, themeTokyoNight],
      langs: [
        langTypescript,
        langTsx,
        langJavascript,
        langJsx,
        langPython,
        langBash,
        langJson,
        langYaml,
        langSql,
        langHtml,
        langCss,
        langMarkdown,
        langRust,
        langGo,
        langDockerfile,
        langToml,
        langDiff,
      ],
      engine: createJavaScriptRegexEngine(),
    });
  }
  return highlighterPromise;
}

export const markdownSanitizeSchema: SanitizeOptions = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), ["className", /^language-[a-z0-9-]+$/i]],
    img: [...(defaultSchema.attributes?.img ?? []), "src", "alt", "width", "height", "title", "loading"],
  },
};

function isElement(node: unknown): node is Element {
  return Boolean(node && typeof node === "object" && (node as Element).type === "element");
}

function normalizeLanguage(rawLang: string | undefined): string {
  if (!rawLang) return "text";
  const lower = rawLang.toLowerCase();
  const mapped = LANG_ALIASES[lower] ?? lower;
  return SUPPORTED_LANGS.has(mapped) ? mapped : "text";
}

function createCopyableCodeBlock(langLabel: string, preElement: Element): Element {
  return {
    type: "element",
    tagName: "div",
    properties: {
      className: ["code-block"],
      "data-code-lang": langLabel,
    },
    children: [
      {
        type: "element",
        tagName: "div",
        properties: { className: ["code-block-header"] },
        children: [
          {
            type: "element",
            tagName: "span",
            properties: { className: ["code-block-lang"] },
            children: [{ type: "text", value: langLabel }],
          },
          {
            type: "element",
            tagName: "button",
            properties: {
              type: "button",
              className: ["code-copy-btn"],
              "aria-label": "复制代码",
            },
            children: [{ type: "text", value: "复制" }],
          },
        ],
      },
      preElement,
    ],
  };
}

function walkAndTransform(
  parentChildren: ElementContent[],
  toc: TocItem[],
  highlighter: HighlighterCore,
): void {
  for (let i = 0; i < parentChildren.length; i += 1) {
    const node = parentChildren[i];
    if (!isElement(node)) continue;

    if (node.tagName === "h2" || node.tagName === "h3") {
      const id = typeof node.properties?.id === "string" ? node.properties.id : "";
      const text = hastToString(node).trim();
      if (id && text) {
        toc.push({
          id,
          text,
          depth: node.tagName === "h2" ? 2 : 3,
        });
      }
      continue;
    }

    if (node.tagName === "pre") {
      const codeChild = node.children.find((c): c is Element => isElement(c) && c.tagName === "code");
      if (codeChild) {
        const classNames = Array.isArray(codeChild.properties?.className)
          ? codeChild.properties.className.map(String)
          : [];
        const langClass = classNames.find((c) => c.startsWith("language-"));
        const rawLang = langClass ? langClass.slice("language-".length) : "";
        const normalizedLang = normalizeLanguage(rawLang);
        const codeText = hastToString(codeChild).replace(/\n$/, "");

        let preElement: Element;
        if (normalizedLang === "text") {
          preElement = {
            type: "element",
            tagName: "pre",
            properties: { className: ["shiki", "shiki-plain"] },
            children: [
              {
                type: "element",
                tagName: "code",
                properties: {},
                children: [{ type: "text", value: codeText }],
              },
            ],
          };
        } else {
          const shikiRoot = highlighter.codeToHast(codeText, {
            lang: normalizedLang,
            themes: {
              light: "github-light",
              dark: "tokyo-night",
            },
            defaultColor: false,
          });
          const shikiPre = shikiRoot.children.find((c): c is Element => isElement(c) && c.tagName === "pre");
          preElement = shikiPre ?? node;
        }

        parentChildren[i] = createCopyableCodeBlock(rawLang || "text", preElement);
        continue;
      }
    }

    if (node.children.length > 0) {
      walkAndTransform(node.children, toc, highlighter);
    }
  }
}

export function calculateReadingTime(markdown: string): number {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .trim();
  const cjkCount = (plain.match(/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g) ?? []).length;
  const nonCjk = plain.replace(/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g, " ");
  const wordCount = (nonCjk.match(/[a-zA-Z0-9_]+/g) ?? []).length;
  const minutes = Math.ceil(cjkCount / 350 + wordCount / 220);
  return Math.max(1, minutes);
}

export function stripMarkdownExcerpt(markdown: string, maxLength = 160): string {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_~\-|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
}

export async function renderMarkdown(markdown: string): Promise<RenderedMarkdown> {
  const highlighter = await getHighlighter();
  const toc: TocItem[] = [];

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize, markdownSanitizeSchema)
    .use(rehypeSlug)
    .use(() => (tree: Root) => {
      walkAndTransform(tree.children as ElementContent[], toc, highlighter);
    })
    .use(rehypeStringify);

  const file = await processor.process(markdown);

  return {
    html: String(file),
    toc,
    readingTime: calculateReadingTime(markdown),
  };
}
