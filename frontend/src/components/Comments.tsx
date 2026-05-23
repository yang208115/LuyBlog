import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { fetchWithAuth, useAuth } from "../hooks/useAuth";
import { ModernLoader } from "./Loading";

type CommentTarget = "post";

type CommentItem = {
  id: string;
  postId: string | null;
  targetType: CommentTarget;
  targetSlug: string;
  parentId: string | null;
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

async function fetchComments(targetType: CommentTarget, targetSlug: string): Promise<CommentItem[]> {
  const response = await fetch(`/api/comments?targetType=${targetType}&targetSlug=${encodeURIComponent(targetSlug)}`);
  if (!response.ok) throw new Error("加载评论失败");
  return response.json();
}

export function Comments({ targetType, targetSlug }: { targetType: CommentTarget; targetSlug: string }) {
  const theme = useTheme();
  const { isAuthenticated, login } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");

  const queryKey = ["comments", targetType, targetSlug];
  const commentsQuery = useQuery({
    queryKey,
    queryFn: () => fetchComments(targetType, targetSlug),
    enabled: Boolean(targetSlug),
  });

  const cardSx = {
    borderRadius: 2,
    backgroundColor: theme.glass.background,
    backdropFilter: "blur(14px)",
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, theme.palette.mode === "dark" ? 0.22 : 0.06)}`,
  };

  const createCommentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetchWithAuth("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetSlug, content }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message || "评论失败");
      }
      return response.json();
    },
    onSuccess: async () => {
      setContent("");
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  return (
    <Stack spacing={1.6}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        评论
      </Typography>

      {!isAuthenticated ? (
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
      ) : (
        <Card variant="outlined" sx={cardSx}>
          <CardContent>
            <Stack spacing={1.5}>
              <TextField multiline minRows={3} value={content} onChange={(event) => setContent(event.target.value)} placeholder="写下你的评论..." />
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

      {commentsQuery.isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <ModernLoader size={22} />
        </Box>
      )}
      {commentsQuery.isError && <Alert severity="warning">评论加载失败。</Alert>}
      {commentsQuery.data?.length === 0 && <Typography color="text.secondary">还没有评论。</Typography>}
      {commentsQuery.data?.map((comment) => (
        <Card key={comment.id} variant="outlined" sx={cardSx}>
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
  );
}
