import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { ImageUploadButton } from "@/components/admin/ImageUploader";
import { joinLines, normalizeSlugInput, splitLinesOnly } from "@/components/admin/utils";
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
import { createMomentFn, deleteMomentFn, getAdminMomentsFn, updateMomentFn } from "@/server/functions/admin";
import type { AdminMomentDto } from "@/shared/types";

export const Route = createFileRoute("/admin/moments")({
  loader: () => getAdminMomentsFn(),
  component: AdminMomentsPage,
});

type MomentForm = {
  id?: string;
  slug: string;
  location: string;
  imagesText: string;
  contentMd: string;
  status: "draft" | "published";
};

function emptyMomentForm(): MomentForm {
  return {
    slug: `moment-${Date.now()}`,
    location: "",
    imagesText: "",
    contentMd: "",
    status: "published",
  };
}

function AdminMomentsPage() {
  const moments = Route.useLoaderData();
  const router = useRouter();
  const { toast } = useToast();
  const createMoment = useServerFn(createMomentFn);
  const updateMoment = useServerFn(updateMomentFn);
  const deleteMoment = useServerFn(deleteMomentFn);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<MomentForm>(emptyMomentForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setForm(emptyMomentForm());
    setModalOpen(true);
  };

  const openEdit = (item: AdminMomentDto) => {
    setForm({
      id: item.id,
      slug: item.slug,
      location: item.location ?? "",
      imagesText: joinLines(item.images),
      contentMd: item.contentMd,
      status: item.status,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      slug: normalizeSlugInput(form.slug) || `moment-${Date.now()}`,
      location: form.location.trim() || null,
      images: splitLinesOnly(form.imagesText),
      contentMd: form.contentMd,
      status: form.status,
    };
    try {
      if (form.id) {
        await updateMoment({ data: { id: form.id, ...payload } });
        toast("瞬间已更新", "success");
      } else {
        await createMoment({ data: payload });
        toast("瞬间已发布", "success");
      }
      setModalOpen(false);
      await router.invalidate();
    } catch (err) {
      toast(err instanceof Error ? err.message : "操作失败", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteMoment({ data: { id: deleteId } });
      setDeleteId(null);
      toast("瞬间已删除", "success");
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
          <p className="font-mono text-xs tracking-wider text-[var(--sakura)] uppercase">MOMENTS</p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--ink)]">瞬间管理</h1>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          发新瞬间
        </Button>
      </header>

      {moments.length === 0 ? (
        <EmptyState title="暂无瞬间" description="记录第一条日常切片吧。" />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--surface-subtle)] text-xs text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">内容摘要</th>
                  <th className="px-4 py-3 font-medium">地点 / 图片</th>
                  <th className="px-4 py-3 font-medium">赞</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {moments.map((item) => (
                  <tr key={item.id}>
                    <td className="max-w-md px-4 py-3.5">
                      <p className="line-clamp-2 text-[var(--ink)]">{item.contentMd}</p>
                      <p className="mt-0.5 font-mono text-xs text-[var(--muted)]">#{item.slug}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[var(--muted)]">
                      {item.location || "—"} · {item.images.length} 张图
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-[var(--sakura)]">{item.likeCount}</td>
                    <td className="px-4 py-3.5">
                      <Badge tone={item.status === "published" ? "success" : "warning"}>
                        {item.status === "published" ? "已发布" : "草稿"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-1.5">
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
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? "编辑瞬间" : "新建瞬间"}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-[var(--ink)]">Slug</span>
              <Input
                required
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                className="font-mono"
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-[var(--ink)]">地点</span>
              <Input
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="上海 / 深夜书房"
              />
            </label>
          </div>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-[var(--ink)]">内容（支持 Markdown）</span>
            <Textarea
              required
              rows={4}
              value={form.contentMd}
              onChange={(e) => setForm((f) => ({ ...f, contentMd: e.target.value }))}
            />
          </label>

          <div className="space-y-1.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-[var(--ink)]">图片列表（每行一个 URL）</span>
              <ImageUploadButton
                label="追加上传图片"
                onUploaded={(media) =>
                  setForm((f) => ({
                    ...f,
                    imagesText: f.imagesText.trim() ? `${f.imagesText.trim()}\n${media.url}` : media.url,
                  }))
                }
              />
            </div>
            <Textarea
              rows={3}
              value={form.imagesText}
              onChange={(e) => setForm((f) => ({ ...f, imagesText: e.target.value }))}
              placeholder="/api/media/uploads/..."
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
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
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
        title="删除瞬间"
        description="确定要删除这条瞬间吗？点赞记录也会一并清除。"
        loading={deleting}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
