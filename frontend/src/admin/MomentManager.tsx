import { Box, Button, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { DeleteOutlineRounded, EditRounded } from "@mui/icons-material";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminMoment, adminApi, joinLines, splitLines } from "./adminApi";
import { AdminToolbar, EntityDialog, MarkdownEditor, PublishStatusField, StateBlock, StatusChip } from "./AdminPrimitives";

type MomentForm = { slug: string; contentMd: string; imagesText: string; status: "draft" | "published" };
const emptyForm: MomentForm = { slug: "", contentMd: "", imagesText: "", status: "published" };

function fromMoment(item?: AdminMoment): MomentForm {
  return item ? { slug: item.slug, contentMd: item.contentMd, imagesText: joinLines(item.images), status: item.status } : emptyForm;
}

function payload(form: MomentForm) {
  return { slug: form.slug, contentMd: form.contentMd, location: null, images: splitLines(form.imagesText), status: form.status };
}

export function MomentManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminMoment | null>(null);
  const [form, setForm] = useState<MomentForm>(emptyForm);
  const query = useQuery({ queryKey: ["admin", "moments"], queryFn: adminApi.moments });
  const createMutation = useMutation({ mutationFn: adminApi.createMoment, onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["admin", "moments"] }) });
  const updateMutation = useMutation({ mutationFn: ({ id, body }: { id: string; body: ReturnType<typeof payload> }) => adminApi.updateMoment(id, body), onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["admin", "moments"] }) });
  const deleteMutation = useMutation({ mutationFn: adminApi.deleteMoment, onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["admin", "moments"] }) });
  const items = query.data?.items ?? [];
  const filtered = useMemo(() => items.filter((item) => !search.trim() || [item.slug, item.contentMd].join(" ").toLowerCase().includes(search.toLowerCase())), [items, search]);
  const start = (item?: AdminMoment) => {
    setEditing(item ?? null);
    setForm(fromMoment(item));
    setOpen(true);
  };
  const save = () => {
    const body = payload(form);
    const options = { onSuccess: () => setOpen(false) };
    if (editing) updateMutation.mutate({ id: editing.id, body }, options);
    else createMutation.mutate(body, options);
  };
  return (
    <Box>
      <AdminToolbar search={search} onSearch={setSearch} onRefresh={() => void query.refetch()} onCreate={() => start()} createLabel="新建瞬间" />
      <StateBlock loading={query.isLoading} error={query.error} empty={!query.isLoading && filtered.length === 0} />
      {filtered.length > 0 && (
        <Paper variant="outlined">
          <Table size="small">
            <TableHead><TableRow><TableCell>内容</TableCell><TableCell>图片</TableCell><TableCell>状态</TableCell><TableCell>更新</TableCell><TableCell align="right">操作</TableCell></TableRow></TableHead>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell><Typography sx={{ fontWeight: 800 }}>{item.slug}</Typography><Typography variant="caption" color="text.secondary">{item.contentMd.slice(0, 80)}</Typography></TableCell>
                  <TableCell>{item.images.length}</TableCell>
                  <TableCell><StatusChip status={item.status} /></TableCell>
                  <TableCell>{new Date(item.updatedAt).toLocaleString("zh-CN")}</TableCell>
                  <TableCell align="right"><Button size="small" startIcon={<EditRounded />} onClick={() => start(item)}>编辑</Button><Button size="small" color="error" startIcon={<DeleteOutlineRounded />} onClick={() => deleteMutation.mutate(item.id)}>删除</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
      <EntityDialog open={open} title={editing ? "编辑瞬间" : "新建瞬间"} saving={createMutation.isPending || updateMutation.isPending} onClose={() => setOpen(false)} onSave={save}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField fullWidth label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} sx={{ flex: 1 }} />
            <PublishStatusField value={form.status} onChange={(status) => setForm({ ...form, status })} sx={{ flex: { md: "0 0 150px" } }} />
          </Stack>
          <TextField fullWidth label="图片 URL（逗号或换行分隔）" multiline minRows={3} value={form.imagesText} onChange={(e) => setForm({ ...form, imagesText: e.target.value })} />
          <MarkdownEditor label="Markdown 内容" value={form.contentMd} onChange={(value) => setForm({ ...form, contentMd: value })} minRows={6} />
        </Stack>
      </EntityDialog>
    </Box>
  );
}
