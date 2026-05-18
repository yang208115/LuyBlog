type ChatMessage = {
  role: "system" | "user";
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

const defaultBaseUrl = "https://api.openai.com/v1";
const defaultModel = "gpt-4.1-mini";

export function chatCompletionsUrl(baseUrl: string) {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/chat/completions") ? trimmed : `${trimmed}/chat/completions`;
}

async function runChatWithConfig(config: AiConfig, messages: ChatMessage[], temperature = 0.3): Promise<ChatResult> {
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
      temperature,
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
    if (!Array.isArray(parsed)) {
      return [];
    }
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
  if (!config.apiKey?.trim()) {
    return { flagged: false, reason: null };
  }

  try {
    const result = await runChatWithConfig(
      config,
      [
        {
          role: "system",
          content:
            "你是评论审核助手。判断内容是否包含辱骂、人身攻击、仇恨、明显广告引流。返回 JSON：{\"flagged\":boolean,\"reason\":string|null}。",
        },
        {
          role: "user",
          content,
        },
      ],
      0,
    );
    const parsed = JSON.parse(result.text) as { flagged?: boolean; reason?: string | null };
    return {
      flagged: Boolean(parsed.flagged),
      reason: parsed.reason ?? null,
    };
  } catch (error) {
    console.warn("评论 AI 审核失败，已降级放行", error);
    return { flagged: false, reason: null };
  }
}
