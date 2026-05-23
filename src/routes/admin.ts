import { OpenAPIHono } from "@hono/zod-openapi";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { comments, friendLinks, moments, musicTracks, navItems, pages, posts, projects, users } from "../db/schema";
import {
  CreateNavItemSchema,
  CreateFriendLinkSchema,
  CreateMomentSchema,
  CreateMusicTrackSchema,
  CreatePageSchema,
  CreatePostSchema,
  CreateProjectSchema,
  ImportMusicPlaylistSchema,
  ReorderNavItemsSchema,
  UpdateCommentStatusSchema,
  UpdateFriendLinkSchema,
  UpdateMomentSchema,
  UpdateMusicTrackSchema,
  UpdateNavItemSchema,
  UpdatePageSchema,
  UpdatePostSchema,
  UpdateProjectSchema,
  SiteConfigSchema,
  UpdateUserRoleSchema,
  UpdateUserStatusSchema,
} from "../../common/validators/admin.schema";
import { authMiddleware } from "../middleware/auth";
import { adminMiddleware } from "../middleware/admin";
import type { Bindings } from "../types";
import { ensureSiteSettingsTable, getSiteConfig, SITE_CONFIG_KEY } from "./siteConfig";
import { seedDefaultNavItems } from "./navigation";

type Variables = {
  db: DrizzleD1Database<typeof schema>;
  user?: typeof users.$inferSelect;
};

const app = new OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>();
app.use("/*", authMiddleware, adminMiddleware);

type NeteaseUrlResponse = {
  code?: number;
  data?: Array<{ url?: string | null; code?: number; expi?: number }>;
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

type NeteasePlaylistResponse = {
  code?: number;
  result?: {
    name?: string;
    coverImgUrl?: string;
    tracks?: NeteasePlaylistTrack[];
  };
  playlist?: {
    name?: string;
    coverImgUrl?: string;
    tracks?: NeteasePlaylistTrack[];
  };
};

type NeteasePlaylistTrack = {
  id?: number | string;
  name?: string;
  artists?: Array<{ name?: string }>;
  ar?: Array<{ name?: string }>;
  album?: { name?: string; picUrl?: string; blurPicUrl?: string };
  al?: { name?: string; picUrl?: string };
};

async function resolveMusicUrl(neteaseId: string, level: string) {
  const response = await fetch(
    `https://music163.xuanmou.com.cn/song/url/v1?id=${encodeURIComponent(neteaseId)}&level=${encodeURIComponent(level)}`,
    { headers: { accept: "application/json", "user-agent": "LuyBlog/1.0" } },
  );
  if (!response.ok) throw new Error(`音乐接口返回 ${response.status}`);
  const data = (await response.json()) as NeteaseUrlResponse;
  const first = data.data?.[0];
  if (data.code !== 200 || first?.code !== 200 || !first.url) throw new Error("音乐接口未返回可播放 URL");
  return {
    url: first.url,
    expiresAt: new Date(Date.now() + Math.max(60, Number(first.expi ?? 1200)) * 1000),
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

function extractPlaylistId(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/[?&]id=(\d+)/) ?? trimmed.match(/playlist\/(?:detail\/)?(\d+)/) ?? trimmed.match(/^(\d+)$/);
  return match?.[1] ?? null;
}

async function resolvePlaylist(playlistId: string) {
  const response = await fetch(`https://music.163.com/api/playlist/detail?id=${encodeURIComponent(playlistId)}`, {
    headers: { accept: "application/json", "user-agent": "LuyBlog/1.0" },
  });
  if (!response.ok) throw new Error(`歌单接口返回 ${response.status}`);
  const data = (await response.json()) as NeteasePlaylistResponse;
  const playlist = data.result ?? data.playlist;
  const tracks = playlist?.tracks ?? [];
  if (data.code !== 200 || tracks.length === 0) throw new Error("歌单接口未返回歌曲信息");
  return {
    id: playlistId,
    name: playlist?.name || `网易云歌单 ${playlistId}`,
    cover: playlist?.coverImgUrl ?? null,
    tracks,
  };
}

function playlistTrackToMusicTrack(track: NeteasePlaylistTrack) {
  const neteaseId = track.id ? String(track.id) : "";
  const artists = track.artists ?? track.ar ?? [];
  return {
    neteaseId,
    title: track.name || neteaseId,
    artist: artists.map((artist) => artist.name).filter(Boolean).join(" / ") || null,
    album: track.album?.name ?? track.al?.name ?? null,
    cover: track.album?.picUrl ?? track.album?.blurPicUrl ?? track.al?.picUrl ?? null,
  };
}

function jsonArray(values: string[]) {
  return JSON.stringify(values);
}

function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function iso(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

app.get("/stats", async (c) => {
  const db = c.get("db");
  const [postCount, momentCount, projectCount, pageCount, friendLinkCount, musicCount, commentCount, userCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(posts).get(),
    db.select({ count: sql<number>`count(*)` }).from(moments).get(),
    db.select({ count: sql<number>`count(*)` }).from(projects).get(),
    db.select({ count: sql<number>`count(*)` }).from(pages).get(),
    db.select({ count: sql<number>`count(*)` }).from(friendLinks).get(),
    db.select({ count: sql<number>`count(*)` }).from(musicTracks).get(),
    db.select({ count: sql<number>`count(*)` }).from(comments).get(),
    db.select({ count: sql<number>`count(*)` }).from(users).get(),
  ]);
  return c.json({
    posts: Number(postCount?.count ?? 0),
    moments: Number(momentCount?.count ?? 0),
    projects: Number(projectCount?.count ?? 0),
    pages: Number(pageCount?.count ?? 0),
    friendLinks: Number(friendLinkCount?.count ?? 0),
    music: Number(musicCount?.count ?? 0),
    comments: Number(commentCount?.count ?? 0),
    users: Number(userCount?.count ?? 0),
  });
});

app.get("/site-config", async (c) => {
  const db = c.get("db");
  return c.json(await getSiteConfig(db));
});

app.put("/site-config", async (c) => {
  const db = c.get("db");
  const parsed = SiteConfigSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: 400, message: "站点配置参数不合法" }, 400);

  const value = JSON.stringify(parsed.data);
  await ensureSiteSettingsTable(db);
  await db
    .insert(schema.siteSettings)
    .values({ key: SITE_CONFIG_KEY, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: schema.siteSettings.key, set: { value, updatedAt: new Date() } });

  return c.json(parsed.data);
});

app.get("/nav-items", async (c) => {
  const db = c.get("db");
  await seedDefaultNavItems(db);
  const rows = await db.select().from(navItems).orderBy(navItems.sortOrder, desc(navItems.createdAt));
  return c.json({
    items: rows.map((row) => ({
      id: row.id,
      label: row.label,
      path: row.path,
      sortOrder: row.sortOrder,
      status: row.status,
      updatedAt: row.updatedAt.toISOString(),
    })),
  });
});

app.post("/nav-items", async (c) => {
  const db = c.get("db");
  await seedDefaultNavItems(db);
  const parsed = CreateNavItemSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: 400, message: "导航参数不合法" }, 400);
  const now = new Date();
  const [created] = await db
    .insert(navItems)
    .values({ ...parsed.data, createdAt: now, updatedAt: now })
    .returning();
  return c.json({
    ...created,
    updatedAt: created.updatedAt.toISOString(),
  });
});

app.patch("/nav-items/reorder", async (c) => {
  const db = c.get("db");
  await seedDefaultNavItems(db);
  const parsed = ReorderNavItemsSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: 400, message: "导航排序参数不合法" }, 400);

  const now = new Date();
  await Promise.all(
    parsed.data.ids.map((id, index) =>
      db
        .update(navItems)
        .set({ sortOrder: index * 10, updatedAt: now })
        .where(eq(navItems.id, id)),
    ),
  );

  return c.json({ success: true });
});

app.patch("/nav-items/:id", async (c) => {
  const db = c.get("db");
  await seedDefaultNavItems(db);
  const parsed = UpdateNavItemSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: 400, message: "导航参数不合法" }, 400);
  const [updated] = await db
    .update(navItems)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(navItems.id, c.req.param("id")))
    .returning();
  if (!updated) return c.json({ code: 404, message: "导航不存在" }, 404);
  return c.json({
    ...updated,
    updatedAt: updated.updatedAt.toISOString(),
  });
});

app.delete("/nav-items/:id", async (c) => {
  const db = c.get("db");
  await seedDefaultNavItems(db);
  await db.delete(navItems).where(eq(navItems.id, c.req.param("id")));
  return c.json({ success: true });
});

app.get("/posts", async (c) => {
  const db = c.get("db");
  const page = Math.max(1, Number(c.req.query("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, Number(c.req.query("pageSize") || "10")));

  const rows = await db
    .select()
    .from(posts)
    .orderBy(desc(posts.updatedAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const totalRow = await db.select({ count: sql<number>`count(*)` }).from(posts).get();

  return c.json({
    items: rows.map((row) => ({
      ...row,
      tags: parseJsonArray(row.tags),
      publishedAt: iso(row.publishedAt),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
    pagination: { page, pageSize, total: Number(totalRow?.count ?? 0) },
  });
});

app.post("/posts", async (c) => {
  const db = c.get("db");
  const currentUser = c.get("user");
  if (!currentUser) {
    return c.json({ code: 401, message: "用户未认证" }, 401);
  }
  const parsed = CreatePostSchema.safeParse(await c.req.json());

  if (!parsed.success) {
    return c.json({ code: 400, message: "文章参数不合法" }, 400);
  }

  const payload = parsed.data;
  const exists = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, payload.slug)).get();
  if (exists) {
    return c.json({ code: 400, message: "slug 已存在" }, 400);
  }

  const now = new Date();
  const [created] = await db
    .insert(posts)
    .values({
      authorId: currentUser.id,
      title: payload.title,
      slug: payload.slug,
      summary: payload.summary ?? null,
      cover: payload.cover ?? null,
      tags: jsonArray(payload.tags),
      category: payload.category ?? null,
      contentMd: payload.contentMd,
      status: payload.status,
      publishedAt: payload.status === "published" ? now : null,
      updatedAt: now,
    })
    .returning();

  return c.json(created);
});

app.patch("/posts/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const parsed = UpdatePostSchema.safeParse(await c.req.json());

  if (!parsed.success) {
    return c.json({ code: 400, message: "更新参数不合法" }, 400);
  }

  const payload = parsed.data;
  const existing = await db.select().from(posts).where(eq(posts.id, id)).get();
  if (!existing) {
    return c.json({ code: 404, message: "文章不存在" }, 404);
  }

  if (payload.slug && payload.slug !== existing.slug) {
    const slugExists = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, payload.slug)).get();
    if (slugExists) {
      return c.json({ code: 400, message: "slug 已存在" }, 400);
    }
  }

  const nextStatus = payload.status ?? existing.status;

  const [updated] = await db
    .update(posts)
    .set({
      title: payload.title ?? existing.title,
      slug: payload.slug ?? existing.slug,
      summary: payload.summary !== undefined ? payload.summary : existing.summary,
      cover: payload.cover !== undefined ? payload.cover : existing.cover,
      tags: payload.tags !== undefined ? jsonArray(payload.tags) : existing.tags,
      category: payload.category !== undefined ? payload.category : existing.category,
      contentMd: payload.contentMd ?? existing.contentMd,
      status: nextStatus,
      publishedAt: nextStatus === "published" ? existing.publishedAt ?? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, id))
    .returning();

  return c.json(updated);
});

app.delete("/posts/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");

  const existing = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, id)).get();
  if (!existing) {
    return c.json({ code: 404, message: "文章不存在" }, 404);
  }

  await db.delete(posts).where(eq(posts.id, id));
  return c.json({ success: true, message: "文章已删除" });
});

app.get("/moments", async (c) => {
  const db = c.get("db");
  const rows = await db.select().from(moments).orderBy(desc(moments.updatedAt));
  return c.json({
    items: rows.map((row) => ({
      ...row,
      images: parseJsonArray(row.images),
      publishedAt: iso(row.publishedAt),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
  });
});

app.post("/moments", async (c) => {
  const db = c.get("db");
  const parsed = CreateMomentSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: 400, message: "瞬间参数不合法" }, 400);

  const exists = await db.select({ id: moments.id }).from(moments).where(eq(moments.slug, parsed.data.slug)).get();
  if (exists) return c.json({ code: 400, message: "slug 已存在" }, 400);

  const now = new Date();
  const [created] = await db
    .insert(moments)
    .values({
      slug: parsed.data.slug,
      contentMd: parsed.data.contentMd,
      location: parsed.data.location ?? null,
      images: jsonArray(parsed.data.images),
      frontmatter: "{}",
      status: parsed.data.status,
      publishedAt: parsed.data.status === "published" ? now : null,
      updatedAt: now,
    })
    .returning();
  return c.json(created);
});

app.patch("/moments/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const parsed = UpdateMomentSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: 400, message: "瞬间参数不合法" }, 400);

  const existing = await db.select().from(moments).where(eq(moments.id, id)).get();
  if (!existing) return c.json({ code: 404, message: "瞬间不存在" }, 404);
  if (parsed.data.slug && parsed.data.slug !== existing.slug) {
    const exists = await db.select({ id: moments.id }).from(moments).where(eq(moments.slug, parsed.data.slug)).get();
    if (exists) return c.json({ code: 400, message: "slug 已存在" }, 400);
  }

  const nextStatus = parsed.data.status ?? existing.status;
  const [updated] = await db
    .update(moments)
    .set({
      slug: parsed.data.slug ?? existing.slug,
      contentMd: parsed.data.contentMd ?? existing.contentMd,
      location: parsed.data.location !== undefined ? parsed.data.location : existing.location,
      images: parsed.data.images !== undefined ? jsonArray(parsed.data.images) : existing.images,
      status: nextStatus,
      publishedAt: nextStatus === "published" ? existing.publishedAt ?? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(moments.id, id))
    .returning();
  return c.json(updated);
});

app.delete("/moments/:id", async (c) => {
  const db = c.get("db");
  await db.delete(moments).where(eq(moments.id, c.req.param("id")));
  return c.json({ success: true });
});

app.get("/projects", async (c) => {
  const db = c.get("db");
  const rows = await db.select().from(projects).orderBy(projects.sortOrder, desc(projects.updatedAt));
  return c.json({
    items: rows.map((row) => ({
      ...row,
      tags: parseJsonArray(row.tags),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
  });
});

app.post("/projects", async (c) => {
  const db = c.get("db");
  const parsed = CreateProjectSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: 400, message: "项目参数不合法" }, 400);
  const [created] = await db
    .insert(projects)
    .values({
      ...parsed.data,
      description: parsed.data.description ?? null,
      icon: parsed.data.icon ?? null,
      githubUrl: parsed.data.githubUrl ?? null,
      tags: jsonArray(parsed.data.tags),
      updatedAt: new Date(),
    })
    .returning();
  return c.json(created);
});

app.patch("/projects/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const parsed = UpdateProjectSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: 400, message: "项目参数不合法" }, 400);
  const existing = await db.select().from(projects).where(eq(projects.id, id)).get();
  if (!existing) return c.json({ code: 404, message: "项目不存在" }, 404);
  const [updated] = await db
    .update(projects)
    .set({
      name: parsed.data.name ?? existing.name,
      description: parsed.data.description !== undefined ? parsed.data.description : existing.description,
      icon: parsed.data.icon !== undefined ? parsed.data.icon : existing.icon,
      githubUrl: parsed.data.githubUrl !== undefined ? parsed.data.githubUrl : existing.githubUrl,
      tags: parsed.data.tags !== undefined ? jsonArray(parsed.data.tags) : existing.tags,
      sortOrder: parsed.data.sortOrder ?? existing.sortOrder,
      status: parsed.data.status ?? existing.status,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, id))
    .returning();
  return c.json(updated);
});

app.delete("/projects/:id", async (c) => {
  const db = c.get("db");
  await db.delete(projects).where(eq(projects.id, c.req.param("id")));
  return c.json({ success: true });
});

app.get("/pages", async (c) => {
  const db = c.get("db");
  const rows = await db.select().from(pages).orderBy(desc(pages.updatedAt));
  return c.json({ items: rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() })) });
});

app.post("/pages", async (c) => {
  const db = c.get("db");
  const parsed = CreatePageSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: 400, message: "页面参数不合法" }, 400);
  const exists = await db.select({ id: pages.id }).from(pages).where(eq(pages.slug, parsed.data.slug)).get();
  if (exists) return c.json({ code: 400, message: "slug 已存在" }, 400);
  const [created] = await db
    .insert(pages)
    .values({ ...parsed.data, frontmatter: "{}", updatedAt: new Date() })
    .returning();
  return c.json(created);
});

app.patch("/pages/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const parsed = UpdatePageSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: 400, message: "页面参数不合法" }, 400);
  const existing = await db.select().from(pages).where(eq(pages.id, id)).get();
  if (!existing) return c.json({ code: 404, message: "页面不存在" }, 404);
  if (parsed.data.slug && parsed.data.slug !== existing.slug) {
    const exists = await db.select({ id: pages.id }).from(pages).where(eq(pages.slug, parsed.data.slug)).get();
    if (exists) return c.json({ code: 400, message: "slug 已存在" }, 400);
  }
  const [updated] = await db
    .update(pages)
    .set({
      slug: parsed.data.slug ?? existing.slug,
      title: parsed.data.title ?? existing.title,
      contentMd: parsed.data.contentMd ?? existing.contentMd,
      status: parsed.data.status ?? existing.status,
      updatedAt: new Date(),
    })
    .where(eq(pages.id, id))
    .returning();
  return c.json(updated);
});

app.delete("/pages/:id", async (c) => {
  const db = c.get("db");
  await db.delete(pages).where(eq(pages.id, c.req.param("id")));
  return c.json({ success: true });
});

app.get("/friend-links", async (c) => {
  const db = c.get("db");
  const rows = await db.select().from(friendLinks).orderBy(friendLinks.sortOrder, desc(friendLinks.updatedAt));
  return c.json({ items: rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() })) });
});

app.post("/friend-links", async (c) => {
  const db = c.get("db");
  const parsed = CreateFriendLinkSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: 400, message: "友链参数不合法" }, 400);
  const [created] = await db
    .insert(friendLinks)
    .values({
      ...parsed.data,
      description: parsed.data.description ?? null,
      avatarUrl: parsed.data.avatarUrl ?? null,
      updatedAt: new Date(),
    })
    .returning();
  return c.json(created);
});

app.patch("/friend-links/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const parsed = UpdateFriendLinkSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: 400, message: "友链参数不合法" }, 400);
  const existing = await db.select().from(friendLinks).where(eq(friendLinks.id, id)).get();
  if (!existing) return c.json({ code: 404, message: "友链不存在" }, 404);
  const [updated] = await db
    .update(friendLinks)
    .set({
      name: parsed.data.name ?? existing.name,
      description: parsed.data.description !== undefined ? parsed.data.description : existing.description,
      url: parsed.data.url ?? existing.url,
      avatarUrl: parsed.data.avatarUrl !== undefined ? parsed.data.avatarUrl : existing.avatarUrl,
      sortOrder: parsed.data.sortOrder ?? existing.sortOrder,
      status: parsed.data.status ?? existing.status,
      updatedAt: new Date(),
    })
    .where(eq(friendLinks.id, id))
    .returning();
  return c.json(updated);
});

app.delete("/friend-links/:id", async (c) => {
  const db = c.get("db");
  await db.delete(friendLinks).where(eq(friendLinks.id, c.req.param("id")));
  return c.json({ success: true });
});

app.get("/comments", async (c) => {
  const db = c.get("db");
  const page = Math.max(1, Number(c.req.query("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, Number(c.req.query("pageSize") || "10")));

  const rows = await db
    .select({
      id: comments.id,
      postId: comments.postId,
      userId: comments.userId,
      content: comments.content,
      status: comments.status,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      username: users.username,
      postTitle: posts.title,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .innerJoin(posts, eq(comments.postId, posts.id))
    .orderBy(desc(comments.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const totalRow = await db.select({ count: sql<number>`count(*)` }).from(comments).get();

  return c.json({ items: rows, pagination: { page, pageSize, total: Number(totalRow?.count ?? 0) } });
});

app.patch("/comments/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const parsed = UpdateCommentStatusSchema.safeParse(await c.req.json());

  if (!parsed.success) {
    return c.json({ code: 400, message: "评论状态不合法" }, 400);
  }

  const [updated] = await db
    .update(comments)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(eq(comments.id, id))
    .returning();

  if (!updated) {
    return c.json({ code: 404, message: "评论不存在" }, 404);
  }

  return c.json(updated);
});

app.get("/users", async (c) => {
  const db = c.get("db");
  const page = Math.max(1, Number(c.req.query("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, Number(c.req.query("pageSize") || "10")));

  const rows = await db
    .select({
      id: users.id,
      githubId: users.githubId,
      username: users.username,
      email: users.email,
      avatarUrl: users.avatarUrl,
      role: users.role,
      status: users.status,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const totalRow = await db.select({ count: sql<number>`count(*)` }).from(users).get();

  return c.json({ items: rows, pagination: { page, pageSize, total: Number(totalRow?.count ?? 0) } });
});

app.get("/music-tracks", async (c) => {
  const db = c.get("db");
  const rows = await db.select().from(musicTracks).orderBy(musicTracks.sortOrder, desc(musicTracks.updatedAt));
  return c.json({
    items: rows.map((row) => ({
      ...row,
      cachedAt: row.cachedAt?.toISOString() ?? null,
      cacheExpiresAt: row.cacheExpiresAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
  });
});

app.post("/music-tracks", async (c) => {
  const db = c.get("db");
  const parsed = CreateMusicTrackSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: 400, message: "歌曲参数不合法" }, 400);

  const exists = await db.select({ id: musicTracks.id }).from(musicTracks).where(eq(musicTracks.neteaseId, parsed.data.neteaseId)).get();
  if (exists) return c.json({ code: 400, message: "歌曲 ID 已存在" }, 400);

  let cachedUrl: string | null = null;
  let cacheExpiresAt: Date | null = null;
  let cachedAt: Date | null = null;
  let detail: Awaited<ReturnType<typeof resolveMusicDetail>> | null = null;
  let lyric: string | null = null;
  try {
    detail = await resolveMusicDetail(parsed.data.neteaseId);
  } catch {
    // 详情接口失败时仍允许保存手动填写的歌曲信息。
  }
  try {
    lyric = await resolveMusicLyric(parsed.data.neteaseId);
  } catch {
    // 歌词接口失败时保留手动填写。
  }
  try {
    const resolved = await resolveMusicUrl(parsed.data.neteaseId, parsed.data.level);
    cachedUrl = resolved.url;
    cacheExpiresAt = resolved.expiresAt;
    cachedAt = new Date();
  } catch {
    // 保存配置，后续播放或手动刷新时再获取。
  }

  const [created] = await db
    .insert(musicTracks)
    .values({
      ...parsed.data,
      title: parsed.data.title || detail?.title || parsed.data.neteaseId,
      artist: parsed.data.artist ?? detail?.artist ?? null,
      album: parsed.data.album ?? detail?.album ?? null,
      cover: parsed.data.cover ?? detail?.cover ?? null,
      lyric: parsed.data.lyric ?? lyric,
      cachedUrl,
      cachedAt,
      cacheExpiresAt,
      updatedAt: new Date(),
    })
    .returning();
  return c.json(created);
});

app.post("/music-tracks/import-playlist", async (c) => {
  const db = c.get("db");
  const parsed = ImportMusicPlaylistSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: 400, message: "歌单参数不合法" }, 400);

  const playlistId = extractPlaylistId(parsed.data.playlist);
  if (!playlistId) return c.json({ code: 400, message: "请输入网易云歌单 ID 或链接" }, 400);

  try {
    const playlist = await resolvePlaylist(playlistId);
    const tracks = playlist.tracks.map(playlistTrackToMusicTrack).filter((track) => /^\d+$/.test(track.neteaseId));
    if (tracks.length === 0) return c.json({ code: 400, message: "歌单中没有可导入的歌曲" }, 400);

    const existing = await db.select({ neteaseId: musicTracks.neteaseId, sortOrder: musicTracks.sortOrder }).from(musicTracks);
    const existingIds = new Set(existing.map((item) => item.neteaseId));
    const imported = [];
    let skipped = 0;
    let sortOrder =
      parsed.data.startSortOrder ??
      Math.max(0, ...existing.map((item) => item.sortOrder)) + 1;

    for (const track of tracks) {
      if (existingIds.has(track.neteaseId)) {
        skipped += 1;
        await db
          .update(musicTracks)
          .set({
            playlistId: playlist.id,
            playlistName: playlist.name,
            playlistCover: playlist.cover,
            updatedAt: new Date(),
          })
          .where(and(eq(musicTracks.neteaseId, track.neteaseId), isNull(musicTracks.playlistId)));
        continue;
      }
      const [created] = await db
        .insert(musicTracks)
        .values({
          neteaseId: track.neteaseId,
          title: track.title,
          artist: track.artist,
          album: track.album,
          cover: track.cover,
          playlistId: playlist.id,
          playlistName: playlist.name,
          playlistCover: playlist.cover,
          level: parsed.data.level,
          sortOrder,
          status: parsed.data.status,
          updatedAt: new Date(),
        })
        .returning();
      imported.push(created);
      existingIds.add(track.neteaseId);
      sortOrder += 1;
    }

    return c.json({
      playlistId,
      playlistName: playlist.name,
      playlistCover: playlist.cover,
      imported: imported.length,
      skipped,
      total: tracks.length,
      items: imported,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "导入歌单失败";
    return c.json({ code: 502, message }, 502);
  }
});

app.patch("/music-tracks/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const parsed = UpdateMusicTrackSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: 400, message: "歌曲参数不合法" }, 400);

  const existing = await db.select().from(musicTracks).where(eq(musicTracks.id, id)).get();
  if (!existing) return c.json({ code: 404, message: "歌曲不存在" }, 404);

  let detail: Awaited<ReturnType<typeof resolveMusicDetail>> | null = null;
  let lyric: string | null = null;
  const nextNeteaseId = parsed.data.neteaseId ?? existing.neteaseId;
  if (parsed.data.neteaseId && parsed.data.neteaseId !== existing.neteaseId) {
    try {
      detail = await resolveMusicDetail(parsed.data.neteaseId);
    } catch {
      // 保留手动输入。
    }
    try {
      lyric = await resolveMusicLyric(parsed.data.neteaseId);
    } catch {
      // 保留手动输入。
    }
  }

  const [updated] = await db
    .update(musicTracks)
    .set({
      ...parsed.data,
      title: parsed.data.title ?? detail?.title ?? existing.title,
      artist: parsed.data.artist !== undefined ? parsed.data.artist : detail?.artist ?? existing.artist,
      album: parsed.data.album !== undefined ? parsed.data.album : detail?.album ?? existing.album,
      cover: parsed.data.cover !== undefined ? parsed.data.cover : detail?.cover ?? existing.cover,
      lyric: parsed.data.lyric !== undefined ? parsed.data.lyric : lyric ?? existing.lyric,
      neteaseId: nextNeteaseId,
      updatedAt: new Date(),
    })
    .where(eq(musicTracks.id, id))
    .returning();
  return c.json(updated);
});

app.post("/music-tracks/:id/refresh", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const existing = await db.select().from(musicTracks).where(eq(musicTracks.id, id)).get();
  if (!existing) return c.json({ code: 404, message: "歌曲不存在" }, 404);

  try {
    let detail: Awaited<ReturnType<typeof resolveMusicDetail>> | null = null;
    let lyric: string | null = null;
    try {
      detail = await resolveMusicDetail(existing.neteaseId);
    } catch {
      // 只刷新 URL 也可以。
    }
    try {
      lyric = await resolveMusicLyric(existing.neteaseId);
    } catch {
      // 歌词刷新不能阻塞 URL 刷新。
    }
    const resolved = await resolveMusicUrl(existing.neteaseId, existing.level);
    const [updated] = await db
      .update(musicTracks)
      .set({
        title: detail?.title ?? existing.title,
        artist: detail?.artist ?? existing.artist,
        album: detail?.album ?? existing.album,
        cover: detail?.cover ?? existing.cover,
        lyric: lyric ?? existing.lyric,
        cachedUrl: resolved.url,
        cachedAt: new Date(),
        cacheExpiresAt: resolved.expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(musicTracks.id, id))
      .returning();
    return c.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "刷新歌曲 URL 失败";
    return c.json({ code: 502, message }, 502);
  }
});

app.delete("/music-tracks/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  await db.delete(musicTracks).where(eq(musicTracks.id, id));
  return c.json({ success: true });
});

app.patch("/users/:id/role", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const currentUser = c.get("user");
  const parsed = UpdateUserRoleSchema.safeParse(await c.req.json());

  if (!parsed.success) {
    return c.json({ code: 400, message: "角色参数不合法" }, 400);
  }

  if (currentUser?.id === id && parsed.data.role !== "admin") {
    return c.json({ code: 400, message: "不能移除自己的管理员权限" }, 400);
  }

  const [updated] = await db
    .update(users)
    .set({ role: parsed.data.role, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();

  if (!updated) {
    return c.json({ code: 404, message: "用户不存在" }, 404);
  }

  return c.json(updated);
});

app.patch("/users/:id/status", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const currentUser = c.get("user");
  const parsed = UpdateUserStatusSchema.safeParse(await c.req.json());

  if (!parsed.success) {
    return c.json({ code: 400, message: "状态参数不合法" }, 400);
  }

  if (currentUser?.id === id && parsed.data.status !== "active") {
    return c.json({ code: 400, message: "不能禁用自己的账户" }, 400);
  }

  const [updated] = await db
    .update(users)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(and(eq(users.id, id)))
    .returning();

  if (!updated) {
    return c.json({ code: 404, message: "用户不存在" }, 404);
  }

  return c.json(updated);
});

export default app;
