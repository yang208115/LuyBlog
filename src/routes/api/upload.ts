import { env } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";
import { assertSameOrigin } from "@/server/auth/origin.server";
import { getSessionUserFromToken, parseCookieHeader, SESSION_COOKIE } from "@/server/auth/session";
import { getDb } from "@/server/db";
import { uploadImageToR2 } from "@/server/storage/r2";

export const Route = createFileRoute("/api/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          assertSameOrigin(request);
        } catch (err) {
          return Response.json(
            { message: err instanceof Error ? err.message : "禁止跨站请求" },
            { status: 403 },
          );
        }

        const db = getDb();
        const rawToken = parseCookieHeader(request.headers.get("cookie"), SESSION_COOKIE);
        const user = await getSessionUserFromToken(db, rawToken);
        if (!user) {
          return Response.json({ message: "请先登录" }, { status: 401 });
        }
        if (user.role !== "admin") {
          return Response.json({ message: "需要管理员权限" }, { status: 403 });
        }

        try {
          const formData = await request.formData();
          const file = formData.get("file");
          if (!(file instanceof File)) {
            return Response.json({ message: "缺少上传文件字段 file" }, { status: 400 });
          }

          const result = await uploadImageToR2({
            bucket: env.MEDIA,
            db,
            file,
            userId: user.id,
          });
          return Response.json(result, { status: 201 });
        } catch (err) {
          const message = err instanceof Error ? err.message : "上传失败";
          return Response.json({ message }, { status: 400 });
        }
      },
    },
  },
});
