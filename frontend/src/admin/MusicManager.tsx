import {
  Alert,
  Avatar,
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { DeleteOutlineRounded, EditRounded } from "@mui/icons-material";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminMusicTrack, adminApi } from "./adminApi";
import { AdminToolbar, EntityDialog, StateBlock, StatusChip } from "./AdminPrimitives";

type MusicForm = {
  url: string;
  title: string;
  artist: string;
  album: string;
  cover: string;
  lyric: string;
  sortOrder: number;
  status: "enabled" | "disabled";
};

const emptyForm: MusicForm = {
  url: "",
  title: "",
  artist: "",
  album: "",
  cover: "",
  lyric: "",
  sortOrder: 0,
  status: "enabled",
};

const normalizeLyric = (value: string) => value.replace(/\\r\\n|\\n|\\r/g, "\n");

const fromTrack = (item?: AdminMusicTrack): MusicForm =>
  item
    ? {
        url: item.url,
        title: item.title,
        artist: item.artist ?? "",
        album: item.album ?? "",
        cover: item.cover ?? "",
        lyric: normalizeLyric(item.lyric ?? ""),
        sortOrder: item.sortOrder,
        status: item.status,
      }
    : emptyForm;

const payload = (form: MusicForm) => ({
  url: form.url.trim(),
  title: form.title.trim(),
  artist: form.artist.trim() || null,
  album: form.album.trim() || null,
  cover: form.cover.trim() || null,
  lyric: normalizeLyric(form.lyric).trim() || null,
  sortOrder: form.sortOrder,
  status: form.status,
});

export function MusicManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminMusicTrack | null>(null);
  const [form, setForm] = useState<MusicForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const query = useQuery({ queryKey: ["admin", "music-tracks"], queryFn: adminApi.music });
  const createMutation = useMutation({
    mutationFn: adminApi.createMusic,
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["admin", "music-tracks"] }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: ReturnType<typeof payload> }) => adminApi.updateMusic(id, body),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["admin", "music-tracks"] }),
  });
  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteMusic,
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["admin", "music-tracks"] }),
  });
  const items = query.data?.items ?? [];
  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          !search.trim() ||
          [item.title, item.artist, item.album, item.url]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [items, search],
  );

  const start = (item?: AdminMusicTrack) => {
    setEditing(item ?? null);
    setForm(fromTrack(item));
    setFormError(null);
    setOpen(true);
  };

  const save = () => {
    if (!form.url.trim() || !form.title.trim()) {
      setFormError("请填写音乐链接和歌曲标题");
      return;
    }
    setFormError(null);
    const body = payload(form);
    const options = { onSuccess: () => setOpen(false) };
    editing ? updateMutation.mutate({ id: editing.id, body }, options) : createMutation.mutate(body, options);
  };

  const mutationError = createMutation.error || updateMutation.error;

  return (
    <Box>
      <AdminToolbar
        search={search}
        onSearch={setSearch}
        onRefresh={() => void query.refetch()}
        onCreate={() => start()}
        createLabel="添加歌曲"
      />
      <StateBlock loading={query.isLoading} error={query.error} empty={!query.isLoading && filtered.length === 0} />
      {filtered.length > 0 && (
        <Paper variant="outlined" sx={{ overflow: "hidden" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>歌曲</TableCell>
                <TableCell>音乐链接</TableCell>
                <TableCell>歌词</TableCell>
                <TableCell>排序</TableCell>
                <TableCell>状态</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar src={item.cover ?? undefined} variant="rounded" />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 800 }} noWrap>
                          {item.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {item.artist || "未知歌手"}
                          {item.album ? ` · ${item.album}` : ""}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 260 }}>
                    <Typography variant="body2" noWrap title={item.url}>
                      {item.url}
                    </Typography>
                  </TableCell>
                  <TableCell>{item.lyric ? "已填写" : "未填写"}</TableCell>
                  <TableCell>{item.sortOrder}</TableCell>
                  <TableCell>
                    <StatusChip status={item.status} />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" startIcon={<EditRounded />} onClick={() => start(item)}>
                      编辑
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteOutlineRounded />}
                      onClick={() => deleteMutation.mutate(item.id)}
                    >
                      删除
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
      <EntityDialog
        open={open}
        title={editing ? "编辑歌曲" : "添加歌曲"}
        saving={createMutation.isPending || updateMutation.isPending}
        onClose={() => setOpen(false)}
        onSave={save}
      >
        <Stack spacing={2}>
          {(formError || mutationError) && (
            <Alert severity="error">
              {formError || (mutationError instanceof Error ? mutationError.message : "保存失败")}
            </Alert>
          )}
          <TextField
            required
            fullWidth
            label="音乐链接"
            placeholder="https://example.com/music/song.mp3"
            value={form.url}
            onChange={(event) => setForm({ ...form, url: event.target.value })}
            helperText="填写浏览器可直接播放的音频文件 URL"
          />
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              required
              fullWidth
              label="歌曲标题"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />
            <TextField
              fullWidth
              label="歌手"
              value={form.artist}
              onChange={(event) => setForm({ ...form, artist: event.target.value })}
            />
            <TextField
              fullWidth
              label="专辑"
              value={form.album}
              onChange={(event) => setForm({ ...form, album: event.target.value })}
            />
          </Stack>
          <TextField
            fullWidth
            label="封面 URL"
            value={form.cover}
            onChange={(event) => setForm({ ...form, cover: event.target.value })}
          />
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              type="number"
              label="排序"
              value={form.sortOrder}
              onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })}
            />
            <TextField
              select
              label="状态"
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value as MusicForm["status"] })}
            >
              <MenuItem value="enabled">启用</MenuItem>
              <MenuItem value="disabled">禁用</MenuItem>
            </TextField>
          </Stack>
          <TextField
            label="歌词（手动填写）"
            multiline
            minRows={8}
            value={form.lyric}
            onChange={(event) => setForm({ ...form, lyric: normalizeLyric(event.target.value) })}
            helperText="支持普通歌词；如需随播放进度滚动，请填写 LRC 时间轴格式，例如 [00:12.00]第一句"
          />
        </Stack>
      </EntityDialog>
    </Box>
  );
}
