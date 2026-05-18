export type Bindings = {
  DB: D1Database;
  ASSETS: Fetcher;
  NODE_ENV: "development" | "production" | "test";
  VITE_PORT: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  APP_BASE_URL: string;
  QWEATHER_KEY?: string;
};
