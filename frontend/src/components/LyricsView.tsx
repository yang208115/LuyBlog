import { Box, Stack, Typography } from "@mui/material";
import { useMemo, useEffect, useRef } from "react";

export type LyricLine = {
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
    .replace(/\\r\\n|\\n|\\r/g, "\n")
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

export function calculateLineProgress(lines: LyricLine[], activeIndex: number, currentTime: number) {
  const line = lines[activeIndex];
  if (!line) return 0;

  const characterCount = Math.max(1, Array.from(line.texts[0]?.replace(/\s/g, "") ?? "").length);
  const estimatedDuration = Math.min(10, Math.max(2, characterCount * 0.24));
  const nextLine = lines[activeIndex + 1];
  const timestampDuration = nextLine ? nextLine.time - line.time : 0;
  const duration = timestampDuration > 0 && timestampDuration <= 10 ? timestampDuration : estimatedDuration;
  const charactersPerSecond = characterCount / duration;
  const progressedCharacters = Math.max(0, currentTime - line.time) * charactersPerSecond;

  return Math.min(1, progressedCharacters / characterCount);
}

export function findActiveLineIndex(lines: LyricLine[], currentTime: number) {
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
}

export function KaraokeText({ text, progress }: { text: string; progress?: number }) {
  const previousProgressRef = useRef(progress);
  const animateForward =
    progress !== undefined &&
    previousProgressRef.current !== undefined &&
    progress >= previousProgressRef.current;

  useEffect(() => {
    previousProgressRef.current = progress;
  }, [progress]);

  if (progress === undefined) return text;
  const progressPercent = Math.min(100, Math.max(0, progress * 100));

  return (
    <Box component="span" sx={{ display: "inline-block", maxWidth: "100%", position: "relative", color: "text.secondary", verticalAlign: "bottom" }}>
      {text}
      <Box
        component="span"
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          color: "primary.main",
          clipPath: `inset(0 ${100 - progressPercent}% 0 0)`,
          transition: animateForward ? "clip-path 320ms linear" : "none",
          textShadow: "0 0 18px rgba(99,102,241,0.35)",
          pointerEvents: "none",
        }}
      >
        {text}
      </Box>
    </Box>
  );
}

export function LyricsView({ lyric, currentTime, onSeek }: { lyric: string | null | undefined; currentTime: number; onSeek?: (time: number) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLParagraphElement>(null);

  const lines = useMemo(() => parseLrc(lyric), [lyric]);
  const activeIndex = useMemo(() => findActiveLineIndex(lines, currentTime), [currentTime, lines]);
  const activeProgress = useMemo(
    () => calculateLineProgress(lines, activeIndex, currentTime),
    [activeIndex, currentTime, lines],
  );

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
        {lyric?.replace(/\\r\\n|\\n|\\r/g, "\n") || "暂无歌词"}
      </Typography>
    );
  }

  return (
    <Box ref={containerRef} sx={{ height: { xs: 260, md: 360 }, overflowY: "auto", pr: 1, scrollBehavior: "smooth" }}>
      <Stack spacing={1.2} sx={{ py: currentTime < 0.5 ? 0 : 10 }}>
        {lines.map((line, index) => {
          const active = index === activeIndex;
          const progressPercent = active ? activeProgress * 100 : 0;
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
                  sx={(theme) => {
                    const karaoke = active && textIndex === 0;
                    return {
                      display: "table",
                      width: "fit-content",
                      maxWidth: "100%",
                      position: "relative",
                      color: karaoke ? theme.palette.text.secondary : active ? "text.primary" : "text.secondary",
                      fontWeight: karaoke ? 900 : 500,
                      fontSize: textIndex === 0 ? (active ? "1.08rem" : "0.96rem") : "0.86rem",
                      opacity: textIndex === 0 ? 1 : active ? 0.82 : 0.62,
                      lineHeight: 1.65,
                    };
                  }}
                >
                  <KaraokeText text={text} progress={active && textIndex === 0 ? progressPercent / 100 : undefined} />
                </Box>
              ))}
            </Typography>
          );
        })}
      </Stack>
    </Box>
  );
}
