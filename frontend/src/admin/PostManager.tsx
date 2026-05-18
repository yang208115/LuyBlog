import { Box, Button, Chip, InputAdornment, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { DeleteOutlineRounded, EditRounded, SearchRounded } from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import { useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "./adminApi";
import { StateBlock, StatusChip } from "./AdminPrimitives";

export function PostManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const query = useQuery({ queryKey: ["admin", "posts"], queryFn: adminApi.posts });
  const deleteMutation = useMutation({
    mutationFn: adminApi.deletePost,
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["admin", "posts"] }),
  });

  const items = query.data?.items ?? [];
  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) =>
      [item.title, item.slug, item.summary, item.category, ...(item.tags ?? [])].filter(Boolean).join(" ").toLowerCase().includes(keyword),
    );
  }, [items, search]);

  return (
    <Box>
      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          mb: 2,
          borderRadius: 2,
          bgcolor: (theme) => alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.72 : 0.92),
          boxShadow: "none",
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }}>
          <TextField
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜索文章"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: { md: 320 } }}
          />
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Button variant="outlined" onClick={() => void query.refetch()}>
              刷新
            </Button>
            <Button component={RouterLink} to="/admin/posts/new" variant="contained">
              写新文章
            </Button>
          </Stack>
        </Stack>
      </Paper>
      <StateBlock loading={query.isLoading} error={query.error} empty={!query.isLoading && filtered.length === 0} />
      {filtered.length > 0 && (
        <Paper
          variant="outlined"
          sx={{
            overflowX: "auto",
            borderRadius: 2,
            bgcolor: (theme) => alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.78 : 0.96),
            boxShadow: "none",
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>标题</TableCell>
                <TableCell>标签</TableCell>
                <TableCell>状态</TableCell>
                <TableCell>浏览</TableCell>
                <TableCell>更新</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((post) => (
                <TableRow key={post.id} hover>
                  <TableCell>
                    <Typography sx={{ fontWeight: 800 }}>{post.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      /blog/{post.slug}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                      {post.category && <Chip size="small" label={post.category} variant="outlined" />}
                      {post.tags.map((tag) => (
                        <Chip key={tag} size="small" label={tag} />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <StatusChip status={post.status} />
                  </TableCell>
                  <TableCell>{post.viewCount}</TableCell>
                  <TableCell>{new Date(post.updatedAt).toLocaleString("zh-CN")}</TableCell>
                  <TableCell align="right">
                    <Button component={RouterLink} to={`/admin/posts/${post.id}`} size="small" startIcon={<EditRounded />}>
                      写作页
                    </Button>
                    <Button size="small" color="error" startIcon={<DeleteOutlineRounded />} onClick={() => deleteMutation.mutate(post.id)}>
                      删除
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}
