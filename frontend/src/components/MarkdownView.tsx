import { Box } from "@mui/material";
import rehypeRaw from "rehype-raw";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

export function MarkdownView({ content }: { content: string }) {
  const decodedContent = decodeHtmlEntities(content);

  return (
    <Box
      sx={{
        lineHeight: 1.9,
        fontSize: "1rem",
        "& h1, & h2, & h3": { mt: 3, mb: 1.2, lineHeight: 1.3 },
        "& p": { my: 1.5 },
        "& a": { color: "primary.main" },
        "& img": { maxWidth: "100%", height: "auto", borderRadius: 2, verticalAlign: "middle" },
        "& ul, & ol": { pl: 3, my: 1.5 },
        "& code": { px: 0.5, py: 0.25, borderRadius: 0.5, bgcolor: "action.hover", fontFamily: "monospace" },
        "& pre": { p: 1.5, borderRadius: 1, bgcolor: "action.hover", overflowX: "auto" },
        "& pre code": { p: 0, bgcolor: "transparent" },
        "& blockquote": { borderLeft: "4px solid", borderColor: "divider", pl: 1.5, color: "text.secondary", m: 0 },
        "& table": { width: "100%", borderCollapse: "collapse", my: 2 },
        "& th, & td": { border: "1px solid", borderColor: "divider", p: 1 },
        "& td > div": { maxWidth: "100%" },
      }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {decodedContent}
      </ReactMarkdown>
    </Box>
  );
}
