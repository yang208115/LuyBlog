import { Box, Stack, Typography } from "@mui/material";
import { useMemo, useEffect, useRef } from "react";

type LyricLine = {
  time: number;
  text: string;
};

function parseTime(raw: string) {
  const match = raw.match(/^(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?$/);
  if (!match) return null;
  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  const ms = Number((match[3] || "0").padEnd(3, "0"));
  return minutes * 60 + seconds + ms / 1000;
}

export function parseLrc(lrc: string | null | undefined): LyricLine[] {
  if (!lrc) return [];
  return lrc
    .split(/\r?\n/)
    .flatMap((line) => {
      const tags = [...line.matchAll(/\[(\d{1,2}:\d{2}(?:\.\d{1,3})?)\]/g)];
      const text = line.replace(/\[(\d{1,2}:\d{2}(?:\.\d{1,3})?)\]/g, "").trim();
      if (!tags.length || !text) return [];
      return tags
        .map((tag) => {
          const time = parseTime(tag[1]);
          return time === null ? null : { time, text };
        })
        .filter((item): item is LyricLine => Boolean(item));
    })
    .sort((a, b) => a.time - b.time);
}

export function LyricsView({ lyric, currentTime, onSeek }: { lyric: string | null | undefined; currentTime: number; onSeek?: (time: number) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLParagraphElement>(null);

  const lines = useMemo(() => parseLrc(lyric), [lyric]);
  const activeIndex = useMemo(() => {
    if (!lines.length) return -1;
    let active = 0;
    for (let index = 0; index < lines.length; index += 1) {
      if (lines[index].time <= currentTime + 0.25) active = index;
      else break;
    }
    return active;
  }, [currentTime, lines]);

  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      const container = containerRef.current;
      const activeLine = activeLineRef.current;

      // Calculate the scroll position to center the active line
      const containerHeight = container.clientHeight;
      const lineTop = activeLine.offsetTop;
      const lineHeight = activeLine.clientHeight;

      const scrollTop = lineTop - containerHeight / 2 + lineHeight / 2;

      container.scrollTo({
        top: scrollTop,
        behavior: "smooth"
      });
    }
  }, [activeIndex]);

  if (!lines.length) {
    return (
      <Typography color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
        {lyric || "暂无歌词"}
      </Typography>
    );
  }

  return (
    <Box ref={containerRef} sx={{ maxHeight: 360, overflowY: "auto", pr: 1, scrollBehavior: "smooth" }}>
      <Stack spacing={1.2} sx={{ py: 10 }}>
        {lines.map((line, index) => {
          const active = index === activeIndex;
          return (
            <Typography
              key={`${line.time}-${index}`}
              ref={active ? activeLineRef : null}
              onClick={() => onSeek?.(line.time)}
              sx={{
                cursor: onSeek ? "pointer" : "default",
                color: active ? "primary.main" : "text.secondary",
                fontWeight: active ? 900 : 500,
                fontSize: active ? "1.08rem" : "0.96rem",
                transition: "all 180ms ease",
                textShadow: active ? "0 0 18px rgba(99,102,241,0.35)" : "none",
              }}
            >
              {line.text}
            </Typography>
          );
        })}
      </Stack>
    </Box>
  );
}
