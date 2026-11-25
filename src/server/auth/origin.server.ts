import { env } from "cloudflare:workers";

function isLoopbackHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function assertSameOrigin(request: Request): void {
  if (request.method === "GET" || request.method === "HEAD") return;

  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite === "cross-site") {
    throw new Error("禁止跨站请求");
  }

  const origin = request.headers.get("origin");
  if (!origin) return;

  let originUrl: URL;
  let expectedUrl: URL;
  try {
    originUrl = new URL(origin);
    expectedUrl = new URL(env.APP_BASE_URL || request.url);
  } catch {
    throw new Error("请求来源无效");
  }

  if (originUrl.origin === expectedUrl.origin) return;

  if (
    originUrl.protocol === "http:" &&
    expectedUrl.protocol === "http:" &&
    isLoopbackHost(originUrl.hostname) &&
    isLoopbackHost(expectedUrl.hostname) &&
    originUrl.port === expectedUrl.port
  ) {
    return;
  }

  throw new Error("请求来源校验失败");
}
