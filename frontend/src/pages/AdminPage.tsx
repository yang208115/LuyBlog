import { Alert } from "@mui/material";
import { useMemo, useState } from "react";
import { AdminDashboard } from "../admin/AdminDashboard";
import { AdminLayout, AdminSection, adminSections } from "../admin/AdminLayout";
import { CommentManager, UserManager } from "../admin/ReviewManagers";
import { FriendLinkManager } from "../admin/FriendLinkManager";
import { MomentManager } from "../admin/MomentManager";
import { MusicManager } from "../admin/MusicManager";
import { PageManager } from "../admin/PageManager";
import { PostManager } from "../admin/PostManager";
import { ProjectManager } from "../admin/ProjectManager";
import { SiteConfigManager } from "../admin/SiteConfigManager";
import { SectionPanel } from "../components/Glass";
import { PublicPageLayout } from "../components/Layout";
import { useAuth } from "../hooks/useAuth";

const subtitles: Record<AdminSection, string> = {
  dashboard: "站点内容和运营数据概览",
  settings: "修改前台站点文案、图片、链接和运行参数",
  posts: "创建、编辑和发布博客文章",
  moments: "管理日常瞬间，评论保持关闭",
  projects: "维护项目列表和展示顺序",
  pages: "编辑关于等 Markdown 页面",
  friends: "管理友链站点和展示状态",
  music: "配置网易云歌曲和缓存播放链接",
  comments: "审核文章评论可见状态",
  users: "管理用户角色和账号状态",
};

function renderSection(section: AdminSection) {
  switch (section) {
    case "dashboard":
      return <AdminDashboard />;
    case "settings":
      return <SiteConfigManager />;
    case "posts":
      return <PostManager />;
    case "moments":
      return <MomentManager />;
    case "projects":
      return <ProjectManager />;
    case "pages":
      return <PageManager />;
    case "friends":
      return <FriendLinkManager />;
    case "music":
      return <MusicManager />;
    case "comments":
      return <CommentManager />;
    case "users":
      return <UserManager />;
    default:
      return <AdminDashboard />;
  }
}

export function AdminPage() {
  const { user, isLoading } = useAuth();
  const [section, setSection] = useState<AdminSection>("dashboard");
  const current = useMemo(() => adminSections.find((item) => item.key === section) ?? adminSections[0], [section]);

  if (isLoading) {
    return (
      <PublicPageLayout maxWidth="sm">
        <SectionPanel>
          正在验证管理员身份...
        </SectionPanel>
      </PublicPageLayout>
    );
  }

  if (user?.role !== "admin") {
    return (
      <PublicPageLayout maxWidth="sm">
        <Alert severity="error">仅管理员可访问。</Alert>
      </PublicPageLayout>
    );
  }

  return (
    <AdminLayout section={section} onSectionChange={setSection} title={current.title} subtitle={subtitles[section]}>
      {renderSection(section)}
    </AdminLayout>
  );
}
