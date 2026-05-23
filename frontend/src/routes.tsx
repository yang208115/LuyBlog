import { Route, Routes } from "react-router-dom";
import App from "./App";
import HomePage from "./pages/HomePage";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { BlogListPage } from "./pages/BlogListPage";
import { BlogDetailPage } from "./pages/BlogDetailPage";
import { AdminPage } from "./pages/AdminPage";
import { AdminPostEditorPage } from "./pages/AdminPostEditorPage";
import { AboutPage } from "./pages/AboutPage";
import { FriendsPage } from "./pages/FriendsPage";
import { MomentsPage } from "./pages/MomentsPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { MusicPage } from "./pages/MusicPage";
import { SearchPage } from "./pages/SearchPage";
import { MarkdownPage } from "./pages/MarkdownPage";

/**
 * 应用路由配置
 *
 * 这是唯一的路由定义文件，被客户端和服务端入口共享使用。
 * 添加新路由时，只需要在这里修改即可。
 *
 * @example
 * // 添加新页面：
 * 1. 导入页面组件：import AboutPage from "./pages/AboutPage";
 * 2. 添加路由：<Route path="about" element={<AboutPage />} />
 */
export const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<App />}>
      <Route index element={<HomePage />} />
      <Route path="blog" element={<BlogListPage />} />
      <Route path="search" element={<SearchPage />} />
      <Route path="blog/:slug" element={<BlogDetailPage />} />
      <Route path="posts/:slug" element={<BlogDetailPage />} />
      <Route path="moments" element={<MomentsPage />} />
      <Route path="projects" element={<ProjectsPage />} />
      <Route path="music" element={<MusicPage />} />
      <Route path="friends" element={<FriendsPage />} />
      <Route path="about" element={<AboutPage />} />
      <Route path="admin" element={<AdminPage />} />
      <Route path="admin/posts/:id" element={<AdminPostEditorPage />} />
      <Route path="auth/callback" element={<AuthCallbackPage />} />
      <Route path=":slug" element={<MarkdownPage />} />
    </Route>
  </Routes>
);
