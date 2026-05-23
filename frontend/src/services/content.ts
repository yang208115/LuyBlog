export type PostItem = {
  id: string;
  authorId: string;
  title: string;
  slug: string;
  summary: string | null;
  cover: string | null;
  tags: string[] | string | null;
  category: string | null;
  readingTime: number | null;
  viewCount: number;
  frontmatter: Record<string, unknown> | string | null;
  contentMd?: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListResponse<T> = {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalViews?: number;
  };
};

export type MomentItem = {
  id: string;
  slug: string;
  contentMd: string;
  location: string | null;
  images: string[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ActivityItem = {
  type: "post" | "moment";
  title: string;
  slug: string;
  summary: string | null;
  date: string | null;
};

export type ProjectItem = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  githubUrl: string | null;
  github_url?: string | null;
  tags: string[];
};

export type FriendLinkItem = {
  id: string;
  name: string;
  description: string | null;
  url: string;
  avatarUrl: string | null;
};

export type NavItem = {
  id: string;
  label: string;
  path: string;
  sortOrder: number;
};

export type FriendLinkApplyPayload = {
  name: string;
  description: string;
  url: string;
  avatarUrl: string;
};

export type SearchResultType = "post" | "page" | "moment" | "project" | "friend";

export type SearchResultItem = {
  id: string;
  type: SearchResultType;
  title: string;
  excerpt: string | null;
  url: string;
  date: string | null;
  meta: string[];
};

export type SearchResponse = {
  items: SearchResultItem[];
  query: string;
  total: number;
};

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message || "请求失败");
  }
  return response.json() as Promise<T>;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message || "请求失败");
  }
  return response.json() as Promise<T>;
}

export function normalizeTags(value: string[] | string | null | undefined): string[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export const contentApi = {
  posts: (pageSize = 20) => getJson<ListResponse<PostItem>>(`/api/posts?page=1&pageSize=${pageSize}`),
  post: (slug: string) => getJson<PostItem & { contentMd: string }>(`/api/posts/${slug}`),
  search: (query: string) => getJson<SearchResponse>(`/api/search?q=${encodeURIComponent(query)}`),
  moments: () => getJson<MomentItem[]>("/api/moments"),
  activity: () => getJson<ActivityItem[]>("/api/activity"),
  page: (slug: string) => getJson<{ title: string; slug: string; contentMd: string }>(`/api/pages/${slug}`),
  projects: () => getJson<ProjectItem[]>("/api/projects"),
  friendLinks: () => getJson<FriendLinkItem[]>("/api/friend-links"),
  navigation: () => getJson<NavItem[]>("/api/navigation"),
  applyFriendLink: (body: FriendLinkApplyPayload) => postJson<{ success: true }>("/api/friend-links/apply", body),
};
