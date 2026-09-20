import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useSiteConfig } from "../context/SiteConfigProvider";

export type AdminSection =
  | "dashboard"
  | "settings"
  | "navigation"
  | "posts"
  | "moments"
  | "projects"
  | "pages"
  | "friends"
  | "comments"
  | "users";

export const adminSections: Array<{ key: AdminSection; title: string; icon: string }> = [
  { key: "dashboard", title: "仪表盘", icon: "⌂" },
  { key: "settings", title: "站点配置", icon: "⚙" },
  { key: "navigation", title: "导航栏", icon: "≡" },
  { key: "posts", title: "文章", icon: "¶" },
  { key: "moments", title: "瞬间", icon: "◌" },
  { key: "projects", title: "项目", icon: "◇" },
  { key: "pages", title: "页面", icon: "□" },
  { key: "friends", title: "友链", icon: "∞" },
  { key: "comments", title: "评论", icon: "⊙" },
  { key: "users", title: "用户", icon: "♙" },
];

function Sidebar({
  section,
  onSectionChange,
  open,
  onClose,
}: {
  section: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  open: boolean;
  onClose: () => void;
}) {
  const siteConfig = useSiteConfig();

  return (
    <aside className={`admin-sidebar${open ? " open" : ""}`} id="admin-sidebar">
      <header>
        <span className="admin-brand-mark">{siteConfig.authorName.slice(0, 1)}</span>
        <span>
          <strong>{siteConfig.title}</strong>
          <small>CONTENT DESK · V2</small>
        </span>
      </header>
      <p className="sidebar-label">WORKSPACE</p>
      <nav>
        {adminSections.map((item) => (
          <a
            className={section === item.key ? "active" : undefined}
            href={`/admin#${item.key}`}
            key={item.key}
            onClick={(event) => {
              event.preventDefault();
              onSectionChange(item.key);
              onClose();
            }}
          >
            <span className="admin-nav-icon">{item.icon}</span>
            <strong>{item.title}</strong>
            <small>›</small>
          </a>
        ))}
      </nav>
      <div className="admin-profile">
        <img src={siteConfig.avatarUrl} alt={`${siteConfig.authorName}的头像`} />
        <span>
          <strong>{siteConfig.authorName}</strong>
          <small>站点管理员 · 在线</small>
        </span>
      </div>
      <RouterLink className="button ghost" to="/">
        ← 返回前台
      </RouterLink>
    </aside>
  );
}

export function AdminLayout({
  section,
  onSectionChange,
  title,
  subtitle,
  actions,
  children,
}: {
  section: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="admin-shell">
      <Sidebar section={section} onSectionChange={onSectionChange} open={open} onClose={() => setOpen(false)} />
      <main className="admin-main">
        <header className="admin-heading">
          <div className="admin-heading-copy">
            <button className="icon-button mobile-only" type="button" aria-label="打开后台菜单" onClick={() => setOpen(true)}>
              ☰
            </button>
            <div>
              <span className="eyebrow">CONTENT DESK / {title}</span>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
          </div>
          {actions && <div className="toolbar-group">{actions}</div>}
        </header>
        {children}
      </main>
      <button
        className={`drawer-backdrop${open ? " open" : ""}`}
        type="button"
        aria-label="关闭后台菜单"
        onClick={() => setOpen(false)}
      />
    </div>
  );
}
