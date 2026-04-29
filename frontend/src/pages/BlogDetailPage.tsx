import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { useParams } from "react-router-dom";
import remarkGfm from "remark-gfm";
import { fetchWithAuth, useAuth } from "../hooks/useAuth";

type PostDetail = {
  id: string;
  authorId: string;
  title: string;
  slug: string;
  summary: string | null;
  contentMd: string;
  status: "draft" | "published";
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type CommentItem = {
  id: string;
  postId: string;
  userId: string;
  content: string;
  status: "visible" | "hidden";
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
};

async function fetchPost(slug: string): Promise<PostDetail> {
  const response = await fetch(`/api/posts/${slug}`);
  if (!response.ok) {
    throw new Error("文章不存在");
  }
  return response.json();
}

async function fetchComments(postId: string): Promise<CommentItem[]> {
  const response = await fetch(`/api/posts/${postId}/comments`);
  if (!response.ok) {
    throw new Error("加载评论失败");
  }
  return response.json();
}

export function BlogDetailPage() {
  const theme = useTheme();
  const { slug = "" } = useParams();
  const { isAuthenticated, login } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");

  const postQuery = useQuery({
    queryKey: ["blog", "post", slug],
    queryFn: () => fetchPost(slug),
    enabled: Boolean(slug),
  });

  const commentsQuery = useQuery({
    queryKey: ["blog", "comments", postQuery.data?.id],
    queryFn: () => fetchComments(postQuery.data!.id),
    enabled: Boolean(postQuery.data?.id),
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

  const createCommentMutation = useMutation({
    mutationFn: async () => {
      if (!postQuery.data) {
        throw new Error("文章不存在");
      }
      const response = await fetchWithAuth(`/api/posts/${postQuery.data.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string };
        throw new Error(errorData.message || "评论失败");
      }

      return response.json();
    },
    onSuccess: async () => {
      setContent("");
      await queryClient.invalidateQueries({ queryKey: ["blog", "comments", postQuery.data?.id] });
    },
  });

  if (postQuery.isLoading) {
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

  if (postQuery.isError || !postQuery.data) {
    return (
      <Box sx={{ minHeight: "calc(100vh - 64px)", background: theme.pageBackground, py: { xs: 3, md: 4 } }}>
        <Container maxWidth="md">
          <Paper sx={{ ...glassCardSx, p: 2.5 }}>
            <Alert severity="error">文章不存在或已下线。</Alert>
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
                  fontSize: { xs: "1.9rem", md: "2.3rem" },
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {postQuery.data.title}
              </Typography>
              <Typography color="text.secondary">
                {new Date(postQuery.data.publishedAt || postQuery.data.createdAt).toLocaleString("zh-CN")}
              </Typography>
            </Stack>
          </Paper>

          {postQuery.data.summary && (
            <Paper sx={{ ...glassCardSx, p: 1.2 }}>
              <Alert severity="info">{postQuery.data.summary}</Alert>
            </Paper>
          )}

          <Card variant="outlined" sx={glassCardSx}>
            <CardContent>
              <Box
                sx={{
                  lineHeight: 1.9,
                  "& p": { my: 1.5 },
                  "& ul, & ol": { pl: 3, my: 1.5 },
                  "& code": { px: 0.5, py: 0.25, borderRadius: 0.5, bgcolor: "action.hover", fontFamily: "monospace" },
                  "& pre": { p: 1.5, borderRadius: 1, bgcolor: "action.hover", overflowX: "auto" },
                  "& pre code": { p: 0, bgcolor: "transparent" },
                  "& blockquote": { borderLeft: "4px solid", borderColor: "divider", pl: 1.5, color: "text.secondary", m: 0 },
                }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{postQuery.data.contentMd}</ReactMarkdown>
              </Box>
            </CardContent>
          </Card>

          <Stack spacing={1.8}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              评论
            </Typography>

            {!isAuthenticated ? (
              <Paper sx={{ ...glassCardSx, p: 1.2 }}>
                <Alert
                  severity="info"
                  action={
                    <Button color="inherit" size="small" onClick={login}>
                      登录
                    </Button>
                  }
                >
                  登录后可发表评论
                </Alert>
              </Paper>
            ) : (
              <Card variant="outlined" sx={glassCardSx}>
                <CardContent>
                  <Stack spacing={1.5}>
                    <TextField
                      multiline
                      minRows={3}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="写下你的评论..."
                    />
                    <Box>
                      <Button
                        variant="contained"
                        disabled={!content.trim() || createCommentMutation.isPending}
                        onClick={() => createCommentMutation.mutate()}
                        sx={{ borderRadius: 999 }}
                      >
                        发布评论
                      </Button>
                    </Box>
                    {createCommentMutation.isError && (
                      <Typography color="error">{(createCommentMutation.error as Error).message}</Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            )}

            <Stack spacing={1.5}>
              {commentsQuery.isLoading && (
                <Paper sx={{ ...glassCardSx, p: 2, display: "flex", justifyContent: "center" }}>
                  <CircularProgress size={20} />
                </Paper>
              )}
              {commentsQuery.data?.map((comment) => (
                <Card key={comment.id} variant="outlined" sx={glassCardSx}>
                  <CardContent>
                    <Stack spacing={1}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {comment.user.username}
                      </Typography>
                      <Typography sx={{ whiteSpace: "pre-wrap" }}>{comment.content}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(comment.createdAt).toLocaleString("zh-CN")}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
