import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { and, asc, count, desc, eq, ne, or } from "drizzle-orm";
import { z } from "zod";
import type { SiteConfig } from "@/shared/siteConfig";
import type {
  AdminCommentDto,
  AdminFriendLinkDto,
  AdminMediaDto,
  AdminMomentDto,
  AdminNavItemDto,
  AdminPageDto,
  AdminPostDetail,
  AdminPostSummary,
  AdminProjectDto,
  AdminStatsDto,
  AdminUserDto,
  PaginationMeta,
} from "@/shared/types";
import {
  CreateFriendLinkSchema,
  CreateMomentSchema,
  CreateNavItemSchema,
  CreatePageSchema,
  CreatePostSchema,
  CreateProjectSchema,
  IdSchema,
  PaginationSchema,
  ReorderNavItemsSchema,
  SiteConfigSchema,
  UpdateCommentStatusSchema,
  UpdateFriendLinkSchema,
  UpdateMomentSchema,
  UpdateNavItemSchema,
  UpdatePageSchema,
  UpdatePostSchema,
  UpdateProjectSchema,
  UpdateUserRoleSchema,
  UpdateUserStatusSchema,
} from "@/shared/validators";
import { adminMiddleware } from "../auth/middleware";
import { revokeUserSessions } from "../auth/session";
import { getSiteConfig, saveSiteConfig } from "../config/siteConfig";
import {
  comments,
  friendLinks,
  mediaAssets,
  moments,
  navItems,
  pages,
  posts,
  projects,
  users,
} from "../db/schema";
import { deleteSearchEntry, rebuildSearchIndex, syncSearchEntry } from "../db/search";
import { calculateReadingTime, renderMarkdown, stripMarkdownExcerpt } from "../markdown/render";
import { deleteImageFromR2 } from "../storage/r2";

function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function buildPagination(page: number, pageSize: number, total: number): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export const getAdminStatsFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async ({ context }): Promise<AdminStatsDto> => {
    const [
      postCount,
      publishedPostCount,
      draftPostCount,
      momentCount,
      projectCount,
      pageCount,
      friendCount,
      pendingFriendCount,
      commentCount,
      userCount,
      mediaCount,
    ] = await Promise.all([
      context.db.select({ count: count() }).from(posts).get(),
      context.db.select({ count: count() }).from(posts).where(eq(posts.status, "published")).get(),
      context.db.select({ count: count() }).from(posts).where(eq(posts.status, "draft")).get(),
      context.db.select({ count: count() }).from(moments).get(),
      context.db.select({ count: count() }).from(projects).get(),
      context.db.select({ count: count() }).from(pages).get(),
      context.db.select({ count: count() }).from(friendLinks).get(),
      context.db.select({ count: count() }).from(friendLinks).where(eq(friendLinks.status, "draft")).get(),
      context.db.select({ count: count() }).from(comments).get(),
      context.db.select({ count: count() }).from(users).get(),
      context.db.select({ count: count() }).from(mediaAssets).get(),
    ]);

    return {
      posts: Number(postCount?.count ?? 0),
      publishedPosts: Number(publishedPostCount?.count ?? 0),
      draftPosts: Number(draftPostCount?.count ?? 0),
      moments: Number(momentCount?.count ?? 0),
      projects: Number(projectCount?.count ?? 0),
      pages: Number(pageCount?.count ?? 0),
      friendLinks: Number(friendCount?.count ?? 0),
      pendingFriendLinks: Number(pendingFriendCount?.count ?? 0),
      comments: Number(commentCount?.count ?? 0),
      users: Number(userCount?.count ?? 0),
      media: Number(mediaCount?.count ?? 0),
    };
  });

export const getAdminPostsFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .validator(
    z.object({
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(15),
      status: z.enum(["all", "draft", "published"]).default("all"),
      q: z.string().trim().max(120).optional(),
    }),
  )
  .handler(async ({ data, context }): Promise<{ items: AdminPostSummary[]; pagination: PaginationMeta }> => {
    const allRows = await context.db
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
        status: posts.status,
        publishedAt: posts.publishedAt,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .orderBy(desc(posts.updatedAt));

    const keyword = data.q?.trim().toLowerCase() ?? "";
    const filtered = allRows
      .map((row) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        summary: row.summary,
        cover: row.cover,
        tags: parseJsonArray(row.tags),
        category: row.category,
        readingTime: row.readingTime ?? 1,
        viewCount: row.viewCount,
        status: row.status,
        publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }))
      .filter((item) => {
        if (data.status !== "all" && item.status !== data.status) return false;
        if (keyword) {
          const text =
            `${item.title} ${item.slug} ${item.summary ?? ""} ${item.category ?? ""} ${item.tags.join(" ")}`.toLowerCase();
          if (!text.includes(keyword)) return false;
        }
        return true;
      });

    const total = filtered.length;
    const pagination = buildPagination(data.page, data.pageSize, total);
    const safePage = Math.min(data.page, pagination.totalPages);
    const items = filtered.slice((safePage - 1) * data.pageSize, safePage * data.pageSize);
    return { items, pagination: { ...pagination, page: safePage } };
  });

export const getAdminPostByIdFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .validator(IdSchema)
  .handler(async ({ data, context }): Promise<AdminPostDetail> => {
    const row = await context.db.select().from(posts).where(eq(posts.id, data.id)).get();
    if (!row) {
      throw new Error("文章不存在");
    }
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      summary: row.summary,
      cover: row.cover,
      tags: parseJsonArray(row.tags),
      category: row.category,
      readingTime: row.readingTime ?? calculateReadingTime(row.contentMd),
      viewCount: row.viewCount,
      status: row.status,
      contentMd: row.contentMd,
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  });

export const getPostTaxonomyFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async ({ context }): Promise<{ categories: string[]; tags: string[] }> => {
    const rows = await context.db.select({ category: posts.category, tags: posts.tags }).from(posts);
    const categories = [
      ...new Set(rows.map((r) => r.category?.trim()).filter((v): v is string => Boolean(v))),
    ].sort((a, b) => a.localeCompare(b, "zh-CN"));
    const tags = [
      ...new Set(
        rows
          .flatMap((r) => parseJsonArray(r.tags))
          .map((t) => t.trim())
          .filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b, "zh-CN"));
    return { categories, tags };
  });

export const previewMarkdownFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(z.object({ contentMd: z.string() }))
  .handler(async ({ data }) => {
    return renderMarkdown(data.contentMd);
  });

export const createPostFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(CreatePostSchema)
  .handler(async ({ data, context }): Promise<AdminPostDetail> => {
    const exists = await context.db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.slug, data.slug))
      .get();
    if (exists) {
      throw new Error("Slug 已存在，请换一个");
    }

    const now = new Date();
    const readingTime = calculateReadingTime(data.contentMd);
    const [created] = await context.db
      .insert(posts)
      .values({
        authorId: context.user.id,
        title: data.title,
        slug: data.slug,
        summary: data.summary || null,
        cover: data.cover || null,
        tags: JSON.stringify(data.tags),
        category: data.category || null,
        readingTime,
        contentMd: data.contentMd,
        status: data.status,
        publishedAt: data.status === "published" ? now : null,
        updatedAt: now,
      })
      .returning();

    if (!created) throw new Error("创建文章失败");

    if (created.status === "published") {
      await syncSearchEntry(context.db, {
        entityType: "post",
        entityId: created.id,
        url: `/blog/${created.slug}`,
        publishedAt: (created.publishedAt ?? created.createdAt).getTime(),
        title: created.title,
        body: `${created.summary ?? ""}\n${stripMarkdownExcerpt(created.contentMd, 4000)}`,
        tags: [created.category, ...data.tags].filter(Boolean).join(" "),
      });
    }

    return {
      id: created.id,
      title: created.title,
      slug: created.slug,
      summary: created.summary,
      cover: created.cover,
      tags: data.tags,
      category: created.category,
      readingTime: created.readingTime ?? readingTime,
      viewCount: created.viewCount,
      status: created.status,
      contentMd: created.contentMd,
      publishedAt: created.publishedAt ? created.publishedAt.toISOString() : null,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  });

export const updatePostFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(UpdatePostSchema)
  .handler(async ({ data, context }): Promise<AdminPostDetail> => {
    const existing = await context.db.select().from(posts).where(eq(posts.id, data.id)).get();
    if (!existing) {
      throw new Error("文章不存在");
    }

    const nextSlug = data.slug ?? existing.slug;
    if (nextSlug !== existing.slug) {
      const conflict = await context.db
        .select({ id: posts.id })
        .from(posts)
        .where(and(eq(posts.slug, nextSlug), ne(posts.id, existing.id)))
        .get();
      if (conflict) {
        throw new Error("Slug 已存在，请换一个");
      }
    }

    const nextStatus = data.status ?? existing.status;
    const nextContentMd = data.contentMd ?? existing.contentMd;
    const nextReadingTime = calculateReadingTime(nextContentMd);
    // 保留首次发布时间：转为草稿时不清零历史 publishedAt
    const nextPublishedAt = existing.publishedAt ?? (nextStatus === "published" ? new Date() : null);
    const nextTags = data.tags !== undefined ? data.tags : parseJsonArray(existing.tags);

    const [updated] = await context.db
      .update(posts)
      .set({
        title: data.title ?? existing.title,
        slug: nextSlug,
        summary: data.summary !== undefined ? data.summary || null : existing.summary,
        cover: data.cover !== undefined ? data.cover || null : existing.cover,
        tags: JSON.stringify(nextTags),
        category: data.category !== undefined ? data.category || null : existing.category,
        readingTime: nextReadingTime,
        contentMd: nextContentMd,
        status: nextStatus,
        publishedAt: nextPublishedAt,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, existing.id))
      .returning();

    if (!updated) throw new Error("更新文章失败");

    // 同步更新关联评论的 targetSlug，避免修改文章 slug 后评论失联
    if (nextSlug !== existing.slug) {
      await context.db
        .update(comments)
        .set({ targetSlug: nextSlug })
        .where(or(eq(comments.postId, existing.id), eq(comments.targetSlug, existing.slug)));
    }

    if (updated.status === "published") {
      await syncSearchEntry(context.db, {
        entityType: "post",
        entityId: updated.id,
        url: `/blog/${updated.slug}`,
        publishedAt: (updated.publishedAt ?? updated.createdAt).getTime(),
        title: updated.title,
        body: `${updated.summary ?? ""}\n${stripMarkdownExcerpt(updated.contentMd, 4000)}`,
        tags: [updated.category, ...nextTags].filter(Boolean).join(" "),
      });
    } else {
      await deleteSearchEntry(context.db, "post", updated.id);
    }

    return {
      id: updated.id,
      title: updated.title,
      slug: updated.slug,
      summary: updated.summary,
      cover: updated.cover,
      tags: nextTags,
      category: updated.category,
      readingTime: updated.readingTime ?? nextReadingTime,
      viewCount: updated.viewCount,
      status: updated.status,
      contentMd: updated.contentMd,
      publishedAt: updated.publishedAt ? updated.publishedAt.toISOString() : null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  });

export const deletePostFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(IdSchema)
  .handler(async ({ data, context }): Promise<{ success: true }> => {
    await context.db.delete(posts).where(eq(posts.id, data.id));
    await deleteSearchEntry(context.db, "post", data.id);
    return { success: true };
  });

export const getAdminMomentsFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async ({ context }): Promise<AdminMomentDto[]> => {
    const rows = await context.db
      .select()
      .from(moments)
      .orderBy(desc(moments.publishedAt), desc(moments.createdAt));

    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      contentMd: row.contentMd,
      location: row.location,
      images: parseJsonArray(row.images),
      likeCount: row.likeCount,
      status: row.status,
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
      updatedAt: row.updatedAt.toISOString(),
    }));
  });

export const createMomentFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(CreateMomentSchema)
  .handler(async ({ data, context }): Promise<AdminMomentDto> => {
    const exists = await context.db
      .select({ id: moments.id })
      .from(moments)
      .where(eq(moments.slug, data.slug))
      .get();
    if (exists) throw new Error("瞬间 Slug 已存在");

    const now = new Date();
    const [created] = await context.db
      .insert(moments)
      .values({
        slug: data.slug,
        contentMd: data.contentMd,
        location: data.location || null,
        images: JSON.stringify(data.images),
        frontmatter: "{}",
        status: data.status,
        publishedAt: data.status === "published" ? now : null,
        updatedAt: now,
      })
      .returning();

    if (!created) throw new Error("创建瞬间失败");

    if (created.status === "published") {
      await syncSearchEntry(context.db, {
        entityType: "moment",
        entityId: created.id,
        url: `/moments#${created.slug}`,
        publishedAt: (created.publishedAt ?? created.createdAt).getTime(),
        title: created.location ? `瞬间 · ${created.location}` : "瞬间",
        body: stripMarkdownExcerpt(created.contentMd, 2000),
        tags: created.location ?? "瞬间",
      });
    }

    return {
      id: created.id,
      slug: created.slug,
      contentMd: created.contentMd,
      location: created.location,
      images: data.images,
      likeCount: created.likeCount,
      status: created.status,
      publishedAt: created.publishedAt ? created.publishedAt.toISOString() : null,
      updatedAt: created.updatedAt.toISOString(),
    };
  });

export const updateMomentFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(UpdateMomentSchema)
  .handler(async ({ data, context }): Promise<AdminMomentDto> => {
    const existing = await context.db.select().from(moments).where(eq(moments.id, data.id)).get();
    if (!existing) throw new Error("瞬间不存在");

    const nextSlug = data.slug ?? existing.slug;
    if (nextSlug !== existing.slug) {
      const conflict = await context.db
        .select({ id: moments.id })
        .from(moments)
        .where(and(eq(moments.slug, nextSlug), ne(moments.id, existing.id)))
        .get();
      if (conflict) throw new Error("瞬间 Slug 已存在");
    }

    const nextStatus = data.status ?? existing.status;
    const nextImages = data.images !== undefined ? data.images : parseJsonArray(existing.images);

    const [updated] = await context.db
      .update(moments)
      .set({
        slug: nextSlug,
        contentMd: data.contentMd ?? existing.contentMd,
        location: data.location !== undefined ? data.location || null : existing.location,
        images: JSON.stringify(nextImages),
        status: nextStatus,
        publishedAt: existing.publishedAt ?? (nextStatus === "published" ? new Date() : null),
        updatedAt: new Date(),
      })
      .where(eq(moments.id, existing.id))
      .returning();

    if (!updated) throw new Error("更新瞬间失败");

    if (updated.status === "published") {
      await syncSearchEntry(context.db, {
        entityType: "moment",
        entityId: updated.id,
        url: `/moments#${updated.slug}`,
        publishedAt: (updated.publishedAt ?? updated.createdAt).getTime(),
        title: updated.location ? `瞬间 · ${updated.location}` : "瞬间",
        body: stripMarkdownExcerpt(updated.contentMd, 2000),
        tags: updated.location ?? "瞬间",
      });
    } else {
      await deleteSearchEntry(context.db, "moment", updated.id);
    }

    return {
      id: updated.id,
      slug: updated.slug,
      contentMd: updated.contentMd,
      location: updated.location,
      images: nextImages,
      likeCount: updated.likeCount,
      status: updated.status,
      publishedAt: updated.publishedAt ? updated.publishedAt.toISOString() : null,
      updatedAt: updated.updatedAt.toISOString(),
    };
  });

export const deleteMomentFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(IdSchema)
  .handler(async ({ data, context }): Promise<{ success: true }> => {
    await context.db.delete(moments).where(eq(moments.id, data.id));
    await deleteSearchEntry(context.db, "moment", data.id);
    return { success: true };
  });

export const getAdminProjectsFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async ({ context }): Promise<AdminProjectDto[]> => {
    const rows = await context.db
      .select()
      .from(projects)
      .orderBy(asc(projects.sortOrder), desc(projects.createdAt));

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      icon: row.icon,
      githubUrl: row.githubUrl,
      tags: parseJsonArray(row.tags),
      sortOrder: row.sortOrder,
      status: row.status,
      updatedAt: row.updatedAt.toISOString(),
    }));
  });

export const createProjectFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(CreateProjectSchema)
  .handler(async ({ data, context }): Promise<AdminProjectDto> => {
    const [created] = await context.db
      .insert(projects)
      .values({
        name: data.name,
        description: data.description || null,
        icon: data.icon || null,
        githubUrl: data.githubUrl || null,
        tags: JSON.stringify(data.tags),
        sortOrder: data.sortOrder,
        status: data.status,
        updatedAt: new Date(),
      })
      .returning();

    if (!created) throw new Error("创建项目失败");

    if (created.status === "published") {
      await syncSearchEntry(context.db, {
        entityType: "project",
        entityId: created.id,
        url: "/projects",
        publishedAt: created.updatedAt.getTime(),
        title: created.name,
        body: created.description ?? "",
        tags: data.tags.join(" "),
      });
    }

    return {
      id: created.id,
      name: created.name,
      description: created.description,
      icon: created.icon,
      githubUrl: created.githubUrl,
      tags: data.tags,
      sortOrder: created.sortOrder,
      status: created.status,
      updatedAt: created.updatedAt.toISOString(),
    };
  });

export const updateProjectFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(UpdateProjectSchema)
  .handler(async ({ data, context }): Promise<AdminProjectDto> => {
    const existing = await context.db.select().from(projects).where(eq(projects.id, data.id)).get();
    if (!existing) throw new Error("项目不存在");

    const nextTags = data.tags !== undefined ? data.tags : parseJsonArray(existing.tags);
    const [updated] = await context.db
      .update(projects)
      .set({
        name: data.name ?? existing.name,
        description: data.description !== undefined ? data.description || null : existing.description,
        icon: data.icon !== undefined ? data.icon || null : existing.icon,
        githubUrl: data.githubUrl !== undefined ? data.githubUrl || null : existing.githubUrl,
        tags: JSON.stringify(nextTags),
        sortOrder: data.sortOrder ?? existing.sortOrder,
        status: data.status ?? existing.status,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, existing.id))
      .returning();

    if (!updated) throw new Error("更新项目失败");

    if (updated.status === "published") {
      await syncSearchEntry(context.db, {
        entityType: "project",
        entityId: updated.id,
        url: "/projects",
        publishedAt: updated.updatedAt.getTime(),
        title: updated.name,
        body: updated.description ?? "",
        tags: nextTags.join(" "),
      });
    } else {
      await deleteSearchEntry(context.db, "project", updated.id);
    }

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      icon: updated.icon,
      githubUrl: updated.githubUrl,
      tags: nextTags,
      sortOrder: updated.sortOrder,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    };
  });

export const deleteProjectFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(IdSchema)
  .handler(async ({ data, context }): Promise<{ success: true }> => {
    await context.db.delete(projects).where(eq(projects.id, data.id));
    await deleteSearchEntry(context.db, "project", data.id);
    return { success: true };
  });

export const getAdminPagesFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async ({ context }): Promise<AdminPageDto[]> => {
    const rows = await context.db.select().from(pages).orderBy(desc(pages.updatedAt));
    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      contentMd: row.contentMd,
      status: row.status,
      updatedAt: row.updatedAt.toISOString(),
    }));
  });

export const createPageFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(CreatePageSchema)
  .handler(async ({ data, context }): Promise<AdminPageDto> => {
    const exists = await context.db
      .select({ id: pages.id })
      .from(pages)
      .where(eq(pages.slug, data.slug))
      .get();
    if (exists) throw new Error("页面 Slug 已存在");

    const [created] = await context.db
      .insert(pages)
      .values({
        slug: data.slug,
        title: data.title,
        contentMd: data.contentMd,
        frontmatter: "{}",
        status: data.status,
        updatedAt: new Date(),
      })
      .returning();

    if (!created) throw new Error("创建页面失败");

    if (created.status === "published") {
      await syncSearchEntry(context.db, {
        entityType: "page",
        entityId: created.id,
        url: `/${created.slug}`,
        publishedAt: created.updatedAt.getTime(),
        title: created.title,
        body: stripMarkdownExcerpt(created.contentMd, 4000),
        tags: "页面",
      });
    }

    return {
      id: created.id,
      slug: created.slug,
      title: created.title,
      contentMd: created.contentMd,
      status: created.status,
      updatedAt: created.updatedAt.toISOString(),
    };
  });

export const updatePageFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(UpdatePageSchema)
  .handler(async ({ data, context }): Promise<AdminPageDto> => {
    const existing = await context.db.select().from(pages).where(eq(pages.id, data.id)).get();
    if (!existing) throw new Error("页面不存在");

    const nextSlug = data.slug ?? existing.slug;
    if (nextSlug !== existing.slug) {
      const conflict = await context.db
        .select({ id: pages.id })
        .from(pages)
        .where(and(eq(pages.slug, nextSlug), ne(pages.id, existing.id)))
        .get();
      if (conflict) throw new Error("页面 Slug 已存在");
    }

    const [updated] = await context.db
      .update(pages)
      .set({
        slug: nextSlug,
        title: data.title ?? existing.title,
        contentMd: data.contentMd ?? existing.contentMd,
        status: data.status ?? existing.status,
        updatedAt: new Date(),
      })
      .where(eq(pages.id, existing.id))
      .returning();

    if (!updated) throw new Error("更新页面失败");

    if (updated.status === "published") {
      await syncSearchEntry(context.db, {
        entityType: "page",
        entityId: updated.id,
        url: `/${updated.slug}`,
        publishedAt: updated.updatedAt.getTime(),
        title: updated.title,
        body: stripMarkdownExcerpt(updated.contentMd, 4000),
        tags: "页面",
      });
    } else {
      await deleteSearchEntry(context.db, "page", updated.id);
    }

    return {
      id: updated.id,
      slug: updated.slug,
      title: updated.title,
      contentMd: updated.contentMd,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    };
  });

export const deletePageFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(IdSchema)
  .handler(async ({ data, context }): Promise<{ success: true }> => {
    await context.db.delete(pages).where(eq(pages.id, data.id));
    await deleteSearchEntry(context.db, "page", data.id);
    return { success: true };
  });

export const getAdminFriendLinksFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async ({ context }): Promise<AdminFriendLinkDto[]> => {
    const rows = await context.db
      .select()
      .from(friendLinks)
      .orderBy(asc(friendLinks.sortOrder), desc(friendLinks.createdAt));

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      url: row.url,
      avatarUrl: row.avatarUrl,
      sortOrder: row.sortOrder,
      status: row.status,
      updatedAt: row.updatedAt.toISOString(),
    }));
  });

export const createFriendLinkFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(CreateFriendLinkSchema)
  .handler(async ({ data, context }): Promise<AdminFriendLinkDto> => {
    const [created] = await context.db
      .insert(friendLinks)
      .values({
        name: data.name,
        description: data.description || null,
        url: data.url,
        avatarUrl: data.avatarUrl || null,
        sortOrder: data.sortOrder,
        status: data.status,
        updatedAt: new Date(),
      })
      .returning();

    if (!created) throw new Error("创建友链失败");

    if (created.status === "published") {
      await syncSearchEntry(context.db, {
        entityType: "friend",
        entityId: created.id,
        url: created.url,
        publishedAt: created.updatedAt.getTime(),
        title: created.name,
        body: `${created.description ?? ""} ${created.url}`,
        tags: "友链",
      });
    }

    return {
      id: created.id,
      name: created.name,
      description: created.description,
      url: created.url,
      avatarUrl: created.avatarUrl,
      sortOrder: created.sortOrder,
      status: created.status,
      updatedAt: created.updatedAt.toISOString(),
    };
  });

export const updateFriendLinkFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(UpdateFriendLinkSchema)
  .handler(async ({ data, context }): Promise<AdminFriendLinkDto> => {
    const existing = await context.db.select().from(friendLinks).where(eq(friendLinks.id, data.id)).get();
    if (!existing) throw new Error("友链不存在");

    const [updated] = await context.db
      .update(friendLinks)
      .set({
        name: data.name ?? existing.name,
        description: data.description !== undefined ? data.description || null : existing.description,
        url: data.url ?? existing.url,
        avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl || null : existing.avatarUrl,
        sortOrder: data.sortOrder ?? existing.sortOrder,
        status: data.status ?? existing.status,
        updatedAt: new Date(),
      })
      .where(eq(friendLinks.id, existing.id))
      .returning();

    if (!updated) throw new Error("更新友链失败");

    if (updated.status === "published") {
      await syncSearchEntry(context.db, {
        entityType: "friend",
        entityId: updated.id,
        url: updated.url,
        publishedAt: updated.updatedAt.getTime(),
        title: updated.name,
        body: `${updated.description ?? ""} ${updated.url}`,
        tags: "友链",
      });
    } else {
      await deleteSearchEntry(context.db, "friend", updated.id);
    }

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      url: updated.url,
      avatarUrl: updated.avatarUrl,
      sortOrder: updated.sortOrder,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    };
  });

export const deleteFriendLinkFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(IdSchema)
  .handler(async ({ data, context }): Promise<{ success: true }> => {
    await context.db.delete(friendLinks).where(eq(friendLinks.id, data.id));
    await deleteSearchEntry(context.db, "friend", data.id);
    return { success: true };
  });

export const getAdminNavItemsFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async ({ context }): Promise<AdminNavItemDto[]> => {
    const rows = await context.db
      .select()
      .from(navItems)
      .orderBy(asc(navItems.sortOrder), desc(navItems.createdAt));

    return rows.map((row) => ({
      id: row.id,
      label: row.label,
      path: row.path,
      sortOrder: row.sortOrder,
      status: row.status,
      updatedAt: row.updatedAt.toISOString(),
    }));
  });

export const createNavItemFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(CreateNavItemSchema)
  .handler(async ({ data, context }): Promise<AdminNavItemDto> => {
    const now = new Date();
    const [created] = await context.db
      .insert(navItems)
      .values({ ...data, createdAt: now, updatedAt: now })
      .returning();

    if (!created) throw new Error("创建导航项失败");
    return {
      id: created.id,
      label: created.label,
      path: created.path,
      sortOrder: created.sortOrder,
      status: created.status,
      updatedAt: created.updatedAt.toISOString(),
    };
  });

export const updateNavItemFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(UpdateNavItemSchema)
  .handler(async ({ data, context }): Promise<AdminNavItemDto> => {
    const existing = await context.db.select().from(navItems).where(eq(navItems.id, data.id)).get();
    if (!existing) throw new Error("导航项不存在");

    const [updated] = await context.db
      .update(navItems)
      .set({
        label: data.label ?? existing.label,
        path: data.path ?? existing.path,
        sortOrder: data.sortOrder ?? existing.sortOrder,
        status: data.status ?? existing.status,
        updatedAt: new Date(),
      })
      .where(eq(navItems.id, existing.id))
      .returning();

    if (!updated) throw new Error("更新导航项失败");
    return {
      id: updated.id,
      label: updated.label,
      path: updated.path,
      sortOrder: updated.sortOrder,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    };
  });

export const reorderNavItemsFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(ReorderNavItemsSchema)
  .handler(async ({ data, context }): Promise<{ success: true }> => {
    const now = new Date();
    const statements = data.ids.map((id, index) =>
      context.db
        .update(navItems)
        .set({ sortOrder: index * 10, updatedAt: now })
        .where(eq(navItems.id, id)),
    );
    const [first, ...rest] = statements;
    if (first) {
      await context.db.batch([first, ...rest]);
    }
    return { success: true };
  });

export const deleteNavItemFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(IdSchema)
  .handler(async ({ data, context }): Promise<{ success: true }> => {
    await context.db.delete(navItems).where(eq(navItems.id, data.id));
    return { success: true };
  });

export const getAdminCommentsFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .validator(PaginationSchema.optional())
  .handler(async ({ data, context }): Promise<{ items: AdminCommentDto[]; pagination: PaginationMeta }> => {
    const page = data?.page ?? 1;
    const pageSize = data?.pageSize ?? 20;

    const [rows, totalRow] = await Promise.all([
      context.db
        .select({
          id: comments.id,
          content: comments.content,
          status: comments.status,
          parentId: comments.parentId,
          createdAt: comments.createdAt,
          username: users.username,
          postTitle: posts.title,
        })
        .from(comments)
        .innerJoin(users, eq(comments.userId, users.id))
        .leftJoin(posts, eq(comments.postId, posts.id))
        .orderBy(desc(comments.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      context.db.select({ count: count() }).from(comments).get(),
    ]);

    return {
      items: rows.map((r) => ({
        id: r.id,
        content: r.content,
        status: r.status,
        parentId: r.parentId,
        username: r.username,
        postTitle: r.postTitle ?? "已删除文章",
        createdAt: r.createdAt.toISOString(),
      })),
      pagination: buildPagination(page, pageSize, Number(totalRow?.count ?? 0)),
    };
  });

export const updateCommentStatusFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(UpdateCommentStatusSchema)
  .handler(async ({ data, context }): Promise<{ id: string; status: "visible" | "hidden" }> => {
    const [updated] = await context.db
      .update(comments)
      .set({ status: data.status, updatedAt: new Date() })
      .where(eq(comments.id, data.id))
      .returning({ id: comments.id, status: comments.status });

    if (!updated) throw new Error("评论不存在");
    return updated;
  });

export const deleteAdminCommentFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(IdSchema)
  .handler(async ({ data, context }): Promise<{ success: true }> => {
    await context.db.delete(comments).where(eq(comments.parentId, data.id));
    await context.db.delete(comments).where(eq(comments.id, data.id));
    return { success: true };
  });

export const getAdminUsersFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .validator(PaginationSchema.optional())
  .handler(async ({ data, context }): Promise<{ items: AdminUserDto[]; pagination: PaginationMeta }> => {
    const page = data?.page ?? 1;
    const pageSize = data?.pageSize ?? 20;

    // 显式列举字段，严禁查询或返回 apiKey
    const [rows, totalRow] = await Promise.all([
      context.db
        .select({
          id: users.id,
          githubId: users.githubId,
          username: users.username,
          email: users.email,
          avatarUrl: users.avatarUrl,
          role: users.role,
          status: users.status,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      context.db.select({ count: count() }).from(users).get(),
    ]);

    return {
      items: rows.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
      })),
      pagination: buildPagination(page, pageSize, Number(totalRow?.count ?? 0)),
    };
  });

export const updateUserRoleFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(UpdateUserRoleSchema)
  .handler(async ({ data, context }): Promise<AdminUserDto> => {
    if (context.user.id === data.id && data.role !== "admin") {
      throw new Error("不能移除自己的管理员权限");
    }

    const [updated] = await context.db
      .update(users)
      .set({ role: data.role, updatedAt: new Date() })
      .where(eq(users.id, data.id))
      .returning({
        id: users.id,
        githubId: users.githubId,
        username: users.username,
        email: users.email,
        avatarUrl: users.avatarUrl,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt,
      });

    if (!updated) throw new Error("用户不存在");
    return { ...updated, createdAt: updated.createdAt.toISOString() };
  });

export const updateUserStatusFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(UpdateUserStatusSchema)
  .handler(async ({ data, context }): Promise<AdminUserDto> => {
    if (context.user.id === data.id && data.status !== "active") {
      throw new Error("不能禁用自己的账户");
    }

    const [updated] = await context.db
      .update(users)
      .set({ status: data.status, updatedAt: new Date() })
      .where(eq(users.id, data.id))
      .returning({
        id: users.id,
        githubId: users.githubId,
        username: users.username,
        email: users.email,
        avatarUrl: users.avatarUrl,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt,
      });

    if (!updated) throw new Error("用户不存在");

    if (updated.status === "banned") {
      await revokeUserSessions(context.db, updated.id);
    }

    return { ...updated, createdAt: updated.createdAt.toISOString() };
  });

export const getAdminMediaFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .validator(PaginationSchema.optional())
  .handler(async ({ data, context }): Promise<{ items: AdminMediaDto[]; pagination: PaginationMeta }> => {
    const page = data?.page ?? 1;
    const pageSize = data?.pageSize ?? 24;

    const [rows, totalRow] = await Promise.all([
      context.db
        .select()
        .from(mediaAssets)
        .orderBy(desc(mediaAssets.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      context.db.select({ count: count() }).from(mediaAssets).get(),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        objectKey: row.objectKey,
        url: `/api/media/${row.objectKey}`,
        filename: row.filename,
        mimeType: row.mimeType,
        sizeBytes: row.sizeBytes,
        createdAt: row.createdAt.toISOString(),
      })),
      pagination: buildPagination(page, pageSize, Number(totalRow?.count ?? 0)),
    };
  });

export const deleteAdminMediaFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(IdSchema)
  .handler(async ({ data, context }): Promise<{ success: true }> => {
    await deleteImageFromR2({
      bucket: env.MEDIA,
      db: context.db,
      id: data.id,
    });
    return { success: true };
  });

export const getAdminSiteConfigFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async ({ context }): Promise<SiteConfig> => {
    return getSiteConfig(context.db);
  });

export const updateSiteConfigFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(SiteConfigSchema)
  .handler(async ({ data, context }): Promise<SiteConfig> => {
    return saveSiteConfig(context.db, data);
  });

export const rebuildSearchIndexFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .handler(async ({ context }): Promise<{ indexed: number }> => {
    return rebuildSearchIndex(context.db);
  });
