import {
  AppBar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
  CssBaseline,
  useTheme,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Stack,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import {
  AdminPanelSettingsRounded,
  CloseRounded,
  ExitToApp as LogoutIcon,
  GitHub as GitHubIcon,
  MenuRounded,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Footer } from "./components/Footer";
import { BackgroundEffects } from "./components/BackgroundEffects";
import { FloatingPlayer } from "./components/FloatingPlayer";
import { ToggleThemeButton } from "./components/ToggleThemeButton";
import { useAuth } from "./hooks/useAuth";
import { useSiteConfig } from "./context/SiteConfigProvider";
import { ModernLoader } from "./components/Loading";
import { defaultNavItems } from "./config/navigation";
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

function App() {
  const location = useLocation();
  const theme = useTheme();
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const siteConfig = useSiteConfig();
  const navQuery = useQuery({ queryKey: ["navigation"], queryFn: contentApi.navigation, staleTime: 5 * 60 * 1000 });
  const navItems = navQuery.data?.length ? navQuery.data : defaultNavItems;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdminRoute = location.pathname.startsWith("/admin");

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

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

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", position: "relative" }}>
      <CssBaseline />
      {!isAdminRoute && <BackgroundEffects />}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          color: theme.palette.text.primary,
          backgroundColor: theme.appBar.background,
          backdropFilter: "blur(22px) saturate(180%)",
          WebkitBackdropFilter: "blur(22px) saturate(180%)",
          borderBottom: `1px solid ${alpha(theme.palette.common.white, theme.palette.mode === "dark" ? 0.14 : 0.52)}`,
          boxShadow: `0 14px 44px ${alpha(theme.palette.common.black, theme.palette.mode === "dark" ? 0.24 : 0.08)}`,
          top: 0,
          left: 0,
          right: 0,
          zIndex: theme.zIndex.appBar,
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ gap: 1.5 }}>
            <IconButton
              aria-label="打开导航"
              onClick={() => setMobileOpen(true)}
              sx={{
                display: { xs: "inline-flex", md: "none" },
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.background.paper, 0.42),
              }}
            >
              <MenuRounded />
            </IconButton>
            <Box
              component={RouterLink}
              to="/"
              sx={{
                display: "flex",
                alignItems: "center",
                minWidth: 0,
                textDecoration: "none",
                color: "inherit",
              }}
            >
                <Typography
                  variant="h6"
                  noWrap
                sx={{
                  ml: 1.5,
                  display: { xs: "none", md: "flex" },
                  fontWeight: 900,
                  letterSpacing: 0,
                }}
              >
                {siteConfig.navTitle}
                {siteConfig.navSuffix}
                {siteConfig.navAfter}
              </Typography>
            </Box>

            <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center" }}>
              <Stack
                direction="row"
                spacing={0.5}
                sx={{
                  display: isAdminRoute ? "none" : { xs: "none", md: "flex" },
                  p: 0.5,
                  borderRadius: 999,
                  backgroundColor: alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.2 : 0.36),
                  border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
                }}
              >
                {navItems.map((item) => {
                  const external = isExternalPath(item.path);
                  const active = isActiveNav(location.pathname, item.path);
                  return (
                    <Button
                      key={`${item.label}-${item.path}`}
                      component={external ? "a" : RouterLink}
                      href={external ? item.path : undefined}
                      to={external ? undefined : item.path}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noreferrer" : undefined}
                      sx={{
                        borderRadius: 999,
                        px: 1.4,
                        fontWeight: active ? 700 : 500,
                        backgroundColor: active
                          ? alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.24 : 0.12)
                          : "transparent",
                        color: active ? "primary.main" : "text.primary",
                        border: "1px solid transparent",
                      }}
                    >
                      {item.label}
                    </Button>
                  );
                })}

                {isAuthenticated && user?.role === "admin" && (
                  <Button
                    component={RouterLink}
                    to="/admin"
                    sx={{
                      color: "inherit",
                      borderRadius: 999,
                      px: 2,
                      fontWeight: location.pathname.startsWith("/admin") ? 700 : 500,
                      backgroundColor: location.pathname.startsWith("/admin") ? "action.selected" : "transparent",
                    }}
                  >
                    后台
                  </Button>
                )}
              </Stack>
            </Box>

            <Stack direction="row" spacing={0.8} alignItems="center">
              <ToggleThemeButton />

              {isLoading ? (
                <ModernLoader size={20} />
              ) : isAuthenticated ? (
                <>
                  <IconButton
                    size="large"
                    aria-label="用户菜单"
                    aria-controls="user-menu"
                    aria-haspopup="true"
                    onClick={handleMenuOpen}
                    color="inherit"
                  >
                    <Avatar src={user?.avatarUrl || undefined} alt={user?.username} sx={{ width: 32, height: 32 }}>
                      {user?.username?.charAt(0).toUpperCase()}
                    </Avatar>
                  </IconButton>
                  <Menu
                    id="user-menu"
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    transformOrigin={{ horizontal: "right", vertical: "top" }}
                    anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                  >
                    {user?.role === "admin" && (
                      <MenuItem onClick={handleMenuClose} component={RouterLink} to="/admin">
                        <AdminPanelSettingsRounded sx={{ mr: 1 }} />
                        后台
                      </MenuItem>
                    )}
                    <MenuItem onClick={handleLogout}>
                      <LogoutIcon sx={{ mr: 1 }} />
                      登出
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Button onClick={login} startIcon={<GitHubIcon />} variant="outlined" sx={{ borderRadius: 999 }}>
                  GitHub 登录
                </Button>
              )}
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{
          sx: {
            width: 284,
            p: 2,
            borderTopRightRadius: 18,
            borderBottomRightRadius: 18,
            backgroundColor: theme.glass.background,
            backdropFilter: "blur(22px) saturate(180%)",
          },
        }}
      >
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              {siteConfig.navTitle}
              {siteConfig.navSuffix}
              {siteConfig.navAfter}
            </Typography>
            <IconButton aria-label="关闭导航" onClick={() => setMobileOpen(false)}>
              <CloseRounded />
            </IconButton>
          </Stack>
          <List sx={{ display: "grid", gap: 0.6 }}>
            {navItems.map((item) => {
              const external = isExternalPath(item.path);
              const active = isActiveNav(location.pathname, item.path);
              return (
                <ListItemButton
                  key={`${item.label}-${item.path}`}
                  component={external ? "a" : RouterLink}
                  href={external ? item.path : undefined}
                  to={external ? undefined : item.path}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noreferrer" : undefined}
                  onClick={() => setMobileOpen(false)}
                  sx={{
                    borderRadius: 2,
                    backgroundColor: active ? alpha(theme.palette.primary.main, 0.14) : "transparent",
                    color: active ? "primary.main" : "text.primary",
                  }}
                >
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontWeight: active ? 900 : 700 }}
                  />
                </ListItemButton>
              );
            })}
            {isAuthenticated && user?.role === "admin" && (
              <ListItemButton
                component={RouterLink}
                to="/admin"
                onClick={() => setMobileOpen(false)}
                sx={{ borderRadius: 2 }}
              >
                <ListItemText primary="后台" primaryTypographyProps={{ fontWeight: 700 }} />
              </ListItemButton>
            )}
          </List>
        </Stack>
      </Drawer>
      <Toolbar aria-hidden="true" sx={{ flexShrink: 0 }} />
      <Box component="main" sx={{ flexGrow: 1, position: "relative", zIndex: 1, minWidth: 0 }}>
        <Outlet />
      </Box>
      {!isAdminRoute && <FloatingPlayer />}
      {!isAdminRoute && <Footer />}
    </Box>
  );
}

export default App;
