import { useQuery } from "@tanstack/react-query";
import { FormEvent, useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import { contentApi } from "../services/content";

const resultTypeLabel = {
  post: "ARTICLE",
  page: "PAGE",
  moment: "MOMENT",
  project: "PROJECT",
  friend: "NEIGHBOR",
} as const;

export function SearchPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const keyword = (params.get("q") || "").trim();
  const [input, setInput] = useState(keyword);
  const query = useQuery({
    queryKey: ["search", keyword],
    queryFn: () => contentApi.search(keyword),
    enabled: keyword.length > 0,
  });

  useEffect(() => setInput(keyword), [keyword]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = input.trim();
    navigate(next ? `/search?q=${encodeURIComponent(next)}` : "/search");
  };

  return (
    <div className="page-shell reading">
      <header className="page-heading">
        <div>
          <span className="eyebrow">SEARCH / 全站搜索</span>
          <h1>{keyword ? `“${keyword}”` : "搜索小窝"}</h1>
          <p>搜索覆盖文章、瞬间、项目与独立页面。</p>
        </div>
        <span className="counter">{query.data?.total ?? 0} 项</span>
      </header>

      <form className="filter-bar" onSubmit={submit}>
        <label className="search-field">
          <span>⌕</span>
          <input
            name="q"
            type="search"
            value={input}
            autoFocus
            placeholder="输入关键词"
            onChange={(event) => setInput(event.target.value)}
          />
        </label>
        <button className="button primary" type="submit">
          搜索
        </button>
      </form>

      <div className="search-result-list">
        {query.isLoading && (
          <div className="empty-state">
            <div className="loader" />
            <strong>正在搜索</strong>
          </div>
        )}
        {query.data?.items.map((item, index) => {
          const external = /^https?:\/\//.test(item.url);
          const content = (
            <>
              <span className="eyebrow">
                {resultTypeLabel[item.type]} / {String(index + 1).padStart(2, "0")}
              </span>
              <h3>{item.title}</h3>
              <p>{item.excerpt || item.meta.join(" · ")}</p>
            </>
          );
          return external ? (
            <a className="result-card" href={item.url} target="_blank" rel="noreferrer" key={`${item.type}-${item.id}`}>
              {content}
            </a>
          ) : (
            <RouterLink className="result-card" to={item.url} key={`${item.type}-${item.id}`}>
              {content}
            </RouterLink>
          );
        })}
        {keyword && !query.isLoading && query.data?.items.length === 0 && (
          <div className="empty-state">
            <strong>暂无匹配内容</strong>
            <p>换一个更短的关键词试试。</p>
          </div>
        )}
      </div>
    </div>
  );
}
