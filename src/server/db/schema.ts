import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

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
    // 兼容历史 NOT NULL UNIQUE 约束：仅用于插入兜底，不在业务中读取或返回
    apiKey: text("api_key")
      .notNull()
      .unique()
      .$defaultFn(() => `legacy-${createId()}`),
    role: text("role", { enum: ["user", "admin"] })
      .notNull()
      .default("user"),
    status: text("status", { enum: ["active", "banned"] })
      .notNull()
      .default("active"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
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
    // 存储 rawToken 的 SHA-256 十六进制哈希
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
    status: text("status", { enum: ["draft", "published"] })
      .notNull()
      .default("draft"),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
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
    likeCount: integer("like_count").notNull().default(0),
    status: text("status", { enum: ["draft", "published"] })
      .notNull()
      .default("published"),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [
    index("moments_status_published_at_idx").on(table.status, table.publishedAt),
    index("moments_slug_idx").on(table.slug),
  ],
);

export const momentLikes = sqliteTable(
  "moment_likes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    momentId: text("moment_id")
      .notNull()
      .references(() => moments.id, { onDelete: "cascade" }),
    visitorHash: text("visitor_hash").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [uniqueIndex("moment_likes_moment_visitor_idx").on(table.momentId, table.visitorHash)],
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
    status: text("status", { enum: ["draft", "published"] })
      .notNull()
      .default("published"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
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
    status: text("status", { enum: ["draft", "published"] })
      .notNull()
      .default("published"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
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
    status: text("status", { enum: ["draft", "published"] })
      .notNull()
      .default("published"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [index("friend_links_status_sort_idx").on(table.status, table.sortOrder)],
);

export const navItems = sqliteTable(
  "nav_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    label: text("label").notNull(),
    path: text("path").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    status: text("status", { enum: ["enabled", "disabled"] })
      .notNull()
      .default("enabled"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [index("nav_items_status_sort_idx").on(table.status, table.sortOrder)],
);

export const comments = sqliteTable(
  "comments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    postId: text("post_id").references(() => posts.id, { onDelete: "cascade" }),
    targetType: text("target_type", { enum: ["post"] })
      .notNull()
      .default("post"),
    targetSlug: text("target_slug"),
    parentId: text("parent_id"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    status: text("status", { enum: ["visible", "hidden"] })
      .notNull()
      .default("visible"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
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
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
});

export const mediaAssets = sqliteTable(
  "media_assets",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    objectKey: text("object_key").notNull().unique(),
    filename: text("filename").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    uploadedBy: text("uploaded_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [index("media_assets_created_at_idx").on(table.createdAt)],
);

export const rateLimits = sqliteTable("rate_limits", {
  key: text("key").primaryKey().notNull(),
  count: integer("count").notNull().default(0),
  resetAt: integer("reset_at").notNull(),
});
