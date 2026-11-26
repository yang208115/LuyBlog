import { createFileRoute, Link, Outlet, useLocation, useNavigate, useRouter } from "@tanstack/react-router";
import {
  ExternalLink,
  Globe,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  Moon,
  Rss,
  Search,
  Settings,
  Sun,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Primitives";
import { useTheme } from "@/components/ui/ThemeContext";
import { useToast } from "@/components/ui/Toast";
import { getBootstrapFn } from "@/server/functions/public";
import { getCurrentYearCN } from "@/shared/date";
import type { SiteConfig } from "@/shared/siteConfig";

function GitHubIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 1.5C6.2 1.5 1.5 6.2 1.5 12c0 4.65 3.01 8.59 7.19 9.98.53.1.72-.23.72-.5 0-.25-.01-1.08-.01-1.96-2.92.63-3.54-1.24-3.54-1.24-.48-1.22-1.17-1.54-1.17-1.54-.96-.65.07-.64.07-.64 1.06.07 1.62 1.09 1.62 1.09.94 1.61 2.47 1.15 3.07.88.1-.68.37-1.15.67-1.41-2.33-.26-4.78-1.17-4.78-5.19 0-1.15.41-2.09 1.08-2.82-.11-.27-.47-1.34.1-2.79 0 0 .88-.28 2.89 1.08a10 10 0 0 1 2.63-.35c.89 0 1.79.12 2.63.35 2.01-1.36 2.89-1.08 2.89-1.08.57 1.45.21 2.52.1 2.79.67.73 1.08 1.67 1.08 2.82 0 4.03-2.46 4.92-4.8 5.18.38.32.72.97.72 1.96 0 1.41-.01 2.55-.01 2.9 0 .28.19.61.73.5A10.51 10.51 0 0 0 22.5 12c0-5.8-4.7-10.5-10.5-10.5Z" />
    </svg>
  );
}

function isExternalUrl(path: string): boolean {
  return /^(https?:)?\/\//.test(path) || path.startsWith("mailto:") || path.startsWith("tel:");
}

function formatUptime(buildDate: string): string {
  const start = new Date(buildDate || "2026-01-01T00:00:00").getTime();
  const elapsed = Math.max(0, Date.now() - start);
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;
  return `${Math.floor(elapsed / day)} 天 ${Math.floor((elapsed % day) / hour)} 小时`;
}

export const Route = createFileRoute("/_public")({
  loader: () => getBootstrapFn(),
  head: ({ loaderData }) => {
    const cfg = loaderData?.siteConfig;
    return {
      meta: [{ title: cfg?.title ?? "运阳的小窝" }, { name: "description", content: cfg?.bio ?? "" }],
      links: cfg?.faviconUrl ? [{ rel: "icon", href: cfg.faviconUrl }] : [],
    };
  },
  component: PublicLayout,
});

function PublicLayout() {
  const { siteConfig, navItems, user } = Route.useLoaderData();
  const location = useLocation();
  const navigate = useNavigate();
  const router = useRouter();
  const { toggleTheme } = useTheme();
  const { toast } = useToast();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(location.pathname);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname);
    setMobileOpen(false);
    setAccountOpen(false);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get("authError");
    if (!authError) return;
    const messages: Record<string, string> = {
      banned: "当前账户已被管理员禁用，无法登录",
      invalid_state: "登录状态已过期，请重新尝试",
      oauth_failed: "GitHub 授权登录失败，请稍后重试",
    };
    toast(messages[authError] ?? "登录未完成", "error");
    params.delete("authError");
    const nextSearch = params.toString();
    window.history.replaceState({}, "", `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`);
  }, [toast]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        void navigate({ to: "/search", search: {} });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate]);

  useEffect(() => {
    if (!accountOpen) return;
    const onMouseDown = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAccountOpen(false);
      }
    };
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("keydown", onEscape);
    };
  }, [accountOpen]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setAccountOpen(false);
    toast("已退出登录", "info");
    await router.invalidate();
  };

  const loginUrl = `/api/auth/github?next=${encodeURIComponent(`${location.pathname}${location.searchStr ?? ""}`)}`;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/88 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="打开菜单"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] md:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>

            <Link to="/" className="group flex items-center gap-2.5">
              <span className="relative flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border-strong)] bg-[var(--surface)] font-editorial text-xs font-semibold text-[var(--ink)] transition-colors group-hover:border-[var(--accent)]">
                {siteConfig.authorName.slice(0, 1)}
                <span
                  aria-hidden="true"
                  className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-[var(--sakura)]"
                />
              </span>
              <span className="font-editorial text-base font-semibold tracking-wide text-[var(--ink)]">
                {siteConfig.navTitle}
                <em className="mx-0.5 font-normal text-[var(--sakura)] not-italic">{siteConfig.navSuffix}</em>
                {siteConfig.navAfter}
              </span>
            </Link>
          </div>

          <nav className="hidden items-center gap-1 md:flex" aria-label="主导航">
            {navItems.map((item) =>
              isExternalUrl(item.path) ? (
                <a
                  key={item.id}
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
                >
                  {item.label}
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              ) : (
                <Link
                  key={item.id}
                  to={item.path}
                  activeProps={{
                    className:
                      "font-medium text-[var(--ink)] after:absolute after:inset-x-3 after:bottom-0.5 after:h-[2px] after:rounded-full after:bg-[var(--sakura)] after:content-['']",
                  }}
                  inactiveProps={{
                    className: "text-[var(--muted)]",
                  }}
                  activeOptions={{ exact: item.path === "/" }}
                  className="relative px-3 py-2 text-sm transition-colors hover:text-[var(--ink)]"
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              to="/search"
              search={{}}
              aria-label="全站搜索"
              className="inline-flex h-8 items-center gap-2 rounded-lg px-2.5 text-xs text-[var(--muted)] transition-colors hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">搜索</span>
              <kbd className="hidden rounded border border-[var(--border)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--muted-soft)] sm:inline">
                ⌘K
              </kbd>
            </Link>

            <span className="h-4 w-px bg-[var(--border)]" aria-hidden="true" />

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="切换浅色/深色主题"
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]"
            >
              <Sun className="hidden h-4 w-4 dark:block" />
              <Moon className="block h-4 w-4 dark:hidden" />
            </button>

            {user ? (
              <div ref={accountMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setAccountOpen((v) => !v)}
                  className="flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 transition-colors hover:border-[var(--border-strong)]"
                  aria-label="账户菜单"
                  aria-expanded={accountOpen}
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.username} className="h-5 w-5 rounded object-cover" />
                  ) : (
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-[var(--accent-soft)] text-[11px] font-semibold text-[var(--accent)]">
                      {user.username.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span className="hidden max-w-24 truncate text-xs font-medium text-[var(--ink)] sm:inline">
                    {user.username}
                  </span>
                </button>

                {accountOpen && (
                  <div className="astral-card absolute right-0 mt-2 w-44 rounded-xl p-1.5 shadow-xl">
                    {user.role === "admin" && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[var(--ink)] hover:bg-[var(--surface-subtle)]"
                      >
                        <Settings className="h-3.5 w-3.5 text-[var(--accent)]" />
                        内容工作台
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <a
                href={loginUrl}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[var(--ink)] px-3 text-xs font-medium text-[var(--surface)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-ink)]"
              >
                <GitHubIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">登录</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* 移动端导航抽屉 */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 flex w-72 flex-col justify-between border-r border-[var(--border)] bg-[var(--bg)] p-6 shadow-2xl">
            <div>
              <div className="mb-6 flex items-center justify-between border-b border-[var(--border)] pb-4">
                <span className="font-editorial text-base font-semibold text-[var(--ink)]">
                  {siteConfig.title}
                </span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="关闭菜单"
                  className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <nav className="divide-y divide-[var(--border)]" aria-label="移动端导航">
                {navItems.map((item) =>
                  isExternalUrl(item.path) ? (
                    <a
                      key={item.id}
                      href={item.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between py-3 text-sm text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
                    >
                      {item.label}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <Link
                      key={item.id}
                      to={item.path}
                      activeProps={{
                        className: "border-l-2 border-[var(--sakura)] pl-3 font-medium text-[var(--ink)]",
                      }}
                      inactiveProps={{
                        className: "text-[var(--muted)]",
                      }}
                      activeOptions={{ exact: item.path === "/" }}
                      className="block py-3 text-sm transition-colors hover:text-[var(--ink)]"
                    >
                      {item.label}
                    </Link>
                  ),
                )}
              </nav>
            </div>
            {user?.role === "admin" && (
              <Link to="/admin">
                <Button variant="secondary" className="w-full">
                  进入内容工作台
                </Button>
              </Link>
            )}
          </aside>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>

      <SiteFooter siteConfig={siteConfig} />
    </div>
  );
}

function SiteFooter({ siteConfig }: { siteConfig: SiteConfig }) {
  const { toast } = useToast();
  const [clock, setClock] = useState("--:--:--");
  const [uptime, setUptime] = useState("");

  useEffect(() => {
    const update = () => {
      setClock(
        new Date().toLocaleTimeString("zh-CN", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
      setUptime(formatUptime(siteConfig.buildDate));
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [siteConfig.buildDate]);

  const copyContact = (label: string, value: string) => {
    void navigator.clipboard.writeText(value).then(() => toast(`已复制 ${label}：${value}`, "success"));
  };

  const linkClass =
    "inline-flex items-center gap-1.5 text-xs text-[var(--muted)] underline-offset-4 transition-colors hover:text-[var(--ink)] hover:underline";

  return (
    <footer className="mt-16 border-t border-[var(--border-strong)] bg-[var(--surface)]/55">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
          <div className="space-y-2.5">
            <p className="font-editorial text-lg font-semibold text-[var(--ink)]">{siteConfig.title}</p>
            {siteConfig.bio && (
              <p className="line-clamp-2 max-w-md text-xs leading-relaxed text-[var(--muted)]">
                {siteConfig.bio}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[11px] text-[var(--muted)]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {clock}
              </span>
              {uptime && (
                <>
                  <span className="text-[var(--muted-soft)]" aria-hidden="true">
                    ·
                  </span>
                  <span>
                    已稳定运行 <strong className="font-medium text-[var(--ink)]">{uptime}</strong>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* 完整渲染所有配置的 7 个社交链接 */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 md:max-w-md md:justify-end">
            {siteConfig.social.github && (
              <a
                href={siteConfig.social.github}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                <GitHubIcon className="h-3.5 w-3.5" />
                GitHub
              </a>
            )}
            {siteConfig.social.demo && (
              <a
                href={siteConfig.social.demo}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                <Globe className="h-3.5 w-3.5" />
                Demo
              </a>
            )}
            {siteConfig.social.gitee && (
              <a
                href={siteConfig.social.gitee}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                Gitee
              </a>
            )}
            {siteConfig.social.google && (
              <a
                href={siteConfig.social.google}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                Google
              </a>
            )}
            {siteConfig.social.email && (
              <a href={`mailto:${siteConfig.social.email}`} className={linkClass}>
                <Mail className="h-3.5 w-3.5" />
                Email
              </a>
            )}
            {siteConfig.social.qq && (
              <button
                type="button"
                onClick={() => copyContact("QQ", siteConfig.social.qq)}
                className={`${linkClass} cursor-pointer`}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                QQ: {siteConfig.social.qq}
              </button>
            )}
            {siteConfig.social.wechat && (
              <button
                type="button"
                onClick={() => copyContact("微信", siteConfig.social.wechat)}
                className={`${linkClass} cursor-pointer`}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                微信: {siteConfig.social.wechat}
              </button>
            )}
            <a href="/rss.xml" target="_blank" rel="noopener noreferrer" className={linkClass}>
              <Rss className="h-3.5 w-3.5 text-[var(--sakura)]" />
              RSS
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] pt-6 text-xs text-[var(--muted)]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p>
              © {getCurrentYearCN()} {siteConfig.title} · {siteConfig.authorName}
            </p>
            {siteConfig.footerBadges.length > 0 && (
              <>
                <span className="hidden text-[var(--border-strong)] sm:inline" aria-hidden="true">
                  /
                </span>
                <p className="flex flex-wrap items-center gap-x-2 font-mono text-[11px] text-[var(--muted-soft)]">
                  {siteConfig.footerBadges.map((badge, index) => (
                    <span key={badge.name} className="inline-flex items-center gap-2">
                      {index > 0 && <span aria-hidden="true">·</span>}
                      <span>{badge.name}</span>
                    </span>
                  ))}
                </p>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <a href="/sitemap.xml" className="hover:text-[var(--ink)]">
              Sitemap
            </a>
            {siteConfig.icpConfig && (
              <a
                href={siteConfig.icpConfig.link}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--ink)]"
              >
                {siteConfig.icpConfig.name}
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
