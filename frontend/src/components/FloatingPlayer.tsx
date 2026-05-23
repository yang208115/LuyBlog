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
        borderRadius: 4,
        p: { xs: 1.5, sm: 2 },
        width: { xs: 150, sm: 200 },
        height: { xs: 150, sm: 200 },
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.48 : 0.62),
        border: `1px solid ${alpha(theme.palette.common.white, theme.palette.mode === "dark" ? 0.16 : 0.46)}`,
        boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        {music.current.cover ? (
          <Box
            component="img"
            src={music.current.cover}
            alt={music.current.title}
            sx={{
              width: { xs: 40, sm: 50 },
              height: { xs: 40, sm: 50 },
              borderRadius: "50%",
              objectFit: "cover",
              flexShrink: 0,
              animation: music.playing ? "luy-cover-spin 10s linear infinite" : "none",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              "@keyframes luy-cover-spin": {
                "0%": { transform: "rotate(0deg)" },
                "100%": { transform: "rotate(360deg)" },
              },
            }}
          />
        ) : (
          <Box
            sx={{
              width: { xs: 40, sm: 50 },
              height: { xs: 40, sm: 50 },
              borderRadius: "50%",
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
          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 800, lineHeight: 1.2 }}>
            {music.current.title}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", mt: 0.2, fontWeight: 500 }}>
            {music.current.artist || "Cloud Music"}
          </Typography>
        </Box>
      </Stack>

      <Box
        component={RouterLink}
        to="/music"
        sx={{
          flex: 1,
          mt: 1.5,
          color: "inherit",
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
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
            lineHeight: 1.5,
            fontWeight: 600,
          }}
        >
          {music.error || activeLyric}
        </Typography>
      </Box>

      <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ mt: 1 }}>
        <IconButton size="small" onClick={() => void music.refreshCurrent()} aria-label="刷新歌曲链接" sx={{ color: "text.secondary" }}>
          <RefreshRounded fontSize="small" />
        </IconButton>
        <IconButton
          onClick={music.toggle}
          aria-label={music.playing ? "暂停" : "播放"}
          sx={{
            bgcolor: "primary.main",
            color: "primary.contrastText",
            width: 38,
            height: 38,
            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
            "&:hover": { bgcolor: "primary.dark" },
          }}
        >
          {music.playing ? <PauseRounded fontSize="small" /> : <PlayArrowRounded fontSize="small" />}
        </IconButton>
        <IconButton size="small" onClick={music.next} aria-label="下一首" sx={{ color: "text.secondary" }}>
          <SkipNextRounded fontSize="small" />
        </IconButton>
      </Stack>
    </Paper>
  );
}
