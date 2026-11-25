import { env } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";
import { assertSameOrigin } from "@/server/auth/origin.server";
import {
  deleteSessionByToken,
  formatCookieHeader,
  isHttpsUrl,
  parseCookieHeader,
  SESSION_COOKIE,
} from "@/server/auth/session";
import { getDb } from "@/server/db";

export const Route = createFileRoute("/api/auth/logout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          assertSameOrigin(request);
        } catch (err) {
          return Response.json(
            { success: false, message: err instanceof Error ? err.message : "禁止跨站请求" },
            { status: 403 },
          );
        }

        const rawToken = parseCookieHeader(request.headers.get("cookie"), SESSION_COOKIE);
        if (rawToken) {
          const db = getDb();
          await deleteSessionByToken(db, rawToken);
        }

        const baseUrl = env.APP_BASE_URL || request.url;
        const secure = isHttpsUrl(baseUrl);
        const headers = new Headers({
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        });
        headers.append("Set-Cookie", formatCookieHeader(SESSION_COOKIE, "", { maxAge: 0, secure }));

        return new Response(JSON.stringify({ success: true }), { status: 200, headers });
      },
    },
  },
});
