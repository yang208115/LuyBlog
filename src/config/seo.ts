/**
 * 集中化的SEO配置文件
 * 其他开发者只需要修改这一个文件即可完成所有SEO配置
 */

export interface SEOConfig {
  // 基础信息
  siteName: string;
  siteUrl: string;
  title: string;
  description: string;
  keywords: string[];
  author: string;
  language: string;

  // 社交媒体
  ogImage: string;
  twitterHandle?: string;

  // 品牌色彩
  themeColor: string;

  // 页面配置
  pages: {
    [path: string]: {
      title?: string;
      description?: string;
      keywords?: string[];
      changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
      priority?: number;
    };
  };
}

/**
 * 默认SEO配置
 * 🎯 用户只需要修改这个配置对象即可完成整站SEO设置
 */
export const seoConfig: SEOConfig = {
  // 🌟 基础网站信息（必须修改）
  siteName: "运阳的小窝",
  siteUrl: "https://blog.lyuy.top/",
  title: "运阳的小窝 - 人生苦短,我用python",
  description: "运阳的个人博客，记录全栈开发、部署与 AI 实践。",
  keywords: [
    "运阳",
    "yunyang",
    "yang208115"
  ],
  author: "运阳",
  language: "zh-CN",

  // 🎨 社交媒体和品牌
  ogImage: "",
  themeColor: "#8A2BE2",

  // 📄 页面级配置
  pages: {
    "/": {
      title: "运阳的小窝 - 人生苦短,我用python",
      description: "运阳的个人博客，记录全栈开发、部署与 AI 实践。",
      keywords: ["运阳", "个人博客", "全栈开发", "Cloudflare", "React", "Python", "Agent"],
      changefreq: "daily",
      priority: 1.0,
    },
    "/blog": {
      title: "文章列表 - 运阳的小窝",
      description: "浏览运阳的小窝全部博客文章。",
      keywords: ["博客", "文章", "技术分享"],
      changefreq: "daily",
      priority: 0.9,
    },
    "/dashboard": {
      title: "用户控制台 - 运阳的小窝",
      description: "查看账号信息与 API Key。",
      keywords: ["控制台", "用户中心", "账号"],
      changefreq: "weekly",
      priority: 0.6,
    },
  },
};

/**
 * 生成页面的完整标题
 */
export function generatePageTitle(path: string): string {
  const pageConfig = seoConfig.pages[path];
  return pageConfig?.title || `${seoConfig.title} | ${seoConfig.siteName}`;
}

/**
 * 生成页面描述
 */
export function generatePageDescription(path: string): string {
  const pageConfig = seoConfig.pages[path];
  return pageConfig?.description || seoConfig.description;
}

/**
 * 生成页面关键词
 */
export function generatePageKeywords(path: string): string {
  const pageConfig = seoConfig.pages[path];
  const keywords = pageConfig?.keywords || seoConfig.keywords;
  return keywords.join(",");
}

/**
 * 生成完整的页面URL
 */
export function generatePageUrl(path: string): string {
  return `${seoConfig.siteUrl}${path === "/" ? "" : path}`;
}
