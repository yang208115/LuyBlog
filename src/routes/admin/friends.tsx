import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { ImageUploadButton } from "@/components/admin/ImageUploader";
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
import {
  createFriendLinkFn,
  deleteFriendLinkFn,
  getAdminFriendLinksFn,
  updateFriendLinkFn,
} from "@/server/functions/admin";
import type { AdminFriendLinkDto } from "@/shared/types";

export const Route = createFileRoute("/admin/friends")({
  loader: () => getAdminFriendLinksFn(),
  component: AdminFriendsPage,
});

type FriendForm = {
  id?: string;
  name: string;
  description: string;
  url: string;
  avatarUrl: string;
  sortOrder: number;
  status: "draft" | "published";
};

const emptyFriend: FriendForm = {
  name: "",
  description: "",
  url: "",
  avatarUrl: "",
  sortOrder: 0,
  status: "published",
};

function AdminFriendsPage() {
  const items = Route.useLoaderData();
  const router = useRouter();
  const { toast } = useToast();
  const createFriend = useServerFn(createFriendLinkFn);
  const updateFriend = useServerFn(updateFriendLinkFn);
  const deleteFriend = useServerFn(deleteFriendLinkFn);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FriendForm>(emptyFriend);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openEdit = (item: AdminFriendLinkDto) => {
    setForm({
      id: item.id,
      name: item.name,
      description: item.description ?? "",
      url: item.url,
      avatarUrl: item.avatarUrl ?? "",
      sortOrder: item.sortOrder,
      status: item.status,
    });
    setOpen(true);
  };

  const quickApprove = async (item: AdminFriendLinkDto) => {
    try {
      await updateFriend({ data: { id: item.id, status: "published" } });
      toast(`已通过友链：${item.name}`, "success");
      await router.invalidate();
    } catch (err) {
      toast(err instanceof Error ? err.message : "操作失败", "error");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      url: form.url.trim(),
      avatarUrl: form.avatarUrl.trim() || null,
      sortOrder: Number(form.sortOrder) || 0,
      status: form.status,
    };
    try {
      if (form.id) {
        await updateFriend({ data: { id: form.id, ...payload } });
        toast("友链已更新", "success");
      } else {
        await createFriend({ data: payload });
        toast("友链已创建", "success");
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
      await deleteFriend({ data: { id: deleteId } });
      setDeleteId(null);
      toast("友链已删除", "success");
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
          <p className="font-mono text-xs tracking-wider text-[var(--sakura)] uppercase">FRIENDS</p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--ink)]">友链与审核</h1>
        </div>
        <Button
          type="button"
          onClick={() => {
            setForm(emptyFriend);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          添加友链
        </Button>
      </header>

      {items.length === 0 ? (
        <EmptyState title="暂无友链" description="手动添加或等待访客通过 Turnstile 申请。" />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--surface-subtle)] text-xs text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">站点</th>
                  <th className="px-4 py-3 font-medium">URL</th>
                  <th className="px-4 py-3 font-medium">排序</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        {item.avatarUrl ? (
                          <img src={item.avatarUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
                        ) : (
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-xs font-bold text-[var(--accent)]">
                            {item.name.slice(0, 1)}
                          </span>
                        )}
                        <div>
                          <p className="font-semibold text-[var(--ink)]">{item.name}</p>
                          <p className="line-clamp-1 text-xs text-[var(--muted)]">
                            {item.description || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-[var(--muted)]">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[var(--accent)]"
                      >
                        {item.url}
                      </a>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-[var(--muted)]">{item.sortOrder}</td>
                    <td className="px-4 py-3.5">
                      <Badge tone={item.status === "published" ? "success" : "warning"}>
                        {item.status === "published" ? "已发布" : "待审核"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-1.5">
                        {item.status === "draft" && (
                          <button
                            type="button"
                            onClick={() => void quickApprove(item)}
                            title="一键通过"
                            className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-500/10"
                          >
                            <Check className="h-4 w-4" />
                          </button>
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

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? "编辑友链" : "添加友链"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-[var(--ink)]">站点名称</span>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-[var(--ink)]">站点 URL（需 http/https）</span>
            <Input
              required
              type="url"
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            />
          </label>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-[var(--ink)]">头像 URL</span>
              <ImageUploadButton
                label="上传头像"
                onUploaded={(media) => setForm((f) => ({ ...f, avatarUrl: media.url }))}
              />
            </div>
            <Input
              value={form.avatarUrl}
              onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))}
            />
          </div>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-[var(--ink)]">简介</span>
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-[var(--ink)]">排序</span>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-[var(--ink)]">状态</span>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "draft" | "published" }))}
                className="h-9 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)]"
              >
                <option value="published">已发布</option>
                <option value="draft">待审核 / 草稿</option>
              </select>
            </label>
          </div>
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
        title="删除友链"
        description="确定要删除这条友链记录吗？"
        loading={deleting}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
