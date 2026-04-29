type ChatMessage = {
  role: "system" | "user";
  content: string;
};

type BindingsLike = {
  OPENAI_API_KEY?: string;
  AI_BASE_URL?: string;
  AI_MODEL?: string;
};

type ChatResult = {
  text: string;
};

const defaultBaseUrl = "https://api.openai.com/v1";
const defaultModel = "gpt-4.1-mini";

async function runChat(env: BindingsLike, messages: ChatMessage[], temperature = 0.3): Promise<ChatResult> {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("AI 服务未配置 OPENAI_API_KEY");
  }

  const baseUrl = env.AI_BASE_URL || defaultBaseUrl;
  const model = env.AI_MODEL || defaultModel;

  const response = await fetch(`${baseUrl}/chat/completions`, {
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

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI 服务调用失败: ${response.status} ${errorText}`);
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

export async function generateSummary(env: BindingsLike, title: string, contentMd: string): Promise<string> {
  const result = await runChat(
    env,
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

export async function suggestTitles(env: BindingsLike, contentMd: string, count: number): Promise<string[]> {
  const result = await runChat(
    env,
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

export async function moderateComment(env: BindingsLike, content: string): Promise<{ flagged: boolean; reason: string | null }> {
  if (!env.OPENAI_API_KEY) {
    return { flagged: false, reason: null };
  }

  const result = await runChat(
    env,
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

  try {
    const parsed = JSON.parse(result.text) as { flagged?: boolean; reason?: string | null };
    return {
      flagged: Boolean(parsed.flagged),
      reason: parsed.reason ?? null,
    };
  } catch {
    return { flagged: false, reason: null };
  }
}
