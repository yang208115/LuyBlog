import { Box, Button, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { DeleteOutlineRounded, EditRounded } from "@mui/icons-material";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminPageItem, adminApi } from "./adminApi";
import { AdminToolbar, EntityDialog, MarkdownEditor, PublishStatusField, StateBlock, StatusChip } from "./AdminPrimitives";

type PageForm = { slug: string; title: string; contentMd: string; status: "draft" | "published" };
const emptyForm: PageForm = { slug: "", title: "", contentMd: "", status: "published" };
const fromPage = (item?: AdminPageItem): PageForm => item ? { slug: item.slug, title: item.title, contentMd: item.contentMd, status: item.status } : emptyForm;

export function PageManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminPageItem | null>(null);
  const [form, setForm] = useState<PageForm>(emptyForm);
  const query = useQuery({ queryKey: ["admin", "pages"], queryFn: adminApi.pages });
  const createMutation = useMutation({ mutationFn: adminApi.createPage, onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["admin", "pages"] }) });
  const updateMutation = useMutation({ mutationFn: ({ id, body }: { id: string; body: PageForm }) => adminApi.updatePage(id, body), onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["admin", "pages"] }) });
  const deleteMutation = useMutation({ mutationFn: adminApi.deletePage, onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["admin", "pages"] }) });
  const items = query.data?.items ?? [];
  const filtered = useMemo(() => items.filter((item) => !search.trim() || [item.title, item.slug, item.contentMd].join(" ").toLowerCase().includes(search.toLowerCase())), [items, search]);
  const start = (item?: AdminPageItem) => { setEditing(item ?? null); setForm(fromPage(item)); setOpen(true); };
  const save = () => { const options = { onSuccess: () => setOpen(false) }; editing ? updateMutation.mutate({ id: editing.id, body: form }, options) : createMutation.mutate(form, options); };
  return (
    <Box>
      <AdminToolbar search={search} onSearch={setSearch} onRefresh={() => void query.refetch()} onCreate={() => start()} createLabel="新建页面" />
      <StateBlock loading={query.isLoading} error={query.error} empty={!query.isLoading && filtered.length === 0} />
      {filtered.length > 0 && <Paper variant="outlined"><Table size="small"><TableHead><TableRow><TableCell>页面</TableCell><TableCell>状态</TableCell><TableCell>更新</TableCell><TableCell align="right">操作</TableCell></TableRow></TableHead><TableBody>{filtered.map((item) => <TableRow key={item.id} hover><TableCell><Typography sx={{ fontWeight: 800 }}>{item.title}</Typography><Typography variant="caption" color="text.secondary">/{item.slug}</Typography></TableCell><TableCell><StatusChip status={item.status} /></TableCell><TableCell>{new Date(item.updatedAt).toLocaleString("zh-CN")}</TableCell><TableCell align="right"><Button size="small" startIcon={<EditRounded />} onClick={() => start(item)}>编辑</Button><Button size="small" color="error" startIcon={<DeleteOutlineRounded />} onClick={() => deleteMutation.mutate(item.id)}>删除</Button></TableCell></TableRow>)}</TableBody></Table></Paper>}
      <EntityDialog open={open} title={editing ? "编辑页面" : "新建页面"} saving={createMutation.isPending || updateMutation.isPending} onClose={() => setOpen(false)} onSave={save}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField fullWidth label="标题" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} sx={{ flex: 1 }} />
            <TextField fullWidth label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} sx={{ flex: 1 }} />
            <PublishStatusField value={form.status} onChange={(status) => setForm({ ...form, status })} sx={{ flex: { md: "0 0 150px" } }} />
          </Stack>
          <MarkdownEditor label="Markdown 正文" value={form.contentMd} onChange={(value) => setForm({ ...form, contentMd: value })} />
        </Stack>
      </EntityDialog>
    </Box>
  );
}
