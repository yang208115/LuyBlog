import { Box } from "@mui/material";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema, type Options as Schema } from "rehype-sanitize";
import ReactMarkdown, { type Options as MarkdownOptions } from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * 允许渲染原始 HTML（rehypeRaw），但随后必须经过 rehypeSanitize 清洗。
 * 在 GitHub 默认白名单基础上只做最小扩展：
 * - 代码块的 className 仅允许 language-* / hljs 相关类名
 * - img 允许 src/alt/width/height/title（src 协议仍受默认的 http/https 限制）
 * - 不允许 iframe/script/style 等标签，也不允许 on* 事件属性
 */
export const markdownSanitizeSchema: Schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), ["className", /^(language|hljs)(-.+)?$/]],
    pre: [...(defaultSchema.attributes?.pre ?? []), ["className", /^(language|hljs)(-.+)?$/]],
    span: [...(defaultSchema.attributes?.span ?? []), ["className", /^hljs(-.+)?$/]],
    img: [...(defaultSchema.attributes?.img ?? []), "src", "alt", "width", "height", "title"],
  },
};

const remarkPlugins = [remarkGfm];
// 顺序很重要：rehypeRaw 先把原始 HTML 解析成节点，rehypeSanitize 再统一清洗。
const rehypePlugins: NonNullable<MarkdownOptions["rehypePlugins"]> = [rehypeRaw, [rehypeSanitize, markdownSanitizeSchema]];

export function MarkdownView({ content }: { content: string }) {
  return (
    <Box
      sx={(theme) => ({
        lineHeight: 1.9,
        fontSize: "1rem",
        "& h1, & h2, & h3": { mt: 3, mb: 1.2, lineHeight: 1.3 },
        "& p": { my: 1.5 },
        "& a": { color: "primary.main" },
        "& img": { maxWidth: "100%", height: "auto", borderRadius: 2, verticalAlign: "middle" },
        "& ul, & ol": { pl: 3, my: 1.5 },
        "& code": {
          px: 0.5,
          py: 0.25,
          borderRadius: 0.5,
          bgcolor: theme.palette.mode === "light" ? "rgba(33, 56, 98, 0.09)" : "action.hover",
          color: "text.primary",
          fontFamily: "monospace",
        },
        "& pre": {
          p: 1.5,
          border: "1px solid",
          borderColor: theme.palette.mode === "light" ? "rgba(112, 137, 194, 0.28)" : "divider",
          borderRadius: 1,
          bgcolor: theme.palette.mode === "light" ? "#17213a" : "#101a2f",
          color: "#edf3ff",
          overflowX: "auto",
          boxShadow: theme.palette.mode === "light" ? "0 14px 34px rgba(34, 49, 87, 0.16)" : "none",
        },
        "& pre code": { p: 0, bgcolor: "transparent", color: "inherit" },
        "& blockquote": { borderLeft: "4px solid", borderColor: "divider", pl: 1.5, color: "text.secondary", m: 0 },
        "& table": { width: "100%", borderCollapse: "collapse", my: 2 },
        "& th, & td": { border: "1px solid", borderColor: "divider", p: 1 },
        "& td > div": { maxWidth: "100%" },
      })}
    >
      <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins}>
        {content}
      </ReactMarkdown>
    </Box>
  );
}
