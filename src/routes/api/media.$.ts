import { env } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/media/$")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const key = (params._splat ?? "").replace(/^\/+/, "");
        if (!key || key.includes("..") || key.includes("\\")) {
          return new Response("Invalid media key", { status: 400 });
        }

        const object = await env.MEDIA.get(key);
        if (!object) {
          return new Response("Not Found", { status: 404 });
        }

        const etag = object.httpEtag;
        const ifNoneMatch = request.headers.get("if-none-match");
        if (ifNoneMatch && etag && ifNoneMatch === etag) {
          return new Response(null, {
            status: 304,
            headers: {
              ETag: etag,
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          });
        }

        const headers = new Headers();
        headers.set("Content-Type", object.httpMetadata?.contentType || "application/octet-stream");
        if (etag) headers.set("ETag", etag);
        headers.set("Cache-Control", "public, max-age=31536000, immutable");
        headers.set("X-Content-Type-Options", "nosniff");

        return new Response(object.body, { status: 200, headers });
      },
    },
  },
});
