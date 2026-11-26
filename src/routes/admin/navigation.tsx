import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { Badge, Button, Card, ConfirmDialog, EmptyState, Input, Modal } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import {
  createNavItemFn,
  deleteNavItemFn,
  getAdminNavItemsFn,
  reorderNavItemsFn,
  updateNavItemFn,
} from "@/server/functions/admin";
import type { AdminNavItemDto } from "@/shared/types";

export const Route = createFileRoute("/admin/navigation")({
  loader: () => getAdminNavItemsFn(),
  component: AdminNavigationPage,
});

type NavForm = {
  id?: string;
  label: string;
  path: string;
  status: "enabled" | "disabled";
};

const emptyNav: NavForm = {
  label: "",
  path: "/",
  status: "enabled",
};

function SortableNavRow({
  item,
  onEdit,
  onToggle,
  onDelete,
}: {
  item: AdminNavItemDto;
  onEdit: (item: AdminNavItemDto) => void;
  onToggle: (item: AdminNavItemDto) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  return (
    <tr
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
      className="bg-[var(--surface)]"
    >
      <td className="w-10 px-3 py-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="拖拽排序"
          className="cursor-grab rounded p-1 text-[var(--muted)] hover:text-[var(--ink)] active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className="px-4 py-3 font-semibold text-[var(--ink)]">{item.label}</td>
      <td className="px-4 py-3 font-mono text-xs text-[var(--muted)]">{item.path}</td>
      <td className="px-4 py-3 font-mono text-xs text-[var(--muted)]">{item.sortOrder}</td>
      <td className="px-4 py-3">
        <button type="button" onClick={() => onToggle(item)}>
          <Badge tone={item.status === "enabled" ? "success" : "neutral"}>
            {item.status === "enabled" ? "已启用" : "已停用"}
          </Badge>
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-1.5">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-500/10"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function AdminNavigationPage() {
  const loadedItems = Route.useLoaderData();
  const router = useRouter();
  const { toast } = useToast();

  const createNav = useServerFn(createNavItemFn);
  const updateNav = useServerFn(updateNavItemFn);
  const reorderNav = useServerFn(reorderNavItemsFn);
  const deleteNav = useServerFn(deleteNavItemFn);

  const [items, setItems] = useState(loadedItems);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NavForm>(emptyNav);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setItems(loadedItems);
  }, [loadedItems]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((i) => i.id === active.id);
    const newIdx = items.findIndex((i) => i.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;

    const reordered = arrayMove(items, oldIdx, newIdx).map((item, idx) => ({
      ...item,
      sortOrder: idx * 10,
    }));
    setItems(reordered);

    try {
      await reorderNav({ data: { ids: reordered.map((i) => i.id) } });
      toast("导航顺序已保存，前台立即生效", "success");
      await router.invalidate();
    } catch (err) {
      setItems(loadedItems);
      toast(err instanceof Error ? err.message : "排序保存失败", "error");
    }
  };

  const handleToggle = async (item: AdminNavItemDto) => {
    try {
      await updateNav({
        data: { id: item.id, status: item.status === "enabled" ? "disabled" : "enabled" },
      });
      toast("导航状态已更新", "success");
      await router.invalidate();
    } catch (err) {
      toast(err instanceof Error ? err.message : "更新失败", "error");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (form.id) {
        await updateNav({ data: { id: form.id, label: form.label, path: form.path, status: form.status } });
        toast("导航项已更新", "success");
      } else {
        await createNav({
          data: {
            label: form.label,
            path: form.path,
            sortOrder: items.length * 10,
            status: form.status,
          },
        });
        toast("导航项已新增", "success");
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
      await deleteNav({ data: { id: deleteId } });
      setDeleteId(null);
      toast("导航项已删除", "success");
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
          <p className="font-mono text-xs tracking-wider text-[var(--accent)] uppercase">NAVIGATION</p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--ink)]">导航栏管理</h1>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            拖拽左侧把手排序，前台将实时按这里的启停与顺序渲染。
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setForm(emptyNav);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          新增导航
        </Button>
      </header>

      {items.length === 0 ? (
        <EmptyState title="暂无导航项" description="添加站内路由或外部链接到顶部导航。" />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[var(--border)] bg-[var(--surface-subtle)] text-xs text-[var(--muted)]">
                    <tr>
                      <th className="w-10 px-3 py-3" />
                      <th className="px-4 py-3 font-medium">显示文本</th>
                      <th className="px-4 py-3 font-medium">目标路径 / URL</th>
                      <th className="px-4 py-3 font-medium">排序值</th>
                      <th className="px-4 py-3 font-medium">状态（点击切换）</th>
                      <th className="px-4 py-3 text-right font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {items.map((item) => (
                      <SortableNavRow
                        key={item.id}
                        item={item}
                        onEdit={(row) => {
                          setForm({ id: row.id, label: row.label, path: row.path, status: row.status });
                          setOpen(true);
                        }}
                        onToggle={(row) => void handleToggle(row)}
                        onDelete={(id) => setDeleteId(id)}
                      />
                    ))}
                  </tbody>
                </table>
              </SortableContext>
            </DndContext>
          </div>
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? "编辑导航项" : "新增导航项"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-[var(--ink)]">显示名称</span>
            <Input
              required
              maxLength={40}
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-[var(--ink)]">路径（以 / 开头，或完整 http(s) 链接）</span>
            <Input
              required
              value={form.path}
              onChange={(e) => setForm((f) => ({ ...f, path: e.target.value }))}
              className="font-mono"
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-[var(--ink)]">状态</span>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "enabled" | "disabled" }))}
              className="h-9 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)]"
            >
              <option value="enabled">已启用</option>
              <option value="disabled">已停用</option>
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
        title="删除导航项"
        description="确定要删除这个导航入口吗？"
        loading={deleting}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
