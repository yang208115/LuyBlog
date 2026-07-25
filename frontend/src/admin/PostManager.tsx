import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "./adminApi";
import { StateBlock, StatusChip } from "./AdminPrimitives";

export function PostManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const query = useQuery({ queryKey: ["admin", "posts"], queryFn: adminApi.posts });
  const deleteMutation = useMutation({
    mutationFn: adminApi.deletePost,
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["admin", "posts"] }),
  });

  const items = query.data?.items ?? [];
  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) =>
      [item.title, item.slug, item.summary, item.category, ...(item.tags ?? [])].filter(Boolean).join(" ").toLowerCase().includes(keyword),
    );
  }, [items, search]);

  return (
    <div>
      <div className="toolbar admin-toolbar">
        <label className="search-field">
          <span>⌕</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜索文章…"
          />
        </label>
        <div className="toolbar-group">
          <button className="button ghost" type="button" onClick={() => void query.refetch()}>↻ 刷新</button>
          <Link className="button primary" to="/admin/posts/new">＋ 写新文章</Link>
        </div>
      </div>
      <div className="admin-filter-row">
        <div><button className="chip active" type="button">全部 · {filtered.length}</button></div>
        <small>{filtered.length} 条记录</small>
      </div>
      <StateBlock loading={query.isLoading} error={query.error} empty={!query.isLoading && filtered.length === 0} />
      {filtered.length > 0 && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>文章</th><th>分类与标签</th><th>状态</th><th>浏览</th><th>更新</th><th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((post) => (
                <tr key={post.id}>
                  <td><div className="admin-cell"><span><strong className="cell-title">{post.title}</strong><small className="cell-sub">/blog/{post.slug}</small></span></div></td>
                  <td><div className="admin-tags">{post.category && <span className="tag solid">{post.category}</span>}{post.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div></td>
                  <td><StatusChip status={post.status} /></td>
                  <td>{post.viewCount.toLocaleString()}</td>
                  <td>{new Date(post.updatedAt).toLocaleDateString("zh-CN")}</td>
                  <td><div className="row-actions">
                    <Link className="button small ghost" to={`/admin/posts/${post.id}`}>写作页</Link>
                    <button className="button small danger" type="button" onClick={() => deleteMutation.mutate(post.id)}>删除</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
