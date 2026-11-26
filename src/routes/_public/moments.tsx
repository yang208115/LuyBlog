import { createFileRoute, useLoaderData, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Heart, ImageOff, Link2, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { ArticleHtml } from "@/components/public/ArticleHtml";
import { ImageLightbox } from "@/components/public/ImageLightbox";
import { Card, EmptyState, Pagination } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { getMomentsFn, toggleMomentLikeFn } from "@/server/functions/public";
import { formatDateCN } from "@/shared/date";

function MomentImageCard({ src, onOpen }: { src: string; onOpen: () => void }) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth === 0) {
      setFailed(true);
    }
  }, []);

  if (failed) {
    return (
      <div className="flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-subtle)] p-3 text-center text-xs text-[var(--muted)]">
        <ImageOff className="h-5 w-5 opacity-60" />
        <span>图片暂不可用</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)]"
    >
      <img
        ref={imgRef}
        src={src}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    </button>
  );
}

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
    <div className="mx-auto max-w-3xl editorial-enter space-y-8">
      <header>
        <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2 text-xs tracking-wide text-[var(--muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--sakura)]" aria-hidden="true" />
            <span>手账切片</span>
          </div>
          <span className="font-mono text-[11px] text-[var(--muted-soft)] tabular-nums">
            共 {data.pagination.total} 则
          </span>
        </div>

        <div className="border-b border-[var(--border)] pt-6 pb-8">
          <h1 className="font-editorial text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
            日常切片
          </h1>
          <div className="my-4 h-[2px] w-8 bg-[var(--sakura)]" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-[var(--muted)]">一些简短的想法、截图与现场记录。</p>
        </div>
      </header>

      {data.items.length === 0 ? (
        <EmptyState title="还没有发布瞬间" description="第一条生活切片正在路上~" />
      ) : (
        <div className="relative space-y-6 sm:border-l sm:border-[var(--border)] sm:pl-7">
          {data.items.map((moment) => (
            <article key={moment.id} id={moment.slug} className="relative scroll-mt-24">
              <span
                aria-hidden="true"
                className="absolute top-6 -left-[32.5px] hidden h-2 w-2 rounded-full bg-[var(--sakura)] ring-4 ring-[var(--bg)] sm:block"
              />
              <Card className="p-5 transition-colors hover:border-[var(--border-strong)] sm:p-6">
                <header className="mb-4 flex items-center justify-between gap-3 border-b border-[var(--border)] pb-3.5">
                  <div className="flex items-center gap-3">
                    {bootstrap.siteConfig.avatarUrl ? (
                      <img
                        src={bootstrap.siteConfig.avatarUrl}
                        alt={bootstrap.siteConfig.authorName}
                        className="h-8 w-8 rounded-lg border border-[var(--border)] object-cover"
                      />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] font-editorial text-xs font-semibold text-[var(--ink)]">
                        {bootstrap.siteConfig.authorName.slice(0, 1)}
                      </span>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-[var(--ink)]">
                        {bootstrap.siteConfig.authorName}
                      </p>
                      <p className="flex items-center gap-1 font-mono text-[11px] text-[var(--muted-soft)]">
                        <MapPin className="h-3 w-3 text-[var(--sakura)]" />
                        {moment.location || "随手记"}
                      </p>
                    </div>
                  </div>
                  <time className="font-mono text-xs text-[var(--muted-soft)] tabular-nums">
                    {formatDateCN(moment.publishedAt || moment.createdAt)}
                  </time>
                </header>

                <ArticleHtml
                  html={moment.html}
                  className="text-[15px] leading-[1.8] [&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0"
                />

                {moment.images.length > 0 && (
                  <div
                    className={`mt-4 grid gap-2.5 ${
                      moment.images.length === 1
                        ? "max-w-lg grid-cols-1"
                        : moment.images.length === 2
                          ? "grid-cols-2"
                          : "grid-cols-2 sm:grid-cols-3"
                    }`}
                  >
                    {moment.images.map((src, idx) => (
                      <MomentImageCard
                        key={`${moment.id}-${src}`}
                        src={src}
                        onOpen={() => {
                          setLightboxImages(moment.images);
                          setLightboxIndex(idx);
                        }}
                      />
                    ))}
                  </div>
                )}

                <footer className="mt-5 flex items-center gap-4 border-t border-[var(--border)] pt-3.5 text-xs">
                  <button
                    type="button"
                    disabled={likingId === moment.id}
                    onClick={() => void handleLike(moment.id)}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 transition-colors ${
                      moment.liked
                        ? "bg-[var(--sakura-soft)] font-medium text-[var(--sakura)]"
                        : "text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]"
                    }`}
                  >
                    <Heart className={`h-3.5 w-3.5 ${moment.liked ? "fill-current" : ""}`} />
                    <span className="tabular-nums">{moment.likeCount}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => copyAnchor(moment.slug)}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-[var(--muted)] transition-colors hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]"
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
