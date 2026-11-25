import { createFileRoute } from "@tanstack/react-router";
import { ArticleHtml } from "@/components/public/ArticleHtml";
import { ArticleToc } from "@/components/public/ArticleToc";
import { Card } from "@/components/ui/Primitives";
import { getPageBySlugFn } from "@/server/functions/public";

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
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="border-b border-[var(--border)] pb-6">
        <p className="font-mono text-xs tracking-wider text-[var(--accent)] uppercase">
          PAGE / {page.slug.toUpperCase()}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--ink)]">{page.title}</h1>
        <p className="mt-2 font-mono text-xs text-[var(--muted)]">
          更新于 {new Date(page.updatedAt).toLocaleDateString("zh-CN")}
        </p>
      </header>

      <div className={page.toc.length > 0 ? "lg:grid lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-10" : ""}>
        <Card className="min-w-0 p-6 sm:p-8">
          <ArticleHtml html={page.html} />
        </Card>
        {page.toc.length > 0 && (
          <div className="hidden lg:block">
            <ArticleToc items={page.toc} />
          </div>
        )}
      </div>
    </div>
  );
}
