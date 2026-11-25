import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CornerDownRight, MessageSquare, Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button, ConfirmDialog, Textarea } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { createCommentFn, deleteCommentFn } from "@/server/functions/public";
import type { CommentNode, SessionUser } from "@/shared/types";
import { TurnstileWidget } from "./TurnstileWidget";

function Avatar({ username, avatarUrl }: { username: string; avatarUrl: string | null }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        className="h-8 w-8 rounded-full border border-[var(--border)] object-cover"
      />
    );
  }
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-semibold text-[var(--accent)]">
      {username.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function CommentsSection({
  targetSlug,
  comments,
  user,
  turnstileSiteKey,
}: {
  targetSlug: string;
  comments: CommentNode[];
  user: SessionUser | null;
  turnstileSiteKey: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const createComment = useServerFn(createCommentFn);
  const deleteComment = useServerFn(deleteCommentFn);

  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<CommentNode | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const totalCount = comments.reduce((acc, item) => acc + 1 + item.replies.length, 0);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    if (turnstileSiteKey && !turnstileToken) {
      setErrorMsg("请先完成人机验证");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await createComment({
        data: {
          targetSlug,
          parentId: replyTo?.id,
          content: trimmed,
          turnstileToken,
        },
      });
      setContent("");
      setReplyTo(null);
      toast("评论已发布", "success");
      await router.invalidate();
    } catch (err) {
      const message = err instanceof Error ? err.message : "评论发送失败";
      setErrorMsg(message);
      toast(message, "error");
    } finally {
      setResetKey((k) => k + 1);
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await deleteComment({ data: { id: deleteTargetId } });
      setDeleteTargetId(null);
      toast("评论已删除", "success");
      await router.invalidate();
    } catch (err) {
      toast(err instanceof Error ? err.message : "删除评论失败", "error");
    } finally {
      setDeleting(false);
    }
  };

  const canDelete = (node: CommentNode) =>
    Boolean(user && (user.id === node.user.id || user.role === "admin"));
  const loginHref = `/api/auth/github?next=${encodeURIComponent(`/blog/${targetSlug}`)}`;

  return (
    <section className="mt-14 border-t border-[var(--border)] pt-10" aria-label="评论区">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="font-mono text-xs tracking-wider text-[var(--accent)] uppercase">DISCUSSION</p>
          <h2 className="mt-1 flex items-center gap-2 text-xl font-bold text-[var(--ink)]">
            <MessageSquare className="h-5 w-5 text-[var(--accent)]" />
            评论 · {totalCount}
          </h2>
        </div>
      </div>

      {user ? (
        <form onSubmit={handleSubmit} className="astral-card mb-8 rounded-2xl p-5">
          {replyTo && (
            <div className="mb-3 flex items-center justify-between rounded-xl bg-[var(--surface-subtle)] px-3 py-2 text-xs text-[var(--muted)]">
              <span>
                正在回复 <strong className="text-[var(--ink)]">@{replyTo.user.username}</strong>
              </span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="text-[var(--accent)] hover:underline"
              >
                取消回复
              </button>
            </div>
          )}
          <Textarea
            rows={3}
            required
            maxLength={1000}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={replyTo ? `回复 @${replyTo.user.username}…` : "留下你的想法（支持单层回复）…"}
          />
          <TurnstileWidget
            siteKey={turnstileSiteKey}
            action="comment_create"
            resetKey={resetKey}
            onToken={setTurnstileToken}
          />
          {errorMsg && (
            <div className="mt-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-400">
              {errorMsg}
            </div>
          )}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-[var(--muted)]">以 {user.username} 身份发表</span>
            <Button type="submit" disabled={submitting || !content.trim()}>
              {submitting ? "发布中…" : replyTo ? "发布回复" : "发布评论"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="astral-card mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5">
          <p className="text-sm text-[var(--muted)]">使用 GitHub 登录后即可参与评论与讨论。</p>
          <a
            href={loginHref}
            className="inline-flex h-9 items-center justify-center rounded-xl bg-[var(--accent)] px-4 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
          >
            GitHub 登录
          </a>
        </div>
      )}

      {comments.length === 0 ? (
        <p className="py-6 text-center text-sm text-[var(--muted)]">还没有评论，来做第一个留言的人吧~</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <article key={comment.id} className="astral-card rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar username={comment.user.username} avatarUrl={comment.user.avatarUrl} />
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">{comment.user.username}</p>
                    <time className="font-mono text-xs text-[var(--muted)]">
                      {new Date(comment.createdAt).toLocaleString("zh-CN")}
                    </time>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {user && (
                    <button
                      type="button"
                      onClick={() => setReplyTo(comment)}
                      className="rounded-lg px-2 py-1 text-xs text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--accent)]"
                    >
                      回复
                    </button>
                  )}
                  {canDelete(comment) && (
                    <button
                      type="button"
                      onClick={() => setDeleteTargetId(comment.id)}
                      aria-label="删除评论"
                      className="rounded-lg p-1 text-[var(--muted)] hover:bg-rose-500/10 hover:text-rose-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink)]">
                {comment.content}
              </p>

              {comment.replies.length > 0 && (
                <div className="mt-4 space-y-3 border-l-2 border-[var(--border)] pl-4">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="rounded-xl bg-[var(--surface-subtle)] p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <CornerDownRight className="h-3.5 w-3.5 text-[var(--accent)]" />
                          <Avatar username={reply.user.username} avatarUrl={reply.user.avatarUrl} />
                          <div>
                            <p className="text-xs font-semibold text-[var(--ink)]">{reply.user.username}</p>
                            <time className="font-mono text-[11px] text-[var(--muted)]">
                              {new Date(reply.createdAt).toLocaleString("zh-CN")}
                            </time>
                          </div>
                        </div>
                        {canDelete(reply) && (
                          <button
                            type="button"
                            onClick={() => setDeleteTargetId(reply.id)}
                            aria-label="删除回复"
                            className="rounded-lg p-1 text-[var(--muted)] hover:bg-rose-500/10 hover:text-rose-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--ink)]">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        title="删除评论"
        description="确定要删除这条评论吗？如果是主评论，其下方的回复也会一并删除。"
        confirmLabel="确认删除"
        loading={deleting}
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
      />
    </section>
  );
}
