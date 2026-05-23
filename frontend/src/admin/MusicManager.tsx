import { Accordion, AccordionDetails, AccordionSummary, Alert, Avatar, Box, Button, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { DeleteOutlineRounded, EditRounded, ExpandMoreRounded, QueueMusicRounded, RefreshRounded } from "@mui/icons-material";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminMusicTrack, adminApi } from "./adminApi";
import { AdminToolbar, EntityDialog, StateBlock, StatusChip } from "./AdminPrimitives";

type MusicForm = { neteaseId: string; title: string; artist: string; cover: string; lyric: string; level: string; sortOrder: number; status: "enabled" | "disabled" };
const emptyForm: MusicForm = { neteaseId: "", title: "", artist: "", cover: "", lyric: "", level: "exhigh", sortOrder: 0, status: "enabled" };
const fromTrack = (item?: AdminMusicTrack): MusicForm => item ? { neteaseId: item.neteaseId, title: item.title, artist: item.artist ?? "", cover: item.cover ?? "", lyric: item.lyric ?? "", level: item.level, sortOrder: item.sortOrder, status: item.status } : emptyForm;
const payload = (form: MusicForm) => ({ neteaseId: form.neteaseId, title: form.title, artist: form.artist || null, cover: form.cover || null, lyric: form.lyric || null, level: form.level, sortOrder: form.sortOrder, status: form.status });
type MusicCollection = { key: string; name: string; cover: string | null; tracks: AdminMusicTrack[] };

function groupTracks(items: AdminMusicTrack[]): MusicCollection[] {
  const groups = new Map<string, MusicCollection>();
  for (const item of items) {
    const key = item.playlistId || "manual";
    const current = groups.get(key);
    if (current) {
      current.tracks.push(item);
    } else {
      groups.set(key, {
        key,
        name: item.playlistName || "单曲收藏",
        cover: item.playlistCover || item.cover,
        tracks: [item],
      });
    }
  }
  return Array.from(groups.values());
}

export function MusicManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminMusicTrack | null>(null);
  const [form, setForm] = useState<MusicForm>(emptyForm);
  const [playlist, setPlaylist] = useState("");
  const [playlistLevel, setPlaylistLevel] = useState("exhigh");
  const [playlistStatus, setPlaylistStatus] = useState<MusicForm["status"]>("enabled");
  const [importResult, setImportResult] = useState<string | null>(null);
  const query = useQuery({ queryKey: ["admin", "music-tracks"], queryFn: adminApi.music });
  const createMutation = useMutation({ mutationFn: adminApi.createMusic, onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["admin", "music-tracks"] }) });
  const updateMutation = useMutation({ mutationFn: ({ id, body }: { id: string; body: ReturnType<typeof payload> }) => adminApi.updateMusic(id, body), onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["admin", "music-tracks"] }) });
  const importMutation = useMutation({
    mutationFn: adminApi.importMusicPlaylist,
    onSuccess: async (result) => {
      setImportResult(`歌单 ${result.playlistId}：导入 ${result.imported} 首，跳过 ${result.skipped} 首`);
      await queryClient.invalidateQueries({ queryKey: ["admin", "music-tracks"] });
    },
  });
  const refreshMutation = useMutation({ mutationFn: adminApi.refreshMusic, onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["admin", "music-tracks"] }) });
  const deleteMutation = useMutation({ mutationFn: adminApi.deleteMusic, onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["admin", "music-tracks"] }) });
  const items = query.data?.items ?? [];
  const filtered = useMemo(() => items.filter((item) => !search.trim() || [item.title, item.artist, item.neteaseId].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase())), [items, search]);
  const collections = useMemo(() => groupTracks(filtered), [filtered]);
  const start = (item?: AdminMusicTrack) => { setEditing(item ?? null); setForm(fromTrack(item)); setOpen(true); };
  const save = () => { const body = payload(form); const options = { onSuccess: () => setOpen(false) }; editing ? updateMutation.mutate({ id: editing.id, body }, options) : createMutation.mutate(body, options); };
  const importPlaylist = () => {
    setImportResult(null);
    importMutation.mutate({ playlist, level: playlistLevel, status: playlistStatus });
  };
  return (
    <Box>
      <AdminToolbar search={search} onSearch={setSearch} onRefresh={() => void query.refetch()} onCreate={() => start()} createLabel="添加歌曲" />
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: "column", lg: "row" }} spacing={2} alignItems={{ xs: "stretch", lg: "center" }}>
          <TextField
            fullWidth
            size="small"
            label="网易云歌单 ID 或链接"
            value={playlist}
            onChange={(e) => setPlaylist(e.target.value)}
          />
          <TextField size="small" label="音质" value={playlistLevel} onChange={(e) => setPlaylistLevel(e.target.value)} sx={{ minWidth: 120 }} />
          <TextField size="small" select label="状态" value={playlistStatus} onChange={(e) => setPlaylistStatus(e.target.value as MusicForm["status"])} sx={{ minWidth: 120 }}>
            <MenuItem value="enabled">启用</MenuItem>
            <MenuItem value="disabled">禁用</MenuItem>
          </TextField>
          <Button
            variant="contained"
            startIcon={<QueueMusicRounded />}
            disabled={!playlist.trim() || importMutation.isPending}
            onClick={importPlaylist}
            sx={{ borderRadius: 2, minWidth: 120 }}
          >
            {importMutation.isPending ? "导入中" : "导入歌单"}
          </Button>
        </Stack>
        {(importResult || importMutation.error) && (
          <Alert severity={importMutation.error ? "error" : "success"} sx={{ mt: 2, borderRadius: 2 }}>
            {importMutation.error instanceof Error ? importMutation.error.message : importResult}
          </Alert>
        )}
      </Paper>
      <StateBlock loading={query.isLoading} error={query.error} empty={!query.isLoading && filtered.length === 0} />
      {collections.length > 0 && (
        <Stack spacing={2}>
          {collections.map((collection) => (
            <Accordion key={collection.key} disableGutters sx={{ border: 1, borderColor: "divider", borderRadius: 2, overflow: "hidden", "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0, width: "100%" }}>
                  <Avatar src={collection.cover ?? undefined} variant="rounded" sx={{ width: 52, height: 52 }} />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontWeight: 900 }} noWrap>{collection.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {collection.tracks.length} 首歌{collection.key !== "manual" ? ` · 歌单 ${collection.key}` : ""}
                    </Typography>
                  </Box>
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0, borderTop: 1, borderColor: "divider" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>歌曲</TableCell>
                      <TableCell>缓存</TableCell>
                      <TableCell>排序</TableCell>
                      <TableCell>状态</TableCell>
                      <TableCell align="right">操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {collection.tracks.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Avatar src={item.cover ?? undefined} variant="rounded" />
                            <Box>
                              <Typography sx={{ fontWeight: 800 }}>{item.title}</Typography>
                              <Typography variant="caption" color="text.secondary">ID {item.neteaseId} · {item.artist || "未知歌手"}</Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>{item.cachedUrl ? "已缓存" : "未缓存"}{item.cacheExpiresAt ? ` · ${new Date(item.cacheExpiresAt).toLocaleString("zh-CN")}` : ""}</TableCell>
                        <TableCell>{item.sortOrder}</TableCell>
                        <TableCell><StatusChip status={item.status} /></TableCell>
                        <TableCell align="right">
                          <Button size="small" startIcon={<EditRounded />} onClick={() => start(item)}>编辑</Button>
                          <Button size="small" startIcon={<RefreshRounded />} onClick={() => refreshMutation.mutate(item.id)}>刷新</Button>
                          <Button size="small" color="error" startIcon={<DeleteOutlineRounded />} onClick={() => deleteMutation.mutate(item.id)}>删除</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      )}
      <EntityDialog open={open} title={editing ? "编辑歌曲" : "添加歌曲"} saving={createMutation.isPending || updateMutation.isPending} onClose={() => setOpen(false)} onSave={save}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}><TextField fullWidth label="网易云歌曲 ID" value={form.neteaseId} onChange={(e) => setForm({ ...form, neteaseId: e.target.value })} /><TextField fullWidth label="标题（可自动获取）" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /><TextField fullWidth label="歌手" value={form.artist} onChange={(e) => setForm({ ...form, artist: e.target.value })} /></Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}><TextField fullWidth label="封面 URL" value={form.cover} onChange={(e) => setForm({ ...form, cover: e.target.value })} /><TextField label="音质" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} /><TextField type="number" label="排序" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} /><TextField select label="状态" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as MusicForm["status"] })}><MenuItem value="enabled">启用</MenuItem><MenuItem value="disabled">禁用</MenuItem></TextField></Stack>
          <TextField label="歌词" multiline minRows={4} value={form.lyric} onChange={(e) => setForm({ ...form, lyric: e.target.value })} />
        </Stack>
      </EntityDialog>
    </Box>
  );
}
