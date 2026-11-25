export type TurnstileEnv = {
  TURNSTILE_SECRET?: string;
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_HOSTNAMES?: string;
  APP_BASE_URL?: string;
};

type SiteverifyResponse = {
  success?: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
};

export function isLocalBypassAllowed(env: TurnstileEnv): boolean {
  const hasSecret = Boolean(env.TURNSTILE_SECRET?.trim());
  const hasSiteKey = Boolean(env.TURNSTILE_SITE_KEY?.trim());
  if (hasSecret || hasSiteKey) return false;
  if (!env.APP_BASE_URL) return false;
  try {
    const { hostname } = new URL(env.APP_BASE_URL);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

export async function verifyTurnstileToken(options: {
  token: string;
  expectedAction: string;
  remoteIp?: string | null;
  env: TurnstileEnv;
  fetchImpl?: typeof fetch;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const { token, expectedAction, remoteIp, env, fetchImpl = fetch } = options;

  if (isLocalBypassAllowed(env)) {
    console.warn(
      `[Turnstile] 本地开发模式（未配置 TURNSTILE_SECRET/TURNSTILE_SITE_KEY），已跳过 ${expectedAction} 校验`,
    );
    return { ok: true };
  }

  const secret = env.TURNSTILE_SECRET?.trim();
  const allowedHostnames = new Set(
    (env.TURNSTILE_HOSTNAMES ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );

  if (!secret || allowedHostnames.size === 0) {
    return { ok: false, message: "人机验证服务未正确配置" };
  }

  if (typeof token !== "string" || token.length === 0 || token.length > 2048) {
    return { ok: false, message: "请先完成人机验证" };
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });
  if (remoteIp) {
    body.set("remoteip", remoteIp);
  }

  let result: SiteverifyResponse;
  try {
    const response = await fetchImpl("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      return { ok: false, message: "人机验证服务异常，请稍后重试" };
    }
    result = (await response.json()) as SiteverifyResponse;
  } catch {
    return { ok: false, message: "人机验证请求失败，请重试" };
  }

  if (
    result.success !== true ||
    result.action !== expectedAction ||
    !result.hostname ||
    !allowedHostnames.has(result.hostname)
  ) {
    return { ok: false, message: "人机验证未通过，请刷新重试" };
  }

  return { ok: true };
}
