import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, Search } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Badge, Card, EmptyState, Input, Pagination } from "@/components/ui/Primitives";
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
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <p className="font-mono text-xs tracking-wider text-[var(--accent)] uppercase">
            ARCHIVE / 文章归档
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--ink)]">所有文章</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">按主题、标签和关键词检索历史记录。</p>
        </div>
        <span className="font-mono text-xs text-[var(--muted)]">共 {data.pagination.total} 篇</span>
      </header>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form
          className="relative w-full max-w-sm"
          onSubmit={(e) => {
            e.preventDefault();
            updateFilter({ q: keyword.trim() || undefined, page: 1 });
          }}
        >
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <Input
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="在归档中筛选…"
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
            className="text-xs font-medium text-[var(--accent)] hover:underline"
          >
            清除全部筛选条件
          </button>
        )}
      </div>

      {/* 分类与标签条 */}
      {(data.categories.length > 0 || data.tags.length > 0) && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => updateFilter({ category: undefined, tag: undefined, page: 1 })}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              !search.category && !search.tag
                ? "bg-[var(--accent)] text-white"
                : "border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            全部
          </button>
          {data.categories.map((cat) => (
            <button
              key={`cat-${cat}`}
              type="button"
              onClick={() => updateFilter({ category: search.category === cat ? undefined : cat, page: 1 })}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                search.category === cat
                  ? "bg-[var(--accent)] text-white"
                  : "border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              分类: {cat}
            </button>
          ))}
          {data.tags.map((tag) => (
            <button
              key={`tag-${tag}`}
              type="button"
              onClick={() => updateFilter({ tag: search.tag === tag ? undefined : tag, page: 1 })}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                search.tag === tag
                  ? "bg-[var(--sakura)] text-white"
                  : "border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {data.items.length === 0 ? (
        <EmptyState title="没有找到匹配的文章" description="换一个关键词或重置筛选条件试试~" />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {data.items.map((post) => (
            <Link key={post.id} to="/blog/$slug" params={{ slug: post.slug }} className="group block">
              <Card className="flex h-full flex-col overflow-hidden transition-all hover:border-[var(--accent)]">
                {post.cover && (
                  <div className="aspect-[16/8] overflow-hidden border-b border-[var(--border)] bg-[var(--surface-subtle)]">
                    <img
                      src={post.cover}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <div className="flex items-center justify-between gap-2 font-mono text-xs text-[var(--muted)]">
                      <span>{formatDateCN(post.publishedAt || post.createdAt)}</span>
                      <span className="inline-flex items-center gap-2">
                        <span>{post.readingTime}m</span>
                        <span className="inline-flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          {post.viewCount}
                        </span>
                      </span>
                    </div>
                    <h2 className="mt-2.5 text-lg font-bold text-[var(--ink)] group-hover:text-[var(--accent)]">
                      {post.title}
                    </h2>
                    {post.summary && (
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--muted)]">
                        {post.summary}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {post.category && <Badge tone="accent">{post.category}</Badge>}
                    {post.tags.map((tag) => (
                      <Badge key={tag} tone="neutral">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Card>
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
