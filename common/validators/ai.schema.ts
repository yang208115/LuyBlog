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

export const ErrorSchema = z.object({
  code: z.number(),
  message: z.string(),
});
