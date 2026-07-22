import { z } from "@hono/zod-openapi";

export const AiGenerateSummarySchema = z.object({
  title: z.string().trim().min(1).max(200),
  contentMd: z.string().trim().min(1).max(20000),
});

export const AiSuggestTitleSchema = z.object({
  contentMd: z.string().trim().min(1).max(20000),
  count: z.number().int().min(1).max(5).default(3),
});

export const AiModerateCommentSchema = z.object({
  content: z.string().trim().min(1).max(1000),
});

export const AiChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(4000),
});

export const AiPostContextSchema = z.object({
  title: z.string().max(200),
  slug: z.string().max(120),
  summary: z.string().max(500),
  category: z.string().max(80),
  tags: z.array(z.string().trim().min(1).max(40)).max(20),
  contentMd: z.string().max(20000),
});

export const AiChatSchema = z.object({
  messages: z.array(AiChatMessageSchema).min(1).max(20),
  context: AiPostContextSchema,
});

export const AiCompletionFieldSchema = z.enum(["titles", "slug", "summary", "category", "tags"]);

export const AiCompletePostSchema = z
  .object({
    fields: z.array(AiCompletionFieldSchema).min(1).max(5),
    context: AiPostContextSchema,
    postId: z.string().min(1).optional(),
  })
  .refine((value) => Boolean(value.context.title.trim() || value.context.contentMd.trim()), {
    message: "标题和正文不能同时为空",
  });

export const AiSummaryResponseSchema = z.object({
  summary: z.string(),
});

export const AiTitleResponseSchema = z.object({
  titles: z.array(z.string()),
});

export const AiModerationResponseSchema = z.object({
  flagged: z.boolean(),
  reason: z.string().nullable(),
  suggestedStatus: z.enum(["visible", "hidden"]),
});

export const AiChatResponseSchema = z.object({
  reply: z.string(),
});

export const AiCompletePostResponseSchema = z.object({
  titles: z.array(z.string()).optional(),
  slug: z.string().optional(),
  summary: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type AiChatMessage = z.infer<typeof AiChatMessageSchema>;
export type AiPostContext = z.infer<typeof AiPostContextSchema>;
export type AiCompletionField = z.infer<typeof AiCompletionFieldSchema>;
export type AiCompletePostResponse = z.infer<typeof AiCompletePostResponseSchema>;

export const ErrorSchema = z.object({
  code: z.number(),
  message: z.string(),
});
