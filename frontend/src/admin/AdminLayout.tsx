import {
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
  Avatar,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  ArticleRounded,
  CloseRounded,
  CommentRounded,
  DashboardRounded,
  GroupRounded,
  HomeRounded,
  LibraryMusicRounded,
  LinkRounded,
  MenuBookRounded,
  MenuRounded,
  PagesRounded,
  RocketLaunchRounded,
  SettingsRounded,
  WhatshotRounded,
  AutoAwesomeRounded,
} from "@mui/icons-material";
import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { AdminWorkspaceLayout } from "../components/Layout";

export type AdminSection = "dashboard" | "settings" | "navigation" | "posts" | "moments" | "projects" | "pages" | "friends" | "music" | "comments" | "users";

export const adminSections: Array<{ key: AdminSection; title: string; icon: React.ReactNode }> = [
  { key: "dashboard", title: "仪表盘", icon: <DashboardRounded /> },
  { key: "settings", title: "站点配置", icon: <SettingsRounded /> },
  { key: "navigation", title: "导航栏", icon: <MenuBookRounded /> },
  { key: "posts", title: "文章", icon: <ArticleRounded /> },
  { key: "moments", title: "瞬间", icon: <WhatshotRounded /> },
  { key: "projects", title: "项目", icon: <RocketLaunchRounded /> },
  { key: "pages", title: "页面", icon: <PagesRounded /> },
  { key: "friends", title: "友链", icon: <LinkRounded /> },
  { key: "music", title: "音乐", icon: <LibraryMusicRounded /> },
  { key: "comments", title: "评论", icon: <CommentRounded /> },
  { key: "users", title: "用户", icon: <GroupRounded /> },
];

function Sidebar({ section, onSectionChange, onClose }: { section: AdminSection; onSectionChange: (section: AdminSection) => void; onClose?: () => void }) {
  const navigate = useNavigate();
  const theme = useTheme();
  return (
    <Stack
      sx={{
        width: 280,
        height: "100%",
        bgcolor: theme.palette.mode === "dark" ? "background.default" : "background.paper",
        borderRight: 1,
        borderColor: "divider",
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, py: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.main", color: "primary.contrastText" }}>
            <AutoAwesomeRounded fontSize="small" />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              LUY ADMIN
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              WORKSPACE
            </Typography>
          </Box>
        </Stack>
        {onClose && (
          <IconButton onClick={onClose} size="small">
            <CloseRounded fontSize="small" />
          </IconButton>
        )}
      </Stack>

      <List sx={{ px: 2, py: 1, flex: 1, overflowY: "auto" }}>
        <Typography variant="overline" sx={{ px: 2, py: 1, display: "block", color: "text.secondary", fontWeight: 700, letterSpacing: "0.1em" }}>
          MENU
        </Typography>
        {adminSections.map((item) => {
          const selected = section === item.key;
          return (
            <ListItemButton
              key={item.key}
              selected={selected}
              onClick={() => {
                onSectionChange(item.key);
                navigate("/admin");
                onClose?.();
              }}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                minHeight: 44,
                color: selected ? "primary.main" : "text.secondary",
                bgcolor: selected ? alpha(theme.palette.primary.main, 0.08) : "transparent",
                transition: "all 0.2s ease-in-out",
                "&.Mui-selected": {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  color: "primary.main",
                },
                "&.Mui-selected:hover": {
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                },
                "&:hover": {
                  bgcolor: alpha(theme.palette.text.primary, 0.04),
                  color: "text.primary",
                  transform: "translateX(4px)",
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.title} primaryTypographyProps={{ fontWeight: selected ? 700 : 500, fontSize: "0.95rem" }} />
            </ListItemButton>
          );
        })}
      </List>
      <Box sx={{ p: 3 }}>
        <Button
          component={RouterLink}
          to="/"
          fullWidth
          startIcon={<HomeRounded />}
          variant="outlined"
          color="inherit"
          sx={{
            justifyContent: "flex-start",
            borderRadius: 2,
            py: 1,
            borderColor: "divider",
            color: "text.secondary",
            "&:hover": {
              borderColor: "text.primary",
              color: "text.primary",
              bgcolor: "transparent"
            }
          }}
        >
          返回前台
        </Button>
      </Box>
    </Stack>
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
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up("md"));
  const [open, setOpen] = useState(false);

  return (
    <AdminWorkspaceLayout sx={{ display: { md: "flex" }, bgcolor: "background.default", minHeight: "100vh" }}>
      {desktop ? (
        <Box
          sx={{
            position: "sticky",
            top: 64,
            alignSelf: "flex-start",
            height: "calc(100vh - 64px)",
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          <Sidebar section={section} onSectionChange={onSectionChange} />
        </Box>
      ) : (
        <Drawer open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { maxWidth: "85vw", backgroundImage: "none" } }}>
          <Sidebar section={section} onSectionChange={onSectionChange} onClose={() => setOpen(false)} />
        </Drawer>
      )}
      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Box
          sx={{
            position: "sticky",
            top: 64,
            zIndex: 9,
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: (theme) => alpha(theme.palette.background.default, 0.8),
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <Container maxWidth="xl">
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ py: 2.5 }}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
                {!desktop && (
                  <IconButton onClick={() => setOpen(true)} edge="start" sx={{ color: "text.primary" }}>
                    <MenuRounded />
                  </IconButton>
                )}
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.02em", mb: 0.5 }} noWrap>
                    {title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }} noWrap>
                    {subtitle}
                  </Typography>
                </Box>
              </Stack>
              {actions && <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap">{actions}</Stack>}
            </Stack>
          </Container>
        </Box>
        <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 4 }, flex: 1 }}>
          {children}
        </Container>
      </Box>
    </AdminWorkspaceLayout>
  );
}
