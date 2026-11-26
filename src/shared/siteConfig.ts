export type FooterBadge = {
  name: string;
  color: string;
};

export type SiteSocial = {
  github: string;
  demo: string;
  gitee: string;
  google: string;
  email: string;
  qq: string;
  wechat: string;
};

export type SiteConfig = {
  title: string;
  subtitle: string;
  faviconUrl: string;
  authorName: string;
  bio: string;
  navTitle: string;
  navSuffix: string;
  navAfter: string;
  avatarUrl: string;
  heroImage: string;
  heroImageLight: string;
  defaultPostCover: string;
  social: SiteSocial;
  buildDate: string;
  footerBadges: FooterBadge[];
  icpConfig: null | { name: string; link: string };
  friendLinkApplyFormat: string;
};

const LEGACY_PLACEHOLDER_URLS = new Set(["https://dmoe.cc/random.php", "http://dmoe.cc/random.php"]);
const LEGACY_DEMO_URLS = new Set(["https://edge.nekro.ai", "http://edge.nekro.ai"]);

function sanitizeLegacyUrl(value: unknown, legacySet: Set<string>, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed || legacySet.has(trimmed)) return fallback;
  return trimmed;
}

export const defaultSiteConfig: SiteConfig = {
  title: "运阳的小窝",
  subtitle: "星雾素笺 · 代码、构建与日常切片",
  faviconUrl: "/luyblog-icon.svg",
  authorName: "运阳",
  bio: "在代码与边缘部署之间穿梭的开发者，记录工程思考、工具实验与生活里闪光的瞬间。",
  navTitle: "运阳",
  navSuffix: "の",
  navAfter: "小窝",
  avatarUrl: "https://avatars.githubusercontent.com/u/132762661?v=4",
  heroImage: "/anime-night-studio.png",
  heroImageLight: "/anime-day-studio.png",
  defaultPostCover: "",
  social: {
    github: "https://github.com/yang208115",
    demo: "",
    gitee: "",
    google: "",
    email: "a3305587173@outlook.com",
    qq: "",
    wechat: "",
  },
  buildDate: "2026-01-01T00:00:00",
  footerBadges: [
    { name: "TanStack Start", color: "indigo" },
    { name: "Cloudflare Workers", color: "amber" },
    { name: "D1 + R2", color: "pink" },
  ],
  icpConfig: null,
  friendLinkApplyFormat:
    "名称：运阳的小窝\n简介：在代码与边缘部署之间穿梭的开发者\n链接：https://blog.lyuy.top\n头像：https://avatars.githubusercontent.com/u/132762661?v=4",
};

/**
 * 兼容旧版 site_settings JSON：
 * - 静默丢弃遗留的 aiConfig 与 bgImages 字段
 * - 清理 dmoe.cc / edge.nekro.ai 等模板占位 URL
 */
export function normalizeSiteConfig(value: unknown): SiteConfig {
  const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const socialRaw =
    source.social && typeof source.social === "object" ? (source.social as Record<string, unknown>) : {};
  const legacyBgImages = Array.isArray(source.bgImages)
    ? source.bgImages.map((item) => sanitizeLegacyUrl(item, LEGACY_PLACEHOLDER_URLS, "")).filter(Boolean)
    : [];

  const heroImageCandidate =
    typeof source.heroImage === "string"
      ? sanitizeLegacyUrl(source.heroImage, LEGACY_PLACEHOLDER_URLS, "")
      : legacyBgImages[0] || defaultSiteConfig.heroImage;

  const heroImageLightCandidate =
    typeof source.heroImageLight === "string"
      ? sanitizeLegacyUrl(source.heroImageLight, LEGACY_PLACEHOLDER_URLS, "")
      : heroImageCandidate === ""
        ? ""
        : heroImageCandidate === defaultSiteConfig.heroImage ||
            typeof source.heroImage !== "string" ||
            heroImageCandidate.includes("anime-night-studio")
          ? defaultSiteConfig.heroImageLight
          : "";

  const icpRaw =
    source.icpConfig && typeof source.icpConfig === "object"
      ? (source.icpConfig as Record<string, unknown>)
      : null;

  const footerBadges = Array.isArray(source.footerBadges)
    ? source.footerBadges
        .map((badge) => {
          if (!badge || typeof badge !== "object") return null;
          const b = badge as Record<string, unknown>;
          const name = String(b.name ?? "").trim();
          if (!name) return null;
          return { name, color: String(b.color ?? "indigo").trim() || "indigo" };
        })
        .filter((item): item is FooterBadge => item !== null)
    : defaultSiteConfig.footerBadges;

  return {
    title:
      typeof source.title === "string" && source.title.trim() ? source.title.trim() : defaultSiteConfig.title,
    subtitle:
      typeof source.subtitle === "string" && source.subtitle.trim()
        ? source.subtitle.trim()
        : defaultSiteConfig.subtitle,
    faviconUrl:
      typeof source.faviconUrl === "string" && source.faviconUrl.trim()
        ? source.faviconUrl.trim()
        : defaultSiteConfig.faviconUrl,
    authorName:
      typeof source.authorName === "string" && source.authorName.trim()
        ? source.authorName.trim()
        : defaultSiteConfig.authorName,
    bio: typeof source.bio === "string" ? source.bio.trim() : defaultSiteConfig.bio,
    navTitle: typeof source.navTitle === "string" ? source.navTitle.trim() : defaultSiteConfig.navTitle,
    navSuffix: typeof source.navSuffix === "string" ? source.navSuffix.trim() : defaultSiteConfig.navSuffix,
    navAfter: typeof source.navAfter === "string" ? source.navAfter.trim() : defaultSiteConfig.navAfter,
    avatarUrl:
      typeof source.avatarUrl === "string" && source.avatarUrl.trim()
        ? source.avatarUrl.trim()
        : defaultSiteConfig.avatarUrl,
    heroImage: heroImageCandidate,
    heroImageLight: heroImageLightCandidate,
    defaultPostCover: sanitizeLegacyUrl(source.defaultPostCover, LEGACY_PLACEHOLDER_URLS, ""),
    social: {
      github:
        typeof socialRaw.github === "string" ? socialRaw.github.trim() : defaultSiteConfig.social.github,
      demo: sanitizeLegacyUrl(socialRaw.demo, LEGACY_DEMO_URLS, ""),
      gitee: typeof socialRaw.gitee === "string" ? socialRaw.gitee.trim() : defaultSiteConfig.social.gitee,
      google:
        typeof socialRaw.google === "string" ? socialRaw.google.trim() : defaultSiteConfig.social.google,
      email: typeof socialRaw.email === "string" ? socialRaw.email.trim() : defaultSiteConfig.social.email,
      qq: typeof socialRaw.qq === "string" ? socialRaw.qq.trim() : defaultSiteConfig.social.qq,
      wechat:
        typeof socialRaw.wechat === "string" ? socialRaw.wechat.trim() : defaultSiteConfig.social.wechat,
    },
    buildDate:
      typeof source.buildDate === "string" && source.buildDate.trim()
        ? source.buildDate.trim()
        : defaultSiteConfig.buildDate,
    footerBadges: footerBadges.length > 0 ? footerBadges : defaultSiteConfig.footerBadges,
    icpConfig:
      icpRaw &&
      typeof icpRaw.name === "string" &&
      icpRaw.name.trim() &&
      typeof icpRaw.link === "string" &&
      icpRaw.link.trim()
        ? { name: icpRaw.name.trim(), link: icpRaw.link.trim() }
        : null,
    friendLinkApplyFormat:
      typeof source.friendLinkApplyFormat === "string"
        ? source.friendLinkApplyFormat
        : defaultSiteConfig.friendLinkApplyFormat,
  };
}
