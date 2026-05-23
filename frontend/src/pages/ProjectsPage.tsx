import { Box, Button, Chip, Paper, Stack, Typography, useTheme } from "@mui/material";
import { ArrowOutwardRounded, CodeRounded, GitHub as GitHubIcon, Inventory2Rounded } from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { glassPanelSx } from "../components/Glass";
import { PublicPageLayout } from "../components/Layout";
import { contentApi } from "../services/content";
import { ModernLoader } from "../components/Loading";

export function ProjectsPage() {
  const theme = useTheme();
  const query = useQuery({ queryKey: ["projects"], queryFn: contentApi.projects });
  const projects = query.data ?? [];
  const tags = useMemo(() => Array.from(new Set(projects.flatMap((project) => project.tags))).slice(0, 8), [projects]);

  return (
    <PublicPageLayout maxWidth="lg" spacing={3} sx={{ py: { xs: 3, md: 5 } }}>
      <Paper
        elevation={0}
        sx={{
          ...glassPanelSx,
          p: { xs: 2.4, md: 4 },
          position: "relative",
          isolation: "isolate",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            zIndex: -1,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.18)}, ${alpha(
              theme.palette.secondary.main,
              0.12,
            )} 46%, transparent 72%)`,
          },
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems={{ xs: "flex-start", md: "flex-end" }} justifyContent="space-between">
          <Box sx={{ maxWidth: 680 }}>
            <Chip
              icon={<CodeRounded />}
              label="Projects"
              size="small"
              sx={{ mb: 1.6, borderRadius: 999, fontWeight: 900, bgcolor: alpha(theme.palette.primary.main, 0.12) }}
            />
            <Typography variant="h3" sx={{ fontWeight: 900, fontSize: { xs: "2rem", md: "3rem" }, lineHeight: 1.08 }}>
              正在维护的工具、实验和产品想法
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.9 }}>
              把可复用的工程经验沉淀成项目，也记录那些仍在迭代中的技术尝试。
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.4}>
            <Metric value={projects.length} label="项目" />
            <Metric value={tags.length} label="标签" />
          </Stack>
        </Stack>
        {tags.length > 0 && (
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 3 }}>
            {tags.map((tag) => (
              <Chip key={tag} label={tag} variant="outlined" size="small" sx={{ borderRadius: 999, fontWeight: 700 }} />
            ))}
          </Stack>
        )}
      </Paper>

      {query.isLoading && (
        <Paper sx={{ ...glassPanelSx, p: 4, display: "flex", justifyContent: "center" }}>
          <ModernLoader size={40} />
        </Paper>
      )}

      {!query.isLoading && projects.length === 0 && (
        <Paper sx={{ ...glassPanelSx, p: 4 }}>
          <Stack spacing={1} alignItems="center" textAlign="center">
            <Inventory2Rounded color="disabled" sx={{ fontSize: 46 }} />
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              暂无项目
            </Typography>
            <Typography color="text.secondary">后台添加项目后，这里会自动展示。</Typography>
          </Stack>
        </Paper>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 2.4 }}>
        {projects.map((project, index) => {
          const githubUrl = project.githubUrl ?? project.github_url ?? "";
          return (
            <Paper
              key={project.id}
              elevation={0}
              sx={{
                ...glassPanelSx,
                p: { xs: 2.2, md: 2.8 },
                minHeight: 260,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                minWidth: 0,
                "&::after": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  background: `linear-gradient(90deg, ${projectColors[index % projectColors.length].join(", ")})`,
                },
              }}
            >
              <Stack spacing={2.2}>
                <Stack direction="row" spacing={1.6} alignItems="center">
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: 2,
                      display: "grid",
                      placeItems: "center",
                      fontSize: 28,
                      fontWeight: 900,
                      background: alpha(projectColors[index % projectColors.length][0], 0.14),
                      color: projectColors[index % projectColors.length][0],
                      border: `1px solid ${alpha(projectColors[index % projectColors.length][0], 0.24)}`,
                      flexShrink: 0,
                    }}
                  >
                    {project.icon || project.name.slice(0, 1)}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.2 }} noWrap>
                      {project.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                      PROJECT #{String(index + 1).padStart(2, "0")}
                    </Typography>
                  </Box>
                </Stack>
                {project.description && (
                  <Typography color="text.secondary" sx={{ lineHeight: 1.85 }}>
                    {project.description}
                  </Typography>
                )}
                <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                  {project.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      sx={{ borderRadius: 999, bgcolor: alpha(theme.palette.primary.main, 0.1), fontWeight: 700 }}
                    />
                  ))}
                </Stack>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 3 }} spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  {githubUrl ? "开源仓库" : "内部迭代"}
                </Typography>
                {githubUrl && (
                  <Button
                    href={githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    startIcon={<GitHubIcon />}
                    endIcon={<ArrowOutwardRounded />}
                    variant="contained"
                    sx={{ borderRadius: 999, px: 2, flexShrink: 0 }}
                  >
                    GitHub
                  </Button>
                )}
              </Stack>
            </Paper>
          );
        })}
      </Box>
    </PublicPageLayout>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <Box sx={{ minWidth: 88, textAlign: "center" }}>
      <Typography sx={{ fontSize: { xs: "1.7rem", md: "2rem" }, fontWeight: 900, lineHeight: 1 }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900 }}>
        {label}
      </Typography>
    </Box>
  );
}

const projectColors = [
  ["#2563eb", "#14b8a6"],
  ["#db2777", "#f59e0b"],
  ["#7c3aed", "#22c55e"],
  ["#0891b2", "#f97316"],
];
