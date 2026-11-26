import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { ImageUploadButton } from "@/components/admin/ImageUploader";
import { normalizeSlugInput } from "@/components/admin/utils";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Input,
  Modal,
  Textarea,
} from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { createPageFn, deletePageFn, getAdminPagesFn, updatePageFn } from "@/server/functions/admin";
import type { AdminPageDto } from "@/shared/types";

export const Route = createFileRoute("/admin/pages")({
  loader: () => getAdminPagesFn(),
  component: AdminPagesPage,
});

type PageForm = {
  id?: string;
  slug: string;
  title: string;
  contentMd: string;
  status: "draft" | "published";
};

const emptyPage: PageForm = {
  slug: "",
  title: "",
  contentMd: "",
  status: "published",
};

function AdminPagesPage() {
  const items = Route.useLoaderData();
  const router = useRouter();
  const { toast } = useToast();
  const createPage = useServerFn(createPageFn);
  const updatePage = useServerFn(updatePageFn);
  const deletePage = useServerFn(deletePageFn);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PageForm>(emptyPage);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openEdit = (item: AdminPageDto) => {
    setForm({
      id: item.id,
      slug: item.slug,
      title: item.title,
      contentMd: item.contentMd,
      status: item.status,
    });
    setOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      slug: normalizeSlugInput(form.slug),
      title: form.title.trim(),
      contentMd: form.contentMd,
      status: form.status,
    };
    try {
      if (form.id) {
        await updatePage({ data: { id: form.id, ...payload } });
        toast("页面已更新", "success");
      } else {
        await createPage({ data: payload });
        toast("页面已创建", "success");
      }
      setOpen(false);
      await router.invalidate();
    } catch (err) {
      toast(err instanceof Error ? err.message : "保存失败", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deletePage({ data: { id: deleteId } });
      setDeleteId(null);
      toast("页面已删除", "success");
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
          <p className="font-mono text-xs tracking-wider text-[var(--accent)] uppercase">PAGES</p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--ink)]">独立页面</h1>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            例如创建 slug 为 about 的页面将自动覆盖 /about 展示。
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setForm(emptyPage);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          新建页面
        </Button>
      </header>

      {items.length === 0 ? (
        <EmptyState title="暂无自定义页面" description="创建一个独立 Markdown 页面（如 about）。" />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--surface-subtle)] text-xs text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">标题 / 路径</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 font-medium">更新日期</th>
                  <th className="px-4 py-3 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-[var(--ink)]">{item.title}</p>
                      <p className="font-mono text-xs text-[var(--muted)]">/{item.slug}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge tone={item.status === "published" ? "success" : "warning"}>
                        {item.status === "published" ? "已发布" : "草稿"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-[var(--muted)]">
                      {new Date(item.updatedAt).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-1.5">
                        {item.status === "published" && (
                          <Link
                            to="/$slug"
                            params={{ slug: item.slug }}
                            className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(item.id)}
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

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? "编辑页面" : "新建页面"}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-[var(--ink)]">页面标题</span>
              <Input
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-[var(--ink)]">路径 Slug</span>
              <Input
                required
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="about"
                className="font-mono"
              />
            </label>
          </div>

          <div className="space-y-1.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-[var(--ink)]">Markdown 内容</span>
              <ImageUploadButton
                label="插入图片"
                onUploaded={(media) =>
                  setForm((f) => ({
                    ...f,
                    contentMd: `${f.contentMd}\n![${media.filename}](${media.url})\n`,
                  }))
                }
              />
            </div>
            <Textarea
              required
              rows={10}
              value={form.contentMd}
              onChange={(e) => setForm((f) => ({ ...f, contentMd: e.target.value }))}
              className="font-mono text-xs"
            />
          </div>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-[var(--ink)]">状态</span>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "draft" | "published" }))}
              className="h-9 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)]"
            >
              <option value="published">已发布</option>
              <option value="draft">草稿</option>
            </select>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "保存中…" : "保存"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="删除页面"
        description="确定要删除这个自定义页面吗？"
        loading={deleting}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
