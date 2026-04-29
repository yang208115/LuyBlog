import { z } from "@hono/zod-openapi";

export const PaginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => Number(v ?? "1"))
    .pipe(z.number().int().min(1)),
  pageSize: z
    .string()
    .optional()
    .transform((v) => Number(v ?? "10"))
    .pipe(z.number().int().min(1).max(50)),
});

export const PostPathIdSchema = z.object({
  id: z.string().min(1),
});

export const PostPathSlugSchema = z.object({
  slug: z.string().min(1),
});

export const PostSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  title: z.string(),
  slug: z.string(),
  summary: z.string().nullable(),
  contentMd: z.string(),
  status: z.enum(["draft", "published"]),
  publishedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const PostListItemSchema = PostSchema.pick({
  id: true,
  authorId: true,
  title: true,
  slug: true,
  summary: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const PostListResponseSchema = z.object({
  items: z.array(PostListItemSchema),
  pagination: z.object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    total: z.number().int().min(0),
  }),
});

export const CommentSchema = z.object({
  id: z.string(),
  postId: z.string(),
  userId: z.string(),
  content: z.string(),
  status: z.enum(["visible", "hidden"]),
  createdAt: z.string(),
  updatedAt: z.string(),
  user: z.object({
    id: z.string(),
    username: z.string(),
    avatarUrl: z.string().nullable(),
  }),
});

export const CreateCommentSchema = z.object({
  content: z.string().trim().min(1).max(1000),
});

export const DeleteCommentPathSchema = z.object({
  id: z.string().min(1),
});

export const ErrorSchema = z.object({
  code: z.number(),
  message: z.string(),
});
