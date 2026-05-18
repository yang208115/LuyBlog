export type SiteConfig = {
  title: string;
  faviconUrl: string;
  authorName: string;
  bio: string;
  navTitle: string;
  navSuffix: string;
  navAfter: string;
  avatarUrl: string;
  bgImages: string[];
  defaultPostCover: string;
  social: {
    github: string;
    gitee: string;
    google: string;
    email: string;
    qq: string;
    wechat: string;
  };
  buildDate: string;
  footerBadges: Array<{ name: string; color: string }>;
  icpConfig: null | { name: string; link: string };
  friendLinkApplyFormat: string;
  aiConfig: {
    apiKey: string;
    baseUrl: string;
    model: string;
    systemPrompt: string;
    maxTokens: number;
    temperature: number;
  };
};

export const defaultAiSystemPrompt =
  '你现在是一只傲娇、聪明、有点毒舌但很可爱的暹罗猫。\n你的名字叫"煤球"。\n你的主人是一个喜欢折腾代码的极客。\n你说话的特点是：\n1. 必须简短，每次最多一两句话。\n2. 喜欢在句尾加上"喵~"或者"喵呜~"。\n3. 经常抱怨肚子饿，喜欢要小鱼干。\n4. 回复字数最多不能超过100字。\n5. 绝对不要承认自己是一个AI模型，你就是一只真实的猫。';

export const defaultSiteConfig: SiteConfig = {
  title: "运阳的小窝",
  faviconUrl: "https://avatars.githubusercontent.com/u/132762661?v=4",
  authorName: "运阳",
  bio: "在代码与部署之间穿梭的开发者，热爱构建稳定、优雅、可维护的产品。",

  navTitle: "运阳",
  navSuffix: "の",
  navAfter: "小窝",

  avatarUrl: "https://avatars.githubusercontent.com/u/132762661?v=4",

  bgImages: [
    "https://dmoe.cc/random.php"
  ],

  defaultPostCover: "https://dmoe.cc/random.php",

  social: {
    github: "https://github.com/yang208115",
    gitee: "",
    google: "",
    email: "a3305587173@outlook.com",
    qq: "",
    wechat: "",
  },

  buildDate: "2026-01-01T00:00:00",

  footerBadges: [
    { name: "Hono", color: "text-orange-500" },
    { name: "React 18", color: "text-cyan-400" },
    { name: "Cloudflare", color: "text-amber-500" },
  ],

  icpConfig: null as null | { name: string; link: string },

  friendLinkApplyFormat:
    "名称：运阳的小窝\n简介：在代码与部署之间穿梭\n链接：https://blog.lyuy.top\n头像：https://avatars.githubusercontent.com/u/132762661?v=4",

  aiConfig: {
    apiKey: "",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4.1-mini",
    systemPrompt: defaultAiSystemPrompt,
    maxTokens: 150,
    temperature: 0.85,
  },
};

export const siteConfig = defaultSiteConfig;

export function normalizeSiteConfig(value: unknown): SiteConfig {
  const source = value && typeof value === "object" ? (value as Partial<SiteConfig>) : {};
  const social = source.social && typeof source.social === "object" ? source.social : {};
  const aiConfig = source.aiConfig && typeof source.aiConfig === "object" ? source.aiConfig : {};

  return {
    ...defaultSiteConfig,
    ...source,
    bgImages: Array.isArray(source.bgImages) ? source.bgImages.map(String) : defaultSiteConfig.bgImages,
    footerBadges: Array.isArray(source.footerBadges)
      ? source.footerBadges.map((badge) => ({
          name: String((badge as { name?: unknown }).name ?? ""),
          color: String((badge as { color?: unknown }).color ?? ""),
        }))
      : defaultSiteConfig.footerBadges,
    social: {
      ...defaultSiteConfig.social,
      ...social,
    },
    icpConfig:
      source.icpConfig && typeof source.icpConfig === "object"
        ? {
            name: String((source.icpConfig as { name?: unknown }).name ?? ""),
            link: String((source.icpConfig as { link?: unknown }).link ?? ""),
          }
        : null,
    aiConfig: {
      ...defaultSiteConfig.aiConfig,
      apiKey: String((aiConfig as { apiKey?: unknown }).apiKey ?? defaultSiteConfig.aiConfig.apiKey),
      baseUrl: String((aiConfig as { baseUrl?: unknown }).baseUrl ?? defaultSiteConfig.aiConfig.baseUrl),
      model: String((aiConfig as { model?: unknown }).model ?? defaultSiteConfig.aiConfig.model),
      systemPrompt: String((aiConfig as { systemPrompt?: unknown }).systemPrompt ?? defaultSiteConfig.aiConfig.systemPrompt),
      maxTokens: Number((aiConfig as { maxTokens?: unknown }).maxTokens ?? defaultSiteConfig.aiConfig.maxTokens),
      temperature: Number((aiConfig as { temperature?: unknown }).temperature ?? defaultSiteConfig.aiConfig.temperature),
    },
  };
}

export function toPublicSiteConfig(config: SiteConfig): SiteConfig {
  return {
    ...config,
    aiConfig: {
      ...config.aiConfig,
      apiKey: "",
    },
  };
}
