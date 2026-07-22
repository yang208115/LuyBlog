import { OpenAPIHono } from "@hono/zod-openapi";
import { asc, eq, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { musicTracks } from "../db/schema";
import type { Bindings } from "../types";

type Variables = {
  db: DrizzleD1Database<typeof schema>;
};

const app = new OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>();

function toDto(row: typeof musicTracks.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    album: row.album,
    cover: row.cover,
    lyric: row.lyric,
    url: row.url,
    sortOrder: row.sortOrder,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

app.get("/tracks", async (c) => {
  const db = c.get("db");
  const rows = await db
    .select()
    .from(musicTracks)
    .where(eq(musicTracks.status, "enabled"))
    .orderBy(sql`random()`, asc(musicTracks.sortOrder), asc(musicTracks.createdAt));

  return c.json(rows.map(toDto));
});

export default app;
