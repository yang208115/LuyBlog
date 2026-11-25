import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Copy, ExternalLink, Plus } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { TurnstileWidget } from "@/components/public/TurnstileWidget";
import { Button, Card, EmptyState, Input, Modal, Textarea } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { applyFriendLinkFn, getFriendLinksFn } from "@/server/functions/public";

function FriendAvatar({ src, name }: { src: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth === 0) {
      setFailed(true);
    }
  }, []);

  if (src && !failed) {
    return (
      <img
        ref={imgRef}
        src={src}
        alt={name}
        onError={() => setFailed(true)}
        className="h-12 w-12 shrink-0 rounded-xl border border-[var(--border)] object-cover"
      />
    );
  }

  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-base font-bold text-[var(--accent)]">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export const Route = createFileRoute("/_public/friends")({
  loader: () => getFriendLinksFn(),
  head: () => ({
    meta: [{ title: "友链 - 运阳的小窝" }],
  }),
  component: FriendsPage,
});

const emptyForm = {
  name: "",
  url: "",
  description: "",
  avatarUrl: "",
};

function FriendsPage() {
  const data = Route.useLoaderData();
  const bootstrap = useLoaderData({ from: "/_public" });
  const { toast } = useToast();
  const applyFriend = useServerFn(applyFriendLinkFn);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCopyFormat = () => {
    void navigator.clipboard.writeText(data.applyFormat).then(() => toast("已复制本站友链信息", "success"));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (bootstrap.turnstileSiteKey && !turnstileToken) {
      setErrorMsg("请先完成人机验证");
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await applyFriend({
        data: {
          ...form,
          turnstileToken,
        },
      });
      setForm(emptyForm);
      setOpen(false);
      toast("友链申请已提交，等待管理员审核~", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "提交失败，请检查表单内容";
      setErrorMsg(msg);
      toast(msg, "error");
    } finally {
      setResetKey((k) => k + 1);
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <p className="font-mono text-xs tracking-wider text-[var(--sakura)] uppercase">NEIGHBORS / 友链</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--ink)]">互联网邻居</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">在算法推荐之外，仍然有人认真维护属于自己的角落。</p>
        </div>
        <Button type="button" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          申请友链
        </Button>
      </header>

      {data.items.length === 0 ? (
        <EmptyState title="还没有收录友链" description="点击右上角申请交换友链吧~" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((friend) => (
            <a
              key={friend.id}
              href={friend.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <Card className="flex items-start gap-3.5 p-4 transition-all hover:border-[var(--accent)]">
                <FriendAvatar src={friend.avatarUrl} name={friend.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="truncate text-sm font-bold text-[var(--ink)] group-hover:text-[var(--accent)]">
                      {friend.name}
                    </h2>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[var(--muted)] opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--muted)]">
                    {friend.description || "一个认真维护的小角落。"}
                  </p>
                </div>
              </Card>
            </a>
          ))}
        </div>
      )}

      {/* 本站信息与交换说明 */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs tracking-wider text-[var(--accent)] uppercase">EXCHANGE INFO</p>
            <h2 className="mt-1 text-lg font-bold text-[var(--ink)]">本站友链信息</h2>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={handleCopyFormat}>
            <Copy className="h-3.5 w-3.5" />
            复制申请格式
          </Button>
        </div>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 font-mono text-xs leading-relaxed text-[var(--ink)]">
          {data.applyFormat}
        </pre>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="申请交换友链"
        subtitle="提交后进入待审核状态，管理员审核通过即会展示。"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-[var(--ink)]">站点名称</span>
            <Input
              required
              maxLength={120}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="例如：运阳的小窝"
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-[var(--ink)]">站点 URL（需含 http/https）</span>
            <Input
              required
              type="url"
              maxLength={1000}
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="https://example.com"
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-[var(--ink)]">头像 URL（需含 http/https）</span>
            <Input
              required
              type="url"
              maxLength={1000}
              value={form.avatarUrl}
              onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))}
              placeholder="https://example.com/avatar.png"
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-[var(--ink)]">一句话简介</span>
            <Textarea
              required
              rows={3}
              maxLength={300}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="简要介绍你的站点内容…"
            />
          </label>

          <TurnstileWidget
            siteKey={bootstrap.turnstileSiteKey}
            action="friend_link_apply"
            resetKey={resetKey}
            onToken={setTurnstileToken}
          />

          {errorMsg && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-400">
              {errorMsg}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "提交中…" : "提交申请"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
