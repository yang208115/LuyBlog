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
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="border-b border-[var(--border)] pb-6">
        <p className="font-mono text-xs tracking-wider text-[var(--accent)] uppercase">ABOUT / 关于</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--ink)]">
          {page?.title ?? "关于我"}
        </h1>
      </header>

      <Card className="p-6 sm:p-8">
        <ArticleHtml html={page?.html ?? FALLBACK_ABOUT_HTML} />
      </Card>
    </div>
  );
}
