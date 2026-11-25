import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, FolderGit2 } from "lucide-react";
import { Badge, Card, EmptyState } from "@/components/ui/Primitives";
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

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <p className="font-mono text-xs tracking-wider text-[var(--accent)] uppercase">PROJECTS / 项目</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--ink)]">做过，也正在做</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">工具、实验与解决真实痛点的开源作品。</p>
        </div>
        <span className="font-mono text-xs text-[var(--muted)]">
          {String(projects.length).padStart(2, "0")} LABS
        </span>
      </header>

      {projects.length === 0 ? (
        <EmptyState title="暂无公开项目" description="后台添加并发布项目后，将在这里展示。" />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
    <Card className="flex h-full flex-col justify-between p-6 transition-all hover:border-[var(--accent)]">
      <div>
        <div className="flex items-center justify-between">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-lg text-[var(--accent)]">
            {project.icon ? <span>{project.icon}</span> : <FolderGit2 className="h-5 w-5" />}
          </span>
          <span className="font-mono text-xs text-[var(--muted)]">{String(index + 1).padStart(2, "0")}</span>
        </div>
        <h2 className="mt-4 flex items-center gap-1.5 text-lg font-bold text-[var(--ink)] group-hover:text-[var(--accent)]">
          <span>{project.name}</span>
          {hasLink && <ArrowUpRight className="h-4 w-4 opacity-60" />}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          {project.description || "仍在持续迭代中的实验作品。"}
        </p>
      </div>
      {project.tags.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <Badge key={tag} tone="neutral">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}
