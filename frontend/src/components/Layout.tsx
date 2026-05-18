import { Box, Container, Stack, Typography } from "@mui/material";
import type { ContainerProps, SxProps, Theme } from "@mui/material";
import { ReactNode } from "react";
import { SectionPanel } from "./Glass";

type PublicPageLayoutProps = {
  maxWidth?: ContainerProps["maxWidth"];
  spacing?: number;
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  centered?: boolean;
  children: ReactNode;
  sx?: SxProps<Theme>;
};

export function PublicPageLayout({
  maxWidth = "lg",
  spacing = 2.4,
  title,
  subtitle,
  actions,
  centered = false,
  children,
  sx,
}: PublicPageLayoutProps) {
  const hasHeader = title || subtitle || actions;

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        py: { xs: 3, md: 4.5 },
        pb: { xs: 18, md: 14 },
        ...sx,
      }}
    >
      <Container maxWidth={maxWidth}>
        <Stack spacing={spacing} alignItems={centered ? "center" : "stretch"}>
          {hasHeader && (
            <SectionPanel>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                alignItems={{ xs: "flex-start", md: "center" }}
                justifyContent="space-between"
              >
                <Box sx={{ minWidth: 0 }}>
                  {title && (
                    <Typography
                      variant="h3"
                      component="h1"
                      sx={{
                        fontWeight: 900,
                        fontSize: { xs: "1.9rem", md: "2.35rem" },
                        lineHeight: 1.12,
                      }}
                    >
                      {title}
                    </Typography>
                  )}
                  {subtitle && (
                    <Typography color="text.secondary" sx={{ mt: title ? 1 : 0, lineHeight: 1.8 }}>
                      {subtitle}
                    </Typography>
                  )}
                </Box>
                {actions && (
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ flexShrink: 0 }}>
                    {actions}
                  </Stack>
                )}
              </Stack>
            </SectionPanel>
          )}
          {children}
        </Stack>
      </Container>
    </Box>
  );
}

export function CenteredStateLayout({ children }: { children: ReactNode }) {
  return (
    <PublicPageLayout maxWidth="sm" centered sx={{ display: "flex", alignItems: "center" }}>
      <Box sx={{ width: "100%" }}>{children}</Box>
    </PublicPageLayout>
  );
}

export function AdminWorkspaceLayout({
  children,
  sx,
}: {
  children: ReactNode;
  sx?: SxProps<Theme>;
}) {
  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        bgcolor: (theme) => (theme.palette.mode === "dark" ? "#07111f" : "#f6f8fb"),
        backgroundImage: (theme) =>
          theme.palette.mode === "dark"
            ? "linear-gradient(180deg, rgba(15, 23, 42, 0.94), rgba(7, 17, 31, 1) 260px)"
            : "linear-gradient(180deg, rgba(248, 250, 252, 1), rgba(241, 245, 249, 1) 260px)",
        pb: { xs: 3, md: 0 },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
