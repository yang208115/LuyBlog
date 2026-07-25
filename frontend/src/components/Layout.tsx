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
        py: { xs: 3.5, md: 5.5 },
        pb: { xs: 18, md: 14 },
        ...sx,
      }}
    >
      <Container maxWidth={maxWidth}>
        <Stack spacing={spacing} alignItems={centered ? "center" : "stretch"}>
          {hasHeader && (
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2.5}
              alignItems={{ xs: "flex-start", md: "flex-end" }}
              justifyContent="space-between"
              sx={{
                mb: 1,
                pb: { xs: 2.5, md: 3.5 },
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="overline" color="secondary.light">
                  YUNYANG&apos;S DIGITAL GARDEN
                </Typography>
                {title && (
                  <Typography
                    variant="h2"
                    component="h1"
                    sx={{
                      mt: 0.6,
                      fontSize: { xs: "2.25rem", md: "3.25rem" },
                      lineHeight: 1.05,
                    }}
                  >
                    {title}
                  </Typography>
                )}
                {subtitle && (
                  <Typography color="text.secondary" sx={{ mt: title ? 1.2 : 0, maxWidth: 720, lineHeight: 1.8 }}>
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

export function AdminWorkspaceLayout({ children, sx }: { children: ReactNode; sx?: SxProps<Theme> }) {
  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        bgcolor: (theme) => (theme.palette.mode === "dark" ? "#07101e" : "#edf3ff"),
        backgroundImage: (theme) =>
          theme.palette.mode === "dark"
            ? "radial-gradient(circle at 82% 8%, rgba(107,99,255,.14), transparent 32%), radial-gradient(circle at 18% 92%, rgba(57,209,203,.08), transparent 32%), linear-gradient(180deg,#0b1325 0,#07101e 420px,#070e1b 100%)"
            : "radial-gradient(circle at 82% 8%, rgba(107,99,255,.11), transparent 32%), linear-gradient(180deg,#f3f7ff 0,#eaf1ff 420px,#edf3ff 100%)",
        pb: { xs: 3, md: 0 },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
