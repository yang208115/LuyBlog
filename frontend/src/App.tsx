import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Footer } from "./components/Footer";
import { BackgroundEffects } from "./components/BackgroundEffects";
import { FloatingPlayer } from "./components/FloatingPlayer";
import { useAuth } from "./hooks/useAuth";
import { useSiteConfig } from "./context/SiteConfigProvider";
import { useAppTheme } from "./context/ThemeContextProvider";
import { contentApi } from "./services/content";

function isExternalPath(path: string) {
  return /^(https?:)?\/\//.test(path) || path.startsWith("mailto:") || path.startsWith("tel:");
}

function isActiveNav(pathname: string, targetPath: string) {
  if (isExternalPath(targetPath)) return false;
  if (targetPath === "/") return pathname === "/";
  if (targetPath === "/blog") return pathname.startsWith("/blog") || pathname.startsWith("/posts");
  return pathname === targetPath || pathname.startsWith(`${targetPath.replace(/\/$/, "")}/`);
}

const prototypeNavigation = [
  ["/", "首页"],
  ["/blog", "文章"],
  ["/moments", "瞬间"],
  ["/projects", "项目"],
  ["/music", "音乐"],
  ["/friends", "友链"],
  ["/about", "关于"],
] as const;

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const siteConfig = useSiteConfig();
  const { themeMode, toggleTheme } = useAppTheme();
  const { user, isAuthenticated, login, logout } = useAuth();
  const navQuery = useQuery({
    queryKey: ["navigation"],
    queryFn: contentApi.navigation,
    staleTime: 5 * 60 * 1000,
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const isAdminRoute = location.pathname.startsWith("/admin");

  const navItems = useMemo(
    () =>
      prototypeNavigation.map(([path, fallbackLabel]) => {
        const configured = navQuery.data?.find((item) => item.path === path);
        return { path, label: configured?.label === "归档" ? "文章" : configured?.label || fallbackLabel };
      }),
    [navQuery.data],
  );

  useEffect(() => {
    document.title = siteConfig.title;
    let favicon = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "icon";
      document.head.appendChild(favicon);
    }
    favicon.href = siteConfig.faviconUrl;
  }, [siteConfig.faviconUrl, siteConfig.title]);

  useEffect(() => {
    document.body.classList.toggle("admin-mode", isAdminRoute);
    return () => document.body.classList.remove("admin-mode");
  }, [isAdminRoute]);

  useEffect(() => {
    setMobileOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleSearchShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        navigate("/search");
      }
    };
    window.addEventListener("keydown", handleSearchShortcut);
    return () => window.removeEventListener("keydown", handleSearchShortcut);
  }, [navigate]);

  return (
    <>
      {!isAdminRoute && <BackgroundEffects />}
      <a className="skip-link" href="#app">
        跳到主要内容
      </a>
      <div className="paper-noise" aria-hidden="true" />

      <header className="site-header">
        <div className="header-inner">
          <button
            className="icon-button mobile-only"
            type="button"
            aria-label="打开菜单"
            onClick={() => setMobileOpen(true)}
          >
            <span aria-hidden="true">☰</span>
          </button>

          <RouterLink className="brand" to="/" aria-label={`${siteConfig.title}首页`}>
            <span className="brand-mark">{siteConfig.authorName.slice(0, 1)}</span>
            <span className="brand-copy">
              <strong>
                {siteConfig.navTitle} <i>{siteConfig.navSuffix}</i> {siteConfig.navAfter}
              </strong>
              <small>YUNYANG&apos;S DIGITAL GARDEN</small>
            </span>
          </RouterLink>

          <nav className="primary-nav" aria-label="主导航">
            {navItems.map((item) => (
              <RouterLink
                key={item.path}
                to={item.path}
                className={isActiveNav(location.pathname, item.path) ? "active" : undefined}
              >
                {item.label}
              </RouterLink>
            ))}
          </nav>

          <div className="header-actions">
            {!isAdminRoute && (
              <button
                className="icon-button"
                type="button"
                aria-label="打开搜索"
                onClick={() => navigate("/search")}
              >
                <span aria-hidden="true">⌕</span>
              </button>
            )}
            <button
              className="icon-button"
              type="button"
              aria-label={themeMode === "dark" ? "切换到浅色主题" : "切换到深色主题"}
              onClick={toggleTheme}
            >
              <span aria-hidden="true">◐</span>
            </button>
            <div style={{ position: "relative" }}>
              <button
                className="profile-button"
                type="button"
                aria-label={isAuthenticated ? "账户菜单" : "GitHub 登录"}
                onClick={() => {
                  if (!isAuthenticated) {
                    login();
                    return;
                  }
                  setAccountOpen((value) => !value);
                }}
              >
                <span>{user?.username?.slice(0, 1) || siteConfig.authorName.slice(0, 1)}</span>
              </button>
              {accountOpen && (
                <div
                  className="paper-card"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 10px)",
                    right: 0,
                    width: 150,
                    padding: 8,
                    zIndex: 90,
                  }}
                >
                  {user?.role === "admin" && (
                    <RouterLink className="button ghost" to="/admin" style={{ width: "100%" }}>
                      内容工作台
                    </RouterLink>
                  )}
                  <button
                    className="button ghost"
                    type="button"
                    style={{ width: "100%", marginTop: 4 }}
                    onClick={() => {
                      logout();
                      setAccountOpen(false);
                    }}
                  >
                    退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <aside className={`mobile-drawer${mobileOpen ? " open" : ""}`} aria-hidden={!mobileOpen}>
        <div className="drawer-head">
          <span className="brand">
            <span className="brand-mark">{siteConfig.authorName.slice(0, 1)}</span>
            <strong>{siteConfig.title}</strong>
          </span>
          <button className="icon-button" type="button" aria-label="关闭菜单" onClick={() => setMobileOpen(false)}>
            ×
          </button>
        </div>
        <nav aria-label="移动端导航">
          {navItems.map((item, index) => (
            <RouterLink key={item.path} to={item.path}>
              {item.label} <span>{String(index + 1).padStart(2, "0")}</span>
            </RouterLink>
          ))}
          {user?.role === "admin" && (
            <RouterLink to="/admin">
              内容工作台 <span>↗</span>
            </RouterLink>
          )}
        </nav>
      </aside>
      <button
        className={`drawer-backdrop${mobileOpen ? " open" : ""}`}
        type="button"
        aria-label="关闭菜单"
        onClick={() => setMobileOpen(false)}
      />

      <main id="app" tabIndex={-1}>
        <Outlet />
      </main>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <FloatingPlayer />}
    </>
  );
}
