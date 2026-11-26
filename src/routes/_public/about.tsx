import { createFileRoute } from "@tanstack/react-router";
import { ArticleHtml } from "@/components/public/ArticleHtml";
import { Card } from "@/components/ui/Primitives";
import { getPageBySlugFn } from "@/server/functions/public";

const FALLBACK_ABOUT_HTML = `
<h2>你好，我是运阳</h2>
<p>在代码、部署与日常记录之间穿梭的开发者。这里是我的数字小窝，用来安放技术沉淀、工具实验与偶尔闪光的生活切片。</p>
<blockquote><p>清晰比聪明重要，完成比完美重要，而工具最终应该把人的注意力还给人。</p></blockquote>
<h2>关于本站 V2</h2>
<ul>
  <li>基于 <strong>TanStack Start</strong> + <strong>Cloudflare Workers</strong> 构建真 SSR 全栈应用</li>
  <li>使用 <strong>Cloudflare D1</strong> (FTS5 全文检索) 与 <strong>R2</strong> 对象存储</li>
  <li>全站采用克制优雅的星雾素笺设计系统，专注阅读体验</li>
</ul>
`;

export const Route = createFileRoute("/_public/about")({
  loader: async () => {
    try {
      return await getPageBySlugFn({ data: { slug: "about" } });
    } catch {
      return null;
    }
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.title ?? "关于"} - 运阳的小窝` }],
  }),
  component: AboutPage,
});

function AboutPage() {
  const page = Route.useLoaderData();

  return (
    <div className="mx-auto max-w-3xl editorial-enter space-y-8">
      <header>
        <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2 text-xs tracking-wide text-[var(--muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--sakura)]" aria-hidden="true" />
            <span>关于本站</span>
          </div>
          <span className="font-mono text-[11px] text-[var(--muted-soft)]">ABOUT</span>
        </div>

        <div className="border-b border-[var(--border)] pt-6 pb-7">
          <h1 className="font-editorial text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
            {page?.title ?? "关于我"}
          </h1>
          <div className="mt-4 h-[2px] w-8 bg-[var(--sakura)]" aria-hidden="true" />
        </div>
      </header>

      <Card className="p-6 sm:p-9">
        <ArticleHtml html={page?.html ?? FALLBACK_ABOUT_HTML} />
      </Card>
    </div>
  );
}
