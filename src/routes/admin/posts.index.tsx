import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Input,
  Pagination,
} from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { deletePostFn, getAdminPostsFn } from "@/server/functions/admin";

const AdminPostsSearch = z.object({
  page: z.coerce.number().int().min(1).optional().catch(undefined),
  status: z.enum(["all", "draft", "published"]).optional().catch(undefined),
  q: z.string().optional(),
});

export const Route = createFileRoute("/admin/posts/")({
  validateSearch: AdminPostsSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) =>
    getAdminPostsFn({
      data: { page: deps.page ?? 1, pageSize: 15, status: deps.status ?? "all", q: deps.q },
    }),
  component: AdminPostsPage,
});

function AdminPostsPage() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const currentStatus = search.status ?? "all";
  const navigate = useNavigate({ from: Route.fullPath });
  const router = useRouter();
  const { toast } = useToast();
  const deletePost = useServerFn(deletePostFn);

  const [keyword, setKeyword] = useState(search.q ?? "");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const updateSearch = (next: Partial<z.infer<typeof AdminPostsSearch>>) => {
    const nextPage = next.page && next.page > 1 ? next.page : undefined;
    const nextStatus = next.status === "all" ? undefined : next.status;
    void navigate({
      search: (prev) => ({
        ...prev,
        ...next,
        ...(next.status !== undefined ? { status: nextStatus } : {}),
        page: nextPage,
      }),
    });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deletePost({ data: { id: deleteId } });
      setDeleteId(null);
      toast("文章已删除", "success");
      await router.invalidate();
    } catch (err) {
      toast(err instanceof Error ? err.message : "删除失败", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <p className="font-mono text-xs tracking-wider text-[var(--accent)] uppercase">POSTS</p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--ink)]">文章管理</h1>
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {(["all", "published", "draft"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => updateSearch({ status, page: 1 })}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                currentStatus === status
                  ? "bg-[var(--accent)] text-white"
                  : "border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {status === "all" ? "全部" : status === "published" ? "已发布" : "草稿"}
            </button>
          ))}
        </div>

        <form
          className="relative w-full max-w-xs"
          onSubmit={(e) => {
            e.preventDefault();
            updateSearch({ q: keyword.trim() || undefined, page: 1 });
          }}
        >
          <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted)]" />
          <Input
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索标题、Slug、标签…"
            className="h-9 pl-9 text-xs"
          />
        </form>
      </div>

      {data.items.length === 0 ? (
        <EmptyState title="暂无文章" description="点击右上角开始创作第一篇文章吧。" />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--surface-subtle)] text-xs text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">标题</th>
                  <th className="px-4 py-3 font-medium">分类 / 标签</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 font-medium">浏览</th>
                  <th className="px-4 py-3 font-medium">更新日期</th>
                  <th className="px-4 py-3 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {data.items.map((post) => (
                  <tr key={post.id} className="hover:bg-[var(--surface-subtle)]/60">
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-[var(--ink)]">{post.title}</p>
                      <p className="font-mono text-xs text-[var(--muted)]">/blog/{post.slug}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {post.category && <Badge tone="accent">{post.category}</Badge>}
                        {post.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} tone="neutral">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge tone={post.status === "published" ? "success" : "warning"}>
                        {post.status === "published" ? "已发布" : "草稿"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-[var(--muted)]">{post.viewCount}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-[var(--muted)]">
                      {new Date(post.updatedAt).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {post.status === "published" && (
                          <Link
                            to="/blog/$slug"
                            params={{ slug: post.slug }}
                            className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]"
                            title="在前台查看"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        )}
                        <Link
                          to="/admin/posts/$id"
                          params={{ id: post.id }}
                          className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
                          title="编辑"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(post.id)}
                          className="px-2 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
                          aria-label="删除文章"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Pagination
        page={data.pagination.page}
        totalPages={data.pagination.totalPages}
        onPageChange={(nextPage) => updateSearch({ page: nextPage })}
      />

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="确认删除文章"
        description="删除后文章及关联评论将被永久移除，此操作不可撤销。"
        confirmLabel="永久删除"
        loading={deleting}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
