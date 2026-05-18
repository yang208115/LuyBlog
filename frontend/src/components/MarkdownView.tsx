import { Box } from "@mui/material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownView({ content }: { content: string }) {
  return (
    <Box
      sx={{
        lineHeight: 1.9,
        fontSize: "1rem",
        "& h1, & h2, & h3": { mt: 3, mb: 1.2, lineHeight: 1.3 },
        "& p": { my: 1.5 },
        "& a": { color: "primary.main" },
        "& img": { maxWidth: "100%", borderRadius: 2 },
        "& ul, & ol": { pl: 3, my: 1.5 },
        "& code": { px: 0.5, py: 0.25, borderRadius: 0.5, bgcolor: "action.hover", fontFamily: "monospace" },
        "& pre": { p: 1.5, borderRadius: 1, bgcolor: "action.hover", overflowX: "auto" },
        "& pre code": { p: 0, bgcolor: "transparent" },
        "& blockquote": { borderLeft: "4px solid", borderColor: "divider", pl: 1.5, color: "text.secondary", m: 0 },
        "& table": { width: "100%", borderCollapse: "collapse", my: 2 },
        "& th, & td": { border: "1px solid", borderColor: "divider", p: 1 },
      }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </Box>
  );
}
