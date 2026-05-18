import { Paper } from "@mui/material";
import type { PaperProps, SxProps, Theme } from "@mui/material";
import type { ResponsiveStyleValue } from "@mui/system";

export const glassPanelSx: SxProps<Theme> = {
  borderRadius: 3,
  backgroundColor: (theme) => theme.glass.background,
  backdropFilter: "blur(18px) saturate(180%)",
  WebkitBackdropFilter: "blur(18px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.32)",
  boxShadow: "0 22px 60px rgba(15,23,42,0.22)",
  overflow: "hidden",
  transition: "transform 450ms ease, box-shadow 450ms ease, border-color 450ms ease",
  "&:hover": {
    transform: "translateY(-4px) scale(1.01)",
    borderColor: "rgba(255,255,255,0.52)",
    boxShadow: "0 28px 76px rgba(15,23,42,0.28)",
  },
};

export const glassCardSx: SxProps<Theme> = {
  borderRadius: 2,
  backgroundColor: (theme) => theme.glass.background,
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: (theme) => `1px solid ${theme.palette.divider}`,
  boxShadow: (theme) =>
    `0 8px 28px ${theme.palette.mode === "dark" ? "rgba(0,0,0,0.24)" : "rgba(15,23,42,0.07)"}`,
};

export const interactiveGlassCardSx: SxProps<Theme> = {
  ...glassCardSx,
  transition: "transform 250ms ease, box-shadow 250ms ease, border-color 250ms ease",
  "&:hover": {
    transform: "translateY(-2px)",
    borderColor: (theme) => theme.palette.primary.main,
    boxShadow: (theme) =>
      `0 14px 34px ${theme.palette.mode === "dark" ? "rgba(96,165,250,0.2)" : "rgba(37,99,235,0.18)"}`,
  },
};

export function SectionPanel({
  interactive = false,
  padding = { xs: 2.2, md: 3 },
  sx,
  children,
  ...props
}: PaperProps & {
  interactive?: boolean;
  padding?: ResponsiveStyleValue<number | string>;
}) {
  const baseSx = interactive ? interactiveGlassCardSx : glassCardSx;

  return (
    <Paper
      elevation={0}
      variant="outlined"
      sx={[baseSx, { p: padding }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
      {...props}
    >
      {children}
    </Paper>
  );
}
