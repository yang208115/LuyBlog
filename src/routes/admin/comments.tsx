import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Badge, Card, ConfirmDialog, EmptyState, Pagination } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { deleteAdminCommentFn, getAdminCommentsFn, updateCommentStatusFn } from "@/server/functions/admin";
import type { AdminCommentDto } from "@/shared/types";

const CommentsSearch = z.object({
  page: z.coerce.number().int().min(1).optional().catch(undefined),
});

export const Route = createFileRoute("/admin/comments")({
  validateSearch: CommentsSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getAdminCommentsFn({ data: { page: deps.page ?? 1, pageSize: 20 } }),
  component: AdminCommentsPage,
});

function AdminCommentsPage() {
  const data = Route.useLoaderData();
  const navigate = useNavigate({ from: Route.fullPath });
  const router = useRouter();
  const { toast } = useToast();

  const updateStatus = useServerFn(updateCommentStatusFn);
  const deleteComment = useServerFn(deleteAdminCommentFn);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const toggleStatus = async (item: AdminCommentDto) => {
    const nextStatus = item.status === "visible" ? "hidden" : "visible";
    try {
      await updateStatus({ data: { id: item.id, status: nextStatus } });
      toast(nextStatus === "visible" ? "评论已恢复显示" : "评论已隐藏", "success");
      await router.invalidate();
    } catch (err) {
      toast(err instanceof Error ? err.message : "更新失败", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteComment({ data: { id: deleteId } });
      setDeleteId(null);
      toast("评论已删除", "success");
      await router.invalidate();
    } catch (err) {
      toast(err instanceof Error ? err.message : "删除失败", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="border-b border-[var(--border)] pb-5">
        <p className="font-mono text-xs tracking-wider text-[var(--accent)] uppercase">COMMENTS</p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--ink)]">评论审核</h1>
      </header>

      {data.items.length === 0 ? (
        <EmptyState title="暂无评论" />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--surface-subtle)] text-xs text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">用户</th>
                  <th className="px-4 py-3 font-medium">评论内容</th>
                  <th className="px-4 py-3 font-medium">所属文章</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 font-medium">时间</th>
                  <th className="px-4 py-3 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {data.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3.5 font-medium text-[var(--ink)]">{item.username}</td>
                    <td className="max-w-md px-4 py-3.5 text-[var(--ink)]">
                      <p className="line-clamp-2">{item.content}</p>
                      {item.parentId && (
                        <span className="font-mono text-[10px] text-[var(--muted)]">回复评论</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[var(--muted)]">{item.postTitle}</td>
                    <td className="px-4 py-3.5">
                      <Badge tone={item.status === "visible" ? "success" : "warning"}>
                        {item.status === "visible" ? "公开" : "隐藏"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-[var(--muted)]">
                      {new Date(item.createdAt).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => void toggleStatus(item)}
                          title={item.status === "visible" ? "隐藏评论" : "恢复显示"}
                          className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]"
                        >
                          {item.status === "visible" ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(item.id)}
                          title="删除评论"
                          className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
        onPageChange={(nextPage) => void navigate({ search: { page: nextPage > 1 ? nextPage : undefined } })}
      />

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="删除评论"
        description="确定永久删除这条评论（及其子回复）吗？"
        loading={deleting}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
