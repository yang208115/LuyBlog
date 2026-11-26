import { env } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const baseUrl = (env.APP_BASE_URL || new URL(request.url).origin).replace(/\/+$/, "");
        const body = [
          "User-agent: *",
          "Allow: /",
          "Disallow: /admin",
          "Disallow: /api/",
          "Disallow: /auth/",
          "",
          `Sitemap: ${baseUrl}/sitemap.xml`,
          "",
        ].join("\n");

        return new Response(body, {
          status: 200,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=86400",
          },
        });
      },
    },
  },
});
