import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { contentApi, normalizeTags, type PostItem } from "../services/content";

function postDate(post: PostItem) {
  return new Date(post.publishedAt || post.createdAt);
}

function monthKey(post: PostItem) {
  const date = postDate(post);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function dayLabel(post: PostItem) {
  const date = postDate(post);
  return `${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

export function BlogListPage() {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("全部");
  const query = useQuery({ queryKey: ["blog", "posts"], queryFn: () => contentApi.posts(100) });
  const posts = query.data?.items ?? [];

  const tags = useMemo(() => {
    const values = new Set<string>();
    posts.forEach((post) => {
      if (post.category) values.add(post.category);
      normalizeTags(post.tags).forEach((tag) => values.add(tag));
    });
    return ["全部", ...values];
  }, [posts]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return posts.filter((post) => {
      const postTags = normalizeTags(post.tags);
      const text = `${post.title} ${post.summary || ""} ${post.category || ""} ${postTags.join(" ")}`.toLowerCase();
      return (
        (!keyword || text.includes(keyword)) &&
        (activeTag === "全部" || post.category === activeTag || postTags.includes(activeTag))
      );
    });
  }, [activeTag, posts, search]);

  const groups = useMemo(() => {
    const result = new Map<string, PostItem[]>();
    filtered.forEach((post) => {
      const key = monthKey(post);
      result.set(key, [...(result.get(key) ?? []), post]);
    });
    return [...result.entries()];
  }, [filtered]);

  return (
    <div className="page-shell reading">
      <header className="page-heading">
        <div>
          <span className="eyebrow">ARCHIVE / 文章归档</span>
          <h1>所有文章</h1>
          <p>按时间、主题和偶尔闪现的兴趣整理。</p>
        </div>
        <span className="counter">{String(filtered.length).padStart(2, "0")} 篇</span>
      </header>

      <section className="filter-bar">
        <label className="search-field">
          <span>⌕</span>
          <input
            type="search"
            value={search}
            placeholder="搜索标题、摘要或标签"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </section>

      <div className="chip-row" aria-label="文章标签筛选">
        {tags.map((tag) => (
          <button
            className={`chip${activeTag === tag ? " active" : ""}`}
            type="button"
            key={tag}
            onClick={() => setActiveTag(tag)}
          >
            {tag}
          </button>
        ))}
      </div>

      {query.isLoading ? (
        <div className="empty-state" style={{ marginTop: 28 }}>
          <div className="loader" />
          <strong>正在整理文章</strong>
        </div>
      ) : groups.length ? (
        <div id="archive-results">
          {groups.map(([month, items]) => (
            <section className="archive-group" key={month}>
              <div className="archive-month">
                <strong>{month.slice(-2)}</strong>
                <span>
                  {month.slice(0, 4)} / {items.length} POSTS
                </span>
              </div>
              <div className="archive-items">
                {items.map((post) => (
                  <RouterLink className="archive-card" to={`/blog/${post.slug}`} key={post.id}>
                    <header>
                      <h3>{post.title}</h3>
                      <span className="note-date">{dayLabel(post)}</span>
                    </header>
                    <p>{post.summary || "继续阅读这篇文章。"}</p>
                    <div className="tag-list">
                      {post.category && <span className="tag solid">{post.category}</span>}
                      {normalizeTags(post.tags).map((tag) => (
                        <span className="tag" key={tag}>
                          {tag}
                        </span>
                      ))}
                      <span className="tag">◉ {post.viewCount}</span>
                    </div>
                  </RouterLink>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="empty-state" style={{ marginTop: 28 }}>
          <strong>没有找到匹配的文章</strong>
          <p>试试清空关键词或选择“全部”。</p>
        </div>
      )}
    </div>
  );
}
