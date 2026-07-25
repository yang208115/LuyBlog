import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { fetchWithAuth, useAuth } from "../hooks/useAuth";

type CommentItem = {
  id: string;
  content: string;
  createdAt: string;
  user: { username: string };
};

async function fetchComments(targetSlug: string): Promise<CommentItem[]> {
  const response = await fetch(`/api/comments?targetType=post&targetSlug=${encodeURIComponent(targetSlug)}`);
  if (!response.ok) throw new Error("加载评论失败");
  return response.json();
}

export function Comments({ targetSlug }: { targetType: "post"; targetSlug: string }) {
  const { isAuthenticated, login } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const queryKey = ["comments", "post", targetSlug];
  const query = useQuery({ queryKey, queryFn: () => fetchComments(targetSlug) });
  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await fetchWithAuth("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType: "post", targetSlug, content }),
      });
      if (!response.ok) throw new Error("评论失败");
      return response.json();
    },
    onSuccess: async () => {
      setContent("");
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  return (
    <section className="comments-section">
      <span className="eyebrow">DISCUSSION</span>
      <h2>评论 · {query.data?.length ?? 0}</h2>
      {isAuthenticated ? (
        <form
          className="comment-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (content.trim()) createMutation.mutate();
          }}
        >
          <label htmlFor="comment-content">留下你的想法</label>
          <textarea
            id="comment-content"
            required
            value={content}
            placeholder="认真又友善地说点什么…"
            onChange={(event) => setContent(event.target.value)}
          />
          <div>
            <button className="button primary" type="submit" disabled={createMutation.isPending}>
              发布评论
            </button>
          </div>
        </form>
      ) : (
        <div className="alert">
          登录后可发表评论{" "}
          <button className="text-button" type="button" onClick={login}>
            GitHub 登录
          </button>
        </div>
      )}
      <div className="comment-list">
        {query.data?.map((comment) => (
          <article className="comment-card" key={comment.id}>
            <header>
              <strong>{comment.user.username}</strong>
              <span className="note-date">{new Date(comment.createdAt).toLocaleString("zh-CN")}</span>
            </header>
            <p>{comment.content}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
