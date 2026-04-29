import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Grid,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import {
  AddRounded,
  AdminPanelSettingsRounded,
  ArticleRounded,
  AutoGraphRounded,
  BlockRounded,
  CommentRounded,
  DashboardRounded,
  DeleteOutlineRounded,
  GroupRounded,
  SearchRounded,
  ShieldRounded,
  VisibilityOffRounded,
  VisibilityRounded,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth, useAuth } from "../hooks/useAuth";

type AdminPost = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  contentMd: string;
  status: "draft" | "published";
  updatedAt: string;
};

type AdminPostList = {
  items: AdminPost[];
  pagination: { page: number; pageSize: number; total: number };
};

type AdminCommentItem = {
  id: string;
  postId: string;
  userId: string;
  content: string;
  status: "visible" | "hidden";
  username: string;
  postTitle: string;
  createdAt: string;
};

type AdminCommentsResponse = {
  items: AdminCommentItem[];
  pagination: { page: number; pageSize: number; total: number };
};

type AdminUser = {
  id: string;
  githubId: string;
  username: string;
  email: string | null;
  role: "user" | "admin";
  status: "active" | "banned";
};

type AdminUsersResponse = {
  items: AdminUser[];
  pagination: { page: number; pageSize: number; total: number };
};

async function fetchAdminPosts(): Promise<AdminPostList> {
  const response = await fetchWithAuth("/api/admin/posts?page=1&pageSize=50");
  if (!response.ok) throw new Error("加载文章失败");
  return response.json();
}

async function fetchAdminComments(): Promise<AdminCommentsResponse> {
  const response = await fetchWithAuth("/api/admin/comments?page=1&pageSize=50");
  if (!response.ok) throw new Error("加载评论失败");
  return response.json();
}

async function fetchAdminUsers(): Promise<AdminUsersResponse> {
  const response = await fetchWithAuth("/api/admin/users?page=1&pageSize=50");
  if (!response.ok) throw new Error("加载用户失败");
  return response.json();
}

type SectionKey = "dashboard" | "posts" | "comments" | "users";

const sectionMeta: {
  key: SectionKey;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "dashboard",
    title: "仪表盘",
    subtitle: "查看整体数据与快捷入口",
    icon: <DashboardRounded fontSize="small" />,
  },
  {
    key: "posts",
    title: "文章",
    subtitle: "创建并管理博客文章",
    icon: <ArticleRounded fontSize="small" />,
  },
  {
    key: "comments",
    title: "评论",
    subtitle: "审核评论内容与可见状态",
    icon: <CommentRounded fontSize="small" />,
  },
  {
    key: "users",
    title: "用户",
    subtitle: "管理角色与账号状态",
    icon: <GroupRounded fontSize="small" />,
  },
];

export function AdminPage() {
  const theme = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [section, setSection] = useState<SectionKey>("dashboard");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [contentMd, setContentMd] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");

  const postsQuery = useQuery({ queryKey: ["admin", "posts"], queryFn: fetchAdminPosts, enabled: user?.role === "admin" });
  const commentsQuery = useQuery({
    queryKey: ["admin", "comments"],
    queryFn: fetchAdminComments,
    enabled: user?.role === "admin",
  });
  const usersQuery = useQuery({ queryKey: ["admin", "users"], queryFn: fetchAdminUsers, enabled: user?.role === "admin" });

  const createPostMutation = useMutation({
    mutationFn: async () => {
      const response = await fetchWithAuth("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slug, summary: summary || null, contentMd, status }),
      });
      if (!response.ok) {
        const err = (await response.json()) as { message?: string };
        throw new Error(err.message || "创建失败");
      }
      return response.json();
    },
    onSuccess: async () => {
      setTitle("");
      setSlug("");
      setSummary("");
      setContentMd("");
      setStatus("draft");
      await queryClient.invalidateQueries({ queryKey: ["admin", "posts"] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetchWithAuth(`/api/admin/posts/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("删除失败");
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "posts"] });
    },
  });

  const commentStatusMutation = useMutation({
    mutationFn: async ({ id, nextStatus }: { id: string; nextStatus: "visible" | "hidden" }) => {
      const response = await fetchWithAuth(`/api/admin/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!response.ok) throw new Error("更新评论状态失败");
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "comments"] });
    },
  });

  const roleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: "user" | "admin" }) => {
      const response = await fetchWithAuth(`/api/admin/users/${id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!response.ok) throw new Error("更新角色失败");
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  const userStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "banned" }) => {
      const response = await fetchWithAuth(`/api/admin/users/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("更新状态失败");
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  const stats = useMemo(
    () => ({
      posts: postsQuery.data?.pagination.total ?? 0,
      comments: commentsQuery.data?.pagination.total ?? 0,
      users: usersQuery.data?.pagination.total ?? 0,
    }),
    [postsQuery.data, commentsQuery.data, usersQuery.data],
  );

  const currentSection = sectionMeta.find((item) => item.key === section)!;

  const glassCardSx = {
    borderRadius: 3,
    backgroundColor: theme.glass.background,
    backdropFilter: "blur(16px)",
    border: `1px solid ${theme.palette.divider}`,
    transition: "all 0.25s ease",
    boxShadow: `0 8px 30px ${alpha(theme.palette.common.black, theme.palette.mode === "dark" ? 0.25 : 0.08)}`,
    "&:hover": {
      transform: "translateY(-3px)",
      borderColor: alpha(theme.palette.primary.main, 0.45),
      boxShadow: `0 14px 36px ${alpha(theme.palette.primary.main, 0.22)}`,
    },
  };

  if (user?.role !== "admin") {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Paper sx={{ ...glassCardSx, p: 3 }}>
          <Alert severity="error" variant="outlined">
            仅管理员可访问。
          </Alert>
        </Paper>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        background: theme.pageBackground,
        position: "relative",
        py: 3,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          right: "8%",
          top: "4%",
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.2)}, ${alpha(theme.palette.secondary.main, 0.2)})`,
          filter: "blur(55px)",
          pointerEvents: "none",
        }}
      />

      <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1 }}>
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={3} lg={2.7}>
            <Paper
              sx={{
                ...glassCardSx,
                p: 2,
                position: { md: "sticky" },
                top: { md: 86 },
              }}
            >
              <Stack spacing={2}>
                <Stack spacing={0.5}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Halo Admin
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    内容管理控制台
                  </Typography>
                </Stack>

                <TextField
                  size="small"
                  placeholder="搜索"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRounded fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />

                <Divider />

                <List disablePadding>
                  {sectionMeta.map((item) => {
                    const selected = item.key === section;
                    return (
                      <ListItemButton
                        key={item.key}
                        selected={selected}
                        onClick={() => setSection(item.key)}
                        sx={{
                          borderRadius: 2,
                          mb: 0.5,
                          borderLeft: selected ? `3px solid ${theme.palette.primary.main}` : "3px solid transparent",
                          backgroundColor: selected ? alpha(theme.palette.primary.main, 0.12) : "transparent",
                          "&:hover": {
                            backgroundColor: alpha(theme.palette.primary.main, 0.08),
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 34,
                            color: selected ? theme.palette.primary.main : theme.palette.text.secondary,
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.title}
                          primaryTypographyProps={{ fontWeight: selected ? 700 : 500 }}
                          secondary={item.key === "dashboard" ? "概览" : undefined}
                        />
                      </ListItemButton>
                    );
                  })}
                </List>
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={9} lg={9.3}>
            <Stack spacing={2}>
              <Paper sx={{ ...glassCardSx, p: { xs: 2, md: 2.5 } }}>
                <Stack direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} justifyContent="space-between" spacing={1.2}>
                  <Stack spacing={0.4}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 800,
                        fontSize: { xs: "1.8rem", md: "2.2rem" },
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {currentSection.title}
                    </Typography>
                    <Typography color="text.secondary">{currentSection.subtitle}</Typography>
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    <Button variant="outlined" startIcon={<AutoGraphRounded />} onClick={() => setSection("dashboard")}>
                      数据概览
                    </Button>
                    {section !== "posts" && (
                      <Button variant="contained" startIcon={<AddRounded />} onClick={() => setSection("posts")}>
                        新建文章
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Paper>

              {section === "dashboard" && (
                <>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ ...glassCardSx, p: 2.5 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Stack>
                            <Typography color="text.secondary">文章</Typography>
                            <Typography variant="h4" sx={{ fontWeight: 800 }}>
                              {stats.posts}
                            </Typography>
                          </Stack>
                          <ArticleRounded sx={{ fontSize: 34, color: "primary.main" }} />
                        </Stack>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ ...glassCardSx, p: 2.5 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Stack>
                            <Typography color="text.secondary">评论</Typography>
                            <Typography variant="h4" sx={{ fontWeight: 800 }}>
                              {stats.comments}
                            </Typography>
                          </Stack>
                          <CommentRounded sx={{ fontSize: 34, color: "secondary.main" }} />
                        </Stack>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ ...glassCardSx, p: 2.5 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Stack>
                            <Typography color="text.secondary">用户</Typography>
                            <Typography variant="h4" sx={{ fontWeight: 800 }}>
                              {stats.users}
                            </Typography>
                          </Stack>
                          <GroupRounded sx={{ fontSize: 34, color: "success.main" }} />
                        </Stack>
                      </Paper>
                    </Grid>
                  </Grid>

                  <Paper sx={{ ...glassCardSx, p: 2.5 }}>
                    <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700 }}>
                      快捷访问
                    </Typography>
                    <Grid container spacing={1.2}>
                      <Grid item xs={12} md={4}>
                        <Button fullWidth variant="outlined" startIcon={<ArticleRounded />} onClick={() => setSection("posts")}>
                          管理文章
                        </Button>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Button fullWidth variant="outlined" startIcon={<CommentRounded />} onClick={() => setSection("comments")}>
                          审核评论
                        </Button>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Button fullWidth variant="outlined" startIcon={<AdminPanelSettingsRounded />} onClick={() => setSection("users")}>
                          管理用户
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>
                </>
              )}

              {section === "posts" && (
                <>
                  <Card variant="outlined" sx={{ ...glassCardSx, borderRadius: 3 }}>
                    <CardContent>
                      <Stack spacing={1.6}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          新建文章
                        </Typography>
                        <TextField label="标题" value={title} onChange={(e) => setTitle(e.target.value)} />
                        <TextField label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
                        <TextField label="摘要" value={summary} onChange={(e) => setSummary(e.target.value)} />
                        <TextField
                          label="Markdown 正文"
                          multiline
                          minRows={8}
                          value={contentMd}
                          onChange={(e) => setContentMd(e.target.value)}
                        />
                        <TextField
                          select
                          label="状态"
                          value={status}
                          onChange={(e) => setStatus(e.target.value as "draft" | "published")}
                        >
                          <MenuItem value="draft">草稿</MenuItem>
                          <MenuItem value="published">已发布</MenuItem>
                        </TextField>

                        <Box>
                          <Button
                            variant="contained"
                            startIcon={<AddRounded />}
                            onClick={() => createPostMutation.mutate()}
                            disabled={!title || !slug || !contentMd || createPostMutation.isPending}
                            sx={{
                              borderRadius: 999,
                              px: 3,
                              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            }}
                          >
                            创建文章
                          </Button>
                        </Box>
                        {createPostMutation.isError && (
                          <Typography color="error">{(createPostMutation.error as Error).message}</Typography>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>

                  <Stack spacing={1.5}>
                    {postsQuery.isLoading && (
                      <Paper sx={{ ...glassCardSx, p: 2 }}>
                        <Skeleton variant="text" width="30%" />
                        <Skeleton variant="text" width="70%" />
                      </Paper>
                    )}
                    {postsQuery.data?.items.map((post) => (
                      <Card key={post.id} variant="outlined" sx={{ ...glassCardSx, borderRadius: 3 }}>
                        <CardContent>
                          <Stack
                            direction={{ xs: "column", md: "row" }}
                            justifyContent="space-between"
                            alignItems={{ md: "center" }}
                            spacing={1.5}
                          >
                            <Stack spacing={0.5}>
                              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                {post.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                /blog/{post.slug} · {post.status} · {new Date(post.updatedAt).toLocaleString("zh-CN")}
                              </Typography>
                            </Stack>
                            <Button
                              color="error"
                              variant="outlined"
                              startIcon={<DeleteOutlineRounded />}
                              onClick={() => deletePostMutation.mutate(post.id)}
                              disabled={deletePostMutation.isPending}
                            >
                              删除
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                </>
              )}

              {section === "comments" && (
                <Stack spacing={1.5}>
                  {commentsQuery.isLoading && (
                    <Paper sx={{ ...glassCardSx, p: 2 }}>
                      <Skeleton variant="text" width="30%" />
                      <Skeleton variant="text" width="80%" />
                    </Paper>
                  )}
                  {commentsQuery.data?.items.map((item) => (
                    <Card key={item.id} variant="outlined" sx={{ ...glassCardSx, borderRadius: 3 }}>
                      <CardContent>
                        <Stack spacing={1.2}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {item.username} · 《{item.postTitle}》
                          </Typography>
                          <Typography sx={{ whiteSpace: "pre-wrap" }}>{item.content}</Typography>
                          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                            <Typography variant="body2" color="text.secondary">
                              状态：{item.status}
                            </Typography>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={item.status === "visible" ? <VisibilityOffRounded /> : <VisibilityRounded />}
                              onClick={() =>
                                commentStatusMutation.mutate({
                                  id: item.id,
                                  nextStatus: item.status === "visible" ? "hidden" : "visible",
                                })
                              }
                            >
                              {item.status === "visible" ? "隐藏" : "恢复"}
                            </Button>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}

              {section === "users" && (
                <Stack spacing={1.5}>
                  {usersQuery.isLoading && (
                    <Paper sx={{ ...glassCardSx, p: 2 }}>
                      <Skeleton variant="text" width="35%" />
                      <Skeleton variant="text" width="70%" />
                    </Paper>
                  )}
                  {usersQuery.data?.items.map((item) => (
                    <Card key={item.id} variant="outlined" sx={{ ...glassCardSx, borderRadius: 3 }}>
                      <CardContent>
                        <Stack
                          direction={{ xs: "column", md: "row" }}
                          justifyContent="space-between"
                          alignItems={{ md: "center" }}
                          spacing={1.5}
                        >
                          <Stack spacing={0.5}>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                              {item.username}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {item.email || "无邮箱"} · role={item.role} · status={item.status}
                            </Typography>
                          </Stack>

                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<ShieldRounded />}
                              onClick={() =>
                                roleMutation.mutate({
                                  id: item.id,
                                  role: item.role === "admin" ? "user" : "admin",
                                })
                              }
                            >
                              {item.role === "admin" ? "设为普通用户" : "设为管理员"}
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color={item.status === "active" ? "error" : "success"}
                              startIcon={<BlockRounded />}
                              onClick={() =>
                                userStatusMutation.mutate({
                                  id: item.id,
                                  status: item.status === "active" ? "banned" : "active",
                                })
                              }
                            >
                              {item.status === "active" ? "封禁" : "解禁"}
                            </Button>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
