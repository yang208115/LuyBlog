/// <reference types="vite/client" />

declare namespace Cloudflare {
  interface Env {
    ADMIN_GITHUB_ID?: string;
    TURNSTILE_SECRET?: string;
    TURNSTILE_SITE_KEY: string;
    TURNSTILE_HOSTNAMES: string;
    GITHUB_CLIENT_ID: string;
    GITHUB_CLIENT_SECRET: string;
    APP_BASE_URL: string;
  }
}
