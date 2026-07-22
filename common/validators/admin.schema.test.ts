import { describe, expect, it } from "vitest";
import { CreateMusicTrackSchema, UpdateMusicTrackSchema } from "./admin.schema";

describe("music track schemas", () => {
  it("accepts a direct music URL and manually entered lyrics", () => {
    const result = CreateMusicTrackSchema.safeParse({
      url: "https://cdn.example.com/music/song.mp3",
      title: "示例歌曲",
      lyric: "[00:01.00]第一句歌词",
    });

    expect(result.success).toBe(true);
  });

  it("requires a valid URL and a title when creating a track", () => {
    expect(CreateMusicTrackSchema.safeParse({ url: "not-a-url", title: "" }).success).toBe(false);
  });

  it("allows updating only the manually entered lyrics", () => {
    expect(UpdateMusicTrackSchema.safeParse({ lyric: "新的歌词" }).success).toBe(true);
  });
});
