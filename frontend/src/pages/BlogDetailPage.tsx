import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Comments } from "../components/Comments";
import { MarkdownView } from "../components/MarkdownView";
import { contentApi, normalizeTags } from "../services/content";

export function BlogDetailPage() {
  const { slug = "" } = useParams();
  const query = useQuery({
    queryKey: ["blog", "post", slug],
    queryFn: () => contentApi.post(slug),
    enabled: Boolean(slug),
  });

  if (query.isLoading) {
    return (
      <div className="page-shell reading">
        <div className="status-page">
          <section className="status-card">
            <div className="loader" />
            <span className="eyebrow">LOADING ARTICLE</span>
            <h1>正在展开文章</h1>
          </section>
        </div>
      </div>
    );
  }

  if (!query.data) {
    return (
      <div className="page-shell reading">
        <div className="empty-state">
          <strong>文章不存在或已下线</strong>
          <p>回到归档页看看其他内容吧。</p>
        </div>
      </div>
    );
  }

  const post = query.data;
  const tags = normalizeTags(post.tags);

  return (
    <article className="page-shell reading">
      <header className="article-header">
        <span className="eyebrow">{post.category || "ARTICLE"} · FIELD NOTE</span>
        <h1>{post.title}</h1>
        <div className="article-meta">
          <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString("zh-CN")}</span>
          <span>{post.readingTime || 6} MIN READ</span>
          <span>◉ {post.viewCount.toLocaleString("zh-CN")} VIEWS</span>
        </div>
        <div className="tag-list">
          {post.category && <span className="tag solid">{post.category}</span>}
          {tags.map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
        {post.summary && <div className="article-summary">{post.summary}</div>}
      </header>
      <div className="article-body">
        <MarkdownView content={post.contentMd} />
      </div>
      <Comments targetType="post" targetSlug={post.slug} />
    </article>
  );
}
