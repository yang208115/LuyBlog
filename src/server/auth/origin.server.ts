import { env } from "cloudflare:workers";

function isLoopbackHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]" || hostname === "::1";
}

function tryParseUrl(raw: string | undefined): URL | null {
  if (!raw) return null;
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

function matchesExpectedOrigin(originUrl: URL, expectedUrl: URL): boolean {
  if (originUrl.origin === expectedUrl.origin) return true;

  return (
    originUrl.protocol === "http:" &&
    expectedUrl.protocol === "http:" &&
    isLoopbackHost(originUrl.hostname) &&
    isLoopbackHost(expectedUrl.hostname) &&
    originUrl.port === expectedUrl.port
  );
}

export function assertSameOriginWithBase(request: Request, appBaseUrl?: string): void {
  if (request.method === "GET" || request.method === "HEAD") return;

  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite === "cross-site") {
    throw new Error("禁止跨站请求");
  }

  const origin = request.headers.get("origin");
  if (!origin) return;

  const originUrl = tryParseUrl(origin);
  if (!originUrl) {
    throw new Error("请求来源无效");
  }

  const expectedUrls = [tryParseUrl(request.url), tryParseUrl(appBaseUrl)].filter(
    (url): url is URL => url !== null,
  );
  if (expectedUrls.length === 0) {
    throw new Error("请求来源无效");
  }

  if (expectedUrls.some((expectedUrl) => matchesExpectedOrigin(originUrl, expectedUrl))) {
    return;
  }

  throw new Error("请求来源校验失败");
}

export function assertSameOrigin(request: Request): void {
  assertSameOriginWithBase(request, env.APP_BASE_URL);
}
