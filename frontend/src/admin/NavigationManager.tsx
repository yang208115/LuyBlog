import { Box, Button, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField } from "@mui/material";
import { DeleteOutlineRounded, DragIndicatorRounded, EditRounded } from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AdminNavItem, adminApi } from "./adminApi";
import { AdminToolbar, EntityDialog, StateBlock, StatusChip } from "./AdminPrimitives";

type NavForm = { label: string; path: string; sortOrder: number; status: "enabled" | "disabled" };
const emptyForm: NavForm = { label: "", path: "/", sortOrder: 0, status: "enabled" };
const fromItem = (item?: AdminNavItem): NavForm =>
  item ? { label: item.label, path: item.path, sortOrder: item.sortOrder, status: item.status } : emptyForm;
const payload = (form: NavForm) => ({ label: form.label, path: form.path, sortOrder: form.sortOrder, status: form.status });

function SortableNavRow({
  item,
  onEdit,
  onDelete,
  disabled,
}: {
  item: AdminNavItem;
  onEdit: (item: AdminNavItem) => void;
  onDelete: (id: string) => void;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    backgroundColor: isDragging ? "action.hover" : undefined,
    position: "relative" as const,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <TableRow ref={setNodeRef} style={style} hover>
      <TableCell
        sx={{
          color: disabled ? "text.disabled" : "text.secondary",
          width: 52,
          cursor: disabled ? "default" : isDragging ? "grabbing" : "grab",
          touchAction: "none",
        }}
        {...attributes}
        {...listeners}
      >
        <DragIndicatorRounded fontSize="small" />
      </TableCell>
      <TableCell>{item.label}</TableCell>
      <TableCell>{item.path}</TableCell>
      <TableCell>{item.sortOrder}</TableCell>
      <TableCell>
        <StatusChip status={item.status} />
      </TableCell>
      <TableCell align="right">
        <Button size="small" startIcon={<EditRounded />} onClick={() => onEdit(item)}>
          编辑
        </Button>
        <Button size="small" color="error" startIcon={<DeleteOutlineRounded />} onClick={() => onDelete(item.id)}>
          删除
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function NavigationManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminNavItem | null>(null);
  const [form, setForm] = useState<NavForm>(emptyForm);
  const [orderedItems, setOrderedItems] = useState<AdminNavItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const query = useQuery({ queryKey: ["admin", "nav-items"], queryFn: adminApi.navItems });
  const createMutation = useMutation({
    mutationFn: adminApi.createNavItem,
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["admin", "nav-items"] }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: ReturnType<typeof payload> }) => adminApi.updateNavItem(id, body),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["admin", "nav-items"] }),
  });
  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteNavItem,
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["admin", "nav-items"] }),
  });
  const reorderMutation = useMutation({
    mutationFn: adminApi.reorderNavItems,
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["admin", "nav-items"] }),
    onError: () => {
      // Revert on error
      setOrderedItems(query.data?.items ?? []);
    },
  });

  useEffect(() => {
    if (query.data?.items) {
      setOrderedItems(query.data.items);
    }
  }, [query.data?.items]);

  const isSearchActive = search.trim().length > 0;
  const filtered = useMemo(
    () =>
      orderedItems.filter(
        (item) => !isSearchActive || [item.label, item.path].join(" ").toLowerCase().includes(search.toLowerCase()),
      ),
    [orderedItems, search, isSearchActive],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOrderedItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);

        // Save the new order to the backend
        reorderMutation.mutate(newItems.map((item) => item.id));

        return newItems;
      });
    }
  };

  const start = (item?: AdminNavItem) => {
    setEditing(item ?? null);
    setForm(fromItem(item));
    setOpen(true);
  };

  const save = () => {
    const body = payload(form);
    const options = { onSuccess: () => setOpen(false) };
    editing ? updateMutation.mutate({ id: editing.id, body }, options) : createMutation.mutate(body, options);
  };

  const activeItem = useMemo(() => orderedItems.find((item) => item.id === activeId), [activeId, orderedItems]);

  return (
    <Box>
      <AdminToolbar
        search={search}
        onSearch={setSearch}
        onRefresh={() => void query.refetch()}
        onCreate={() => start()}
        createLabel="添加导航"
      />
      <StateBlock loading={query.isLoading} error={query.error} empty={!query.isLoading && filtered.length === 0} />
      {filtered.length > 0 && (
        <Paper variant="outlined">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 52 }} />
                  <TableCell>名称</TableCell>
                  <TableCell>路径</TableCell>
                  <TableCell>排序</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <SortableContext items={filtered.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                  {filtered.map((item) => (
                    <SortableNavRow
                      key={item.id}
                      item={item}
                      onEdit={start}
                      onDelete={(id) => deleteMutation.mutate(id)}
                      disabled={isSearchActive}
                    />
                  ))}
                </SortableContext>
              </TableBody>
            </Table>
            <DragOverlay
              dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({
                  styles: {
                    active: {
                      opacity: "0.4",
                    },
                  },
                }),
              }}
            >
              {activeItem ? (
                <Table size="small" sx={{ bgcolor: "background.paper", boxShadow: 3, borderRadius: 1 }}>
                  <TableBody>
                    <TableRow hover>
                      <TableCell sx={{ color: "text.secondary", width: 52, cursor: "grabbing" }}>
                        <DragIndicatorRounded fontSize="small" />
                      </TableCell>
                      <TableCell>{activeItem.label}</TableCell>
                      <TableCell>{activeItem.path}</TableCell>
                      <TableCell>{activeItem.sortOrder}</TableCell>
                      <TableCell>
                        <StatusChip status={activeItem.status} />
                      </TableCell>
                      <TableCell align="right">
                        <Button size="small" startIcon={<EditRounded />} disabled>
                          编辑
                        </Button>
                        <Button size="small" color="error" startIcon={<DeleteOutlineRounded />} disabled>
                          删除
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : null}
            </DragOverlay>
          </DndContext>
        </Paper>
      )}
      <EntityDialog
        open={open}
        title={editing ? "编辑导航" : "添加导航"}
        saving={createMutation.isPending || updateMutation.isPending}
        onClose={() => setOpen(false)}
        onSave={save}
      >
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField fullWidth label="显示名称" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            <TextField
              select
              fullWidth
              label="状态"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as NavForm["status"] })}
              sx={{ flex: { md: "0 0 160px" } }}
            >
              <MenuItem value="enabled">启用</MenuItem>
              <MenuItem value="disabled">停用</MenuItem>
            </TextField>
          </Stack>
          <TextField
            fullWidth
            label="链接路径"
            helperText="站内路径如 /blog，也可以填写 https:// 外部链接。"
            value={form.path}
            onChange={(e) => setForm({ ...form, path: e.target.value })}
          />
        </Stack>
      </EntityDialog>
    </Box>
  );
}
