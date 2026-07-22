import type {
  AiChatMessage,
  AiCompletePostResponse,
  AiCompletionField,
  AiPostContext,
} from "../../common/validators/ai.schema";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AiConfig = {
  apiKey?: string | null;
  baseUrl?: string | null;
  model?: string | null;
  systemPrompt?: string | null;
  maxTokens?: number | null;
  temperature?: number | null;
};

type ChatResult = {
  text: string;
};

type Taxonomy = {
  categories: string[];
  tags: string[];
};

const defaultBaseUrl = "https://api.openai.com/v1";
const defaultModel = "gpt-4.1-mini";

export function chatCompletionsUrl(baseUrl: string) {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/chat/completions") ? trimmed : `${trimmed}/chat/completions`;
}

async function runChatWithConfig(
  config: AiConfig,
  messages: ChatMessage[],
  temperature?: number,
): Promise<ChatResult> {
  const apiKey = config.apiKey?.trim();
  if (!apiKey) {
    throw new Error("AI 服务未配置 API Key");
  }

  const baseUrl = config.baseUrl?.trim() || defaultBaseUrl;
  const model = config.model?.trim() || defaultModel;

  const response = await fetch(chatCompletionsUrl(baseUrl), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: config.maxTokens ?? undefined,
      temperature: temperature ?? config.temperature ?? 0.3,
      messages,
    }),
  });

  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI 服务调用失败: ${response.status} ${errorText.slice(0, 500)}`);
  }
  if (!contentType.includes("application/json")) {
    const bodyText = await response.text();
    throw new Error(`AI 服务返回非 JSON 响应: ${contentType || "unknown"} ${bodyText.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("AI 返回为空");
  }

  return { text };
}

export async function chatWithConfig(
  config: AiConfig,
  messages: AiChatMessage[],
  context?: AiPostContext,
): Promise<string> {
  const articleContext = context
    ? `\n\n当前文章（可能尚未保存）：\n标题：${context.title || "未填写"}\nSlug：${context.slug || "未填写"}\n摘要：${context.summary || "未填写"}\n分类：${context.category || "未填写"}\n标签：${context.tags.join("、") || "未填写"}\n\n正文：\n${context.contentMd || "未填写"}`
    : "";
  const systemPrompt = [
    config.systemPrompt?.trim(),
    context
      ? "你正在后台协助管理员撰写博客。回答应结合给定文章上下文；除非管理员明确要求，否则不要虚构事实。"
      : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const result = await runChatWithConfig(config, [
    { role: "system", content: `${systemPrompt}${articleContext}` },
    ...messages,
  ]);
  return result.text;
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const source = fenced ?? text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  if (!source.trim()) throw new Error("AI 未返回 JSON");
  return JSON.parse(source);
}

function uniqueStrings(value: unknown, max: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(String).map((item) => item.trim()).filter(Boolean))]
    .map((item) => item.slice(0, maxLength))
    .slice(0, max);
}

export function normalizeSlug(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 120)
    .replace(/-+$/g, "");
}

export async function makeUniqueSlug(
  proposed: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = normalizeSlug(proposed);
  if (!base) throw new Error("AI 未生成有效的英文 slug");
  if (!(await exists(base))) return base;

  for (let suffix = 2; suffix <= 9999; suffix += 1) {
    const marker = `-${suffix}`;
    const candidate = `${base.slice(0, 120 - marker.length).replace(/-+$/g, "")}${marker}`;
    if (!(await exists(candidate))) return candidate;
  }
  throw new Error("无法生成可用的 slug");
}

export async function completePostWithConfig(
  config: AiConfig,
  fields: AiCompletionField[],
  context: AiPostContext,
  taxonomy: Taxonomy,
): Promise<AiCompletePostResponse> {
  const requested = [...new Set(fields)];
  const result = await runChatWithConfig(
    config,
    [
      {
        role: "system",
        content:
          "你是专业中文博客编辑。只返回一个合法 JSON 对象，不要使用 Markdown。标题最多给 3 个候选；摘要 80-150 个中文字符；slug 必须是简洁、有意义的小写英文 ASCII 连字符格式；分类只给一个；标签最多 5 个。分类和标签优先复用现有词库，确实不合适时才创建新词。只返回请求的字段。",
      },
      {
        role: "user",
        content: `请求字段：${requested.join(", ")}\n现有分类：${taxonomy.categories.slice(0, 100).join("、") || "无"}\n现有标签：${taxonomy.tags.slice(0, 200).join("、") || "无"}\n\n当前标题：${context.title || "未填写"}\n当前摘要：${context.summary || "未填写"}\n当前分类：${context.category || "未填写"}\n当前标签：${context.tags.join("、") || "未填写"}\n\n正文：\n${context.contentMd || "未填写"}`,
      },
    ],
    0.4,
  );

  let parsed: Record<string, unknown>;
  try {
    const value = extractJson(result.text);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("不是对象");
    parsed = value as Record<string, unknown>;
  } catch {
    throw new Error("AI 返回的文章信息格式无效，请重试");
  }

  const output: AiCompletePostResponse = {};
  if (requested.includes("titles")) output.titles = uniqueStrings(parsed.titles, 3, 200);
  if (requested.includes("slug")) output.slug = normalizeSlug(String(parsed.slug ?? ""));
  if (requested.includes("summary")) output.summary = String(parsed.summary ?? "").trim().slice(0, 150);
  if (requested.includes("category")) output.category = String(parsed.category ?? "").trim().slice(0, 80);
  if (requested.includes("tags")) output.tags = uniqueStrings(parsed.tags, 5, 40);

  const missing = requested.filter((field) => {
    const value = output[field];
    if (field === "summary") return typeof value !== "string" || value.length < 80;
    return Array.isArray(value) ? value.length === 0 : !value;
  });
  if (missing.length > 0) {
    throw new Error(`AI 未生成有效字段：${missing.join("、")}`);
  }
  return output;
}

export async function generateSummaryWithConfig(config: AiConfig, title: string, contentMd: string): Promise<string> {
  const result = await runChatWithConfig(
    config,
    [
      {
        role: "system",
        content: "你是专业中文技术博客编辑。请输出简洁摘要（80-150字），只返回摘要文本。",
      },
      {
        role: "user",
        content: `标题：${title}\n\n正文：${contentMd}`,
      },
    ],
    0.4,
  );

  return result.text;
}

export async function suggestTitlesWithConfig(config: AiConfig, contentMd: string, count: number): Promise<string[]> {
  const result = await runChatWithConfig(
    config,
    [
      {
        role: "system",
        content:
          "你是中文技术写作助手。请给出多个标题建议，输出 JSON 数组字符串，例如 [\"标题1\",\"标题2\"]，不要输出其他文本。",
      },
      {
        role: "user",
        content: `请基于以下正文生成 ${count} 个标题建议：\n\n${contentMd}`,
      },
    ],
    0.7,
  );

  try {
    const parsed = JSON.parse(result.text);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((x) => String(x)).filter((x) => x.length > 0).slice(0, count);
  } catch {
    return result.text
      .split("\n")
      .map((line) => line.replace(/^[-\d.\s]+/, "").trim())
      .filter(Boolean)
      .slice(0, count);
  }
}

export async function moderateCommentWithConfig(config: AiConfig, content: string): Promise<{ flagged: boolean; reason: string | null }> {
  if (!config.apiKey?.trim()) return { flagged: false, reason: null };

  try {
    const result = await runChatWithConfig(
      config,
      [
        {
          role: "system",
          content:
            "你是评论审核助手。判断内容是否包含辱骂、人身攻击、仇恨、明显广告引流。返回 JSON：{\"flagged\":boolean,\"reason\":string|null}。",
        },
        { role: "user", content },
      ],
      0,
    );
    const parsed = JSON.parse(result.text) as { flagged?: boolean; reason?: string | null };
    return { flagged: Boolean(parsed.flagged), reason: parsed.reason ?? null };
  } catch (error) {
    console.warn("评论 AI 审核失败，已降级放行", error);
    return { flagged: false, reason: null };
  }
}
