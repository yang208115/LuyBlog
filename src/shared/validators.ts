import { z } from "zod";

export function isSafeHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function isSafeRelativePath(value: string): boolean {
  return value.startsWith("/") && !value.startsWith("//") && !value.includes("\\");
}

export const safeHttpUrlSchema = z
  .string()
  .trim()
  .max(1000, "链接长度不能超过 1000 个字符")
  .refine(isSafeHttpUrl, "仅允许 http:// 或 https:// 开头的有效链接");

export const optionalSafeUrlSchema = z
  .string()
  .trim()
  .max(1000, "链接长度不能超过 1000 个字符")
  .refine((val) => val === "" || isSafeRelativePath(val) || isSafeHttpUrl(val), {
    message: "仅允许站内相对路径或 http(s):// 链接",
  });

export const safeNavPathSchema = z
  .string()
  .trim()
  .min(1, "路径不能为空")
  .max(1000, "路径长度不能超过 1000 个字符")
  .refine((val) => isSafeRelativePath(val) || isSafeHttpUrl(val), {
    message: "仅允许站内路径（以 / 开头）或 http(s):// 外部链接",
  });

export const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug 不能为空")
  .max(120, "Slug 长度不能超过 120 个字符")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug 仅允许小写字母、数字和单个连字符");

export const readableSlugSchema = z.string().trim().min(1).max(120);

export const IdSchema = z.object({
  id: z.string().trim().min(1).max(128),
});

export const PaginationSchema = z.object({
  page: z.number().int().min(1).max(1000).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export const PublicPostsQuerySchema = z.object({
  page: z.number().int().min(1).max(1000).default(1),
  pageSize: z.number().int().min(1).max(24).default(12),
  category: z.string().trim().max(80).optional(),
  tag: z.string().trim().max(40).optional(),
  q: z.string().trim().max(120).optional(),
});

export const CreatePostSchema = z.object({
  title: z.string().trim().min(1, "标题不能为空").max(200),
  slug: slugSchema,
  summary: z.string().trim().max(500).nullable().optional(),
  cover: optionalSafeUrlSchema.nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  category: z.string().trim().max(80).nullable().optional(),
  contentMd: z.string().trim().min(1, "正文不能为空"),
  status: z.enum(["draft", "published"]).default("draft"),
});

export const UpdatePostSchema = CreatePostSchema.partial().extend({
  id: z.string().trim().min(1).max(128),
});

export const CreateMomentSchema = z.object({
  slug: slugSchema,
  contentMd: z.string().trim().min(1, "瞬间内容不能为空"),
  location: z.string().trim().max(120).nullable().optional(),
  images: z
    .array(optionalSafeUrlSchema.refine((v) => v !== "", "图片 URL 不能为空"))
    .max(20)
    .default([]),
  status: z.enum(["draft", "published"]).default("published"),
});

export const UpdateMomentSchema = CreateMomentSchema.partial().extend({
  id: z.string().trim().min(1).max(128),
});

export const CreateProjectSchema = z.object({
  name: z.string().trim().min(1, "项目名称不能为空").max(160),
  description: z.string().trim().max(500).nullable().optional(),
  icon: z.string().trim().max(80).nullable().optional(),
  githubUrl: optionalSafeUrlSchema.nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  sortOrder: z.number().int().min(0).max(9999).default(0),
  status: z.enum(["draft", "published"]).default("published"),
});

export const UpdateProjectSchema = CreateProjectSchema.partial().extend({
  id: z.string().trim().min(1).max(128),
});

export const CreatePageSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(1, "页面标题不能为空").max(160),
  contentMd: z.string().trim().min(1, "页面内容不能为空"),
  status: z.enum(["draft", "published"]).default("published"),
});

export const UpdatePageSchema = CreatePageSchema.partial().extend({
  id: z.string().trim().min(1).max(128),
});

export const CreateFriendLinkSchema = z.object({
  name: z.string().trim().min(1, "站点名称不能为空").max(120),
  description: z.string().trim().max(300).nullable().optional(),
  url: safeHttpUrlSchema,
  avatarUrl: optionalSafeUrlSchema.nullable().optional(),
  sortOrder: z.number().int().min(0).max(9999).default(0),
  status: z.enum(["draft", "published"]).default("published"),
});

export const UpdateFriendLinkSchema = CreateFriendLinkSchema.partial().extend({
  id: z.string().trim().min(1).max(128),
});

export const ApplyFriendLinkSchema = z.object({
  name: z.string().trim().min(1, "站点名称不能为空").max(120),
  description: z.string().trim().min(1, "站点简介不能为空").max(300),
  url: safeHttpUrlSchema,
  avatarUrl: safeHttpUrlSchema,
  turnstileToken: z.string().trim().max(2048).default(""),
});

export const CreateNavItemSchema = z.object({
  label: z.string().trim().min(1, "导航名称不能为空").max(40),
  path: safeNavPathSchema,
  sortOrder: z.number().int().min(0).max(9999).default(0),
  status: z.enum(["enabled", "disabled"]).default("enabled"),
});

export const UpdateNavItemSchema = CreateNavItemSchema.partial().extend({
  id: z.string().trim().min(1).max(128),
});

export const ReorderNavItemsSchema = z.object({
  ids: z.array(z.string().trim().min(1)).min(1).max(100),
});

export const CreateCommentSchema = z.object({
  targetSlug: readableSlugSchema,
  parentId: z.string().trim().min(1).max(128).optional(),
  content: z.string().trim().min(1, "评论内容不能为空").max(1000, "评论内容不能超过 1000 字"),
  turnstileToken: z.string().trim().max(2048).default(""),
});

export const UpdateCommentStatusSchema = z.object({
  id: z.string().trim().min(1).max(128),
  status: z.enum(["visible", "hidden"]),
});

export const UpdateUserRoleSchema = z.object({
  id: z.string().trim().min(1).max(128),
  role: z.enum(["user", "admin"]),
});

export const UpdateUserStatusSchema = z.object({
  id: z.string().trim().min(1).max(128),
  status: z.enum(["active", "banned"]),
});

export const SiteConfigSchema = z.object({
  title: z.string().trim().min(1, "站点标题不能为空").max(120),
  subtitle: z.string().trim().max(200),
  faviconUrl: optionalSafeUrlSchema,
  authorName: z.string().trim().min(1, "作者名称不能为空").max(80),
  bio: z.string().trim().max(500),
  navTitle: z.string().trim().max(40),
  navSuffix: z.string().trim().max(20),
  navAfter: z.string().trim().max(40),
  avatarUrl: optionalSafeUrlSchema,
  heroImage: optionalSafeUrlSchema,
  defaultPostCover: optionalSafeUrlSchema,
  social: z.object({
    github: optionalSafeUrlSchema,
    demo: optionalSafeUrlSchema,
    gitee: optionalSafeUrlSchema,
    google: optionalSafeUrlSchema,
    email: z.string().trim().max(200),
    qq: z.string().trim().max(80),
    wechat: z.string().trim().max(120),
  }),
  buildDate: z.string().trim().min(1).max(80),
  footerBadges: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        color: z.string().trim().max(40).default("indigo"),
      }),
    )
    .max(20),
  icpConfig: z
    .object({
      name: z.string().trim().min(1).max(120),
      link: safeHttpUrlSchema,
    })
    .nullable(),
  friendLinkApplyFormat: z.string().trim().max(2000),
});
