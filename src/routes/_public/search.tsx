import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowUpRight, Search } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { z } from "zod";
import { Badge, Button, Card, EmptyState, Input } from "@/components/ui/Primitives";
import { searchSiteFn } from "@/server/functions/public";
import type { SearchResultItem } from "@/shared/types";

const SearchParamsSchema = z.object({
  q: z.string().optional().catch(undefined),
});

const typeLabels = {
  post: { label: "文章", tone: "accent" as const },
  page: { label: "页面", tone: "neutral" as const },
  moment: { label: "瞬间", tone: "sakura" as const },
  project: { label: "项目", tone: "success" as const },
  friend: { label: "友链", tone: "warning" as const },
};

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
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="border-b border-[var(--border)] pb-6">
        <p className="font-mono text-xs tracking-wider text-[var(--accent)] uppercase">
          SEARCH / FTS5 全文搜索
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--ink)]">
          {q ? `“${q}” 的搜索结果` : "全站搜索"}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">检索已发布的文章、瞬间、项目、页面与友链。</p>
      </header>

      <form onSubmit={handleSubmit} className="flex gap-2.5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <Input
            type="search"
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入关键词回车搜索…"
            className="pl-10"
          />
        </div>
        <Button type="submit">搜索</Button>
      </form>

      {q && <p className="font-mono text-xs text-[var(--muted)]">找到 {data.total} 条相关结果</p>}

      {q && data.items.length === 0 ? (
        <EmptyState title="没有找到相关内容" description="试试换一个关键词，或者缩短搜索词组。" />
      ) : (
        <div className="space-y-3">
          {data.items.map((item) => {
            const meta = typeLabels[item.type];
            const isExternal = /^https?:\/\//.test(item.url);
            return isExternal ? (
              <a
                key={`${item.type}-${item.id}`}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <SearchResultCardContent item={item} meta={meta} />
              </a>
            ) : (
              <Link key={`${item.type}-${item.id}`} to={item.url} className="block">
                <SearchResultCardContent item={item} meta={meta} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SearchResultCardContent({
  item,
  meta,
}: {
  item: SearchResultItem;
  meta: { label: string; tone: "accent" | "neutral" | "sakura" | "success" | "warning" };
}) {
  return (
    <Card className="p-5 transition-colors hover:border-[var(--accent)]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge tone={meta.tone}>{meta.label}</Badge>
          {item.meta.slice(0, 3).map((tag) => (
            <span key={tag} className="font-mono text-[11px] text-[var(--muted)]">
              {tag}
            </span>
          ))}
        </div>
        <ArrowUpRight className="h-4 w-4 text-[var(--muted)]" />
      </div>
      <h2 className="mt-2.5 text-base font-bold text-[var(--ink)]">{item.title}</h2>
      {item.excerpt && <p className="mt-1.5 line-clamp-2 text-sm text-[var(--muted)]">{item.excerpt}</p>}
    </Card>
  );
}
