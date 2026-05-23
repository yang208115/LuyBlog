import { OpenAPIHono } from "@hono/zod-openapi";
import * as drizzleSchema from "../db/schema";
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";

import auth from "./auth";
import post from "./post";
import comment from "./comment";
import admin from "./admin";
import ai from "./ai";
import content from "./content";
import utility, { protectedUtilityRoutes } from "./utility";
import music, { protectedMusicRoutes } from "./music";
import siteConfig from "./siteConfig";
import navigation from "./navigation";
import { Bindings } from "../types";

type Variables = {
  db: DrizzleD1Database<typeof drizzleSchema>;
};

const api = new OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>()
  // Add DB middleware to all API routes
  .use("*", async (c, next) => {
    const db = drizzle(c.env.DB, { schema: drizzleSchema });
    c.set("db", db);
    await next();
  })
  // Register API routes using chaining
  .route("/auth", auth)
  .route("/posts", post)
  .route("/comments", comment)
  .route("/music", music)
  .route("/music", protectedMusicRoutes)
  .route("/", siteConfig)
  .route("/", navigation)
  .route("/", content)
  .route("/", utility)
  .route("/", protectedUtilityRoutes)
  .route("/admin", admin)
  .route("/ai", ai);

export type ApiRoutes = typeof api;

export default api;
