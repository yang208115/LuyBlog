import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { splitTags } from "@/components/admin/utils";
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
  createProjectFn,
  deleteProjectFn,
  getAdminProjectsFn,
  updateProjectFn,
} from "@/server/functions/admin";
import type { AdminProjectDto } from "@/shared/types";

export const Route = createFileRoute("/admin/projects")({
  loader: () => getAdminProjectsFn(),
  component: AdminProjectsPage,
});

type ProjectForm = {
  id?: string;
  name: string;
  description: string;
  icon: string;
  githubUrl: string;
  tagsText: string;
  sortOrder: number;
  status: "draft" | "published";
};

const emptyProject: ProjectForm = {
  name: "",
  description: "",
  icon: "✦",
  githubUrl: "",
  tagsText: "",
  sortOrder: 0,
  status: "published",
};

function AdminProjectsPage() {
  const items = Route.useLoaderData();
  const router = useRouter();
  const { toast } = useToast();
  const createProject = useServerFn(createProjectFn);
  const updateProject = useServerFn(updateProjectFn);
  const deleteProject = useServerFn(deleteProjectFn);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ProjectForm>(emptyProject);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openEdit = (item: AdminProjectDto) => {
    setForm({
      id: item.id,
      name: item.name,
      description: item.description ?? "",
      icon: item.icon ?? "",
      githubUrl: item.githubUrl ?? "",
      tagsText: item.tags.join(", "),
      sortOrder: item.sortOrder,
      status: item.status,
    });
    setOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      icon: form.icon.trim() || null,
      githubUrl: form.githubUrl.trim() || null,
      tags: splitTags(form.tagsText),
      sortOrder: Number(form.sortOrder) || 0,
      status: form.status,
    };
    try {
      if (form.id) {
        await updateProject({ data: { id: form.id, ...payload } });
        toast("项目已更新", "success");
      } else {
        await createProject({ data: payload });
        toast("项目已创建", "success");
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
      await deleteProject({ data: { id: deleteId } });
      setDeleteId(null);
      toast("项目已删除", "success");
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
          <p className="font-mono text-xs tracking-wider text-[var(--accent)] uppercase">PROJECTS</p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--ink)]">项目管理</h1>
        </div>
        <Button
          type="button"
          onClick={() => {
            setForm(emptyProject);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          新建项目
        </Button>
      </header>

      {items.length === 0 ? (
        <EmptyState title="暂无项目" description="添加你在做或已开源的项目吧。" />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--surface-subtle)] text-xs text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">项目</th>
                  <th className="px-4 py-3 font-medium">标签</th>
                  <th className="px-4 py-3 font-medium">排序</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-[var(--ink)]">
                        {item.icon ? `${item.icon} ` : ""}
                        {item.name}
                      </p>
                      <p className="line-clamp-1 text-xs text-[var(--muted)]">{item.description || "—"}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map((tag) => (
                          <Badge key={tag}>{tag}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-[var(--muted)]">{item.sortOrder}</td>
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

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? "编辑项目" : "新建项目"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-1.5 text-sm sm:col-span-2">
              <span className="font-medium text-[var(--ink)]">名称</span>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-[var(--ink)]">图标字符</span>
              <Input value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} />
            </label>
          </div>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-[var(--ink)]">项目链接</span>
            <Input
              value={form.githubUrl}
              onChange={(e) => setForm((f) => ({ ...f, githubUrl: e.target.value }))}
              placeholder="https://github.com/..."
            />
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-[var(--ink)]">简介</span>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-1.5 text-sm sm:col-span-2">
              <span className="font-medium text-[var(--ink)]">标签（逗号分隔）</span>
              <Input
                value={form.tagsText}
                onChange={(e) => setForm((f) => ({ ...f, tagsText: e.target.value }))}
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-[var(--ink)]">排序</span>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
              />
            </label>
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
        title="删除项目"
        description="确定要移除这个项目展示吗？"
        loading={deleting}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
