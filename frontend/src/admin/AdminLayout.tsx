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
  MenuRounded,
  PagesRounded,
  RocketLaunchRounded,
  SettingsRounded,
  WhatshotRounded,
} from "@mui/icons-material";
import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { AdminWorkspaceLayout } from "../components/Layout";

export type AdminSection = "dashboard" | "settings" | "posts" | "moments" | "projects" | "pages" | "friends" | "music" | "comments" | "users";

export const adminSections: Array<{ key: AdminSection; title: string; icon: React.ReactNode }> = [
  { key: "dashboard", title: "仪表盘", icon: <DashboardRounded /> },
  { key: "settings", title: "站点配置", icon: <SettingsRounded /> },
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
        width: 256,
        height: "100%",
        bgcolor: theme.palette.mode === "dark" ? "#0f172a" : "background.paper",
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.25, py: 2.2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Luy Admin
          </Typography>
          <Typography variant="caption" color="text.secondary">
            内容管理系统
          </Typography>
        </Box>
        {onClose && (
          <IconButton onClick={onClose}>
            <CloseRounded />
          </IconButton>
        )}
      </Stack>
      <Divider />
      <List sx={{ px: 1, py: 1, flex: 1 }}>
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
                borderRadius: 1.5,
                mb: 0.5,
                minHeight: 44,
                color: selected ? "primary.contrastText" : "text.primary",
                bgcolor: selected ? "primary.main" : "transparent",
                "&.Mui-selected": {
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                },
                "&.Mui-selected:hover": {
                  bgcolor: "primary.dark",
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: "inherit" }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.title} primaryTypographyProps={{ fontWeight: selected ? 900 : 700 }} />
            </ListItemButton>
          );
        })}
      </List>
      <Divider />
      <Box sx={{ p: 1.5 }}>
        <Button component={RouterLink} to="/" fullWidth startIcon={<HomeRounded />} variant="outlined" sx={{ justifyContent: "flex-start" }}>
          返回首页
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
    <AdminWorkspaceLayout sx={{ display: { md: "flex" } }}>
      {desktop ? (
        <Paper
          square
          elevation={0}
          sx={{
            position: "sticky",
            top: 64,
            alignSelf: "flex-start",
            height: "calc(100vh - 64px)",
            flexShrink: 0,
            zIndex: 10,
            borderRight: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Sidebar section={section} onSectionChange={onSectionChange} />
        </Paper>
      ) : (
        <Drawer open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { maxWidth: "85vw" } }}>
          <Sidebar section={section} onSectionChange={onSectionChange} onClose={() => setOpen(false)} />
        </Drawer>
      )}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Paper
          square
          elevation={0}
          sx={{
            position: "sticky",
            top: 64,
            zIndex: 9,
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: (theme) => alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.9 : 0.96),
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          <Container maxWidth="xl">
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ py: 1.5 }}>
              <Stack direction="row" spacing={1.2} alignItems="center" sx={{ minWidth: 0 }}>
                {!desktop && (
                  <IconButton onClick={() => setOpen(true)}>
                    <MenuRounded />
                  </IconButton>
                )}
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h5" sx={{ fontWeight: 900 }} noWrap>
                    {title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {subtitle}
                  </Typography>
                </Box>
              </Stack>
              {actions && <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">{actions}</Stack>}
            </Stack>
          </Container>
        </Paper>
        <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 }, px: { xs: 2, md: 3 } }}>
          {children}
        </Container>
      </Box>
    </AdminWorkspaceLayout>
  );
}
