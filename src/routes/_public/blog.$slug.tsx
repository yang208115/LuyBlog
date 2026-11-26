import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Calendar, Clock, Eye } from "lucide-react";
import { ArticleHtml } from "@/components/public/ArticleHtml";
import { ArticleToc } from "@/components/public/ArticleToc";
import { CommentsSection } from "@/components/public/CommentsSection";
import { getPostBySlugFn } from "@/server/functions/public";
import { formatDateCN } from "@/shared/date";

export const Route = createFileRoute("/_public/blog/$slug")({
  loader: ({ params }) => getPostBySlugFn({ data: { slug: params.slug } }),
  head: ({ loaderData, matches }) => {
    const publicMatch = matches.find((m) => String(m.routeId) === "/_public");
    const siteName =
      (publicMatch?.loaderData as { siteConfig?: { title?: string } } | undefined)?.siteConfig?.title ??
      "运阳的小窝";
    if (!loaderData) {
      return { meta: [{ title: `文章 - ${siteName}` }] };
    }
    const title = `${loaderData.title} - ${siteName}`;
    const description = loaderData.summary ?? loaderData.title;
    const meta = [
      { title },
      { name: "description", content: description },
      { property: "og:type", content: "article" },
      { property: "og:title", content: loaderData.title },
      { property: "og:description", content: description },
      ...(loaderData.cover ? [{ property: "og:image", content: loaderData.cover }] : []),
    ];
    return {
      meta,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: loaderData.title,
            description,
            datePublished: loaderData.publishedAt ?? loaderData.createdAt,
            dateModified: loaderData.updatedAt,
            ...(loaderData.cover ? { image: loaderData.cover } : {}),
          }),
        },
      ],
    };
  },
  component: BlogDetailPage,
});

function BlogDetailPage() {
  const post = Route.useLoaderData();
  const bootstrap = useLoaderData({ from: "/_public" });

  return (
    <div className="mx-auto max-w-5xl editorial-enter">
      <div className="mb-7 flex items-center justify-between gap-4 border-b border-[var(--border)] pb-3 text-xs">
        <Link
          to="/blog"
          search={{}}
          className="inline-flex items-center gap-1.5 font-medium text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          返回文章归档
        </Link>
        <div className="flex items-center gap-2.5 text-[var(--muted-soft)]">
          {post.category && (
            <>
              <Link
                to="/blog"
                search={{ category: post.category }}
                className="font-medium text-[var(--accent)] underline-offset-4 hover:underline"
              >
                {post.category}
              </Link>
              <span aria-hidden="true">·</span>
            </>
          )}
          <time className="font-mono tabular-nums">{formatDateCN(post.publishedAt || post.createdAt)}</time>
        </div>
      </div>

      <article>
        <header className="mb-10 border-b border-[var(--border)] pb-8">
          <h1 className="font-editorial text-3xl leading-[1.25] font-semibold tracking-tight text-[var(--ink)] sm:text-[2.35rem]">
            {post.title}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--muted)]">
            <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
              <Calendar className="h-3.5 w-3.5" />
              {formatDateCN(post.publishedAt || post.createdAt)}
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
              <Clock className="h-3.5 w-3.5" />
              {post.readingTime} 分钟阅读
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
              <Eye className="h-3.5 w-3.5" />
              {post.viewCount.toLocaleString("zh-CN")} 次浏览
            </span>
            {post.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2.5 font-mono text-[11px] text-[var(--muted-soft)]">
                <span aria-hidden="true">·</span>
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    to="/blog"
                    search={{ tag }}
                    className="transition-colors hover:text-[var(--sakura)]"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {post.summary && (
            <p className="mt-6 rounded-r-xl border-l-2 border-l-[var(--sakura)] bg-[var(--surface)]/75 px-5 py-4 text-sm leading-[1.85] text-[var(--muted)]">
              {post.summary}
            </p>
          )}

          {post.cover && (
            <div className="mt-7 overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--surface-subtle)]">
              <img src={post.cover} alt={post.title} className="max-h-[420px] w-full object-cover" />
            </div>
          )}
        </header>

        <div
          className={
            post.toc.length > 0 ? "lg:grid lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-12" : "mx-auto max-w-3xl"
          }
        >
          <div className="min-w-0">
            {post.toc.length > 0 && (
              <div className="lg:hidden">
                <ArticleToc items={post.toc} />
              </div>
            )}
            <ArticleHtml html={post.html} />

            {/* 上一篇 / 下一篇 */}
            {(post.prev || post.next) && (
              <nav
                className="mt-12 grid gap-4 border-t border-[var(--border)] pt-8 sm:grid-cols-2"
                aria-label="相邻文章"
              >
                {post.prev ? (
                  <Link
                    to="/blog/$slug"
                    params={{ slug: post.prev.slug }}
                    className="astral-card group rounded-xl p-4 transition-colors hover:border-[var(--border-strong)]"
                  >
                    <span className="flex items-center gap-1 font-mono text-xs text-[var(--muted-soft)]">
                      <ArrowLeft className="h-3.5 w-3.5" />
                      上一篇
                    </span>
                    <p className="font-editorial mt-1.5 line-clamp-1 text-base font-medium text-[var(--ink)] transition-colors group-hover:text-[var(--accent)]">
                      {post.prev.title}
                    </p>
                  </Link>
                ) : (
                  <div />
                )}

                {post.next && (
                  <Link
                    to="/blog/$slug"
                    params={{ slug: post.next.slug }}
                    className="astral-card group rounded-xl p-4 text-right transition-colors hover:border-[var(--border-strong)]"
                  >
                    <span className="inline-flex items-center gap-1 font-mono text-xs text-[var(--muted-soft)]">
                      下一篇
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                    <p className="font-editorial mt-1.5 line-clamp-1 text-base font-medium text-[var(--ink)] transition-colors group-hover:text-[var(--accent)]">
                      {post.next.title}
                    </p>
                  </Link>
                )}
              </nav>
            )}

            <CommentsSection
              targetSlug={post.slug}
              comments={post.comments}
              user={bootstrap.user}
              turnstileSiteKey={bootstrap.turnstileSiteKey}
            />
          </div>

          {post.toc.length > 0 && (
            <div className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
              <ArticleToc items={post.toc} />
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
