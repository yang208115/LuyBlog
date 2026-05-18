// This file is the entry point for the server.
//
// It's responsible for exporting a Hono application that can be used as a
// serverless function.
//
// The server-side rendering is handled by the `../frontend/src/entry-server.tsx`
// file, which is imported here. The Vite plugin for Hono will handle bundling
// this file and its dependencies.

import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import type { Context } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { etag } from "hono/etag";
import { drizzle } from "drizzle-orm/d1";

import api from "./routes/api";
import * as drizzleSchema from "./db/schema";
import { Bindings } from "./types";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

// Middlewares
app.use("*", etag(), secureHeaders(), logger());
app.use(
  "/api/*",
  cors({
    origin: (origin, c) => {
      if (c.env.NODE_ENV !== "production") return origin || "*";
      const allowedOrigin = c.env.APP_BASE_URL;
      return origin === allowedOrigin ? origin : "";
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  }),
);

// API routes
app.route("/api", api);

// OpenAPI Docs
app.doc("/api/doc", {
  openapi: "3.1.0",
  info: {
    version: "1.0.0",
    title: "NekroEdge API",
  },
});

// Serve Swagger UI
app.get(
  "/doc",
  swaggerUI({
    url: "/api/doc",
  }),
);

// Serve robots.txt (dynamically generated)
app.get("/robots.txt", async (c) => {
  const { generateRobotsTxt } = await import("./utils/htmlTemplate");
  return c.text(generateRobotsTxt(), 200, {
    "Content-Type": "text/plain",
    "Cache-Control": "public, max-age=86400", // Cache for 24 hours
  });
});

// Serve sitemap.xml (dynamically generated)
app.get("/sitemap.xml", async (c) => {
  const { generateDynamicSitemapXml } = await import("./utils/feed");
  const db = drizzle(c.env.DB, { schema: drizzleSchema });
  return c.text(await generateDynamicSitemapXml(db), 200, {
    "Content-Type": "application/xml",
    "Cache-Control": "public, max-age=86400", // Cache for 24 hours
  });
});

const rssHandler = async (c: Context<{ Bindings: Bindings }>) => {
  const { generateRssXml } = await import("./utils/feed");
  const db = drizzle(c.env.DB, { schema: drizzleSchema });
  return c.text(await generateRssXml(db), 200, {
    "Content-Type": "application/rss+xml; charset=utf-8",
    "Cache-Control": "public, max-age=3600", // Cache for 1 hour
  });
};

app.get("/rss.xml", rssHandler);
app.get("/feed.xml", rssHandler);

// Serve frontend assets
app.get("*", async (c) => {
  if (c.env.NODE_ENV === "development") {
    const vitePort = c.env.VITE_PORT || "5173";
    const url = new URL(c.req.url);
    url.hostname = "localhost";
    url.port = vitePort;
    url.protocol = "http";

    const res = await fetch(url.toString(), c.req.raw);
    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: new Headers(res.headers),
    });
  }

  // Production: Use ASSETS binding to serve static files
  const url = new URL(c.req.url);

  // Try to serve static assets first using ASSETS binding
  if (url.pathname.startsWith("/assets/")) {
    try {
      const assetResponse = await c.env.ASSETS.fetch(c.req.raw);
      if (assetResponse.status !== 404) {
        return assetResponse;
      }
    } catch (error) {
      console.error("Error serving static asset:", error);
    }
  }

  // Production SSR for pages
  try {
    // Note: These are dynamic imports, and will only be available after building the frontend.
    // @ts-ignore
    const manifestModule = await import("../dist/client/.vite/manifest.json");
    // @ts-ignore
    const { render } = await import("../dist/server/entry-server.mjs");

    // The imported module may have the content under a `default` key.
    const manifest = manifestModule.default || manifestModule;

    const url = new URL(c.req.url);
    const rendered = await render(url.pathname);

    // The manifest key is the path to the entrypoint file relative to the
    // Vite root. In our case, the client build entry is `index.html` (the
    // default for Vite), so we use that as the key.
    const entry = (manifest as Record<string, any>)["index.html"];

    if (!entry) {
      throw new Error("Could not find a valid client entry in manifest.json");
    }

    // Use centralized HTML template generator
    const { generateHtmlTemplate } = await import("./utils/htmlTemplate");

    const cssFiles = entry.css ? entry.css.map((css: string) => `/${css}`) : [];
    const jsFiles = [entry.file].map((js: string) => `/${js}`);

    const template = generateHtmlTemplate({
      path: url.pathname,
      content: rendered.html,
      cssFiles,
      jsFiles,
    });

    return c.html(template);
  } catch (e) {
    console.error("SSR failed:", e);
    const detailedError =
      c.env.NODE_ENV === "production"
        ? "The page could not be rendered. Please try again later."
        : e instanceof Error
          ? `Error: ${e.message}\n\nStack Trace:\n${e.stack}\n`
          : `A non-error was thrown: ${String(e)}`;

    return c.html(
      `<!DOCTYPE html><html><head><title>Render Error</title><style>body{font-family:sans-serif;background:#111;color:#eee;}pre{background:#222;padding:1em;border-radius:8px;white-space:pre-wrap;word-wrap:break-word;}</style></head><body><h1>Server-side rendering failed.</h1><p>Please check the server logs for more details.</p><hr><pre>${detailedError}</pre></body></html>`,
      500,
    );
  }
});

export default app;
