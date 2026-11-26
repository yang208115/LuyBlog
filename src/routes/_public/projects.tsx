import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, FolderGit2 } from "lucide-react";
import { Card, EmptyState } from "@/components/ui/Primitives";
import { getProjectsFn } from "@/server/functions/public";
import type { PublicProjectDto } from "@/shared/types";

export const Route = createFileRoute("/_public/projects")({
  loader: () => getProjectsFn(),
  head: () => ({
    meta: [{ title: "项目 - 运阳的小窝" }],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const projects = Route.useLoaderData();
  const gridClass =
    projects.length >= 3 ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-5 sm:grid-cols-2";

  return (
    <div className="mx-auto max-w-5xl editorial-enter space-y-8">
      <header>
        <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2 text-xs tracking-wide text-[var(--muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" aria-hidden="true" />
            <span>造物录</span>
          </div>
          <span className="font-mono text-[11px] text-[var(--muted-soft)] tabular-nums">
            {String(projects.length).padStart(2, "0")} 项作品
          </span>
        </div>

        <div className="border-b border-[var(--border)] pt-6 pb-8">
          <h1 className="font-editorial text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
            做过，也正在做
          </h1>
          <div className="my-4 h-[2px] w-8 bg-[var(--sakura)]" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-[var(--muted)]">工具、实验与解决真实痛点的开源作品。</p>
        </div>
      </header>

      {projects.length === 0 ? (
        <EmptyState title="暂无公开项目" description="后台添加并发布项目后，将在这里展示。" />
      ) : (
        <div className={gridClass}>
          {projects.map((project, index) =>
            project.githubUrl ? (
              <a
                key={project.id}
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <ProjectCardContent project={project} index={index} hasLink />
              </a>
            ) : (
              <div key={project.id} className="group">
                <ProjectCardContent project={project} index={index} hasLink={false} />
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

function ProjectCardContent({
  project,
  index,
  hasLink,
}: {
  project: PublicProjectDto;
  index: number;
  hasLink: boolean;
}) {
  return (
    <Card className="flex h-full flex-col justify-between border-t-2 border-t-transparent p-6 transition-all hover:border-[var(--border-strong)] hover:border-t-[var(--accent)]">
      <div>
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)]/70 text-lg text-[var(--accent)]">
            {project.icon ? <span>{project.icon}</span> : <FolderGit2 className="h-5 w-5" />}
          </span>
          <span className="font-editorial text-2xl leading-none text-[var(--muted-soft)]/40 tabular-nums select-none">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        <h2 className="font-editorial mt-5 text-xl font-semibold tracking-tight text-[var(--ink)] transition-colors group-hover:text-[var(--accent)]">
          {project.name}
        </h2>

        <p className="mt-2.5 text-sm leading-[1.75] text-[var(--muted)]">
          {project.description || "仍在持续迭代中的实验作品。"}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
        <div className="flex flex-wrap gap-x-2.5 gap-y-1 font-mono text-[11px] text-[var(--muted-soft)]">
          {project.tags.slice(0, 3).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        {hasLink ? (
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[var(--accent)]">
            查看源码
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        ) : (
          <span className="shrink-0 font-mono text-[11px] text-[var(--muted-soft)]">持续打磨</span>
        )}
      </div>
    </Card>
  );
}
