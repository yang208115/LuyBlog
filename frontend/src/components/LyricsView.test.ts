import { describe, expect, it } from "vitest";
import {
  calculateLineProgress,
  findActiveLineIndex,
  parseLrc,
} from "./LyricsView";

describe("parseLrc", () => {
  it("treats escaped newline markers as real line breaks", () => {
    expect(parseLrc("[00:01.00]第一句\\n[00:02.00]第二句")).toEqual([
      { time: 1, texts: ["第一句"] },
      { time: 2, texts: ["第二句"] },
    ]);
  });

  it("calculates karaoke progress from line duration and character count", () => {
    const lines = parseLrc("[00:01.00]四个字符\\n[00:05.00]下一句");

    expect(calculateLineProgress(lines, 0, 1)).toBe(0);
    expect(calculateLineProgress(lines, 0, 3)).toBe(0.5);
    expect(calculateLineProgress(lines, 0, 5)).toBe(1);
  });

  it("estimates the last line duration from its lyric length", () => {
    const shortLine = parseLrc("[00:01.00]短句");
    const longLine = parseLrc("[00:01.00]这是一句明显更长的歌词内容");

    expect(calculateLineProgress(shortLine, 0, 3)).toBe(1);
    expect(calculateLineProgress(longLine, 0, 3)).toBeLessThan(1);
  });

  it("finishes the previous line before switching to the next one", () => {
    const lines = parseLrc("[00:01.00]上一句\n[00:05.00]下一句");

    expect(calculateLineProgress(lines, 0, 5)).toBe(1);
    expect(findActiveLineIndex(lines, 5.1)).toBe(0);
    expect(findActiveLineIndex(lines, 5.2)).toBe(1);
  });
});
