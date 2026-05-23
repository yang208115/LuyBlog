import { Box, Stack, Typography } from "@mui/material";
import { useMemo, useEffect, useRef } from "react";

type LyricLine = {
  time: number;
  texts: string[];
};

const timeTagPattern = /\[(\d{1,3}[:：]\d{2}(?:(?:[:：]|[\.,])\d{1,3})?)\]/g;

function parseTime(raw: string) {
  const normalized = raw.replaceAll("：", ":").replace(",", ".");
  const match = normalized.match(/^(\d{1,3}):(\d{2})(?:(?:[:\.])(\d{1,3}))?$/);
  if (!match) return null;
  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  const ms = Number((match[3] || "0").padEnd(3, "0"));
  return minutes * 60 + seconds + ms / 1000;
}

export function parseLrc(lrc: string | null | undefined): LyricLine[] {
  if (!lrc) return [];
  const items = lrc
    .split(/\r?\n/)
    .flatMap((line) => {
      const tags = [...line.matchAll(timeTagPattern)];
      const text = line.replace(timeTagPattern, "").trim();
      if (!tags.length || !text) return [];
      return tags
        .map((tag) => {
          const time = parseTime(tag[1]);
          return time === null ? null : { time, text };
        })
        .filter((item): item is { time: number; text: string } => Boolean(item));
    })
    .sort((a, b) => a.time - b.time);

  const grouped = new Map<number, string[]>();
  for (const item of items) {
    const key = Math.round(item.time * 100) / 100;
    const texts = grouped.get(key) ?? [];
    if (!texts.includes(item.text)) texts.push(item.text);
    grouped.set(key, texts);
  }

  return Array.from(grouped.entries())
    .map(([time, texts]) => ({ time, texts }))
    .sort((a, b) => a.time - b.time);
}

export function LyricsView({ lyric, currentTime, onSeek }: { lyric: string | null | undefined; currentTime: number; onSeek?: (time: number) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLParagraphElement>(null);

  const lines = useMemo(() => parseLrc(lyric), [lyric]);
  const activeIndex = useMemo(() => {
    if (!lines.length) return -1;
    let active = -1;
    for (let index = 0; index < lines.length; index += 1) {
      if (lines[index].time <= currentTime + 0.25) active = index;
      else break;
    }
    if (active < 0) return -1;

    const next = lines[active + 1];
    const longInstrumentalGap = next && next.time - lines[active].time > 10;
    if (longInstrumentalGap && currentTime - lines[active].time > 6 && currentTime < next.time - 0.25) {
      return -1;
    }
    return active;
  }, [currentTime, lines]);

  useEffect(() => {
    if (currentTime < 0.5) {
      containerRef.current?.scrollTo({ top: 0 });
      return;
    }
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
    <Box ref={containerRef} sx={{ height: { xs: 260, md: 360 }, overflowY: "auto", pr: 1, scrollBehavior: "smooth" }}>
      <Stack spacing={1.2} sx={{ py: currentTime < 0.5 ? 0 : 10 }}>
        {lines.map((line, index) => {
          const active = index === activeIndex;
          return (
            <Typography
              key={`${line.time}-${index}`}
              ref={active ? activeLineRef : null}
              onClick={() => onSeek?.(line.time)}
              component="div"
              sx={{ cursor: onSeek ? "pointer" : "default", transition: "all 180ms ease" }}
            >
              {line.texts.map((text, textIndex) => (
                <Box
                  key={`${line.time}-${textIndex}`}
                  sx={{
                    color: active ? (textIndex === 0 ? "primary.main" : "text.primary") : "text.secondary",
                    fontWeight: active && textIndex === 0 ? 900 : 500,
                    fontSize: textIndex === 0 ? (active ? "1.08rem" : "0.96rem") : "0.86rem",
                    opacity: textIndex === 0 ? 1 : active ? 0.82 : 0.62,
                    lineHeight: 1.65,
                    textShadow: active && textIndex === 0 ? "0 0 18px rgba(99,102,241,0.35)" : "none",
                  }}
                >
                  {text}
                </Box>
              ))}
            </Typography>
          );
        })}
      </Stack>
    </Box>
  );
}
