import { createFileRoute } from "@tanstack/react-router";
import { ArticleHtml } from "@/components/public/ArticleHtml";
import { ArticleToc } from "@/components/public/ArticleToc";
import { Card } from "@/components/ui/Primitives";
import { getPageBySlugFn } from "@/server/functions/public";
import { formatDateCN } from "@/shared/date";

export const Route = createFileRoute("/_public/$slug")({
  loader: ({ params }) => getPageBySlugFn({ data: { slug: params.slug } }),
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData ? `${loaderData.title} - 运阳的小窝` : "页面 - 运阳的小窝" }],
  }),
  component: DynamicMarkdownPage,
});

function DynamicMarkdownPage() {
  const page = Route.useLoaderData();

  return (
    <div className="mx-auto max-w-5xl editorial-enter space-y-8">
      <header>
        <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2 text-xs tracking-wide text-[var(--muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" aria-hidden="true" />
            <span>独立页面</span>
          </div>
          <span className="font-mono text-[11px] text-[var(--muted-soft)] tabular-nums">
            更新于 {formatDateCN(page.updatedAt)}
          </span>
        </div>

        <div className="border-b border-[var(--border)] pt-6 pb-7">
          <h1 className="font-editorial text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
            {page.title}
          </h1>
          <div className="mt-4 h-[2px] w-8 bg-[var(--sakura)]" aria-hidden="true" />
        </div>
      </header>

      <div
        className={
          page.toc.length > 0 ? "lg:grid lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-12" : "mx-auto max-w-3xl"
        }
      >
        <div className="min-w-0">
          {page.toc.length > 0 && (
            <div className="lg:hidden">
              <ArticleToc items={page.toc} />
            </div>
          )}
          <Card className="min-w-0 p-6 sm:p-9">
            <ArticleHtml html={page.html} />
          </Card>
        </div>

        {page.toc.length > 0 && (
          <div className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
            <ArticleToc items={page.toc} />
          </div>
        )}
      </div>
    </div>
  );
}
