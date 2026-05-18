import { Avatar, Box, Button, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { DeleteOutlineRounded, EditRounded } from "@mui/icons-material";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminFriendLink, adminApi } from "./adminApi";
import { AdminToolbar, EntityDialog, PublishStatusField, StateBlock, StatusChip } from "./AdminPrimitives";

type LinkForm = { name: string; description: string; url: string; avatarUrl: string; sortOrder: number; status: "draft" | "published" };
const emptyForm: LinkForm = { name: "", description: "", url: "", avatarUrl: "", sortOrder: 0, status: "published" };
const fromLink = (item?: AdminFriendLink): LinkForm => item ? { name: item.name, description: item.description ?? "", url: item.url, avatarUrl: item.avatarUrl ?? "", sortOrder: item.sortOrder, status: item.status } : emptyForm;
const payload = (form: LinkForm) => ({ name: form.name, description: form.description || null, url: form.url, avatarUrl: form.avatarUrl || null, sortOrder: form.sortOrder, status: form.status });

export function FriendLinkManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminFriendLink | null>(null);
  const [form, setForm] = useState<LinkForm>(emptyForm);
  const query = useQuery({ queryKey: ["admin", "friend-links"], queryFn: adminApi.friendLinks });
  const createMutation = useMutation({ mutationFn: adminApi.createFriendLink, onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["admin", "friend-links"] }) });
  const updateMutation = useMutation({ mutationFn: ({ id, body }: { id: string; body: ReturnType<typeof payload> }) => adminApi.updateFriendLink(id, body), onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["admin", "friend-links"] }) });
  const deleteMutation = useMutation({ mutationFn: adminApi.deleteFriendLink, onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["admin", "friend-links"] }) });
  const items = query.data?.items ?? [];
  const filtered = useMemo(() => items.filter((item) => !search.trim() || [item.name, item.description, item.url].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase())), [items, search]);
  const start = (item?: AdminFriendLink) => { setEditing(item ?? null); setForm(fromLink(item)); setOpen(true); };
  const save = () => { const body = payload(form); const options = { onSuccess: () => setOpen(false) }; editing ? updateMutation.mutate({ id: editing.id, body }, options) : createMutation.mutate(body, options); };
  return (
    <Box>
      <AdminToolbar search={search} onSearch={setSearch} onRefresh={() => void query.refetch()} onCreate={() => start()} createLabel="新建友链" />
      <StateBlock loading={query.isLoading} error={query.error} empty={!query.isLoading && filtered.length === 0} />
      {filtered.length > 0 && <Paper variant="outlined"><Table size="small"><TableHead><TableRow><TableCell>站点</TableCell><TableCell>链接</TableCell><TableCell>排序</TableCell><TableCell>状态</TableCell><TableCell align="right">操作</TableCell></TableRow></TableHead><TableBody>{filtered.map((item) => <TableRow key={item.id} hover><TableCell><Stack direction="row" spacing={1} alignItems="center"><Avatar src={item.avatarUrl ?? undefined}>{item.name.slice(0, 1)}</Avatar><Box><Typography sx={{ fontWeight: 800 }}>{item.name}</Typography><Typography variant="caption" color="text.secondary">{item.description}</Typography></Box></Stack></TableCell><TableCell>{item.url}</TableCell><TableCell>{item.sortOrder}</TableCell><TableCell><StatusChip status={item.status} /></TableCell><TableCell align="right"><Button size="small" startIcon={<EditRounded />} onClick={() => start(item)}>编辑</Button><Button size="small" color="error" startIcon={<DeleteOutlineRounded />} onClick={() => deleteMutation.mutate(item.id)}>删除</Button></TableCell></TableRow>)}</TableBody></Table></Paper>}
      <EntityDialog open={open} title={editing ? "编辑友链" : "新建友链"} saving={createMutation.isPending || updateMutation.isPending} onClose={() => setOpen(false)} onSave={save}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField fullWidth label="名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} sx={{ flex: 1 }} />
            <TextField fullWidth type="number" label="排序" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} sx={{ flex: { md: "0 0 120px" } }} />
            <PublishStatusField value={form.status} onChange={(status) => setForm({ ...form, status })} sx={{ flex: { md: "0 0 150px" } }} />
          </Stack>
          <TextField fullWidth label="简介" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <TextField fullWidth label="链接 URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
          <TextField fullWidth label="头像 URL" value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} />
        </Stack>
      </EntityDialog>
    </Box>
  );
}
