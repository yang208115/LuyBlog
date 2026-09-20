import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";
import { useSiteConfig } from "../context/SiteConfigProvider";
import { contentApi, normalizeTags } from "../services/content";

function featureImageStyle(image: string) {
  return { "--feature-image": `url(${JSON.stringify(image)})` } as React.CSSProperties;
}

function formatDay(value?: string | null) {
  if (!value) return "NOW";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "NOW";
  return `${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

export default function HomePage() {
  const siteConfig = useSiteConfig();
  const postsQuery = useQuery({ queryKey: ["home", "posts"], queryFn: () => contentApi.posts(8) });
  const momentsQuery = useQuery({ queryKey: ["home", "moments"], queryFn: contentApi.moments });
  const projectsQuery = useQuery({ queryKey: ["home", "projects"], queryFn: contentApi.projects });
  const posts = postsQuery.data?.items ?? [];
  const primaryPost = posts[0];
  const secondaryPost = posts[1];
  const latestMoment = momentsQuery.data?.[0];
  const projectCount = projectsQuery.data?.length ?? 0;
  const total = postsQuery.data?.pagination.total ?? posts.length;
  const fallbackCover =
    siteConfig.defaultPostCover || siteConfig.bgImages.find((image) => image.trim()) || "/anime-night-studio.png";
  const primaryCover = primaryPost?.cover || fallbackCover;
  const secondaryCover = secondaryPost?.cover || latestMoment?.images?.[0] || fallbackCover;

  return (
    <>
      <div className="page-shell">
        <section className="hero">
          <span className="eyebrow">YUNYANG&apos;S DIGITAL GARDEN · ONLINE</span>
          <div className="hero-profile">
            <img src={siteConfig.avatarUrl} alt={`${siteConfig.authorName}的头像`} />
            <span>
              <strong>{siteConfig.authorName}</strong>
              <small>Developer · Pythonista</small>
            </span>
          </div>
          <h1 className="display-title">
            人生苦短，
            <br />
            我用 <em>Python</em>。
          </h1>
          <p className="lead">
            嗨，我是{siteConfig.authorName}。这里是我的数字小窝，收录代码、项目，以及日常里偶尔闪光的瞬间。
          </p>
        </section>

        <section className="section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">EDITOR&apos;S PICK</span>
              <h2>从这里开始</h2>
            </div>
            <span className="counter">
              {String(Math.min(posts.length + projectCount, 99)).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
          </div>
          <div className="feature-grid">
            {primaryPost ? (
              <RouterLink
                className="feature-card large ink has-image"
                to={`/blog/${primaryPost.slug}`}
                data-number="FEATURE / 01"
                style={featureImageStyle(primaryCover)}
              >
                <span className="eyebrow">
                  {primaryPost.category || "工程札记"} · {primaryPost.readingTime || 6} MIN
                </span>
                <h3>{primaryPost.title}</h3>
                <p>{primaryPost.summary || "从一个真实问题出发，记录完整的思考与实现过程。"}</p>
                <div className="feature-tags">
                  {(normalizeTags(primaryPost.tags).length
                    ? normalizeTags(primaryPost.tags)
                    : [primaryPost.category || "FIELD NOTE"]
                  )
                    .slice(0, 2)
                    .map((tag) => (
                      <span className="tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                </div>
              </RouterLink>
            ) : (
              <div
                className="feature-card large ink has-image"
                data-number="FEATURE / 01"
                style={featureImageStyle(fallbackCover)}
              >
                <span className="eyebrow">工程札记</span>
                <h3>新的文章正在路上</h3>
                <p>从真实问题出发，记录完整的思考与实现过程。</p>
              </div>
            )}

            {secondaryPost ? (
              <RouterLink
                className="feature-card accent-wash has-image"
                to={`/blog/${secondaryPost.slug}`}
                data-number="NOTE / 02"
                style={featureImageStyle(secondaryCover)}
              >
                <span className="eyebrow">{secondaryPost.category || "生活切片"}</span>
                <h3>{secondaryPost.title}</h3>
              </RouterLink>
            ) : (
              <RouterLink
                className="feature-card accent-wash has-image"
                to="/moments"
                data-number="NOTE / 02"
                style={featureImageStyle(secondaryCover)}
              >
                <span className="eyebrow">生活切片</span>
                <h3>{latestMoment?.contentMd || "夏夜、灯光与一个不会结束的好梦"}</h3>
              </RouterLink>
            )}

            <RouterLink className="feature-card teal-wash" to="/projects" data-number="BUILD / 03">
              <span className="eyebrow">正在构建</span>
              <h3>近期项目与实验</h3>
              <p>{projectCount || "一些"}个仍在持续生长的小宇宙。</p>
            </RouterLink>
          </div>
        </section>

        <section className="section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">LATEST NOTES</span>
              <h2>最近更新</h2>
            </div>
            <RouterLink className="button ghost" to="/blog">
              查看全部
            </RouterLink>
          </div>

          {postsQuery.isLoading ? (
            <div className="empty-state">
              <div className="loader" />
              <strong>正在整理最近更新</strong>
            </div>
          ) : posts.length ? (
            <div className="note-list">
              {posts.slice(0, 3).map((post) => (
                <RouterLink className="note-row" to={`/blog/${post.slug}`} key={post.id}>
                  <span className="note-date">
                    {formatDay(post.publishedAt || post.createdAt)}
                    <br />
                    {post.viewCount.toLocaleString("zh-CN")} VIEWS
                  </span>
                  <div>
                    <h3>{post.title}</h3>
                    <p>{post.summary || "继续阅读这篇最新记录。"}</p>
                  </div>
                  <span className="round-arrow">↗</span>
                </RouterLink>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <strong>还没有文章</strong>
              <p>第一篇内容发布后会出现在这里。</p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
