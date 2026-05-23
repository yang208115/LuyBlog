import { Alert, Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { PauseRounded, PlayArrowRounded, RefreshRounded, SkipNextRounded } from "@mui/icons-material";
import { glassPanelSx } from "../components/Glass";
import { PublicPageLayout } from "../components/Layout";
import { LyricsView } from "../components/LyricsView";
import { useMusic } from "../context/MusicProvider";
import { ModernLoader } from "../components/Loading";

export function MusicPage() {
  const music = useMusic();
  return (
    <PublicPageLayout maxWidth="md" title="音乐" subtitle="后台配置网易云歌曲 ID，后端缓存播放 URL，播放失败会自动刷新。" spacing={2.4}>
      <Card variant="outlined" sx={glassPanelSx}>
        <CardContent sx={{ p: { xs: 2.2, md: 3 } }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
              {music.current.cover && (
                <Box component="img" src={music.current.cover} alt={music.current.title} sx={{ width: 96, height: 96, objectFit: "cover", borderRadius: 2 }} />
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                  {music.current.title}
                </Typography>
                <Typography color="text.secondary">
                  {music.current.artist || "未知歌手"} {music.current.neteaseId ? `· ID ${music.current.neteaseId}` : ""}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }} useFlexGap flexWrap="wrap">
                  <Chip size="small" label={music.current.level} />
                  <Chip size="small" label={music.current.url ? "URL 已缓存" : "URL 未缓存"} color={music.current.url ? "success" : "warning"} />
                </Stack>
              </Box>
            </Stack>

            {music.error && <Alert severity="warning">{music.error}</Alert>}
            {music.loading && <ModernLoader size={24} />}
            <LyricsView lyric={music.current.lyric} currentTime={music.currentTime} onSeek={music.seek} />

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button variant="contained" startIcon={music.playing ? <PauseRounded /> : <PlayArrowRounded />} onClick={music.toggle} sx={{ borderRadius: 999 }}>
                {music.playing ? "暂停" : "播放"}
              </Button>
              <Button startIcon={<SkipNextRounded />} onClick={music.next} sx={{ borderRadius: 999 }}>
                下一首
              </Button>
              <Button startIcon={<RefreshRounded />} onClick={() => void music.refreshCurrent()} sx={{ borderRadius: 999 }}>
                刷新 URL
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Stack spacing={1}>
        {music.tracks.map((track, index) => (
          <Card key={track.id} variant={index === music.index ? "elevation" : "outlined"} onClick={() => music.select(index)} sx={{ ...glassPanelSx, cursor: "pointer" }}>
            <CardContent>
              <Stack direction="row" spacing={1.4} alignItems="center">
                {track.cover && <Box component="img" src={track.cover} alt={track.title} sx={{ width: 48, height: 48, objectFit: "cover", borderRadius: 1.5, flexShrink: 0 }} />}
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800 }} noWrap>{track.title}</Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {track.artist || "未知歌手"} · {track.neteaseId || "未配置 ID"}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </PublicPageLayout>
  );
}
