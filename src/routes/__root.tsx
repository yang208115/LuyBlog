import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, HeadContent, Link, Outlet, Scripts } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/ui/ThemeContext";
import { ToastProvider } from "@/components/ui/Toast";
import appCss from "@/styles/app.css?url";

const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem('themeMode');var m=s==='dark'||s==='light'?s:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=m;}catch(e){document.documentElement.dataset.theme='light';}})();`;

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "运阳的小窝" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Newsreader:ital,opsz,wght@0,6..72,400..600;1,6..72,400&family=Noto+Serif+SC:wght@500;600;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/luyblog-icon.svg" },
      { rel: "alternate", type: "application/rss+xml", title: "RSS", href: "/rss.xml" },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: RootNotFound,
  errorComponent: RootError,
  component: () => <Outlet />,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static inline theme initializer before hydration */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="astral-mist-bg min-h-screen antialiased">
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}

function RootNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="astral-card max-w-md rounded-xl p-8 text-center">
        <p className="font-mono text-xs tracking-widest text-[var(--accent)]">404 / NOT FOUND</p>
        <h1 className="font-editorial mt-2 text-2xl font-bold text-[var(--ink)]">页面走丢在星雾里了</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">你访问的地址不存在，或者尚未发布。</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex h-9 items-center justify-center rounded-xl bg-[var(--accent)] px-4 text-sm font-medium text-[var(--accent-ink)] hover:bg-[var(--accent-hover)]"
          >
            回到首页
          </Link>
        </div>
      </div>
    </div>
  );
}

function RootError({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : "发生未知错误";
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="astral-card max-w-md rounded-xl p-8 text-center">
        <p className="font-mono text-xs tracking-widest text-rose-500">ERROR</p>
        <h1 className="font-editorial mt-2 text-2xl font-bold text-[var(--ink)]">页面渲染遇到一点小波折</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{message}</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex h-9 items-center justify-center rounded-xl bg-[var(--accent)] px-4 text-sm font-medium text-[var(--accent-ink)] hover:bg-[var(--accent-hover)]"
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
