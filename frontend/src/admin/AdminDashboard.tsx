import { Box, Grid, Paper, Stack, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "./adminApi";
import { StateBlock } from "./AdminPrimitives";
import {
  ArticleRounded,
  CommentRounded,
  GroupRounded,
  LibraryMusicRounded,
  LinkRounded,
  PagesRounded,
  RocketLaunchRounded,
  WhatshotRounded,
  TrendingUpRounded,
} from "@mui/icons-material";

const statConfig: Record<keyof Awaited<ReturnType<typeof adminApi.stats>>, { label: string; icon: React.ReactNode; color: string }> = {
  posts: { label: "文章", icon: <ArticleRounded />, color: "#3b82f6" }, // blue-500
  moments: { label: "瞬间", icon: <WhatshotRounded />, color: "#f59e0b" }, // amber-500
  projects: { label: "项目", icon: <RocketLaunchRounded />, color: "#8b5cf6" }, // violet-500
  pages: { label: "页面", icon: <PagesRounded />, color: "#10b981" }, // emerald-500
  friendLinks: { label: "友链", icon: <LinkRounded />, color: "#ec4899" }, // pink-500
  music: { label: "音乐", icon: <LibraryMusicRounded />, color: "#06b6d4" }, // cyan-500
  comments: { label: "评论", icon: <CommentRounded />, color: "#6366f1" }, // indigo-500
  users: { label: "用户", icon: <GroupRounded />, color: "#64748b" }, // slate-500
};

export function AdminDashboard() {
  const theme = useTheme();
  const query = useQuery({ queryKey: ["admin", "stats"], queryFn: adminApi.stats });

  return (
    <Stack spacing={4}>
      <StateBlock loading={query.isLoading} error={query.error} />

      <Box>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, letterSpacing: "-0.02em" }}>
          数据概览
        </Typography>
        {query.data && (
          <Grid container spacing={3}>
            {(Object.keys(statConfig) as Array<keyof typeof statConfig>).map((key) => {
              const config = statConfig[key];
              return (
                <Grid item xs={12} sm={6} md={3} key={key}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      height: "100%",
                      borderRadius: 3,
                      bgcolor: "background.paper",
                      border: 1,
                      borderColor: "divider",
                      position: "relative",
                      overflow: "hidden",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: `0 12px 24px -10px ${alpha(config.color, 0.2)}`,
                        borderColor: alpha(config.color, 0.3),
                      },
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        right: 0,
                        width: "150px",
                        height: "150px",
                        background: `radial-gradient(circle at top right, ${alpha(config.color, 0.1)}, transparent 70%)`,
                        borderRadius: "0 0 0 100%",
                        pointerEvents: "none",
                      }
                    }}
                  >
                    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: alpha(config.color, theme.palette.mode === "dark" ? 0.15 : 0.1),
                          color: config.color,
                        }}
                      >
                        {config.icon}
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", color: "success.main", typography: "caption", fontWeight: 700 }}>
                        <TrendingUpRounded sx={{ fontSize: 16, mr: 0.5 }} />
                        +12%
                      </Box>
                    </Stack>
                    <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: "-0.02em", mb: 0.5 }}>
                      {query.data[key]}
                    </Typography>
                    <Typography color="text.secondary" sx={{ fontWeight: 500, fontSize: "0.9rem" }}>
                      {config.label}总数
                    </Typography>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>

      <Box>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, letterSpacing: "-0.02em" }}>
          系统状态
        </Typography>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
            position: "relative",
            overflow: "hidden"
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: -100,
              right: -100,
              width: 300,
              height: 300,
              background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 70%)`,
              pointerEvents: "none",
            }}
          />
          <Grid container spacing={4}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>工作台就绪</Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.7, maxWidth: 600 }}>
                欢迎使用 Luy Admin 内容管理系统。您可以使用左侧导航栏管理站点的各项内容，包括文章、瞬间、项目、页面等。所有数据的修改将实时同步到前台展示。
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", display: "block", mb: 0.5 }}>
                    系统版本
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>v2.0.0-beta</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", display: "block", mb: 0.5 }}>
                    最后更新
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>刚刚</Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Stack>
  );
}
