import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Trash2 } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { ImageUploadButton } from "@/components/admin/ImageUploader";
import { formatBytes } from "@/components/admin/utils";
import { Card, ConfirmDialog, EmptyState, Pagination } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { deleteAdminMediaFn, getAdminMediaFn } from "@/server/functions/admin";

const MediaSearch = z.object({
  page: z.coerce.number().int().min(1).optional().catch(undefined),
});

export const Route = createFileRoute("/admin/media")({
  validateSearch: MediaSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getAdminMediaFn({ data: { page: deps.page ?? 1, pageSize: 24 } }),
  component: AdminMediaPage,
});

function AdminMediaPage() {
  const data = Route.useLoaderData();
  const navigate = useNavigate({ from: Route.fullPath });
  const router = useRouter();
  const { toast } = useToast();
  const deleteMedia = useServerFn(deleteAdminMediaFn);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const copyUrl = (url: string) => {
    void navigator.clipboard.writeText(url).then(() => toast(`已复制链接：${url}`, "success"));
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteMedia({ data: { id: deleteId } });
      setDeleteId(null);
      toast("图片已从 R2 移除", "success");
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
          <p className="font-mono text-xs tracking-wider text-[var(--accent)] uppercase">R2 MEDIA</p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--ink)]">媒体库（Cloudflare R2）</h1>
          <p className="mt-0.5 text-xs text-[var(--muted)]">单文件最大 5 MB，自动校验文件头魔数。</p>
        </div>
        <ImageUploadButton
          label="上传新图片"
          onUploaded={() => {
            void router.invalidate();
          }}
          className="h-9 px-4"
        />
      </header>

      {data.items.length === 0 ? (
        <EmptyState title="媒体库还是空的" description="点击右上角上传图片，或在文章写作页拖拽图片直传。" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {data.items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="aspect-[4/3] bg-[var(--surface-subtle)]">
                <img
                  src={item.url}
                  alt={item.filename}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="space-y-2 p-3">
                <p className="truncate text-xs font-semibold text-[var(--ink)]" title={item.filename}>
                  {item.filename}
                </p>
                <div className="flex items-center justify-between font-mono text-[11px] text-[var(--muted)]">
                  <span>{formatBytes(item.sizeBytes)}</span>
                  <span>{new Date(item.createdAt).toLocaleDateString("zh-CN")}</span>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => copyUrl(item.url)}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-[var(--border)] py-1 text-xs text-[var(--ink)] hover:border-[var(--accent)]"
                  >
                    <Copy className="h-3 w-3" />
                    复制链接
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(item.id)}
                    aria-label="删除图片"
                    className="rounded-lg border border-[var(--border)] p-1.5 text-rose-500 hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Pagination
        page={data.pagination.page}
        totalPages={data.pagination.totalPages}
        onPageChange={(nextPage) => void navigate({ search: { page: nextPage > 1 ? nextPage : undefined } })}
      />

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="删除 R2 图片"
        description="确定从 Cloudflare R2 永久删除此图片吗？引用该地址的文章图片将失效。"
        loading={deleting}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
