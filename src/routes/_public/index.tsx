import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Eye, FolderGit2, Sparkles } from "lucide-react";
import { ArticleHtml } from "@/components/public/ArticleHtml";
import { Badge, Card } from "@/components/ui/Primitives";
import { getHomeDataFn } from "@/server/functions/public";

export const Route = createFileRoute("/_public/")({
  loader: () => getHomeDataFn(),
  component: HomePage,
});

function formatShortDate(value: string | null): string {
  if (!value) return "--.--";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "--.--";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function HomePage() {
  const bootstrap = useLoaderData({ from: "/_public" });
  const data = Route.useLoaderData();
  const { siteConfig } = bootstrap;
  const heroLead = data.featuredPosts[0];

  return (
    <div className="space-y-14">
      {/* 克制二次元 Hero 区域 */}
      <section className="grid items-center gap-8 lg:grid-cols-12">
        <div className={siteConfig.heroImage ? "lg:col-span-7" : "lg:col-span-12"}>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--muted)]">
            <span className="h-2 w-2 rounded-full bg-[var(--sakura)]" />
            <span>{siteConfig.subtitle}</span>
          </div>

          <div className="mt-6 flex items-center gap-4">
            {siteConfig.avatarUrl ? (
              <img
                src={siteConfig.avatarUrl}
                alt={siteConfig.authorName}
                className="h-16 w-16 rounded-2xl border border-[var(--border)] object-cover ring-4 ring-[var(--accent-soft)]"
              />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-xl font-bold text-[var(--accent)]">
                {siteConfig.authorName.slice(0, 1)}
              </span>
            )}
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)] sm:text-4xl">
                {siteConfig.title}
              </h1>
              <p className="mt-1 font-mono text-xs text-[var(--muted)]">
                BY {siteConfig.authorName.toUpperCase()} · {data.stats.postCount} 篇文章 ·{" "}
                {data.stats.totalViews.toLocaleString("zh-CN")} 次阅读
              </p>
            </div>
          </div>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--muted)]">{siteConfig.bio}</p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/blog"
              search={{ page: 1 }}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
            >
              <BookOpen className="h-4 w-4" />
              浏览文章
            </Link>
            <Link
              to="/moments"
              search={{ page: 1 }}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--accent)]"
            >
              <Sparkles className="h-4 w-4 text-[var(--sakura)]" />
              生活瞬间（{data.stats.momentCount}）
            </Link>
          </div>
        </div>

        {siteConfig.heroImage && (
          <div className="lg:col-span-5">
            <Card className="overflow-hidden p-2">
              <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-[var(--surface-subtle)]">
                <img
                  src={siteConfig.heroImage}
                  alt={siteConfig.title}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent p-4">
                  <span className="font-mono text-[11px] tracking-wider text-white/90 uppercase">
                    CURATED ILLUSTRATION
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </section>

      {/* 精选文章与近期瞬间 */}
      <section className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="font-mono text-xs tracking-wider text-[var(--accent)] uppercase">FEATURED</p>
              <h2 className="text-xl font-bold text-[var(--ink)]">近期精选</h2>
            </div>
            <Link
              to="/blog"
              search={{ page: 1 }}
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline"
            >
              全部文章
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {heroLead ? (
            <Link to="/blog/$slug" params={{ slug: heroLead.slug }} className="group block">
              <Card className="overflow-hidden transition-all hover:border-[var(--accent)]">
                {heroLead.cover && (
                  <div className="aspect-[16/8] overflow-hidden border-b border-[var(--border)] bg-[var(--surface-subtle)]">
                    <img
                      src={heroLead.cover}
                      alt={heroLead.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-[var(--muted)]">
                    {heroLead.category && <Badge tone="accent">{heroLead.category}</Badge>}
                    <span>{formatShortDate(heroLead.publishedAt || heroLead.createdAt)}</span>
                    <span>·</span>
                    <span>{heroLead.readingTime} MIN READ</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      {heroLead.viewCount}
                    </span>
                  </div>
                  <h3 className="mt-3 text-2xl font-bold tracking-tight text-[var(--ink)] group-hover:text-[var(--accent)]">
                    {heroLead.title}
                  </h3>
                  {heroLead.summary && (
                    <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-[var(--muted)]">
                      {heroLead.summary}
                    </p>
                  )}
                </div>
              </Card>
            </Link>
          ) : (
            <Card className="p-8 text-center text-sm text-[var(--muted)]">第一篇文章正在酝酿中…</Card>
          )}
        </div>

        <div className="flex flex-col gap-6 lg:col-span-5">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-mono text-xs tracking-wider text-[var(--sakura)] uppercase">MOMENT</p>
                <h2 className="text-xl font-bold text-[var(--ink)]">最新瞬间</h2>
              </div>
              <Link
                to="/moments"
                search={{ page: 1 }}
                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline"
              >
                更多切片
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {data.latestMoment ? (
              <Link to="/moments" search={{ page: 1 }} hash={data.latestMoment.slug} className="block">
                <Card className="p-5 transition-colors hover:border-[var(--sakura)]">
                  <div className="mb-2 flex items-center justify-between font-mono text-xs text-[var(--muted)]">
                    <span>{data.latestMoment.location || "DAILY NOTE"}</span>
                    <span>
                      {formatShortDate(data.latestMoment.publishedAt || data.latestMoment.createdAt)}
                    </span>
                  </div>
                  <div className="line-clamp-4 text-sm text-[var(--ink)]">
                    <ArticleHtml html={data.latestMoment.html} />
                  </div>
                </Card>
              </Link>
            ) : (
              <Card className="p-6 text-sm text-[var(--muted)]">还没有发布过瞬间~</Card>
            )}
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-mono text-xs tracking-wider text-[var(--accent)] uppercase">WORKBENCH</p>
                <h2 className="text-xl font-bold text-[var(--ink)]">近期项目</h2>
              </div>
              <Link
                to="/projects"
                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline"
              >
                全部（{data.stats.projectCount}）
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="space-y-3">
              {data.projects.length > 0 ? (
                data.projects.map((project) => (
                  <Link key={project.id} to="/projects" className="block">
                    <Card className="flex items-start gap-3 p-4 transition-colors hover:border-[var(--accent)]">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                        {project.icon ? <span>{project.icon}</span> : <FolderGit2 className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[var(--ink)]">{project.name}</p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-[var(--muted)]">
                          {project.description || "持续打磨中的实验作品"}
                        </p>
                      </div>
                    </Card>
                  </Link>
                ))
              ) : (
                <Card className="p-5 text-sm text-[var(--muted)]">暂无公开项目</Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 最近更新文章列表 */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="font-mono text-xs tracking-wider text-[var(--accent)] uppercase">LATEST NOTES</p>
            <h2 className="text-xl font-bold text-[var(--ink)]">最近更新</h2>
          </div>
          <span className="font-mono text-xs text-[var(--muted)]">
            {String(data.recentPosts.length).padStart(2, "0")} /{" "}
            {String(data.stats.postCount).padStart(2, "0")}
          </span>
        </div>

        <div className="divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          {data.recentPosts.map((post) => (
            <Link
              key={post.id}
              to="/blog/$slug"
              params={{ slug: post.slug }}
              className="group flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-[var(--surface-subtle)] sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  {post.category && <Badge tone="accent">{post.category}</Badge>}
                  <h3 className="truncate text-base font-semibold text-[var(--ink)] group-hover:text-[var(--accent)]">
                    {post.title}
                  </h3>
                </div>
                {post.summary && (
                  <p className="mt-1 line-clamp-1 text-sm text-[var(--muted)]">{post.summary}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-4 font-mono text-xs text-[var(--muted)]">
                <span>{post.readingTime}m</span>
                <span>{post.viewCount} views</span>
                <span>{formatShortDate(post.publishedAt || post.createdAt)}</span>
              </div>
            </Link>
          ))}
          {data.recentPosts.length === 0 && (
            <p className="p-8 text-center text-sm text-[var(--muted)]">还没有发布文章</p>
          )}
        </div>
      </section>
    </div>
  );
}
