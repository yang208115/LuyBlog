import { createFileRoute, useLoaderData, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Heart, Link2, MapPin } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { ArticleHtml } from "@/components/public/ArticleHtml";
import { ImageLightbox } from "@/components/public/ImageLightbox";
import { Card, EmptyState, Pagination } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { getMomentsFn, toggleMomentLikeFn } from "@/server/functions/public";

const MomentsSearchSchema = z.object({
  page: z.coerce.number().int().min(1).optional().catch(undefined),
});

export const Route = createFileRoute("/_public/moments")({
  validateSearch: MomentsSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getMomentsFn({ data: { page: deps.page ?? 1, pageSize: 12 } }),
  head: () => ({
    meta: [{ title: "瞬间 - 运阳的小窝" }],
  }),
  component: MomentsPage,
});

function MomentsPage() {
  const data = Route.useLoaderData();
  const bootstrap = useLoaderData({ from: "/_public" });
  const navigate = useNavigate({ from: Route.fullPath });
  const router = useRouter();
  const { toast } = useToast();
  const toggleLike = useServerFn(toggleMomentLikeFn);

  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [likingId, setLikingId] = useState<string | null>(null);

  const handleLike = async (momentId: string) => {
    if (likingId) return;
    setLikingId(momentId);
    try {
      await toggleLike({ data: { momentId } });
      await router.invalidate();
    } catch (err) {
      toast(err instanceof Error ? err.message : "点赞失败", "error");
    } finally {
      setLikingId(null);
    }
  };

  const copyAnchor = (slug: string) => {
    const url = `${window.location.origin}/moments#${slug}`;
    void navigator.clipboard.writeText(url).then(() => toast("已复制瞬间链接", "success"));
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <p className="font-mono text-xs tracking-wider text-[var(--sakura)] uppercase">MOMENTS / 瞬间</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--ink)]">日常切片</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">一些简短的想法、截图与现场记录。</p>
        </div>
        <span className="font-mono text-xs text-[var(--muted)]">共 {data.pagination.total} 则</span>
      </header>

      {data.items.length === 0 ? (
        <EmptyState title="还没有发布瞬间" description="第一条生活切片正在路上~" />
      ) : (
        <div className="space-y-6">
          {data.items.map((moment) => (
            <article key={moment.id} id={moment.slug} className="scroll-mt-24">
              <Card className="p-6">
                <header className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {bootstrap.siteConfig.avatarUrl ? (
                      <img
                        src={bootstrap.siteConfig.avatarUrl}
                        alt={bootstrap.siteConfig.authorName}
                        className="h-9 w-9 rounded-xl border border-[var(--border)] object-cover"
                      />
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-sm font-bold text-[var(--accent)]">
                        {bootstrap.siteConfig.authorName.slice(0, 1)}
                      </span>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-[var(--ink)]">
                        {bootstrap.siteConfig.authorName}
                      </p>
                      <p className="flex items-center gap-1 font-mono text-xs text-[var(--muted)]">
                        <MapPin className="h-3 w-3 text-[var(--sakura)]" />
                        {moment.location || "DAILY NOTE"}
                      </p>
                    </div>
                  </div>
                  <time className="font-mono text-xs text-[var(--muted)]">
                    {new Date(moment.publishedAt || moment.createdAt).toLocaleDateString("zh-CN")}
                  </time>
                </header>

                <ArticleHtml html={moment.html} className="text-sm sm:text-base" />

                {moment.images.length > 0 && (
                  <div
                    className={`mt-4 grid gap-2.5 ${
                      moment.images.length === 1
                        ? "grid-cols-1 max-w-lg"
                        : moment.images.length === 2
                          ? "grid-cols-2"
                          : "grid-cols-2 sm:grid-cols-3"
                    }`}
                  >
                    {moment.images.map((src, idx) => (
                      <button
                        key={`${moment.id}-${src}`}
                        type="button"
                        onClick={() => {
                          setLightboxImages(moment.images);
                          setLightboxIndex(idx);
                        }}
                        className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)]"
                      >
                        <img
                          src={src}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </button>
                    ))}
                  </div>
                )}

                <footer className="mt-5 flex items-center gap-4 border-t border-[var(--border)] pt-3.5 text-xs">
                  <button
                    type="button"
                    disabled={likingId === moment.id}
                    onClick={() => void handleLike(moment.id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-colors ${
                      moment.liked
                        ? "bg-[var(--sakura-soft)] font-medium text-[var(--sakura)]"
                        : "text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]"
                    }`}
                  >
                    <Heart className={`h-3.5 w-3.5 ${moment.liked ? "fill-current" : ""}`} />
                    <span>{moment.likeCount}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => copyAnchor(moment.slug)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[var(--muted)] transition-colors hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    复制链接
                  </button>
                </footer>
              </Card>
            </article>
          ))}
        </div>
      )}

      <Pagination
        page={data.pagination.page}
        totalPages={data.pagination.totalPages}
        onPageChange={(nextPage) => void navigate({ search: { page: nextPage > 1 ? nextPage : undefined } })}
      />

      <ImageLightbox
        images={lightboxImages}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />
    </div>
  );
}
