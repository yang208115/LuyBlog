import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FileCode2,
  FileText,
  FolderGit2,
  Image,
  Link2,
  MessageSquare,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { Badge, Card } from "@/components/ui/Primitives";
import { getAdminStatsFn } from "@/server/functions/admin";

export const Route = createFileRoute("/admin/")({
  loader: () => getAdminStatsFn(),
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const stats = Route.useLoaderData();

  const cards = [
    {
      label: "文章总数",
      value: stats.posts,
      sub: `已发布 ${stats.publishedPosts} · 草稿 ${stats.draftPosts}`,
      icon: FileText,
      to: "/admin/posts",
    },
    { label: "瞬间动态", value: stats.moments, sub: "生活切片", icon: Sparkles, to: "/admin/moments" },
    {
      label: "项目作品",
      value: stats.projects,
      sub: "实验室与工具",
      icon: FolderGit2,
      to: "/admin/projects",
    },
    { label: "独立页面", value: stats.pages, sub: "自定义 Markdown 页", icon: FileCode2, to: "/admin/pages" },
    {
      label: "友情链接",
      value: stats.friendLinks,
      sub: `待审核 ${stats.pendingFriendLinks}`,
      icon: Link2,
      to: "/admin/friends",
    },
    {
      label: "评论互动",
      value: stats.comments,
      sub: "支持单层回复",
      icon: MessageSquare,
      to: "/admin/comments",
    },
    { label: "注册用户", value: stats.users, sub: "GitHub OAuth", icon: Users, to: "/admin/users" },
    { label: "R2 媒体资源", value: stats.media, sub: "图床对象存储", icon: Image, to: "/admin/media" },
  ] as const;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <p className="font-mono text-xs tracking-wider text-[var(--accent)] uppercase">OVERVIEW</p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--ink)]">仪表盘</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">站点内容、审核队列与存储概览。</p>
        </div>
        <Link
          to="/admin/posts/$id"
          params={{ id: "new" }}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
        >
          <Plus className="h-4 w-4" />
          写新文章
        </Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.label} to={item.to} className="group block">
              <Card className="p-5 transition-colors hover:border-[var(--accent)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--muted)]">{item.label}</span>
                  <Icon className="h-4 w-4 text-[var(--accent)]" />
                </div>
                <p className="mt-3 font-mono text-3xl font-bold text-[var(--ink)]">{item.value}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{item.sub}</p>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[var(--ink)]">待办提醒</h2>
            <p className="mt-0.5 text-xs text-[var(--muted)]">快速处理草稿文章与待审核友链申请。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.pendingFriendLinks > 0 && (
              <Link to="/admin/friends">
                <Badge tone="warning">{stats.pendingFriendLinks} 条待审友链</Badge>
              </Link>
            )}
            {stats.draftPosts > 0 && (
              <Link to="/admin/posts" search={{ page: 1, status: "draft" }}>
                <Badge tone="accent">{stats.draftPosts} 篇草稿文章</Badge>
              </Link>
            )}
            {stats.pendingFriendLinks === 0 && stats.draftPosts === 0 && (
              <Badge tone="success">全部队列已清空</Badge>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
