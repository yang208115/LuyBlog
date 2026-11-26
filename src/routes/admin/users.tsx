import { createFileRoute, useLoaderData, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Ban, Shield, ShieldOff, UserCheck } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Badge, Card, ConfirmDialog, EmptyState, Pagination } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { getAdminUsersFn, updateUserRoleFn, updateUserStatusFn } from "@/server/functions/admin";
import type { AdminUserDto } from "@/shared/types";

const UsersSearch = z.object({
  page: z.coerce.number().int().min(1).optional().catch(undefined),
});

export const Route = createFileRoute("/admin/users")({
  validateSearch: UsersSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getAdminUsersFn({ data: { page: deps.page ?? 1, pageSize: 20 } }),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const data = Route.useLoaderData();
  const bootstrap = useLoaderData({ from: "/admin" });
  const navigate = useNavigate({ from: Route.fullPath });
  const router = useRouter();
  const { toast } = useToast();

  const updateRole = useServerFn(updateUserRoleFn);
  const updateStatus = useServerFn(updateUserStatusFn);

  const [pendingAction, setPendingAction] = useState<
    | { type: "role"; user: AdminUserDto; nextRole: "user" | "admin" }
    | { type: "status"; user: AdminUserDto; nextStatus: "active" | "banned" }
    | null
  >(null);
  const [processing, setProcessing] = useState(false);

  const handleConfirm = async () => {
    if (!pendingAction) return;
    setProcessing(true);
    try {
      if (pendingAction.type === "role") {
        await updateRole({ data: { id: pendingAction.user.id, role: pendingAction.nextRole } });
        toast("用户角色已更新", "success");
      } else {
        await updateStatus({ data: { id: pendingAction.user.id, status: pendingAction.nextStatus } });
        toast(pendingAction.nextStatus === "banned" ? "用户已禁用并注销全部分话" : "用户已解封", "success");
      }
      setPendingAction(null);
      await router.invalidate();
    } catch (err) {
      toast(err instanceof Error ? err.message : "操作失败", "error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="border-b border-[var(--border)] pb-5">
        <p className="font-mono text-xs tracking-wider text-[var(--accent)] uppercase">USERS</p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--ink)]">用户管理</h1>
        <p className="mt-0.5 text-xs text-[var(--muted)]">
          禁用用户会同步清除其在线 Session 并阻止 OAuth 登录。
        </p>
      </header>

      {data.items.length === 0 ? (
        <EmptyState title="暂无注册用户" />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--surface-subtle)] text-xs text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">用户</th>
                  <th className="px-4 py-3 font-medium">GitHub ID</th>
                  <th className="px-4 py-3 font-medium">角色</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 font-medium">注册时间</th>
                  <th className="px-4 py-3 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {data.items.map((u) => {
                  const isSelf = u.id === bootstrap.user?.id;
                  return (
                    <tr key={u.id}>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
                          ) : (
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-xs font-bold text-[var(--accent)]">
                              {u.username.slice(0, 1).toUpperCase()}
                            </span>
                          )}
                          <div>
                            <p className="font-semibold text-[var(--ink)]">
                              {u.username}{" "}
                              {isSelf && <span className="text-xs text-[var(--accent)]">(我)</span>}
                            </p>
                            <p className="text-xs text-[var(--muted)]">{u.email || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-[var(--muted)]">{u.githubId}</td>
                      <td className="px-4 py-3.5">
                        <Badge tone={u.role === "admin" ? "accent" : "neutral"}>
                          {u.role === "admin" ? "管理员" : "普通用户"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge tone={u.status === "active" ? "success" : "danger"}>
                          {u.status === "active" ? "正常" : "已封禁"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-[var(--muted)]">
                        {new Date(u.createdAt).toLocaleDateString("zh-CN")}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() =>
                              setPendingAction({
                                type: "role",
                                user: u,
                                nextRole: u.role === "admin" ? "user" : "admin",
                              })
                            }
                            title={u.role === "admin" ? "降为普通用户" : "设为管理员"}
                            className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] disabled:opacity-30"
                          >
                            {u.role === "admin" ? (
                              <ShieldOff className="h-4 w-4" />
                            ) : (
                              <Shield className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() =>
                              setPendingAction({
                                type: "status",
                                user: u,
                                nextStatus: u.status === "active" ? "banned" : "active",
                              })
                            }
                            title={u.status === "active" ? "封禁用户" : "解封用户"}
                            className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-500/10 disabled:opacity-30"
                          >
                            {u.status === "active" ? (
                              <Ban className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4 text-emerald-500" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
        open={Boolean(pendingAction)}
        title="确认用户变更"
        description={
          pendingAction?.type === "role"
            ? `确定将 ${pendingAction.user.username} 的角色更改为 ${pendingAction.nextRole === "admin" ? "管理员" : "普通用户"} 吗？`
            : pendingAction
              ? `确定要${pendingAction.nextStatus === "banned" ? "封禁" : "解封"}用户 ${pendingAction.user.username} 吗？`
              : ""
        }
        confirmLabel="确认"
        loading={processing}
        onCancel={() => setPendingAction(null)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
