import { createMiddleware } from "@tanstack/react-start";

export const sessionMiddleware = createMiddleware().server(async ({ next, request }) => {
  const [{ getDb }, { getSessionUserFromToken, parseCookieHeader, SESSION_COOKIE }] = await Promise.all([
    import("../db"),
    import("./session"),
  ]);
  const db = getDb();
  const rawToken = parseCookieHeader(request.headers.get("cookie"), SESSION_COOKIE);
  const user = await getSessionUserFromToken(db, rawToken);
  return next({ context: { db, user } });
});

export const csrfCheckMiddleware = createMiddleware().server(async ({ next, request }) => {
  const { assertSameOrigin } = await import("./origin.server");
  assertSameOrigin(request);
  return next();
});

export const authMiddleware = createMiddleware()
  .middleware([sessionMiddleware])
  .server(async ({ next, context, request }) => {
    const { assertSameOrigin } = await import("./origin.server");
    assertSameOrigin(request);
    if (!context.user) {
      throw new Error("请先登录");
    }
    return next({ context: { user: context.user } });
  });

export const adminMiddleware = createMiddleware()
  .middleware([authMiddleware])
  .server(async ({ next, context }) => {
    if (context.user.role !== "admin") {
      throw new Error("需要管理员权限");
    }
    return next();
  });
