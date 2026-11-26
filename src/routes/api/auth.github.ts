import { env } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";
import {
  formatCookieHeader,
  generateSecureToken,
  isHttpsUrl,
  OAUTH_NEXT_COOKIE,
  OAUTH_STATE_COOKIE,
  sanitizeNextPath,
} from "@/server/auth/session";

export const Route = createFileRoute("/api/auth/github")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const clientId = env.GITHUB_CLIENT_ID?.trim();
        const baseUrl = (env.APP_BASE_URL || new URL(request.url).origin).replace(/\/+$/, "");

        if (!clientId) {
          return Response.json({ success: false, message: "GitHub OAuth 未配置" }, { status: 500 });
        }

        const url = new URL(request.url);
        const nextPath = sanitizeNextPath(url.searchParams.get("next"));
        const state = generateSecureToken(16);
        const secure = isHttpsUrl(baseUrl);

        const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
        githubAuthUrl.searchParams.set("client_id", clientId);
        githubAuthUrl.searchParams.set("redirect_uri", `${baseUrl}/auth/callback`);
        githubAuthUrl.searchParams.set("scope", "user:email");
        githubAuthUrl.searchParams.set("state", state);

        const headers = new Headers({
          Location: githubAuthUrl.toString(),
          "Cache-Control": "no-store",
        });
        headers.append("Set-Cookie", formatCookieHeader(OAUTH_STATE_COOKIE, state, { maxAge: 600, secure }));
        headers.append(
          "Set-Cookie",
          formatCookieHeader(OAUTH_NEXT_COOKIE, nextPath, { maxAge: 600, secure }),
        );

        return new Response(null, { status: 302, headers });
      },
    },
  },
});
