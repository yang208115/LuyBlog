import { OpenAPIHono } from "@hono/zod-openapi";
import { asc, eq, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { musicTracks } from "../db/schema";
import type { Bindings } from "../types";
import { authMiddleware } from "../middleware/auth";
import { adminMiddleware } from "../middleware/admin";

type Variables = {
  db: DrizzleD1Database<typeof schema>;
  user?: typeof schema.users.$inferSelect;
};

const app = new OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>();
const protectedRoutes = new OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>();
protectedRoutes.use("/*", authMiddleware, adminMiddleware);

type NeteaseUrlResponse = {
  code?: number;
  data?: Array<{
    id: number;
    url?: string | null;
    expi?: number;
    code?: number;
    level?: string;
    type?: string;
    time?: number;
  }>;
};

type NeteaseDetailResponse = {
  code?: number;
  songs?: Array<{
    name?: string;
    ar?: Array<{ name?: string }>;
    al?: { name?: string; picUrl?: string };
  }>;
};

type NeteaseLyricResponse = {
  code?: number;
  lrc?: {
    lyric?: string;
  };
  tlyric?: {
    lyric?: string;
  };
  romalrc?: {
    lyric?: string;
  };
};

function toDto(row: typeof musicTracks.$inferSelect) {
  return {
    id: row.id,
    neteaseId: row.neteaseId,
    title: row.title,
    artist: row.artist,
    album: row.album,
    cover: row.cover,
    playlistId: row.playlistId,
    playlistName: row.playlistName,
    playlistCover: row.playlistCover,
    lyric: row.lyric,
    url: row.cachedUrl,
    cachedAt: row.cachedAt?.toISOString() ?? null,
    cacheExpiresAt: row.cacheExpiresAt?.toISOString() ?? null,
    level: row.level,
    sortOrder: row.sortOrder,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function isFresh(row: typeof musicTracks.$inferSelect) {
  return Boolean(row.cachedUrl && row.cacheExpiresAt && row.cacheExpiresAt.getTime() > Date.now() + 30_000);
}

async function resolveMusicUrl(neteaseId: string, level: string) {
  const response = await fetch(
    `https://music163.xuanmou.com.cn/song/url/v1?id=${encodeURIComponent(neteaseId)}&level=${encodeURIComponent(level)}`,
    {
      headers: {
        accept: "application/json",
        "user-agent": "LuyBlog/1.0",
      },
    },
  );
  if (!response.ok) {
    throw new Error(`音乐接口返回 ${response.status}`);
  }
  const data = (await response.json()) as NeteaseUrlResponse;
  const first = data.data?.[0];
  if (data.code !== 200 || first?.code !== 200 || !first.url) {
    throw new Error("音乐接口未返回可播放 URL");
  }
  const expiresIn = Math.max(60, Number(first.expi ?? 1200));
  return {
    url: first.url,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
  };
}

async function resolveMusicDetail(neteaseId: string) {
  const response = await fetch(`https://music163.xuanmou.com.cn/song/detail?ids=${encodeURIComponent(neteaseId)}`, {
    headers: { accept: "application/json", "user-agent": "LuyBlog/1.0" },
  });
  if (!response.ok) throw new Error(`歌曲详情接口返回 ${response.status}`);
  const data = (await response.json()) as NeteaseDetailResponse;
  const song = data.songs?.[0];
  if (data.code !== 200 || !song) throw new Error("歌曲详情接口未返回歌曲信息");
  return {
    title: song.name ?? null,
    artist: song.ar?.map((artist) => artist.name).filter(Boolean).join(" / ") || null,
    album: song.al?.name ?? null,
    cover: song.al?.picUrl ?? null,
  };
}

async function resolveMusicLyric(neteaseId: string) {
  const response = await fetch(`https://music163.xuanmou.com.cn/lyric?id=${encodeURIComponent(neteaseId)}`, {
    headers: { accept: "application/json", "user-agent": "LuyBlog/1.0" },
  });
  if (!response.ok) throw new Error(`歌词接口返回 ${response.status}`);
  const data = (await response.json()) as NeteaseLyricResponse;
  if (data.code !== 200) throw new Error("歌词接口未返回成功状态");
  return [data.lrc?.lyric, data.tlyric?.lyric, data.romalrc?.lyric].filter(Boolean).join("\n") || null;
}

async function ensureTrackUrl(db: DrizzleD1Database<typeof schema>, row: typeof musicTracks.$inferSelect, force = false) {
  if (!force && isFresh(row)) return row;

  const resolved = await resolveMusicUrl(row.neteaseId, row.level);
  let detail: Awaited<ReturnType<typeof resolveMusicDetail>> | null = null;
  let lyric: string | null = null;
  try {
    detail = await resolveMusicDetail(row.neteaseId);
  } catch {
    // URL 刷新不能被详情接口失败阻塞。
  }
  try {
    lyric = await resolveMusicLyric(row.neteaseId);
  } catch {
    // 歌词刷新不能阻塞 URL 刷新。
  }
  const [updated] = await db
    .update(musicTracks)
    .set({
      title: detail?.title ?? row.title,
      artist: detail?.artist ?? row.artist,
      album: detail?.album ?? row.album,
      cover: detail?.cover ?? row.cover,
      lyric: lyric ?? row.lyric,
      cachedUrl: resolved.url,
      cachedAt: new Date(),
      cacheExpiresAt: resolved.expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(musicTracks.id, row.id))
    .returning();
  return updated ?? row;
}

app.get("/tracks", async (c) => {
  const db = c.get("db");
  const rows = await db
    .select()
    .from(musicTracks)
    .where(eq(musicTracks.status, "enabled"))
    .orderBy(sql`random()`, asc(musicTracks.sortOrder), asc(musicTracks.createdAt));

  const resolved = await Promise.all(
    rows.map(async (row) => {
      try {
        return await ensureTrackUrl(db, row);
      } catch {
        return row;
      }
    }),
  );

  return c.json(resolved.map(toDto));
});

protectedRoutes.post("/tracks/:id/refresh", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const row = await db.select().from(musicTracks).where(eq(musicTracks.id, id)).get();
  if (!row) return c.json({ code: 404, message: "歌曲不存在" }, 404);

  try {
    const updated = await ensureTrackUrl(db, row, true);
    return c.json(toDto(updated));
  } catch (error) {
    const message = error instanceof Error ? error.message : "刷新歌曲 URL 失败";
    return c.json({ code: 502, message }, 502);
  }
});

export default app;
export { protectedRoutes as protectedMusicRoutes };
