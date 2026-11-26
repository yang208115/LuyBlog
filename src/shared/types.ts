import type { SiteConfig } from "./siteConfig";

export type SessionUser = {
  id: string;
  githubId: string;
  username: string;
  email: string | null;
  avatarUrl: string | null;
  role: "user" | "admin";
  status: "active" | "banned";
  createdAt: string;
};

export type NavItemDto = {
  id: string;
  label: string;
  path: string;
  sortOrder: number;
};

export type BootstrapData = {
  siteConfig: SiteConfig;
  navItems: NavItemDto[];
  user: SessionUser | null;
  turnstileSiteKey: string;
};

export type TocItem = {
  id: string;
  text: string;
  depth: 2 | 3;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PublicPostSummary = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  cover: string | null;
  tags: string[];
  category: string | null;
  readingTime: number;
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CommentNode = {
  id: string;
  postId: string | null;
  targetSlug: string | null;
  parentId: string | null;
  content: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  replies: CommentNode[];
};

export type PublicPostDetail = PublicPostSummary & {
  html: string;
  toc: TocItem[];
  prev: { title: string; slug: string } | null;
  next: { title: string; slug: string } | null;
  comments: CommentNode[];
};

export type PublicMomentDto = {
  id: string;
  slug: string;
  html: string;
  location: string | null;
  images: string[];
  likeCount: number;
  liked: boolean;
  publishedAt: string | null;
  createdAt: string;
};

export type PublicProjectDto = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  githubUrl: string | null;
  tags: string[];
  sortOrder: number;
};

export type PublicFriendLinkDto = {
  id: string;
  name: string;
  description: string | null;
  url: string;
  avatarUrl: string | null;
  sortOrder: number;
};

export type PublicPageDto = {
  id: string;
  slug: string;
  title: string;
  html: string;
  toc: TocItem[];
  updatedAt: string;
};

export type SearchResultItem = {
  id: string;
  type: "post" | "page" | "moment" | "project" | "friend";
  title: string;
  excerpt: string | null;
  url: string;
  date: string | null;
  meta: string[];
};

export type AdminStatsDto = {
  posts: number;
  publishedPosts: number;
  draftPosts: number;
  moments: number;
  projects: number;
  pages: number;
  friendLinks: number;
  pendingFriendLinks: number;
  comments: number;
  users: number;
  media: number;
};

export type AdminPostSummary = PublicPostSummary & {
  status: "draft" | "published";
};

export type AdminPostDetail = AdminPostSummary & {
  contentMd: string;
};

export type AdminMomentDto = {
  id: string;
  slug: string;
  contentMd: string;
  location: string | null;
  images: string[];
  likeCount: number;
  status: "draft" | "published";
  publishedAt: string | null;
  updatedAt: string;
};

export type AdminProjectDto = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  githubUrl: string | null;
  tags: string[];
  sortOrder: number;
  status: "draft" | "published";
  updatedAt: string;
};

export type AdminPageDto = {
  id: string;
  slug: string;
  title: string;
  contentMd: string;
  status: "draft" | "published";
  updatedAt: string;
};

export type AdminFriendLinkDto = {
  id: string;
  name: string;
  description: string | null;
  url: string;
  avatarUrl: string | null;
  sortOrder: number;
  status: "draft" | "published";
  updatedAt: string;
};

export type AdminNavItemDto = {
  id: string;
  label: string;
  path: string;
  sortOrder: number;
  status: "enabled" | "disabled";
  updatedAt: string;
};

export type AdminCommentDto = {
  id: string;
  content: string;
  status: "visible" | "hidden";
  username: string;
  postTitle: string;
  parentId: string | null;
  createdAt: string;
};

export type AdminUserDto = {
  id: string;
  githubId: string;
  username: string;
  email: string | null;
  avatarUrl: string | null;
  role: "user" | "admin";
  status: "active" | "banned";
  createdAt: string;
};

export type AdminMediaDto = {
  id: string;
  objectKey: string;
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};
