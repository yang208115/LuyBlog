import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { ExpandMoreRounded, PauseRounded, PlayArrowRounded, SkipNextRounded } from "@mui/icons-material";
import { glassPanelSx } from "../components/Glass";
import { PublicPageLayout } from "../components/Layout";
import { LyricsView } from "../components/LyricsView";
import { Track, useMusic } from "../context/MusicProvider";
import { ModernLoader } from "../components/Loading";
import { useEffect, useMemo, useState } from "react";

type MusicCollection = { key: string; name: string; cover: string | null; tracks: Array<{ track: Track; index: number }> };

function groupTracks(tracks: Track[]): MusicCollection[] {
  const groups = new Map<string, MusicCollection>();
  tracks.forEach((track, index) => {
    const key = track.playlistId || "manual";
    const current = groups.get(key);
    if (current) {
      current.tracks.push({ track, index });
    } else {
      groups.set(key, {
        key,
        name: track.playlistName || "单曲收藏",
        cover: track.playlistCover || track.cover,
        tracks: [{ track, index }],
      });
    }
  });
  return Array.from(groups.values());
}

export function MusicPage() {
  const music = useMusic();
  const collections = useMemo(() => groupTracks(music.tracks), [music.tracks]);
  const currentCollectionKey = collections.find((collection) => collection.tracks.some(({ index }) => index === music.index))?.key ?? null;
  const [expandedCollection, setExpandedCollection] = useState<string | null>(null);

  useEffect(() => {
    if (currentCollectionKey) setExpandedCollection(currentCollectionKey);
  }, [currentCollectionKey]);

  return (
    <PublicPageLayout maxWidth="md" title="音乐" subtitle="按歌单集合收纳歌曲，后端缓存播放 URL，播放失败会自动刷新。" spacing={2.4}>
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
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Stack spacing={1.5}>
        {collections.map((collection) => (
          <Accordion
            key={collection.key}
            expanded={expandedCollection === collection.key}
            onChange={(_, expanded) => setExpandedCollection(expanded ? collection.key : null)}
            disableGutters
            sx={{ ...glassPanelSx, overflow: "hidden", "&:before": { display: "none" } }}
          >
            <AccordionSummary expandIcon={<ExpandMoreRounded />}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0, width: "100%" }}>
                {collection.cover && <Box component="img" src={collection.cover} alt={collection.name} sx={{ width: 56, height: 56, objectFit: "cover", borderRadius: 1.5, flexShrink: 0 }} />}
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontWeight: 900 }} noWrap>{collection.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{collection.tracks.length} 首歌</Typography>
                </Box>
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <Stack spacing={0.8}>
                {collection.tracks.map(({ track, index }) => (
                  <Box key={track.id} onClick={() => music.select(index)} sx={{ p: 1, borderRadius: 1.5, cursor: "pointer", bgcolor: index === music.index ? "action.selected" : "transparent", "&:hover": { bgcolor: "action.hover" } }}>
                    <Stack direction="row" spacing={1.2} alignItems="center">
                      {track.cover && <Box component="img" src={track.cover} alt={track.title} sx={{ width: 42, height: 42, objectFit: "cover", borderRadius: 1.2, flexShrink: 0 }} />}
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 800 }} noWrap>{track.title}</Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {track.artist || "未知歌手"} · {track.neteaseId || "未配置 ID"}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        ))}
      </Stack>
    </PublicPageLayout>
  );
}
