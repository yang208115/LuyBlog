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
  CircularProgress,
  Stack,
} from "@mui/material";
import { Dashboard as DashboardIcon, ExitToApp as LogoutIcon, GitHub as GitHubIcon } from "@mui/icons-material";
import { Link as RouterLink, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { Footer } from "./components/Footer";
import { NekroEdgeLogo } from "./assets/logos";
import { ToggleThemeButton } from "./components/ToggleThemeButton";
import { useAuth } from "./hooks/useAuth";

function App() {
  const location = useLocation();
  const theme = useTheme();
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <CssBaseline />
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          color: theme.palette.text.primary,
          backgroundColor: theme.appBar.background,
          backdropFilter: "blur(12px) saturate(180%)",
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ gap: 1.5 }}>
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
              <NekroEdgeLogo height={32} />
              <Typography
                variant="h6"
                noWrap
                sx={{
                  ml: 1.5,
                  display: { xs: "none", md: "flex" },
                  fontFamily: "monospace",
                  fontWeight: 700,
                }}
              >
                NekroEdge
              </Typography>
            </Box>

            <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center" }}>
              <Stack direction="row" spacing={0.5} sx={{ display: { xs: "none", md: "flex" } }}>
                <Button
                  component={RouterLink}
                  to="/blog"
                  sx={{
                    color: "inherit",
                    borderRadius: 999,
                    px: 2,
                    fontWeight: location.pathname.startsWith("/blog") ? 700 : 500,
                    backgroundColor: location.pathname.startsWith("/blog") ? "action.selected" : "transparent",
                  }}
                >
                  文章
                </Button>

                <Button
                  component={RouterLink}
                  to="/friends"
                  sx={{
                    color: "inherit",
                    borderRadius: 999,
                    px: 2,
                    fontWeight: location.pathname.startsWith("/friends") ? 700 : 500,
                    backgroundColor: location.pathname.startsWith("/friends") ? "action.selected" : "transparent",
                  }}
                >
                  友链
                </Button>

                {isAuthenticated && (
                  <Button
                    component={RouterLink}
                    to="/dashboard"
                    sx={{
                      color: "inherit",
                      borderRadius: 999,
                      px: 2,
                      fontWeight: location.pathname === "/dashboard" ? 700 : 500,
                      backgroundColor: location.pathname === "/dashboard" ? "action.selected" : "transparent",
                    }}
                  >
                    我的
                  </Button>
                )}

                <Button
                  component={RouterLink}
                  to="/about"
                  sx={{
                    color: "inherit",
                    borderRadius: 999,
                    px: 2,
                    fontWeight: location.pathname.startsWith("/about") ? 700 : 500,
                    backgroundColor: location.pathname.startsWith("/about") ? "action.selected" : "transparent",
                  }}
                >
                  关于
                </Button>

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
                <CircularProgress size={20} sx={{ ml: 0.5 }} />
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
                    <MenuItem onClick={handleMenuClose} component={RouterLink} to="/dashboard">
                      <DashboardIcon sx={{ mr: 1 }} />
                      控制台
                    </MenuItem>
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
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Outlet />
      </Box>
      <Footer />
    </Box>
  );
}

export default App;
