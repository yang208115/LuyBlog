import { useQuery } from "@tanstack/react-query";
import { contentApi } from "../services/content";

export function ProjectsPage() {
  const query = useQuery({ queryKey: ["projects"], queryFn: contentApi.projects });
  const projects = query.data ?? [];

  return (
    <div className="page-shell">
      <header className="page-heading">
        <div>
          <span className="eyebrow">PROJECTS / 项目</span>
          <h1>做过，也正在做</h1>
          <p>工具、产品与还没有名字的实验。每一项都来自真实需求。</p>
        </div>
        <span className="counter">{String(projects.length).padStart(2, "0")} / LAB</span>
      </header>

      {query.isLoading ? (
        <div className="empty-state">
          <div className="loader" />
          <strong>正在整理项目</strong>
        </div>
      ) : (
        <div className="project-grid">
          {projects.map((project, index) => {
            const href = project.githubUrl || project.github_url || "#";
            return (
              <a
                className="project-card"
                href={href}
                target={href === "#" ? undefined : "_blank"}
                rel={href === "#" ? undefined : "noreferrer"}
                key={project.id}
              >
                <span className="project-icon">{project.icon || ["⌘", "◇", "✦", "◫"][index % 4]}</span>
                <h3>{project.name}</h3>
                <p>{project.description || "仍在持续迭代中的小宇宙。"}</p>
                <div className="tag-list">
                  {project.tags.map((tag) => (
                    <span className="tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="note-date">PROJECT {String(index + 1).padStart(2, "0")} ↗</span>
              </a>
            );
          })}
        </div>
      )}
      {!query.isLoading && projects.length === 0 && (
        <div className="empty-state">
          <strong>暂无项目</strong>
          <p>后台添加项目后，这里会自动展示。</p>
        </div>
      )}
    </div>
  );
}
