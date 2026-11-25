import { env, waitUntil } from "cloudflare:workers";
import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { and, asc, count, desc, eq, gte, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import type {
  BootstrapData,
  CommentNode,
  PaginationMeta,
  PublicFriendLinkDto,
  PublicMomentDto,
  PublicPageDto,
  PublicPostDetail,
  PublicPostSummary,
  PublicProjectDto,
  SearchResultItem,
} from "@/shared/types";
import {
  ApplyFriendLinkSchema,
  CreateCommentSchema,
  IdSchema,
  PaginationSchema,
  PublicPostsQuerySchema,
  readableSlugSchema,
} from "@/shared/validators";
import { authMiddleware, csrfCheckMiddleware, sessionMiddleware } from "../auth/middleware";
import { getSiteConfig } from "../config/siteConfig";
import { getDb } from "../db";
import {
  comments,
  friendLinks,
  momentLikes,
  moments,
  navItems,
  pages,
  posts,
  projects,
  users,
} from "../db/schema";
import { searchContent, syncSearchEntry } from "../db/search";
import { renderMarkdown, stripMarkdownExcerpt } from "../markdown/render";
import { checkRateLimit, hashIp } from "../security/rateLimit";
import { verifyTurnstileToken } from "../security/turnstile";

function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function getClientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "127.0.0.1"
  );
}

const DEFAULT_PUBLIC_NAV = [
  { id: "nav_home", label: "首页", path: "/", sortOrder: 0 },
  { id: "nav_blog", label: "文章", path: "/blog", sortOrder: 10 },
  { id: "nav_moments", label: "瞬间", path: "/moments", sortOrder: 20 },
  { id: "nav_projects", label: "项目", path: "/projects", sortOrder: 30 },
  { id: "nav_friends", label: "友链", path: "/friends", sortOrder: 40 },
  { id: "nav_about", label: "关于", path: "/about", sortOrder: 50 },
];

export const getBootstrapFn = createServerFn({ method: "GET" })
  .middleware([sessionMiddleware])
  .handler(async ({ context }): Promise<BootstrapData> => {
    setResponseHeader("Cache-Control", "private, no-store");
    setResponseHeader("Vary", "Cookie");

    const [siteConfig, navRows] = await Promise.all([
      getSiteConfig(context.db),
      context.db
        .select({
          id: navItems.id,
          label: navItems.label,
          path: navItems.path,
          sortOrder: navItems.sortOrder,
        })
        .from(navItems)
        .where(eq(navItems.status, "enabled"))
        .orderBy(asc(navItems.sortOrder), desc(navItems.createdAt)),
    ]);

    return {
      siteConfig,
      navItems: navRows.length > 0 ? navRows : DEFAULT_PUBLIC_NAV,
      user: context.user,
      turnstileSiteKey: env.TURNSTILE_SITE_KEY || "",
    };
  });

export type HomeData = {
  featuredPosts: PublicPostSummary[];
  recentPosts: PublicPostSummary[];
  latestMoment: PublicMomentDto | null;
  projects: PublicProjectDto[];
  stats: {
    postCount: number;
    momentCount: number;
    projectCount: number;
    totalViews: number;
  };
};

export const getHomeDataFn = createServerFn({ method: "GET" }).handler(async (): Promise<HomeData> => {
  const db = getDb();

  const [postRows, postAgg, latestMomentRow, momentAgg, projectRows, projectAgg] = await Promise.all([
    db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        summary: posts.summary,
        cover: posts.cover,
        tags: posts.tags,
        category: posts.category,
        readingTime: posts.readingTime,
        viewCount: posts.viewCount,
        publishedAt: posts.publishedAt,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.publishedAt), desc(posts.createdAt))
      .limit(6),
    db
      .select({
        postCount: count(),
        totalViews: sql<number>`coalesce(sum(${posts.viewCount}), 0)`,
      })
      .from(posts)
      .where(eq(posts.status, "published"))
      .get(),
    db
      .select()
      .from(moments)
      .where(eq(moments.status, "published"))
      .orderBy(desc(moments.publishedAt), desc(moments.createdAt))
      .limit(1)
      .get(),
    db.select({ count: count() }).from(moments).where(eq(moments.status, "published")).get(),
    db
      .select()
      .from(projects)
      .where(eq(projects.status, "published"))
      .orderBy(asc(projects.sortOrder), desc(projects.createdAt))
      .limit(3),
    db.select({ count: count() }).from(projects).where(eq(projects.status, "published")).get(),
  ]);

  const mappedPosts: PublicPostSummary[] = postRows.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    summary: p.summary ? stripMarkdownExcerpt(p.summary, 180) : null,
    cover: p.cover,
    tags: parseJsonArray(p.tags),
    category: p.category,
    readingTime: p.readingTime ?? 1,
    viewCount: p.viewCount,
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  let latestMoment: PublicMomentDto | null = null;
  if (latestMomentRow) {
    const rendered = await renderMarkdown(latestMomentRow.contentMd);
    latestMoment = {
      id: latestMomentRow.id,
      slug: latestMomentRow.slug,
      html: rendered.html,
      location: latestMomentRow.location,
      images: parseJsonArray(latestMomentRow.images),
      likeCount: latestMomentRow.likeCount,
      liked: false,
      publishedAt: latestMomentRow.publishedAt ? latestMomentRow.publishedAt.toISOString() : null,
      createdAt: latestMomentRow.createdAt.toISOString(),
    };
  }

  return {
    featuredPosts: mappedPosts.slice(0, 2),
    recentPosts: mappedPosts.slice(0, 5),
    latestMoment,
    projects: projectRows.map((pr) => ({
      id: pr.id,
      name: pr.name,
      description: pr.description,
      icon: pr.icon,
      githubUrl: pr.githubUrl,
      tags: parseJsonArray(pr.tags),
      sortOrder: pr.sortOrder,
    })),
    stats: {
      postCount: Number(postAgg?.postCount ?? 0),
      momentCount: Number(momentAgg?.count ?? 0),
      projectCount: Number(projectAgg?.count ?? 0),
      totalViews: Number(postAgg?.totalViews ?? 0),
    },
  };
});

export type PublicPostsResponse = {
  items: PublicPostSummary[];
  pagination: PaginationMeta;
  categories: string[];
  tags: string[];
};

export const getPostsFn = createServerFn({ method: "GET" })
  .validator(PublicPostsQuerySchema)
  .handler(async ({ data }): Promise<PublicPostsResponse> => {
    const db = getDb();
    const { page, pageSize, category, tag, q } = data;

    // 仅选择轻量元数据列（绝不查询 contentMd），用于准确分页及分类/标签聚合
    const allRows = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        summary: posts.summary,
        cover: posts.cover,
        tags: posts.tags,
        category: posts.category,
        readingTime: posts.readingTime,
        viewCount: posts.viewCount,
        publishedAt: posts.publishedAt,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.publishedAt), desc(posts.createdAt));

    const categorySet = new Set<string>();
    const tagSet = new Set<string>();
    const mapped: PublicPostSummary[] = allRows.map((p) => {
      const parsedTags = parseJsonArray(p.tags);
      if (p.category?.trim()) categorySet.add(p.category.trim());
      for (const t of parsedTags) {
        if (t.trim()) tagSet.add(t.trim());
      }
      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        summary: p.summary ? stripMarkdownExcerpt(p.summary, 180) : null,
        cover: p.cover,
        tags: parsedTags,
        category: p.category,
        readingTime: p.readingTime ?? 1,
        viewCount: p.viewCount,
        publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      };
    });

    const keyword = q?.trim().toLowerCase() ?? "";
    const filtered = mapped.filter((item) => {
      if (category && item.category !== category) return false;
      if (tag && !item.tags.includes(tag)) return false;
      if (keyword) {
        const text =
          `${item.title} ${item.summary ?? ""} ${item.category ?? ""} ${item.tags.join(" ")}`.toLowerCase();
        if (!text.includes(keyword)) return false;
      }
      return true;
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const items = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

    return {
      items,
      pagination: { page: safePage, pageSize, total, totalPages },
      categories: [...categorySet].sort((a, b) => a.localeCompare(b, "zh-CN")),
      tags: [...tagSet].sort((a, b) => a.localeCompare(b, "zh-CN")),
    };
  });

export const getPostBySlugFn = createServerFn({ method: "GET" })
  .validator(z.object({ slug: readableSlugSchema }))
  .handler(async ({ data }): Promise<PublicPostDetail> => {
    const db = getDb();
    const request = getRequest();

    const post = await db
      .select()
      .from(posts)
      .where(and(eq(posts.slug, data.slug), eq(posts.status, "published")))
      .get();

    if (!post) {
      throw notFound();
    }

    const [rendered, orderedPosts, commentRows] = await Promise.all([
      renderMarkdown(post.contentMd),
      db
        .select({ id: posts.id, title: posts.title, slug: posts.slug })
        .from(posts)
        .where(eq(posts.status, "published"))
        .orderBy(desc(posts.publishedAt), desc(posts.createdAt)),
      db
        .select({
          id: comments.id,
          postId: comments.postId,
          targetSlug: comments.targetSlug,
          parentId: comments.parentId,
          content: comments.content,
          createdAt: comments.createdAt,
          userId: users.id,
          username: users.username,
          avatarUrl: users.avatarUrl,
        })
        .from(comments)
        .innerJoin(users, eq(comments.userId, users.id))
        .where(
          and(
            eq(comments.status, "visible"),
            or(eq(comments.postId, post.id), eq(comments.targetSlug, post.slug)),
          ),
        )
        .orderBy(asc(comments.createdAt)),
    ]);

    // 异步去重递增浏览量（10 分钟内同一访客不重复累加）
    const ipHash = await hashIp(getClientIp(request));
    waitUntil(
      (async () => {
        try {
          const allowed = await checkRateLimit(db, `view:${post.id}:${ipHash}`, 1, 10 * 60 * 1000);
          if (allowed) {
            await db
              .update(posts)
              .set({ viewCount: sql`${posts.viewCount} + 1` })
              .where(eq(posts.id, post.id));
          }
        } catch (err) {
          console.warn("[ViewCount] increment failed:", err);
        }
      })(),
    );

    const currentIdx = orderedPosts.findIndex((item) => item.id === post.id);
    const newer = currentIdx > 0 ? orderedPosts[currentIdx - 1] : undefined;
    const older =
      currentIdx >= 0 && currentIdx < orderedPosts.length - 1 ? orderedPosts[currentIdx + 1] : undefined;

    const nodeMap = new Map<string, CommentNode>();
    const topLevel: CommentNode[] = [];

    for (const row of commentRows) {
      nodeMap.set(row.id, {
        id: row.id,
        postId: row.postId,
        targetSlug: row.targetSlug,
        parentId: row.parentId,
        content: row.content,
        createdAt: row.createdAt.toISOString(),
        user: {
          id: row.userId,
          username: row.username,
          avatarUrl: row.avatarUrl,
        },
        replies: [],
      });
    }

    for (const node of nodeMap.values()) {
      const parent = node.parentId ? nodeMap.get(node.parentId) : undefined;
      if (parent) {
        parent.replies.push(node);
      } else {
        topLevel.push(node);
      }
    }

    topLevel.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      summary: post.summary ? stripMarkdownExcerpt(post.summary, 200) : null,
      cover: post.cover,
      tags: parseJsonArray(post.tags),
      category: post.category,
      readingTime: post.readingTime ?? rendered.readingTime,
      viewCount: post.viewCount,
      publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      html: rendered.html,
      toc: rendered.toc,
      prev: older ? { title: older.title, slug: older.slug } : null,
      next: newer ? { title: newer.title, slug: newer.slug } : null,
      comments: topLevel,
    };
  });

export const getMomentsFn = createServerFn({ method: "GET" })
  .middleware([sessionMiddleware])
  .validator(PaginationSchema.optional())
  .handler(async ({ data, context }): Promise<{ items: PublicMomentDto[]; pagination: PaginationMeta }> => {
    const page = data?.page ?? 1;
    const pageSize = Math.min(24, data?.pageSize ?? 12);
    const request = getRequest();
    const visitorHash = context.user ? `u:${context.user.id}` : `ip:${await hashIp(getClientIp(request))}`;

    const [rows, totalRow] = await Promise.all([
      context.db
        .select()
        .from(moments)
        .where(eq(moments.status, "published"))
        .orderBy(desc(moments.publishedAt), desc(moments.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      context.db.select({ count: count() }).from(moments).where(eq(moments.status, "published")).get(),
    ]);

    const momentIds = rows.map((r) => r.id);
    const likedSet = new Set<string>();
    if (momentIds.length > 0) {
      const likedRows = await context.db
        .select({ momentId: momentLikes.momentId })
        .from(momentLikes)
        .where(and(eq(momentLikes.visitorHash, visitorHash), inArray(momentLikes.momentId, momentIds)));
      for (const row of likedRows) likedSet.add(row.momentId);
    }

    const items = await Promise.all(
      rows.map(async (row) => {
        const rendered = await renderMarkdown(row.contentMd);
        return {
          id: row.id,
          slug: row.slug,
          html: rendered.html,
          location: row.location,
          images: parseJsonArray(row.images),
          likeCount: row.likeCount,
          liked: likedSet.has(row.id),
          publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
          createdAt: row.createdAt.toISOString(),
        };
      }),
    );

    const total = Number(totalRow?.count ?? 0);
    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  });

export const toggleMomentLikeFn = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware, csrfCheckMiddleware])
  .validator(z.object({ momentId: z.string().trim().min(1).max(128) }))
  .handler(async ({ data, context }): Promise<{ liked: boolean; likeCount: number }> => {
    const request = getRequest();
    const visitorHash = context.user ? `u:${context.user.id}` : `ip:${await hashIp(getClientIp(request))}`;

    const moment = await context.db
      .select({ id: moments.id, likeCount: moments.likeCount })
      .from(moments)
      .where(and(eq(moments.id, data.momentId), eq(moments.status, "published")))
      .get();

    if (!moment) {
      throw new Error("瞬间不存在");
    }

    const existingLike = await context.db
      .select({ id: momentLikes.id })
      .from(momentLikes)
      .where(and(eq(momentLikes.momentId, moment.id), eq(momentLikes.visitorHash, visitorHash)))
      .get();

    if (existingLike) {
      await context.db.delete(momentLikes).where(eq(momentLikes.id, existingLike.id));
      const [updated] = await context.db
        .update(moments)
        .set({ likeCount: sql`max(0, ${moments.likeCount} - 1)` })
        .where(eq(moments.id, moment.id))
        .returning({ likeCount: moments.likeCount });
      return { liked: false, likeCount: updated?.likeCount ?? Math.max(0, moment.likeCount - 1) };
    }

    await context.db.insert(momentLikes).values({
      momentId: moment.id,
      visitorHash,
    });
    const [updated] = await context.db
      .update(moments)
      .set({ likeCount: sql`${moments.likeCount} + 1` })
      .where(eq(moments.id, moment.id))
      .returning({ likeCount: moments.likeCount });
    return { liked: true, likeCount: updated?.likeCount ?? moment.likeCount + 1 };
  });

export const getProjectsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicProjectDto[]> => {
    const db = getDb();
    const rows = await db
      .select()
      .from(projects)
      .where(eq(projects.status, "published"))
      .orderBy(asc(projects.sortOrder), desc(projects.createdAt));

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      icon: row.icon,
      githubUrl: row.githubUrl,
      tags: parseJsonArray(row.tags),
      sortOrder: row.sortOrder,
    }));
  },
);

export const getFriendLinksFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ items: PublicFriendLinkDto[]; applyFormat: string }> => {
    const db = getDb();
    const [rows, siteConfig] = await Promise.all([
      db
        .select()
        .from(friendLinks)
        .where(eq(friendLinks.status, "published"))
        .orderBy(asc(friendLinks.sortOrder), desc(friendLinks.createdAt)),
      getSiteConfig(db),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        url: row.url,
        avatarUrl: row.avatarUrl,
        sortOrder: row.sortOrder,
      })),
      applyFormat: siteConfig.friendLinkApplyFormat,
    };
  },
);

export const applyFriendLinkFn = createServerFn({ method: "POST" })
  .middleware([csrfCheckMiddleware])
  .validator(ApplyFriendLinkSchema)
  .handler(async ({ data }): Promise<{ success: true }> => {
    const db = getDb();
    const request = getRequest();
    const ip = getClientIp(request);

    const verify = await verifyTurnstileToken({
      token: data.turnstileToken,
      expectedAction: "friend_link_apply",
      remoteIp: ip,
      env,
    });
    if (!verify.ok) {
      throw new Error(verify.message);
    }

    const ipHash = await hashIp(ip);
    const allowed = await checkRateLimit(db, `friend_apply:${ipHash}`, 3, 60 * 60 * 1000);
    if (!allowed) {
      throw new Error("申请过于频繁，请一小时后再试");
    }

    const [created] = await db
      .insert(friendLinks)
      .values({
        name: data.name,
        description: data.description,
        url: data.url,
        avatarUrl: data.avatarUrl,
        sortOrder: 0,
        status: "draft",
        updatedAt: new Date(),
      })
      .returning();

    if (created && created.status === "published") {
      await syncSearchEntry(db, {
        entityType: "friend",
        entityId: created.id,
        url: created.url,
        publishedAt: created.updatedAt.getTime(),
        title: created.name,
        body: `${created.description ?? ""} ${created.url}`,
        tags: "友链",
      });
    }

    return { success: true };
  });

export const createCommentFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(CreateCommentSchema)
  .handler(async ({ data, context }): Promise<CommentNode> => {
    const request = getRequest();
    const ip = getClientIp(request);

    const verify = await verifyTurnstileToken({
      token: data.turnstileToken,
      expectedAction: "comment_create",
      remoteIp: ip,
      env,
    });
    if (!verify.ok) {
      throw new Error(verify.message);
    }

    const post = await context.db
      .select({ id: posts.id, slug: posts.slug })
      .from(posts)
      .where(and(eq(posts.slug, data.targetSlug), eq(posts.status, "published")))
      .get();

    if (!post) {
      throw new Error("文章不存在或未发布");
    }

    if (data.parentId) {
      const parent = await context.db
        .select({
          id: comments.id,
          postId: comments.postId,
          targetSlug: comments.targetSlug,
          parentId: comments.parentId,
        })
        .from(comments)
        .where(and(eq(comments.id, data.parentId), eq(comments.status, "visible")))
        .get();

      if (!parent) {
        throw new Error("要回复的评论不存在");
      }
      if (parent.postId !== post.id && parent.targetSlug !== post.slug) {
        throw new Error("父评论不属于当前文章");
      }
      if (parent.parentId) {
        throw new Error("不支持多层嵌套回复");
      }
    }

    const allowed = await checkRateLimit(context.db, `comment:${context.user.id}`, 5, 60 * 1000);
    if (!allowed) {
      throw new Error("评论过于频繁，请稍后再试");
    }

    const dupCutoff = new Date(Date.now() - 10 * 60 * 1000);
    const duplicate = await context.db
      .select({ id: comments.id })
      .from(comments)
      .where(
        and(
          eq(comments.userId, context.user.id),
          eq(comments.postId, post.id),
          eq(comments.content, data.content),
          gte(comments.createdAt, dupCutoff),
        ),
      )
      .get();

    if (duplicate) {
      throw new Error("请勿重复提交相同的评论");
    }

    const [created] = await context.db
      .insert(comments)
      .values({
        postId: post.id,
        targetType: "post",
        targetSlug: post.slug,
        parentId: data.parentId ?? null,
        userId: context.user.id,
        content: data.content,
        status: "visible",
        updatedAt: new Date(),
      })
      .returning();

    if (!created) {
      throw new Error("保存评论失败");
    }

    return {
      id: created.id,
      postId: created.postId,
      targetSlug: created.targetSlug,
      parentId: created.parentId,
      content: created.content,
      createdAt: created.createdAt.toISOString(),
      user: {
        id: context.user.id,
        username: context.user.username,
        avatarUrl: context.user.avatarUrl,
      },
      replies: [],
    };
  });

export const deleteCommentFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(IdSchema)
  .handler(async ({ data, context }): Promise<{ success: true }> => {
    const existing = await context.db.select().from(comments).where(eq(comments.id, data.id)).get();
    if (!existing) {
      throw new Error("评论不存在");
    }
    if (existing.userId !== context.user.id && context.user.role !== "admin") {
      throw new Error("无权删除该评论");
    }
    await context.db.delete(comments).where(eq(comments.parentId, existing.id));
    await context.db.delete(comments).where(eq(comments.id, existing.id));
    return { success: true };
  });

export const searchSiteFn = createServerFn({ method: "GET" })
  .validator(
    z.object({
      q: z.string().trim().max(120).default(""),
      limit: z.number().int().min(1).max(50).default(30),
    }),
  )
  .handler(async ({ data }): Promise<{ items: SearchResultItem[]; query: string; total: number }> => {
    const db = getDb();
    const items = await searchContent(db, data.q, data.limit);
    return { items, query: data.q, total: items.length };
  });

export const getPageBySlugFn = createServerFn({ method: "GET" })
  .validator(z.object({ slug: readableSlugSchema }))
  .handler(async ({ data }): Promise<PublicPageDto> => {
    const db = getDb();
    const row = await db
      .select()
      .from(pages)
      .where(and(eq(pages.slug, data.slug), eq(pages.status, "published")))
      .get();

    if (!row) {
      throw notFound();
    }

    const rendered = await renderMarkdown(row.contentMd);
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      html: rendered.html,
      toc: rendered.toc,
      updatedAt: row.updatedAt.toISOString(),
    };
  });
