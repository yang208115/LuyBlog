import { Box, IconButton, Paper, Stack, Typography } from "@mui/material";
import { PauseRounded, PlayArrowRounded, RefreshRounded, SkipNextRounded } from "@mui/icons-material";
import { alpha, useTheme } from "@mui/material/styles";
import { useLocation, Link as RouterLink } from "react-router-dom";
import { useMusic } from "../context/MusicProvider";
import { parseLrc } from "./LyricsView";

export function FloatingPlayer() {
  const location = useLocation();
  const music = useMusic();
  const theme = useTheme();
  if (location.pathname === "/music" || location.pathname.startsWith("/admin")) return null;

  const lyricLines = parseLrc(music.current.lyric);
  const activeLyric =
    lyricLines.reduce((active, line) => (line.time <= music.currentTime + 0.25 ? line : active), lyricLines[0])?.text ||
    music.current.lyric ||
    music.current.artist ||
    "暂无歌词";

  return (
    <Paper
      elevation={0}
      sx={{
        position: "fixed",
        left: { xs: 16, md: 36 },
        bottom: { xs: 76, md: 96 },
        zIndex: 1200,
        borderRadius: 3,
        p: { xs: 1.15, sm: 1.3 },
        width: { xs: 136, sm: 176 },
        height: { xs: 136, sm: 176 },
        backdropFilter: "blur(18px) saturate(180%)",
        WebkitBackdropFilter: "blur(18px) saturate(180%)",
        bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.48 : 0.62),
        border: `1px solid ${alpha(theme.palette.common.white, theme.palette.mode === "dark" ? 0.16 : 0.46)}`,
        boxShadow: "0 18px 48px rgba(15,23,42,0.32)",
        overflow: "hidden",
      }}
    >
      <Stack spacing={{ xs: 0.85, sm: 1 }} sx={{ height: "100%" }}>
        <Stack direction="row" spacing={0.9} alignItems="center" sx={{ minHeight: { xs: 50, sm: 56 } }}>
          {music.current.cover ? (
            <Box
              component="img"
              src={music.current.cover}
              alt={music.current.title}
              sx={{
                width: { xs: 46, sm: 54 },
                height: { xs: 46, sm: 54 },
                borderRadius: 2,
                objectFit: "cover",
                flexShrink: 0,
                animation: music.playing ? "luy-cover-pulse 2.8s ease-in-out infinite" : "none",
                "@keyframes luy-cover-pulse": {
                  "0%, 100%": { transform: "scale(1)" },
                  "50%": { transform: "scale(1.04)" },
                },
              }}
            />
          ) : (
            <Box
              sx={{
                width: { xs: 46, sm: 54 },
                height: { xs: 46, sm: 54 },
                borderRadius: 2,
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                fontWeight: 900,
                color: "primary.main",
                background: alpha(theme.palette.primary.main, 0.12),
              }}
            >
              ♪
            </Box>
          )}
          <Box component={RouterLink} to="/music" sx={{ minWidth: 0, color: "inherit", textDecoration: "none" }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 900, lineHeight: 1.25 }}>
              {music.current.title}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", mt: 0.3 }}>
              {music.current.artist || "Cloud Music"}
            </Typography>
          </Box>
        </Stack>

        <Box
          component={RouterLink}
          to="/music"
          sx={{
            minHeight: { xs: 34, sm: 38 },
            color: "inherit",
            textDecoration: "none",
            borderRadius: 2,
            px: 0.9,
            py: { xs: 0.6, sm: 0.75 },
            bgcolor: alpha(theme.palette.common.black, theme.palette.mode === "dark" ? 0.2 : 0.06),
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: 1.45,
            }}
          >
            {music.error || activeLyric}
          </Typography>
        </Box>

        <Stack direction="row" spacing={0.7} alignItems="center" justifyContent="space-between" sx={{ mt: "auto" }}>
          <IconButton
            size="small"
            onClick={music.toggle}
            aria-label={music.playing ? "暂停" : "播放"}
            sx={{ bgcolor: "primary.main", color: "white", "&:hover": { bgcolor: "primary.dark" } }}
          >
            {music.playing ? <PauseRounded /> : <PlayArrowRounded />}
          </IconButton>
          <Typography variant="caption" noWrap sx={{ flex: 1, fontWeight: 800, textAlign: "center" }}>
            {music.current.title}
          </Typography>
          <IconButton size="small" onClick={music.next} aria-label="下一首">
            <SkipNextRounded />
          </IconButton>
          <IconButton size="small" onClick={() => void music.refreshCurrent()} aria-label="刷新歌曲链接">
            <RefreshRounded />
          </IconButton>
        </Stack>
      </Stack>
    </Paper>
  );
}
