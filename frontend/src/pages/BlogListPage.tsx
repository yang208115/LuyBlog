import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
  Button,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";

type PostListItem = {
  id: string;
  authorId: string;
  title: string;
  slug: string;
  summary: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type PostListResponse = {
  items: PostListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
};

async function fetchPosts(): Promise<PostListResponse> {
  const response = await fetch("/api/posts?page=1&pageSize=20");
  if (!response.ok) {
    throw new Error("加载文章失败");
  }
  return response.json();
}

export function BlogListPage() {
  const theme = useTheme();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["blog", "posts"],
    queryFn: fetchPosts,
  });

  const glassCardSx = {
    borderRadius: 3,
    backgroundColor: theme.glass.background,
    backdropFilter: "blur(14px)",
    border: `1px solid ${theme.palette.divider}`,
    transition: "all 0.25s ease",
    boxShadow: `0 8px 28px ${alpha(theme.palette.common.black, theme.palette.mode === "dark" ? 0.24 : 0.07)}`,
    "&:hover": {
      transform: "translateY(-2px)",
      borderColor: alpha(theme.palette.primary.main, 0.4),
      boxShadow: `0 14px 34px ${alpha(theme.palette.primary.main, 0.2)}`,
    },
  };

  if (isLoading) {
    return (
      <Box sx={{ minHeight: "calc(100vh - 64px)", background: theme.pageBackground, py: { xs: 3, md: 4 } }}>
        <Container maxWidth="md">
          <Paper sx={{ ...glassCardSx, p: 3, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Paper>
        </Container>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ minHeight: "calc(100vh - 64px)", background: theme.pageBackground, py: { xs: 3, md: 4 } }}>
        <Container maxWidth="md">
          <Paper sx={{ ...glassCardSx, p: 3 }}>
            <Typography color="error">加载文章失败，请稍后重试。</Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        background: theme.pageBackground,
        py: { xs: 3, md: 4 },
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={2.2}>
          <Paper sx={{ ...glassCardSx, p: { xs: 2.2, md: 2.8 } }}>
            <Stack spacing={0.8}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: "1.9rem", md: "2.2rem" },
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                博客
              </Typography>
              <Typography color="text.secondary">最新发布的文章</Typography>
            </Stack>
          </Paper>

          <Stack spacing={1.8}>
            {data?.items.map((post) => (
              <Card key={post.id} variant="outlined" sx={glassCardSx}>
                <CardContent>
                  <Stack spacing={1.5}>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {post.title}
                    </Typography>
                    {post.summary && <Typography color="text.secondary">{post.summary}</Typography>}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(post.publishedAt || post.createdAt).toLocaleString("zh-CN")}
                      </Typography>
                      <Button component={RouterLink} to={`/blog/${post.slug}`} sx={{ borderRadius: 999 }}>
                        阅读全文
                      </Button>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
