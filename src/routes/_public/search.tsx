import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Search } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { z } from "zod";
import { EmptyState, Input } from "@/components/ui/Primitives";
import { searchSiteFn } from "@/server/functions/public";
import type { SearchResultItem } from "@/shared/types";

const SearchParamsSchema = z.object({
  q: z.string().optional().catch(undefined),
});

const typeStyles: Record<SearchResultItem["type"], { label: string; colorClass: string }> = {
  post: { label: "文章", colorClass: "text-[var(--accent)]" },
  page: { label: "页面", colorClass: "text-[var(--muted)]" },
  moment: { label: "瞬间", colorClass: "text-[var(--sakura)]" },
  project: { label: "项目", colorClass: "text-emerald-600 dark:text-emerald-400" },
  friend: { label: "友链", colorClass: "text-amber-600 dark:text-amber-400" },
};

const QUICK_DESTINATIONS = [
  { to: "/blog", search: {} as Record<string, never>, title: "文章归档", desc: "浏览全部分类与技术笔记" },
  { to: "/moments", search: {} as Record<string, never>, title: "生活瞬间", desc: "随手记下的切片与想法" },
  { to: "/projects", search: undefined, title: "造物项目", desc: "开源实验与工具作品集" },
  { to: "/friends", search: undefined, title: "友邻名录", desc: "去邻居的站点逛一逛" },
] as const;

export const Route = createFileRoute("/_public/search")({
  validateSearch: SearchParamsSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => searchSiteFn({ data: { q: deps.q ?? "", limit: 30 } }),
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData?.query ? `搜索：${loaderData.query} - 运阳的小窝` : "全站搜索 - 运阳的小窝" }],
  }),
  component: SearchPage,
});

function SearchPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const search = Route.useSearch();
  const q = search.q ?? "";
  const data = Route.useLoaderData();
  const [input, setInput] = useState(q);

  useEffect(() => {
    setInput(q);
  }, [q]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    void navigate({ search: { q: trimmed || undefined } });
  };

  return (
    <div className="mx-auto max-w-3xl editorial-enter space-y-8">
      <header>
        <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2 text-xs tracking-wide text-[var(--muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" aria-hidden="true" />
            <span>全站检索 · FTS5</span>
          </div>
          {q && (
            <span className="font-mono text-[11px] text-[var(--muted-soft)] tabular-nums">
              找到 {data.total} 条结果
            </span>
          )}
        </div>

        <div className="border-b border-[var(--border)] pt-6 pb-8">
          <h1 className="font-editorial text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
            {q ? `“${q}” 的搜索结果` : "全站搜索"}
          </h1>
          <div className="my-4 h-[2px] w-8 bg-[var(--sakura)]" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            检索已发布的文章、瞬间、项目、页面与友链。
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex gap-2.5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--muted-soft)]" />
          <Input
            type="search"
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入关键词回车搜索…"
            className="h-10 pl-10"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-[var(--ink)] px-5 text-sm font-medium text-[var(--surface)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-ink)]"
        >
          搜索
        </button>
      </form>

      {!q ? (
        <section className="space-y-3 pt-2">
          <p className="font-mono text-[11px] tracking-wider text-[var(--muted-soft)]">站内快捷入口</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {QUICK_DESTINATIONS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                search={item.search}
                className="group rounded-xl border border-[var(--border)] bg-[var(--surface)]/75 p-4 transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--surface)]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-editorial text-base font-semibold text-[var(--ink)] transition-colors group-hover:text-[var(--accent)]">
                    {item.title}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-[var(--muted-soft)] transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">{item.desc}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : data.items.length === 0 ? (
        <EmptyState title="没有找到相关内容" description="试试换一个关键词，或者缩短搜索词组。" />
      ) : (
        <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {data.items.map((item) => {
            const meta = typeStyles[item.type];
            const isExternal = /^https?:\/\//.test(item.url);
            return isExternal ? (
              <a
                key={`${item.type}-${item.id}`}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block py-5 transition-colors"
              >
                <SearchResultRow item={item} meta={meta} />
              </a>
            ) : (
              <Link
                key={`${item.type}-${item.id}`}
                to={item.url}
                className="group block py-5 transition-colors"
              >
                <SearchResultRow item={item} meta={meta} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SearchResultRow({
  item,
  meta,
}: {
  item: SearchResultItem;
  meta: { label: string; colorClass: string };
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
          <span className={`font-medium ${meta.colorClass}`}>{meta.label}</span>
          {item.meta.slice(0, 3).map((tag) => (
            <span key={tag} className="font-mono text-[11px] text-[var(--muted-soft)]">
              · {tag}
            </span>
          ))}
        </div>
        <h2 className="font-editorial mt-1.5 text-lg font-medium text-[var(--ink)] transition-colors group-hover:text-[var(--accent)]">
          {item.title}
        </h2>
        {item.excerpt && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[var(--muted)]">{item.excerpt}</p>
        )}
      </div>
      <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-[var(--muted-soft)] transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--accent)]" />
    </div>
  );
}
