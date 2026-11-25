import { env } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import {
  constantTimeEqual,
  createSession,
  formatCookieHeader,
  isAdminGithubId,
  isHttpsUrl,
  OAUTH_NEXT_COOKIE,
  OAUTH_STATE_COOKIE,
  parseCookieHeader,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  sanitizeNextPath,
} from "@/server/auth/session";
import { getDb } from "@/server/db";
import { users } from "@/server/db/schema";

function redirectWithClearOAuth(location: string, secure: boolean, extraCookies: string[] = []): Response {
  const headers = new Headers({
    Location: location,
    "Cache-Control": "no-store",
  });
  headers.append("Set-Cookie", formatCookieHeader(OAUTH_STATE_COOKIE, "", { maxAge: 0, secure }));
  headers.append("Set-Cookie", formatCookieHeader(OAUTH_NEXT_COOKIE, "", { maxAge: 0, secure }));
  for (const cookie of extraCookies) {
    headers.append("Set-Cookie", cookie);
  }
  return new Response(null, { status: 302, headers });
}

export const Route = createFileRoute("/auth/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const baseUrl = (env.APP_BASE_URL || new URL(request.url).origin).replace(/\/+$/, "");
        const secure = isHttpsUrl(baseUrl);
        const url = new URL(request.url);
        const code = url.searchParams.get("code")?.trim() ?? "";
        const state = url.searchParams.get("state")?.trim() ?? "";

        const cookieHeader = request.headers.get("cookie");
        const expectedState = parseCookieHeader(cookieHeader, OAUTH_STATE_COOKIE) ?? "";
        const nextPath = sanitizeNextPath(parseCookieHeader(cookieHeader, OAUTH_NEXT_COOKIE));

        if (!code || !state || !expectedState || !constantTimeEqual(state, expectedState)) {
          return redirectWithClearOAuth("/?authError=invalid_state", secure);
        }

        try {
          const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              client_id: env.GITHUB_CLIENT_ID,
              client_secret: env.GITHUB_CLIENT_SECRET,
              code,
              redirect_uri: `${baseUrl}/auth/callback`,
            }),
            signal: AbortSignal.timeout(10_000),
          });

          if (!tokenResponse.ok) {
            return redirectWithClearOAuth("/?authError=oauth_failed", secure);
          }

          const tokenData = (await tokenResponse.json()) as { access_token?: string };
          if (!tokenData.access_token) {
            return redirectWithClearOAuth("/?authError=oauth_failed", secure);
          }

          const userResponse = await fetch("https://api.github.com/user", {
            headers: {
              Authorization: `token ${tokenData.access_token}`,
              "User-Agent": "luy-blog",
              Accept: "application/vnd.github.v3+json",
            },
            signal: AbortSignal.timeout(10_000),
          });

          if (!userResponse.ok) {
            return redirectWithClearOAuth("/?authError=oauth_failed", secure);
          }

          const githubUser = (await userResponse.json()) as {
            id?: number;
            login?: string;
            email?: string | null;
            avatar_url?: string | null;
          };

          if (!githubUser.id || !githubUser.login) {
            return redirectWithClearOAuth("/?authError=oauth_failed", secure);
          }

          const githubId = String(githubUser.id);
          const db = getDb();
          const shouldPromoteAdmin = isAdminGithubId(githubId, env.ADMIN_GITHUB_ID);
          const existing = await db.select().from(users).where(eq(users.githubId, githubId)).get();

          let userId: string;
          let userStatus: "active" | "banned";

          if (existing) {
            userId = existing.id;
            userStatus = existing.status;
            if (userStatus === "banned") {
              return redirectWithClearOAuth("/?authError=banned", secure);
            }
            await db
              .update(users)
              .set({
                username: githubUser.login,
                email: githubUser.email || existing.email,
                avatarUrl: githubUser.avatar_url || existing.avatarUrl,
                role: shouldPromoteAdmin ? "admin" : existing.role,
                updatedAt: new Date(),
              })
              .where(eq(users.id, existing.id));
          } else {
            const [created] = await db
              .insert(users)
              .values({
                githubId,
                username: githubUser.login,
                email: githubUser.email || null,
                avatarUrl: githubUser.avatar_url || null,
                role: shouldPromoteAdmin ? "admin" : "user",
                status: "active",
              })
              .returning({ id: users.id, status: users.status });

            if (!created) {
              return redirectWithClearOAuth("/?authError=oauth_failed", secure);
            }
            userId = created.id;
            userStatus = created.status;
          }

          if (userStatus === "banned") {
            return redirectWithClearOAuth("/?authError=banned", secure);
          }

          const { rawToken } = await createSession(db, userId);
          const sessionCookie = formatCookieHeader(SESSION_COOKIE, rawToken, {
            maxAge: SESSION_MAX_AGE_SECONDS,
            secure,
          });

          return redirectWithClearOAuth(nextPath, secure, [sessionCookie]);
        } catch (err) {
          console.error("[OAuth Callback] Failed:", err);
          return redirectWithClearOAuth("/?authError=oauth_failed", secure);
        }
      },
    },
  },
});
