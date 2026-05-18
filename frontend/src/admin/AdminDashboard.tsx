import { Grid, Paper, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { glassCardSx } from "../components/Glass";
import { adminApi } from "./adminApi";
import { StateBlock } from "./AdminPrimitives";

const labels: Array<[keyof Awaited<ReturnType<typeof adminApi.stats>>, string]> = [
  ["posts", "文章"],
  ["moments", "瞬间"],
  ["projects", "项目"],
  ["pages", "页面"],
  ["friendLinks", "友链"],
  ["music", "音乐"],
  ["comments", "评论"],
  ["users", "用户"],
];

export function AdminDashboard() {
  const query = useQuery({ queryKey: ["admin", "stats"], queryFn: adminApi.stats });
  return (
    <Stack spacing={2}>
      <StateBlock loading={query.isLoading} error={query.error} />
      {query.data && (
        <Grid container spacing={2}>
          {labels.map(([key, label]) => (
            <Grid item xs={12} sm={6} md={3} key={key}>
              <Paper variant="outlined" sx={{ ...glassCardSx, p: 2.2, height: "100%" }}>
                <Typography color="text.secondary">{label}</Typography>
                <Typography variant="h4" sx={{ fontWeight: 900 }}>{query.data[key]}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
      <Paper variant="outlined" sx={{ ...glassCardSx, p: 2.2 }}>
        <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>工作台</Typography>
        <Typography color="text.secondary">使用左侧导航进入内容、音乐、评论和用户管理。数据修改后前台会通过现有接口读取最新内容。</Typography>
      </Paper>
    </Stack>
  );
}
