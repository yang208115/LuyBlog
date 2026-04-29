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
  contentMd: z.string().trim().min(1),
  status: z.enum(["draft", "published"]).default("draft"),
});

export const UpdatePostSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  slug: z.string().trim().min(1).max(120).optional(),
  summary: z.string().trim().max(500).nullable().optional(),
  contentMd: z.string().trim().min(1).optional(),
  status: z.enum(["draft", "published"]).optional(),
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

export const ErrorSchema = z.object({
  code: z.number(),
  message: z.string(),
});
