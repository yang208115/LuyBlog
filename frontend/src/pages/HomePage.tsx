import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Link,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";
import { ArrowForwardRounded, CalendarTodayRounded, LocalOfferRounded } from "@mui/icons-material";

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

async function fetchHomePosts(): Promise<PostListResponse> {
  const response = await fetch("/api/posts?page=1&pageSize=8");
  if (!response.ok) {
    throw new Error("加载文章失败");
  }
  return response.json();
}

const tags = ["Cloudflare", "React", "Hono", "TypeScript", "D1", "AI"];

export default function HomePage() {
  const theme = useTheme();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["home", "posts"],
    queryFn: fetchHomePosts,
  });

  const cardSx = {
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

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        background: theme.pageBackground,
        py: { xs: 3, md: 4 },
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: "-70px",
          right: "5%",
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.18)}, ${alpha(theme.palette.secondary.main, 0.18)})`,
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1 }}>
        <Grid container spacing={2.5}>
          <Grid item xs={12} lg={8.2}>
            <Stack spacing={2.2}>
              <Paper sx={{ ...cardSx, p: { xs: 2, md: 2.8 } }}>
                <Stack spacing={1}>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: "1.9rem", md: "2.4rem" },
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Lyuy Blog
                  </Typography>
                  <Typography color="text.secondary">记录编程、部署与 AI 实践。</Typography>
                </Stack>
              </Paper>

              {isLoading && (
                <Paper sx={{ ...cardSx, p: 3, display: "flex", justifyContent: "center" }}>
                  <CircularProgress />
                </Paper>
              )}

              {isError && (
                <Paper sx={{ ...cardSx, p: 3 }}>
                  <Typography color="error">加载文章失败，请稍后重试。</Typography>
                </Paper>
              )}

              {data?.items.map((post) => (
                <Card key={post.id} variant="outlined" sx={cardSx}>
                  <CardContent>
                    <Stack spacing={1.3}>
                      <Link
                        component={RouterLink}
                        to={`/blog/${post.slug}`}
                        underline="none"
                        color="inherit"
                        sx={{
                          fontSize: { xs: "1.1rem", md: "1.3rem" },
                          fontWeight: 700,
                          "&:hover": { color: "primary.main" },
                        }}
                      >
                        {post.title}
                      </Link>

                      {post.summary && (
                        <Typography color="text.secondary" sx={{ lineHeight: 1.75 }}>
                          {post.summary}
                        </Typography>
                      )}

                      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" spacing={1.2}>
                        <Stack direction="row" alignItems="center" spacing={0.8}>
                          <CalendarTodayRounded sx={{ fontSize: 15, color: "text.secondary" }} />
                          <Typography variant="body2" color="text.secondary">
                            {new Date(post.publishedAt || post.createdAt).toLocaleDateString("zh-CN")}
                          </Typography>
                        </Stack>

                        <Button
                          component={RouterLink}
                          to={`/blog/${post.slug}`}
                          endIcon={<ArrowForwardRounded />}
                          sx={{ borderRadius: 999 }}
                        >
                          阅读全文
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ))}

              {!!data?.items.length && (
                <Box sx={{ display: "flex", justifyContent: "center", pt: 1 }}>
                  <Button component={RouterLink} to="/blog" variant="outlined" sx={{ borderRadius: 999, px: 3 }}>
                    查看更多文章
                  </Button>
                </Box>
              )}
            </Stack>
          </Grid>

          <Grid item xs={12} lg={3.8}>
            <Stack spacing={2.2}>
              <Paper sx={{ ...cardSx, p: 2.5 }}>
                <Stack direction="row" spacing={1.4} alignItems="center" sx={{ mb: 1.6 }}>
                  <Avatar sx={{ width: 56, height: 56 }}>L</Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Lyuy
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Fullstack Developer
                    </Typography>
                  </Box>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  热爱构建稳定、优雅、可维护的产品。这里分享技术笔记与实践总结。
                </Typography>
              </Paper>

              <Paper sx={{ ...cardSx, p: 2.5 }}>
                <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mb: 1.3 }}>
                  <LocalOfferRounded sx={{ fontSize: 18 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    标签
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" />
                  ))}
                </Stack>
              </Paper>

              <Paper sx={{ ...cardSx, p: 2.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.2 }}>
                  最新发布
                </Typography>
                <List disablePadding>
                  {data?.items.slice(0, 5).map((post) => (
                    <ListItem key={post.id} disableGutters sx={{ py: 0.6 }}>
                      <ListItemText
                        primary={
                          <Link
                            component={RouterLink}
                            to={`/blog/${post.slug}`}
                            underline="hover"
                            color="inherit"
                            sx={{ fontSize: "0.95rem", lineHeight: 1.4 }}
                          >
                            {post.title}
                          </Link>
                        }
                        secondary={new Date(post.publishedAt || post.createdAt).toLocaleDateString("zh-CN")}
                      />
                    </ListItem>
                  ))}
                </List>
                <Divider sx={{ my: 1.3 }} />
                <Button component={RouterLink} to="/blog" fullWidth variant="text">
                  浏览全部
                </Button>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
