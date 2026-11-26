import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Eye, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { EmptyState, Input, Pagination } from "@/components/ui/Primitives";
import { getPostsFn } from "@/server/functions/public";
import { formatDateCN } from "@/shared/date";

const BlogSearchSchema = z.object({
  page: z.coerce.number().int().min(1).optional().catch(undefined),
  category: z.string().optional(),
  tag: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/_public/blog/")({
  validateSearch: BlogSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) =>
    getPostsFn({
      data: {
        page: deps.page ?? 1,
        pageSize: 12,
        category: deps.category,
        tag: deps.tag,
        q: deps.q,
      },
    }),
  head: () => ({
    meta: [{ title: "文章归档 - 运阳的小窝" }],
  }),
  component: BlogListPage,
});

function BlogListPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const search = Route.useSearch();
  const data = Route.useLoaderData();
  const [keyword, setKeyword] = useState(search.q ?? "");

  useEffect(() => {
    setKeyword(search.q ?? "");
  }, [search.q]);

  const updateFilter = (next: Partial<z.infer<typeof BlogSearchSchema>>) => {
    const nextPage = next.page && next.page > 1 ? next.page : undefined;
    void navigate({
      search: (prev) => ({
        ...prev,
        ...next,
        page: nextPage,
      }),
    });
  };

  return (
    <div className="mx-auto max-w-5xl editorial-enter space-y-8">
      <header>
        <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2 text-xs tracking-wide text-[var(--muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" aria-hidden="true" />
            <span>文章索引</span>
          </div>
          <span className="font-mono text-[11px] text-[var(--muted-soft)] tabular-nums">
            共 {data.pagination.total} 篇
          </span>
        </div>

        <div className="border-b border-[var(--border)] pt-6 pb-8">
          <h1 className="font-editorial text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
            文章归档
          </h1>
          <div className="my-4 h-[2px] w-8 bg-[var(--sakura)]" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            按主题、标签与关键词检索历次工程笔记与技术沉淀。
          </p>
        </div>
      </header>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <form
            className="relative w-full max-w-sm"
            onSubmit={(e) => {
              e.preventDefault();
              updateFilter({ q: keyword.trim() || undefined, page: 1 });
            }}
          >
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--muted-soft)]" />
            <Input
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="在归档中筛选标题或摘要…"
              className="pl-10"
            />
          </form>

          {(search.category || search.tag || search.q) && (
            <button
              type="button"
              onClick={() => {
                setKeyword("");
                void navigate({ search: {} });
              }}
              className="cursor-pointer self-start text-xs font-medium text-[var(--accent)] underline-offset-4 hover:underline sm:self-auto"
            >
              清除全部筛选条件
            </button>
          )}
        </div>

        {/* 分类与标签分区 */}
        {(data.categories.length > 0 || data.tags.length > 0) && (
          <div className="space-y-2.5 border-y border-[var(--border)] py-4">
            {data.categories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-10 shrink-0 font-mono text-[11px] text-[var(--muted-soft)]">分类</span>
                <button
                  type="button"
                  onClick={() => updateFilter({ category: undefined, page: 1 })}
                  className={`cursor-pointer rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
                    !search.category
                      ? "border-transparent bg-[var(--ink)] text-[var(--surface)]"
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--border-strong)] hover:text-[var(--ink)]"
                  }`}
                >
                  全部
                </button>
                {data.categories.map((cat) => (
                  <button
                    key={`cat-${cat}`}
                    type="button"
                    onClick={() =>
                      updateFilter({ category: search.category === cat ? undefined : cat, page: 1 })
                    }
                    className={`cursor-pointer rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
                      search.category === cat
                        ? "border-transparent bg-[var(--ink)] text-[var(--surface)]"
                        : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--border-strong)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {data.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="w-10 shrink-0 font-mono text-[11px] text-[var(--muted-soft)]">标签</span>
                {data.tags.map((tag) => (
                  <button
                    key={`tag-${tag}`}
                    type="button"
                    onClick={() => updateFilter({ tag: search.tag === tag ? undefined : tag, page: 1 })}
                    className={`cursor-pointer rounded-md border px-2.5 py-0.5 font-mono text-[11px] transition-colors ${
                      search.tag === tag
                        ? "border-[var(--sakura)] bg-[var(--sakura-soft)] font-medium text-[var(--sakura)]"
                        : "border-[var(--border)] bg-transparent text-[var(--muted)] hover:border-[var(--border-strong)] hover:text-[var(--ink)]"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {data.items.length === 0 ? (
        <EmptyState title="没有找到匹配的文章" description="换一个关键词或重置筛选条件试试~" />
      ) : (
        <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {data.items.map((post, idx) => (
            <Link
              key={post.id}
              to="/blog/$slug"
              params={{ slug: post.slug }}
              className="group flex items-start gap-4 py-6 transition-colors sm:gap-6"
            >
              <span className="w-7 shrink-0 pt-1 font-mono text-xs text-[var(--muted-soft)] tabular-nums">
                {String((data.pagination.page - 1) * 12 + idx + 1).padStart(2, "0")}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[var(--muted)]">
                  {post.category && (
                    <>
                      <span className="font-medium text-[var(--accent)]">{post.category}</span>
                      <span aria-hidden="true">·</span>
                    </>
                  )}
                  <span className="font-mono tabular-nums">
                    {formatDateCN(post.publishedAt || post.createdAt)}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{post.readingTime} 分钟阅读</span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                    <Eye className="h-3.5 w-3.5" />
                    {post.viewCount}
                  </span>
                </div>

                <h2 className="font-editorial mt-2 text-xl leading-snug font-semibold text-[var(--ink)] transition-colors group-hover:text-[var(--accent)] sm:text-[1.35rem]">
                  {post.title}
                </h2>

                {post.summary && (
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--muted)]">
                    {post.summary}
                  </p>
                )}

                {post.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] text-[var(--muted-soft)]">
                    {post.tags.slice(0, 4).map((tag) => (
                      <span key={tag}>#{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              {post.cover ? (
                <div className="hidden aspect-[16/10] w-40 shrink-0 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] sm:block">
                  <img
                    src={post.cover}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
              ) : (
                <ArrowRight className="mt-1.5 hidden h-4 w-4 shrink-0 text-[var(--muted-soft)] transition-all group-hover:translate-x-1 group-hover:text-[var(--accent)] sm:block" />
              )}
            </Link>
          ))}
        </div>
      )}

      <Pagination
        page={data.pagination.page}
        totalPages={data.pagination.totalPages}
        onPageChange={(nextPage) => updateFilter({ page: nextPage })}
      />
    </div>
  );
}
