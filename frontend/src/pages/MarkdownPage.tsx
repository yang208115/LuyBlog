import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { MarkdownView } from "../components/MarkdownView";
import { contentApi } from "../services/content";

export function MarkdownPage() {
  const { slug = "" } = useParams();
  const query = useQuery({
    queryKey: ["page", slug],
    queryFn: () => contentApi.page(slug),
    enabled: Boolean(slug),
  });

  return (
    <div className="page-shell reading markdown-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">CUSTOM PAGE / {slug.toUpperCase()}</span>
          <h1>{query.data?.title || slug}</h1>
        </div>
      </header>
      <article className="article-body markdown-page-card">
        {query.isLoading && <div className="loader" />}
        {query.isError && (
          <div className="empty-state">
            <strong>页面不存在或尚未发布</strong>
          </div>
        )}
        {query.data && <MarkdownView content={query.data.contentMd} />}
      </article>
    </div>
  );
}
