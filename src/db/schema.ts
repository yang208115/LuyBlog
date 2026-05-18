import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";

export const users = sqliteTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    githubId: text("github_id").notNull().unique(),
    username: text("username").notNull(),
    email: text("email"),
    avatarUrl: text("avatar_url"),
    apiKey: text("api_key")
      .notNull()
      .unique()
      .$defaultFn(() => `ak-${createId()}`),
    role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
    status: text("status", { enum: ["active", "banned"] }).notNull().default("active"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [index("users_github_id_idx").on(table.githubId), index("users_api_key_idx").on(table.apiKey)],
);

export const userSessions = sqliteTable(
  "user_sessions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sessionToken: text("session_token").notNull().unique(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("user_sessions_session_token_idx").on(table.sessionToken),
    index("user_sessions_user_id_idx").on(table.userId),
  ],
);

export const posts = sqliteTable(
  "posts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    summary: text("summary"),
    cover: text("cover"),
    tags: text("tags"),
    category: text("category"),
    readingTime: integer("reading_time"),
    viewCount: integer("view_count").notNull().default(0),
    frontmatter: text("frontmatter"),
    contentMd: text("content_md").notNull(),
    status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [
    index("posts_author_id_idx").on(table.authorId),
    index("posts_status_published_at_idx").on(table.status, table.publishedAt),
    index("posts_slug_idx").on(table.slug),
    index("posts_category_idx").on(table.category),
  ],
);

export const moments = sqliteTable(
  "moments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    slug: text("slug").notNull().unique(),
    contentMd: text("content_md").notNull(),
    location: text("location"),
    images: text("images"),
    frontmatter: text("frontmatter"),
    status: text("status", { enum: ["draft", "published"] }).notNull().default("published"),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [
    index("moments_status_published_at_idx").on(table.status, table.publishedAt),
    index("moments_slug_idx").on(table.slug),
  ],
);

export const pages = sqliteTable(
  "pages",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    contentMd: text("content_md").notNull(),
    frontmatter: text("frontmatter"),
    status: text("status", { enum: ["draft", "published"] }).notNull().default("published"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [index("pages_slug_idx").on(table.slug), index("pages_status_idx").on(table.status)],
);

export const projects = sqliteTable(
  "projects",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text("name").notNull(),
    description: text("description"),
    icon: text("icon"),
    githubUrl: text("github_url"),
    tags: text("tags"),
    sortOrder: integer("sort_order").notNull().default(0),
    status: text("status", { enum: ["draft", "published"] }).notNull().default("published"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [index("projects_status_sort_idx").on(table.status, table.sortOrder)],
);

export const friendLinks = sqliteTable(
  "friend_links",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text("name").notNull(),
    description: text("description"),
    url: text("url").notNull(),
    avatarUrl: text("avatar_url"),
    sortOrder: integer("sort_order").notNull().default(0),
    status: text("status", { enum: ["draft", "published"] }).notNull().default("published"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [index("friend_links_status_sort_idx").on(table.status, table.sortOrder)],
);

export const musicTracks = sqliteTable(
  "music_tracks",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    neteaseId: text("netease_id").notNull().unique(),
    title: text("title").notNull(),
    artist: text("artist"),
    album: text("album"),
    cover: text("cover"),
    lyric: text("lyric"),
    cachedUrl: text("cached_url"),
    cachedAt: integer("cached_at", { mode: "timestamp" }),
    cacheExpiresAt: integer("cache_expires_at", { mode: "timestamp" }),
    level: text("level").notNull().default("exhigh"),
    sortOrder: integer("sort_order").notNull().default(0),
    status: text("status", { enum: ["enabled", "disabled"] }).notNull().default("enabled"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [
    index("music_tracks_netease_id_idx").on(table.neteaseId),
    index("music_tracks_status_sort_idx").on(table.status, table.sortOrder),
  ],
);

export const comments = sqliteTable(
  "comments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    postId: text("post_id").references(() => posts.id, { onDelete: "cascade" }),
    targetType: text("target_type", { enum: ["post"] }).notNull().default("post"),
    targetSlug: text("target_slug"),
    parentId: text("parent_id"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    status: text("status", { enum: ["visible", "hidden"] }).notNull().default("visible"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [
    index("comments_post_id_created_at_idx").on(table.postId, table.createdAt),
    index("comments_target_created_at_idx").on(table.targetType, table.targetSlug, table.createdAt),
    index("comments_parent_id_idx").on(table.parentId),
    index("comments_user_id_idx").on(table.userId),
    index("comments_status_idx").on(table.status),
  ],
);

export const siteSettings = sqliteTable("site_settings", {
  key: text("key").primaryKey().notNull(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});
