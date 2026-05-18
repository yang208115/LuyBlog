import { Box, Button, Chip, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { DeleteOutlineRounded, EditRounded } from "@mui/icons-material";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminProject, adminApi, joinLines, splitLines } from "./adminApi";
import { AdminToolbar, EntityDialog, PublishStatusField, StateBlock, StatusChip } from "./AdminPrimitives";

type ProjectForm = { name: string; description: string; icon: string; githubUrl: string; tagsText: string; sortOrder: number; status: "draft" | "published" };
const emptyForm: ProjectForm = { name: "", description: "", icon: "", githubUrl: "", tagsText: "", sortOrder: 0, status: "published" };
const fromProject = (item?: AdminProject): ProjectForm => item ? { name: item.name, description: item.description ?? "", icon: item.icon ?? "", githubUrl: item.githubUrl ?? "", tagsText: joinLines(item.tags), sortOrder: item.sortOrder, status: item.status } : emptyForm;
const payload = (form: ProjectForm) => ({ name: form.name, description: form.description || null, icon: form.icon || null, githubUrl: form.githubUrl || null, tags: splitLines(form.tagsText), sortOrder: form.sortOrder, status: form.status });

export function ProjectManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProject | null>(null);
  const [form, setForm] = useState<ProjectForm>(emptyForm);
  const query = useQuery({ queryKey: ["admin", "projects"], queryFn: adminApi.projects });
  const createMutation = useMutation({ mutationFn: adminApi.createProject, onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["admin", "projects"] }) });
  const updateMutation = useMutation({ mutationFn: ({ id, body }: { id: string; body: ReturnType<typeof payload> }) => adminApi.updateProject(id, body), onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["admin", "projects"] }) });
  const deleteMutation = useMutation({ mutationFn: adminApi.deleteProject, onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["admin", "projects"] }) });
  const items = query.data?.items ?? [];
  const filtered = useMemo(() => items.filter((item) => !search.trim() || [item.name, item.description, item.githubUrl, ...(item.tags ?? [])].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase())), [items, search]);
  const start = (item?: AdminProject) => { setEditing(item ?? null); setForm(fromProject(item)); setOpen(true); };
  const save = () => { const body = payload(form); const options = { onSuccess: () => setOpen(false) }; editing ? updateMutation.mutate({ id: editing.id, body }, options) : createMutation.mutate(body, options); };
  return (
    <Box>
      <AdminToolbar search={search} onSearch={setSearch} onRefresh={() => void query.refetch()} onCreate={() => start()} createLabel="新建项目" />
      <StateBlock loading={query.isLoading} error={query.error} empty={!query.isLoading && filtered.length === 0} />
      {filtered.length > 0 && <Paper variant="outlined"><Table size="small"><TableHead><TableRow><TableCell>项目</TableCell><TableCell>标签</TableCell><TableCell>排序</TableCell><TableCell>状态</TableCell><TableCell align="right">操作</TableCell></TableRow></TableHead><TableBody>{filtered.map((item) => <TableRow key={item.id} hover><TableCell><Typography sx={{ fontWeight: 800 }}>{item.icon ? `${item.icon} ` : ""}{item.name}</Typography><Typography variant="caption" color="text.secondary">{item.description}</Typography></TableCell><TableCell><Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">{item.tags.map((tag) => <Chip key={tag} size="small" label={tag} />)}</Stack></TableCell><TableCell>{item.sortOrder}</TableCell><TableCell><StatusChip status={item.status} /></TableCell><TableCell align="right"><Button size="small" startIcon={<EditRounded />} onClick={() => start(item)}>编辑</Button><Button size="small" color="error" startIcon={<DeleteOutlineRounded />} onClick={() => deleteMutation.mutate(item.id)}>删除</Button></TableCell></TableRow>)}</TableBody></Table></Paper>}
      <EntityDialog open={open} title={editing ? "编辑项目" : "新建项目"} saving={createMutation.isPending || updateMutation.isPending} onClose={() => setOpen(false)} onSave={save}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField fullWidth label="名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} sx={{ flex: 1 }} />
            <TextField fullWidth label="图标" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} sx={{ flex: { md: "0 0 120px" } }} />
            <TextField fullWidth type="number" label="排序" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} sx={{ flex: { md: "0 0 120px" } }} />
          </Stack>
          <TextField fullWidth label="描述" multiline minRows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <TextField fullWidth label="GitHub URL" value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} />
          <TextField fullWidth label="标签（逗号或换行分隔）" multiline minRows={2} value={form.tagsText} onChange={(e) => setForm({ ...form, tagsText: e.target.value })} />
          <PublishStatusField value={form.status} onChange={(status) => setForm({ ...form, status })} />
        </Stack>
      </EntityDialog>
    </Box>
  );
}
