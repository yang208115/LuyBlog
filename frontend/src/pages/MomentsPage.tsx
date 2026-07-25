import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useSiteConfig } from "../context/SiteConfigProvider";
import { contentApi } from "../services/content";

function readableMoment(value: string) {
  return value
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_#>`~-]/g, "")
    .trim();
}

export function MomentsPage() {
  const siteConfig = useSiteConfig();
  const query = useQuery({ queryKey: ["moments"], queryFn: contentApi.moments });
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);
  const moments = query.data ?? [];

  return (
    <div className="page-shell moments-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">MOMENTS / 瞬间</span>
          <h1>最近的生活切片</h1>
          <p>没有严格的时间线，只有此刻想留下来的画面、声音和念头。</p>
        </div>
        <span className="counter">{moments.length} 则</span>
      </header>

      {query.isLoading ? (
        <div className="empty-state">
          <div className="loader" />
          <strong>正在翻看最近的瞬间</strong>
        </div>
      ) : (
        <div className="moment-board">
          {moments.map((moment, index) => {
            const image = moment.images[0];
            const isLiked = liked.has(moment.id);
            return (
              <article
                className={`moment-card${index === 0 ? " featured" : ""}${image ? " with-image" : ""}`}
                key={moment.id}
              >
                <header className="moment-card-head">
                  <span className="moment-author">
                    <img src={siteConfig.avatarUrl} alt="" />
                    <span>
                      <strong>{siteConfig.authorName}</strong>
                      <small>{moment.location || "DAILY NOTE"}</small>
                    </span>
                  </span>
                  <time className="note-date">
                    {new Date(moment.publishedAt || moment.createdAt).toLocaleDateString("zh-CN", {
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </time>
                </header>

                {image && (
                  <a className="moment-media" href={image} target="_blank" rel="noreferrer" aria-label="查看瞬间原图">
                    <img src={image} alt="" />
                    <span>查看原图</span>
                  </a>
                )}

                <div className="moment-copy">
                  <span className="moment-index">{String(index + 1).padStart(2, "0")}</span>
                  <p>{readableMoment(moment.contentMd)}</p>
                </div>
                <div className="moment-actions">
                  <button
                    className={`text-button${isLiked ? " liked" : ""}`}
                    type="button"
                    onClick={() =>
                      setLiked((current) => {
                        const next = new Set(current);
                        if (next.has(moment.id)) next.delete(moment.id);
                        else next.add(moment.id);
                        return next;
                      })
                    }
                  >
                    ♥ {isLiked ? 1 : 0}
                  </button>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => {
                      const url = `${window.location.origin}/moments#${moment.slug}`;
                      void navigator.clipboard.writeText(url);
                      setCopied(moment.id);
                      window.setTimeout(() => setCopied(null), 1600);
                    }}
                  >
                    {copied === moment.id ? "已复制" : "复制链接"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {!query.isLoading && moments.length === 0 && (
        <div className="empty-state">
          <strong>还没有瞬间</strong>
          <p>第一条生活切片正在等待被记录。</p>
        </div>
      )}
    </div>
  );
}
