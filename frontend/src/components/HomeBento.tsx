import { Avatar, Box, ButtonBase, Chip, IconButton, Stack, Typography, useTheme } from "@mui/material";
import { GitHub, MailRounded, PauseRounded, PlayArrowRounded, RefreshRounded, SkipNextRounded } from "@mui/icons-material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { glassPanelSx } from "./Glass";
import { parseLrc } from "./LyricsView";
import { useMusic } from "../context/MusicProvider";
import type { PostItem } from "../services/content";
import { useAppTheme } from "../context/ThemeContextProvider";
import { useSiteConfig } from "../context/SiteConfigProvider";

function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).replaceAll("/", ".");
}

export function ProfileBento({ postCount, momentCount, totalViews }: { postCount: number; momentCount: number; totalViews: number }) {
  const navigate = useNavigate();
  const siteConfig = useSiteConfig();
  return (
    <Box component={ButtonBase} onClick={() => navigate("/about")} sx={{ ...glassPanelSx, p: { xs: 2.4, md: 3 }, minHeight: 278, display: "block", textAlign: "left" }}>
      <Stack sx={{ height: "100%" }} justifyContent="space-between" spacing={4}>
        <Stack direction="row" spacing={{ xs: 2, md: 3 }} alignItems="center">
          <Box sx={{ p: 0.5, borderRadius: 3, background: "linear-gradient(135deg,#6366f1,#a855f7)", boxShadow: "0 18px 36px rgba(99,102,241,0.28)" }}>
            <Avatar src={siteConfig.avatarUrl} alt={siteConfig.authorName} variant="rounded" sx={{ width: { xs: 72, md: 94 }, height: { xs: 72, md: 94 }, borderRadius: 2.4 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h3" sx={{ fontWeight: 900, fontSize: { xs: "1.7rem", md: "2.35rem" }, lineHeight: 1.15 }}>
              {siteConfig.authorName}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.75, maxWidth: 520 }}>
              {siteConfig.bio}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" alignItems="flex-end" justifyContent="space-between" spacing={2} flexWrap="wrap">
          <Stack direction="row" spacing={{ xs: 2.6, md: 4 }}>
            <Stat count={postCount} label="文章" color="#6366f1" />
            <Stat count={momentCount} label="瞬间" color="#a855f7" />
            <Stat count={totalViews} label="浏览" color="#0f9f8f" />
          </Stack>
          <Stack direction="row" spacing={1} onClick={(event) => event.stopPropagation()}>
            {siteConfig.social.github && (
              <IconButton component="a" href={siteConfig.social.github} target="_blank" rel="noreferrer" sx={{ bgcolor: "rgba(255,255,255,0.32)", borderRadius: 2 }}>
                <GitHub />
              </IconButton>
            )}
            {siteConfig.social.email && (
              <IconButton component="a" href={`mailto:${siteConfig.social.email}`} sx={{ bgcolor: "rgba(255,255,255,0.32)", borderRadius: 2 }}>
                <MailRounded />
              </IconButton>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}

function Stat({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <Box sx={{ textAlign: "center" }}>
      <Typography sx={{ color, fontSize: { xs: "1.4rem", md: "1.65rem" }, fontWeight: 900, lineHeight: 1 }}>
        {count.toLocaleString("zh-CN")}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900, letterSpacing: 1.4 }}>
        {label}
      </Typography>
    </Box>
  );
}

export function CloudPlayerBento() {
  const music = useMusic();
  const lyricLines = parseLrc(music.current.lyric);
  const activeLyric =
    lyricLines.reduce((active, line) => (line.time <= music.currentTime + 0.25 ? line : active), lyricLines[0])?.text ||
    (music.current.lyric ? "歌词加载中..." : "") ||
    "暂无歌词";
  return (
    <Box sx={{ ...glassPanelSx, p: 3, minHeight: 278, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <Box>
        <Typography variant="overline" color="primary.light" sx={{ fontWeight: 900, letterSpacing: 2 }}>
          Cloud Music
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 900, mt: 1 }}>
          {music.current.title}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          {music.loading ? "加载歌单中..." : music.current.artist || `网易云 ID: ${music.current.neteaseId || "未配置"}`}
        </Typography>
      </Box>
      <Box sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(0,0,0,0.22)", color: "white" }}>
        <Typography sx={{ fontWeight: 700 }}>{music.error || activeLyric}</Typography>
      </Box>
      <Stack direction="row" spacing={1}>
        <IconButton onClick={music.toggle} sx={{ bgcolor: "primary.main", color: "white", "&:hover": { bgcolor: "primary.dark" } }}>
          {music.playing ? <PauseRounded /> : <PlayArrowRounded />}
        </IconButton>
        <IconButton onClick={music.next} sx={{ bgcolor: "rgba(255,255,255,0.28)" }}>
          <SkipNextRounded />
        </IconButton>
        <IconButton onClick={() => void music.refreshCurrent()} sx={{ bgcolor: "rgba(255,255,255,0.28)" }}>
          <RefreshRounded />
        </IconButton>
      </Stack>
    </Box>
  );
}

export function FeatureCarouselBento({ items }: { items: PostItem[] }) {
  const [index, setIndex] = useState(0);
  const siteConfig = useSiteConfig();
  const current = items[index];
  const covers = useMemo(() => items.map((item) => item.cover || siteConfig.defaultPostCover), [items, siteConfig.defaultPostCover]);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % items.length), 5000);
    return () => window.clearInterval(timer);
  }, [items.length]);

  if (!current) return null;
  const to = `/blog/${current.slug}`;

  return (
    <Box component={RouterLink} to={to} sx={{ ...glassPanelSx, minHeight: 420, display: "block", color: "white", textDecoration: "none", position: "relative" }}>
      {items.map((item, itemIndex) => (
        <Box
          key={item.slug}
          component="img"
          src={covers[itemIndex]}
          alt={item.title}
          loading={itemIndex === 0 ? "eager" : "lazy"}
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: itemIndex === index ? 0.92 : 0,
            transition: "opacity 700ms ease, transform 900ms ease",
            transform: itemIndex === index ? "scale(1)" : "scale(1.02)",
            pointerEvents: "none",
            ".MuiBox-root:hover &": itemIndex === index ? { transform: "scale(1.05)" } : undefined,
          }}
        />
      ))}
      <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(0,0,0,0.9), rgba(0,0,0,0.08))" }} />
      <Stack sx={{ position: "relative", zIndex: 2, height: "100%", p: 3 }} justifyContent="flex-end">
        <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
          <Chip label="Latest Insight" size="small" sx={{ bgcolor: "rgba(99,102,241,0.86)", color: "white", fontWeight: 900 }} />
          <Chip label={formatDate(current.publishedAt || current.createdAt)} size="small" sx={{ bgcolor: "rgba(0,0,0,0.38)", color: "white" }} />
        </Stack>
        <Typography variant="h4" sx={{ fontWeight: 900, textShadow: "0 2px 14px rgba(0,0,0,0.4)" }}>
          {current.title}
        </Typography>
        {current.summary && (
          <Typography sx={{ mt: 1, color: "rgba(255,255,255,0.82)", lineHeight: 1.7, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {current.summary}
          </Typography>
        )}
      </Stack>
      {items.length > 1 && (
        <Stack direction="row" spacing={0.8} sx={{ position: "absolute", right: 20, bottom: 18, zIndex: 2 }}>
          {items.map((item, itemIndex) => (
            <Box key={item.slug} onClick={(event) => { event.preventDefault(); setIndex(itemIndex); }} sx={{ width: itemIndex === index ? 24 : 8, height: 6, borderRadius: 999, bgcolor: itemIndex === index ? "#818cf8" : "rgba(255,255,255,0.45)", transition: "all 300ms ease" }} />
          ))}
        </Stack>
      )}
    </Box>
  );
}

export function ThemeBento({ minHeight = 180 }: { minHeight?: number } = {}) {
  const theme = useTheme();
  const { themeMode, toggleTheme } = useAppTheme();
  const isDark = themeMode === "dark";
  return (
    <Box onClick={toggleTheme} sx={{ ...glassPanelSx, minHeight, p: 3, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
      <Box sx={{ width: 82, height: 82, borderRadius: "50%", mb: 2, display: "grid", placeItems: "center", fontSize: 34, background: isDark ? "linear-gradient(135deg,#312e81,#020617)" : "linear-gradient(135deg,#7dd3fc,#fde68a)", boxShadow: `inset 0 0 28px ${theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.55)"}` }}>
        {isDark ? "✨" : "🌸"}
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 900 }}>
        {isDark ? "夜间模式" : "日间模式"}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {isDark ? "流萤飞舞的深空" : "落樱漫舞的清晨"}
      </Typography>
    </Box>
  );
}

export function SiteDashboardBento() {
  const siteConfig = useSiteConfig();
  const [time, setTime] = useState("00:00:00");
  const [uptime, setUptime] = useState("");

  useEffect(() => {
    const start = new Date(siteConfig.buildDate || "2026-03-23T00:00:00").getTime();
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      const elapsed = Math.max(0, now.getTime() - start);
      const hours = 60 * 60 * 1000;
      const days = 24 * hours;
      setUptime(`${Math.floor(elapsed / days)}天 ${Math.floor((elapsed % days) / hours)}小时`);
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [siteConfig.buildDate]);

  return (
    <Box sx={{ ...glassPanelSx, display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: "stretch", minHeight: 82 }}>
      <Box sx={{ px: 4, py: 2, bgcolor: "rgba(2,6,23,0.92)", color: "white", fontFamily: "monospace", fontSize: { xs: "1.6rem", md: "2rem" }, fontWeight: 900, display: "grid", placeItems: "center" }}>
        {time}
      </Box>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "flex-start", md: "center" }} justifyContent="space-between" sx={{ flex: 1, px: 3, py: 2 }}>
        <Typography sx={{ fontWeight: 800 }}>
          <Box component="span" sx={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", bgcolor: "#22c55e", mr: 1 }} />
          系统已稳定运行：<Box component="span" sx={{ color: "primary.main", fontWeight: 900 }}>{uptime}</Box>
        </Typography>
        <Stack direction="row" spacing={1}>
          {siteConfig.footerBadges.map((badge) => (
            <Chip key={badge.name} label={badge.name} size="small" sx={{ bgcolor: "rgba(255,255,255,0.28)", fontWeight: 800 }} />
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}
