import { Box, Button, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { BlockRounded, ShieldRounded, VisibilityOffRounded, VisibilityRounded } from "@mui/icons-material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "./adminApi";
import { AdminToolbar, StateBlock, StatusChip } from "./AdminPrimitives";
import { useState } from "react";

export function CommentManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const query = useQuery({ queryKey: ["admin", "comments"], queryFn: adminApi.comments });
  const mutation = useMutation({ mutationFn: ({ id, status }: { id: string; status: "visible" | "hidden" }) => adminApi.updateComment(id, status), onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["admin", "comments"] }) });
  const items = (query.data?.items ?? []).filter((item) => !search.trim() || [item.username, item.postTitle, item.content].join(" ").toLowerCase().includes(search.toLowerCase()));
  return (
    <Box>
      <AdminToolbar search={search} onSearch={setSearch} onRefresh={() => void query.refetch()} />
      <StateBlock loading={query.isLoading} error={query.error} empty={!query.isLoading && items.length === 0} />
      {items.length > 0 && <Paper variant="outlined"><Table size="small"><TableHead><TableRow><TableCell>评论</TableCell><TableCell>文章</TableCell><TableCell>用户</TableCell><TableCell>状态</TableCell><TableCell align="right">操作</TableCell></TableRow></TableHead><TableBody>{items.map((item) => <TableRow key={item.id} hover><TableCell><Typography sx={{ whiteSpace: "pre-wrap" }}>{item.content}</Typography><Typography variant="caption" color="text.secondary">{new Date(item.createdAt).toLocaleString("zh-CN")}</Typography></TableCell><TableCell>{item.postTitle}</TableCell><TableCell>{item.username}</TableCell><TableCell><StatusChip status={item.status} /></TableCell><TableCell align="right"><Button size="small" startIcon={item.status === "visible" ? <VisibilityOffRounded /> : <VisibilityRounded />} onClick={() => mutation.mutate({ id: item.id, status: item.status === "visible" ? "hidden" : "visible" })}>{item.status === "visible" ? "隐藏" : "恢复"}</Button></TableCell></TableRow>)}</TableBody></Table></Paper>}
    </Box>
  );
}

export function UserManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const query = useQuery({ queryKey: ["admin", "users"], queryFn: adminApi.users });
  const roleMutation = useMutation({ mutationFn: ({ id, role }: { id: string; role: "user" | "admin" }) => adminApi.updateUserRole(id, role), onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }) });
  const statusMutation = useMutation({ mutationFn: ({ id, status }: { id: string; status: "active" | "banned" }) => adminApi.updateUserStatus(id, status), onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }) });
  const items = (query.data?.items ?? []).filter((item) => !search.trim() || [item.username, item.email, item.role, item.status].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase()));
  return (
    <Box>
      <AdminToolbar search={search} onSearch={setSearch} onRefresh={() => void query.refetch()} />
      <StateBlock loading={query.isLoading} error={query.error} empty={!query.isLoading && items.length === 0} />
      {items.length > 0 && <Paper variant="outlined"><Table size="small"><TableHead><TableRow><TableCell>用户</TableCell><TableCell>角色</TableCell><TableCell>状态</TableCell><TableCell align="right">操作</TableCell></TableRow></TableHead><TableBody>{items.map((item) => <TableRow key={item.id} hover><TableCell><Typography sx={{ fontWeight: 800 }}>{item.username}</Typography><Typography variant="caption" color="text.secondary">{item.email || "无邮箱"}</Typography></TableCell><TableCell><StatusChip status={item.role} /></TableCell><TableCell><StatusChip status={item.status} /></TableCell><TableCell align="right"><Stack direction="row" spacing={1} justifyContent="flex-end"><Button size="small" startIcon={<ShieldRounded />} onClick={() => roleMutation.mutate({ id: item.id, role: item.role === "admin" ? "user" : "admin" })}>{item.role === "admin" ? "设为用户" : "设为管理员"}</Button><Button size="small" color={item.status === "active" ? "error" : "success"} startIcon={<BlockRounded />} onClick={() => statusMutation.mutate({ id: item.id, status: item.status === "active" ? "banned" : "active" })}>{item.status === "active" ? "封禁" : "解禁"}</Button></Stack></TableCell></TableRow>)}</TableBody></Table></Paper>}
    </Box>
  );
}
