import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import {
  ArrowLeft,
  Compass,
  FileCode2,
  FileText,
  FolderGit2,
  Image,
  LayoutDashboard,
  Link2,
  Menu,
  MessageSquare,
  Moon,
  Settings,
  ShieldAlert,
  Sparkles,
  Sun,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/Primitives";
import { useTheme } from "@/components/ui/ThemeContext";
import { getBootstrapFn } from "@/server/functions/public";

const adminNav = [
  { to: "/admin", label: "仪表盘", icon: LayoutDashboard, exact: true },
  { to: "/admin/posts", label: "文章", icon: FileText, exact: false },
  { to: "/admin/moments", label: "瞬间", icon: Sparkles, exact: false },
  { to: "/admin/projects", label: "项目", icon: FolderGit2, exact: false },
  { to: "/admin/pages", label: "页面", icon: FileCode2, exact: false },
  { to: "/admin/friends", label: "友链", icon: Link2, exact: false },
  { to: "/admin/navigation", label: "导航栏", icon: Compass, exact: false },
  { to: "/admin/comments", label: "评论", icon: MessageSquare, exact: false },
  { to: "/admin/users", label: "用户", icon: Users, exact: false },
  { to: "/admin/media", label: "媒体库", icon: Image, exact: false },
  { to: "/admin/settings", label: "站点配置", icon: Settings, exact: false },
] as const;

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    const bootstrap = await getBootstrapFn();
    const nextPath = `${location.pathname}${location.searchStr ?? ""}` || "/admin";
    if (!bootstrap.user) {
      throw redirect({ href: `/api/auth/github?next=${encodeURIComponent(nextPath)}` });
    }
    if (bootstrap.user.role !== "admin") {
      throw redirect({ to: "/" });
    }
    return { bootstrap };
  },
  loader: ({ context }) => context.bootstrap,
  head: () => ({
    meta: [{ title: "内容工作台 - LuyBlog" }],
  }),
  component: AdminShellLayout,
});

function AdminShellLayout() {
  const { user, siteConfig } = Route.useLoaderData();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="max-w-md p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-[var(--accent)]" />
          <h1 className="mt-4 text-xl font-bold text-[var(--ink)]">需要登录管理员账号</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">请先通过 GitHub 登录以访问后台管理工作台。</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/"
              className="inline-flex h-9 items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--ink)]"
            >
              返回首页
            </Link>
            <a
              href="/api/auth/github?next=/admin"
              className="inline-flex h-9 items-center rounded-xl bg-[var(--accent)] px-4 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
            >
              GitHub 登录
            </a>
          </div>
        </Card>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="max-w-md p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-rose-500" />
          <h1 className="mt-4 text-xl font-bold text-[var(--ink)]">403 · 无权访问</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            当前账户（{user.username}）不是管理员，无法进入内容工作台。
          </p>
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex h-9 items-center rounded-xl bg-[var(--accent)] px-4 text-sm font-medium text-white"
            >
              返回前台首页
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-4">
      <div>
        <div className="mb-6 flex items-center justify-between px-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--sakura)] text-xs font-bold text-white">
              {siteConfig.authorName.slice(0, 1)}
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold text-[var(--ink)]">{siteConfig.title}</p>
              <p className="font-mono text-[10px] tracking-wider text-[var(--muted)]">ADMIN DESK V2</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 text-[var(--muted)] lg:hidden"
            aria-label="关闭侧栏"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="space-y-1" aria-label="后台菜单">
          {adminNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.exact }}
                activeProps={{
                  className: "bg-[var(--accent-soft)] text-[var(--accent)] font-semibold",
                }}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-[var(--muted)] transition-colors hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-3 border-t border-[var(--border)] pt-4">
        <div className="flex items-center gap-2.5 px-2">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.username} className="h-8 w-8 rounded-xl object-cover" />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-xs font-bold text-[var(--accent)]">
              {user.username.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-[var(--ink)]">{user.username}</p>
            <p className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">ADMIN · ONLINE</p>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="切换主题"
            className="rounded-lg border border-[var(--border)] p-1.5 text-[var(--muted)] hover:text-[var(--ink)]"
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
        </div>

        <Link
          to="/"
          className="flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-medium text-[var(--ink)] hover:border-[var(--accent)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          返回前台
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r border-[var(--border)] bg-[var(--surface)]/85 lg:block">
        <div className="sticky top-0 h-screen overflow-y-auto">{sidebarContent}</div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="astral-card fixed inset-y-0 left-0 w-64 overflow-y-auto shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--bg)]/85 px-4 backdrop-blur-md lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--ink)]"
          >
            <Menu className="h-4 w-4" />
            菜单
          </button>
          <Link to="/" className="text-xs font-medium text-[var(--accent)]">
            返回前台
          </Link>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
