import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, BookOpen, Eye, FolderGit2, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ArticleHtml } from "@/components/public/ArticleHtml";
import { getHomeDataFn } from "@/server/functions/public";
import { formatShortDateCN } from "@/shared/date";

export const Route = createFileRoute("/_public/")({
  loader: () => getHomeDataFn(),
  component: HomePage,
});

function HeroArtworkLayer({ src, fallbackSrc, alt }: { src: string; fallbackSrc: string; alt: string }) {
  const [prevSrc, setPrevSrc] = useState(src);
  const [stage, setStage] = useState<"primary" | "fallback" | "none">(src ? "primary" : "none");
  const imgRef = useRef<HTMLImageElement | null>(null);

  if (prevSrc !== src) {
    setPrevSrc(src);
    setStage(src ? "primary" : "none");
  }

  const activeSrc = stage === "primary" ? src : stage === "fallback" ? fallbackSrc : null;

  const handleImageError = () => {
    if (stage === "primary" && src !== fallbackSrc) {
      setStage("fallback");
    } else {
      setStage("none");
    }
  };

  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth === 0) {
      if (stage === "primary" && src !== fallbackSrc) {
        setStage("fallback");
      } else if (stage === "fallback") {
        setStage("none");
      }
    }
  }, [stage, src, fallbackSrc]);

  if (!activeSrc) {
    return (
      <div className="flex h-full w-full items-center justify-center text-[var(--muted-soft)]">
        <Sparkles className="h-10 w-10" />
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={activeSrc}
      alt={alt}
      onError={handleImageError}
      className="h-full w-full object-cover object-[72%_center] transition-transform duration-700 group-hover:scale-[1.02]"
    />
  );
}

function HeroIllustrationCard({
  lightSrc,
  darkSrc,
  title,
}: {
  lightSrc: string;
  darkSrc: string;
  title: string;
}) {
  const effectiveLightSrc = lightSrc || darkSrc;
  const effectiveDarkSrc = darkSrc || lightSrc;
  const isPaired = Boolean(effectiveLightSrc && effectiveDarkSrc && effectiveLightSrc !== effectiveDarkSrc);

  return (
    <div className="group relative h-full min-h-[260px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] transition-colors duration-300 sm:min-h-[320px] lg:min-h-[370px] dark:border-[var(--border-strong)] dark:bg-[#14192d]">
      {isPaired ? (
        <>
          <div className="pointer-events-auto absolute inset-0 opacity-100 transition-opacity duration-500 dark:pointer-events-none dark:opacity-0">
            <HeroArtworkLayer src={effectiveLightSrc} fallbackSrc="/anime-day-studio.png" alt={title} />
          </div>
          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 dark:pointer-events-auto dark:opacity-100">
            <HeroArtworkLayer src={effectiveDarkSrc} fallbackSrc="/anime-night-studio.png" alt={title} />
          </div>
        </>
      ) : (
        <div className="absolute inset-0">
          <HeroArtworkLayer
            src={effectiveLightSrc || effectiveDarkSrc}
            fallbackSrc={lightSrc ? "/anime-day-studio.png" : "/anime-night-studio.png"}
            alt={title}
          />
        </div>
      )}
    </div>
  );
}

function MomentThumbnail({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth === 0) {
      setFailed(true);
    }
  }, []);

  if (failed) return null;

  return (
    <div className="mt-3 aspect-[16/9] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)]">
      <img
        ref={imgRef}
        src={src}
        alt="瞬间配图"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
      />
    </div>
  );
}

const ROAM_ITEMS = [
  { to: "/blog", label: "文章归档", desc: "按分类与标签索引", search: {} as Record<string, never> },
  { to: "/moments", label: "生活瞬间", desc: "日常切片与随手记", search: {} as Record<string, never> },
  { to: "/friends", label: "友邻链接", desc: "同频站点的穿梭门", search: undefined },
  { to: "/about", label: "关于本站", desc: "技术栈与自述", search: undefined },
] as const;

function HomePage() {
  const bootstrap = useLoaderData({ from: "/_public" });
  const data = Route.useLoaderData();
  const { siteConfig } = bootstrap;

  const heroLead = data.featuredPosts[0] ?? data.recentPosts[0] ?? null;
  const listPosts = data.recentPosts.filter((p) => p.id !== heroLead?.id);
  const displayedCount = (heroLead ? 1 : 0) + listPosts.length;
  const hasHeroArtwork = Boolean(siteConfig.heroImageLight || siteConfig.heroImage);

  return (
    <div className="editorial-enter">
      {/* 顶部期号细线栏 */}
      <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] pb-3">
        <div className="flex min-w-0 items-center gap-2 text-xs tracking-wide text-[var(--muted)]">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--sakura)]" aria-hidden="true" />
          <span className="truncate">{siteConfig.subtitle}</span>
        </div>
        <span className="hidden shrink-0 font-mono text-[11px] tracking-wider text-[var(--muted-soft)] tabular-nums sm:inline">
          NO. {String(data.stats.postCount).padStart(2, "0")} ·{" "}
          {data.stats.totalViews.toLocaleString("zh-CN")} READS · {data.stats.momentCount} MOMENTS
        </span>
      </div>

      {/* Band 1: 非对称杂志封面跨页 */}
      <section className="grid items-stretch gap-8 border-b border-[var(--border)] pt-7 pb-10 lg:grid-cols-12 lg:gap-10">
        <div
          className={`flex flex-col justify-between gap-6 ${
            hasHeroArtwork ? "lg:col-span-5" : "lg:col-span-12"
          }`}
        >
          <div>
            <div className="flex items-center gap-3">
              {siteConfig.avatarUrl ? (
                <img
                  src={siteConfig.avatarUrl}
                  alt={siteConfig.authorName}
                  className="h-11 w-11 rounded-xl border border-[var(--border)] object-cover"
                />
              ) : (
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] font-editorial text-base font-semibold text-[var(--ink)]">
                  {siteConfig.authorName.slice(0, 1)}
                </span>
              )}
              <div className="flex items-center gap-2 font-mono text-xs tracking-wider text-[var(--muted)]">
                <span>BY {siteConfig.authorName.toUpperCase()}</span>
                {siteConfig.social.github && (
                  <a
                    href={siteConfig.social.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="访问 GitHub 主页"
                    className="inline-flex items-center text-[var(--muted-soft)] transition-colors hover:text-[var(--accent)]"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>

            <h1 className="font-editorial mt-5 text-4xl leading-[1.15] font-semibold tracking-tight text-[var(--ink)] sm:text-[2.75rem]">
              {siteConfig.title}
            </h1>

            <div className="my-5 h-[2px] w-8 bg-[var(--sakura)]" aria-hidden="true" />

            <p className="max-w-xl text-[15px] leading-[1.85] text-[var(--muted)]">{siteConfig.bio}</p>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/blog"
                search={{}}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--ink)] px-5 text-sm font-medium text-[var(--surface)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-ink)]"
              >
                <BookOpen className="h-4 w-4" />
                浏览文章
              </Link>
              <Link
                to="/moments"
                search={{}}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--border-strong)] bg-transparent px-4 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--sakura)] hover:text-[var(--sakura)]"
              >
                <Sparkles className="h-4 w-4 text-[var(--sakura)]" />
                生活瞬间（{data.stats.momentCount}）
              </Link>
            </div>

            <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-[var(--border)] pt-4">
              <div>
                <dd className="font-editorial text-xl font-semibold text-[var(--ink)] tabular-nums">
                  {data.stats.postCount}
                </dd>
                <dt className="mt-0.5 text-[11px] text-[var(--muted)]">文章</dt>
              </div>
              <div>
                <dd className="font-editorial text-xl font-semibold text-[var(--ink)] tabular-nums">
                  {data.stats.momentCount}
                </dd>
                <dt className="mt-0.5 text-[11px] text-[var(--muted)]">瞬间</dt>
              </div>
              <div>
                <dd className="font-editorial text-xl font-semibold text-[var(--ink)] tabular-nums">
                  {data.stats.projectCount}
                </dd>
                <dt className="mt-0.5 text-[11px] text-[var(--muted)]">项目</dt>
              </div>
            </dl>
          </div>
        </div>

        {hasHeroArtwork && (
          <div className="lg:col-span-7">
            <HeroIllustrationCard
              lightSrc={siteConfig.heroImageLight}
              darkSrc={siteConfig.heroImage}
              title={siteConfig.title}
            />
          </div>
        )}
      </section>

      {/* Band 2: 8/4 杂志双栏阅读版面 */}
      <section className="grid gap-10 pt-10 lg:grid-cols-12 lg:gap-0">
        {/* 主阅读栏 */}
        <div className="lg:col-span-8 lg:pr-9">
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <div className="flex items-baseline gap-2.5">
              <h2 className="font-editorial text-2xl font-semibold tracking-tight text-[var(--ink)]">
                近期文章
              </h2>
              <span className="font-mono text-xs text-[var(--muted-soft)] tabular-nums">
                {String(data.stats.postCount).padStart(2, "0")} 篇
              </span>
            </div>
            <Link
              to="/blog"
              search={{}}
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
            >
              全部文章
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {heroLead ? (
            <Link to="/blog/$slug" params={{ slug: heroLead.slug }} className="group block">
              <article
                className={`astral-card overflow-hidden rounded-xl transition-colors hover:border-[var(--border-strong)] ${
                  !heroLead.cover ? "border-t-2 border-t-[var(--accent)]" : ""
                }`}
              >
                {heroLead.cover && (
                  <div className="aspect-[16/8] overflow-hidden border-b border-[var(--border)] bg-[var(--surface-subtle)]">
                    <img
                      src={heroLead.cover}
                      alt={heroLead.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  </div>
                )}
                <div className="relative p-6 sm:p-7">
                  {!heroLead.cover && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute top-5 right-6 font-editorial text-3xl text-[var(--muted-soft)]/35 select-none"
                    >
                      01
                    </span>
                  )}

                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pr-10 text-xs text-[var(--muted)]">
                    {heroLead.category && (
                      <>
                        <span className="font-medium text-[var(--accent)]">{heroLead.category}</span>
                        <span aria-hidden="true">·</span>
                      </>
                    )}
                    <span className="font-mono tabular-nums">
                      {formatShortDateCN(heroLead.publishedAt || heroLead.createdAt)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{heroLead.readingTime} 分钟阅读</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                      <Eye className="h-3.5 w-3.5" />
                      {heroLead.viewCount}
                    </span>
                  </div>

                  <h3 className="font-editorial mt-3 text-2xl leading-snug font-semibold tracking-tight text-[var(--ink)] transition-colors group-hover:text-[var(--accent)] sm:text-[1.65rem]">
                    {heroLead.title}
                  </h3>

                  {heroLead.summary && (
                    <p className="mt-3 line-clamp-3 text-[14.5px] leading-[1.8] text-[var(--muted)]">
                      {heroLead.summary}
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
                    <div className="flex flex-wrap items-center gap-2.5 font-mono text-[11px] text-[var(--muted-soft)]">
                      {heroLead.tags.slice(0, 3).map((tag) => (
                        <span key={tag}>#{tag}</span>
                      ))}
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)]">
                      阅读全文
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          ) : (
            <div className="astral-card rounded-xl p-8 text-center text-sm text-[var(--muted)]">
              第一篇文章正在酝酿中…
            </div>
          )}

          {listPosts.length > 0 && (
            <div className="mt-7 divide-y divide-[var(--border)] border-y border-[var(--border)]">
              {listPosts.map((post, index) => (
                <Link
                  key={post.id}
                  to="/blog/$slug"
                  params={{ slug: post.slug }}
                  className="group flex flex-col gap-2 py-4 transition-colors sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                >
                  <div className="flex min-w-0 flex-1 items-baseline gap-3">
                    <span className="w-6 shrink-0 font-mono text-xs text-[var(--muted-soft)] tabular-nums">
                      {String(index + 2).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                        <h3 className="font-editorial text-lg font-medium text-[var(--ink)] transition-colors group-hover:text-[var(--accent)]">
                          {post.title}
                        </h3>
                        {post.category && (
                          <span className="shrink-0 text-xs text-[var(--accent)]">{post.category}</span>
                        )}
                      </div>
                      {post.summary && (
                        <p className="mt-1 line-clamp-1 text-xs leading-relaxed text-[var(--muted)]">
                          {post.summary}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 pl-9 font-mono text-xs text-[var(--muted-soft)] tabular-nums sm:pl-0">
                    <span>{post.readingTime}m</span>
                    <span>{formatShortDateCN(post.publishedAt || post.createdAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {data.stats.postCount > displayedCount && (
            <div className="mt-5 flex justify-end">
              <Link
                to="/blog"
                search={{}}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
              >
                浏览归档中全部 {data.stats.postCount} 篇文章
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* 右侧手账边栏 */}
        <aside className="space-y-9 lg:col-span-4 lg:border-l lg:border-[var(--border)] lg:pl-8">
          {/* 区块 A · 最新瞬间 */}
          <div>
            <div className="mb-4 flex items-baseline justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--sakura)]" aria-hidden="true" />
                <h2 className="font-editorial text-xl font-semibold text-[var(--ink)]">最新瞬间</h2>
              </div>
              <Link
                to="/moments"
                search={{}}
                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--muted)] transition-colors hover:text-[var(--sakura)]"
              >
                更多
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {data.latestMoment ? (
              <Link to="/moments" search={{}} hash={data.latestMoment.slug} className="group block">
                <div className="rounded-xl border border-[var(--border)] border-l-2 border-l-[var(--sakura)] bg-[var(--surface)] p-5 transition-colors group-hover:border-[var(--sakura)]/60">
                  <div className="mb-2.5 flex items-center justify-between font-mono text-[11px] text-[var(--muted-soft)]">
                    <span>{data.latestMoment.location || "随手记"}</span>
                    <span className="tabular-nums">
                      {formatShortDateCN(data.latestMoment.publishedAt || data.latestMoment.createdAt)}
                    </span>
                  </div>
                  <div className="line-clamp-5 text-sm leading-relaxed text-[var(--ink)] [&_p]:my-1.5 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0">
                    <ArticleHtml html={data.latestMoment.html} />
                  </div>
                  {data.latestMoment.images[0] && (
                    <MomentThumbnail key={data.latestMoment.images[0]} src={data.latestMoment.images[0]} />
                  )}
                </div>
              </Link>
            ) : (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 text-sm text-[var(--muted)]">
                还没有发布过瞬间~
              </div>
            )}
          </div>

          {/* 区块 B · 近期项目 */}
          <div>
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h2 className="font-editorial text-xl font-semibold text-[var(--ink)]">近期项目</h2>
              <Link
                to="/projects"
                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
              >
                全部（{data.stats.projectCount}）
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {data.projects.length > 0 ? (
              <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
                {data.projects.map((project) => (
                  <Link
                    key={project.id}
                    to="/projects"
                    className="group flex items-start gap-3 py-3.5 transition-colors"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--accent)]">
                      {project.icon ? <span>{project.icon}</span> : <FolderGit2 className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-[var(--ink)] transition-colors group-hover:text-[var(--accent)]">
                          {project.name}
                        </p>
                        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[var(--muted-soft)] opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-[var(--muted)]">
                        {project.description || "持续打磨中的实验作品"}
                      </p>
                      {project.tags.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-2 font-mono text-[10px] text-[var(--muted-soft)]">
                          {project.tags.slice(0, 2).map((tag) => (
                            <span key={tag}>{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="border-y border-[var(--border)] py-5 text-sm text-[var(--muted)]">暂无公开项目</p>
            )}
          </div>

          {/* 区块 C · 站内漫游 */}
          <div>
            <h2 className="font-editorial mb-3 text-lg font-semibold text-[var(--ink)]">站内漫游</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {ROAM_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  search={item.search}
                  className="group rounded-lg border border-[var(--border)] bg-[var(--surface)]/65 px-3.5 py-2.5 transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--surface)]"
                >
                  <div className="flex items-center justify-between text-xs font-medium text-[var(--ink)] group-hover:text-[var(--accent)]">
                    <span>{item.label}</span>
                    <ArrowRight className="h-3 w-3 text-[var(--muted-soft)] transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-[var(--muted-soft)]">{item.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
