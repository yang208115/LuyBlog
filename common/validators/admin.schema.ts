import { z } from "@hono/zod-openapi";

export const AdminListQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => Number(v ?? "1"))
    .pipe(z.number().int().min(1)),
  pageSize: z
    .string()
    .optional()
    .transform((v) => Number(v ?? "10"))
    .pipe(z.number().int().min(1).max(100)),
});

export const AdminPostPathSchema = z.object({
  id: z.string().min(1),
});

export const AdminCommentPathSchema = z.object({
  id: z.string().min(1),
});

export const AdminUserPathSchema = z.object({
  id: z.string().min(1),
});

export const CreatePostSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z.string().trim().min(1).max(120),
  summary: z.string().trim().max(500).nullable().optional(),
  cover: z.string().trim().max(1000).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  category: z.string().trim().max(80).nullable().optional(),
  contentMd: z.string().trim().min(1),
  status: z.enum(["draft", "published"]).default("draft"),
});

export const UpdatePostSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  slug: z.string().trim().min(1).max(120).optional(),
  summary: z.string().trim().max(500).nullable().optional(),
  cover: z.string().trim().max(1000).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  category: z.string().trim().max(80).nullable().optional(),
  contentMd: z.string().trim().min(1).optional(),
  status: z.enum(["draft", "published"]).optional(),
});

export const CreateMomentSchema = z.object({
  slug: z.string().trim().min(1).max(120),
  contentMd: z.string().trim().min(1),
  location: z.string().trim().max(120).nullable().optional(),
  images: z.array(z.string().trim().min(1).max(1000)).max(20).default([]),
  status: z.enum(["draft", "published"]).default("published"),
});

export const UpdateMomentSchema = CreateMomentSchema.partial();

export const CreateProjectSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(500).nullable().optional(),
  icon: z.string().trim().max(80).nullable().optional(),
  githubUrl: z.string().trim().max(1000).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  sortOrder: z.number().int().min(0).max(9999).default(0),
  status: z.enum(["draft", "published"]).default("published"),
});

export const UpdateProjectSchema = CreateProjectSchema.partial();

export const CreatePageSchema = z.object({
  slug: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(160),
  contentMd: z.string().trim().min(1),
  status: z.enum(["draft", "published"]).default("published"),
});

export const UpdatePageSchema = CreatePageSchema.partial();

export const CreateFriendLinkSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(300).nullable().optional(),
  url: z.string().trim().min(1).max(1000),
  avatarUrl: z.string().trim().max(1000).nullable().optional(),
  sortOrder: z.number().int().min(0).max(9999).default(0),
  status: z.enum(["draft", "published"]).default("published"),
});

export const UpdateFriendLinkSchema = CreateFriendLinkSchema.partial();

export const ApplyFriendLinkSchema = CreateFriendLinkSchema.pick({
  name: true,
  url: true,
}).extend({
  description: z.string().trim().min(1).max(300),
  avatarUrl: z.string().trim().min(1).max(1000),
});

export const UpdateCommentStatusSchema = z.object({
  status: z.enum(["visible", "hidden"]),
});

export const UpdateUserRoleSchema = z.object({
  role: z.enum(["user", "admin"]),
});

export const UpdateUserStatusSchema = z.object({
  status: z.enum(["active", "banned"]),
});

export const CreateMusicTrackSchema = z.object({
  neteaseId: z.string().trim().regex(/^\d+$/, "歌曲 ID 必须是数字"),
  title: z.string().trim().max(200).optional().default(""),
  artist: z.string().trim().max(200).nullable().optional(),
  album: z.string().trim().max(200).nullable().optional(),
  cover: z.string().trim().max(1000).nullable().optional(),
  lyric: z.string().trim().max(2000).nullable().optional(),
  level: z.string().trim().min(1).max(40).default("exhigh"),
  sortOrder: z.number().int().min(0).max(9999).default(0),
  status: z.enum(["enabled", "disabled"]).default("enabled"),
});

export const UpdateMusicTrackSchema = CreateMusicTrackSchema.partial();

export const SiteConfigSchema = z.object({
  title: z.string().trim().min(1).max(120),
  faviconUrl: z.string().trim().max(1000),
  authorName: z.string().trim().min(1).max(80),
  bio: z.string().trim().max(500),
  navTitle: z.string().trim().max(40),
  navSuffix: z.string().trim().max(20),
  navAfter: z.string().trim().max(40),
  avatarUrl: z.string().trim().max(1000),
  bgImages: z.array(z.string().trim().min(1).max(1000)).max(20),
  defaultPostCover: z.string().trim().max(1000),
  social: z.object({
    github: z.string().trim().max(1000),
    gitee: z.string().trim().max(1000),
    google: z.string().trim().max(1000),
    email: z.string().trim().max(200),
    qq: z.string().trim().max(80),
    wechat: z.string().trim().max(120),
  }),
  buildDate: z.string().trim().min(1).max(80),
  footerBadges: z.array(z.object({ name: z.string().trim().min(1).max(80), color: z.string().trim().max(80) })).max(20),
  icpConfig: z.object({ name: z.string().trim().min(1).max(120), link: z.string().trim().min(1).max(1000) }).nullable(),
  friendLinkApplyFormat: z.string().trim().max(2000),
  aiConfig: z.object({
    apiKey: z.string().trim().max(4000),
    baseUrl: z.string().trim().min(1).max(1000),
    model: z.string().trim().min(1).max(120),
    systemPrompt: z.string().trim().max(4000),
    maxTokens: z.number().int().min(1).max(8000),
    temperature: z.number().min(0).max(2),
  }),
});

export const ErrorSchema = z.object({
  code: z.number(),
  message: z.string(),
});
