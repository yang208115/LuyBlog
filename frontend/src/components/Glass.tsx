import { Paper } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { PaperProps, SxProps, Theme } from "@mui/material";
import type { ResponsiveStyleValue } from "@mui/system";

export const glassPanelSx: SxProps<Theme> = {
  borderRadius: 3.5,
  backgroundColor: (theme) => theme.glass.background,
  backgroundImage: (theme) =>
    theme.palette.mode === "dark"
      ? "linear-gradient(145deg, rgba(255,255,255,.09), transparent 48%)"
      : "linear-gradient(145deg, rgba(255,255,255,.52), transparent 48%)",
  backdropFilter: "blur(26px) saturate(160%)",
  WebkitBackdropFilter: "blur(26px) saturate(160%)",
  border: (theme) => `1px solid ${theme.palette.mode === "dark" ? "rgba(223,234,255,.18)" : "rgba(255,255,255,.66)"}`,
  boxShadow: (theme) =>
    theme.palette.mode === "dark"
      ? "0 24px 72px rgba(0,5,24,.32), inset 0 1px 0 rgba(255,255,255,.09)"
      : "0 24px 72px rgba(35,54,100,.18), inset 0 1px 0 rgba(255,255,255,.55)",
  overflow: "hidden",
  transition: "transform 450ms ease, box-shadow 450ms ease, border-color 450ms ease",
  "&:hover": {
    transform: "translateY(-3px)",
    borderColor: (theme) => alpha(theme.palette.primary.main, 0.48),
    boxShadow: (theme) =>
      theme.palette.mode === "dark"
        ? "0 30px 86px rgba(0,5,24,.42), inset 0 1px 0 rgba(255,255,255,.14)"
        : "0 30px 86px rgba(35,54,100,.24), inset 0 1px 0 rgba(255,255,255,.72)",
  },
};

export const glassCardSx: SxProps<Theme> = {
  borderRadius: 3,
  backgroundColor: (theme) => theme.glass.background,
  backgroundImage: (theme) =>
    theme.palette.mode === "dark"
      ? "linear-gradient(145deg, rgba(255,255,255,.07), transparent 48%)"
      : "linear-gradient(145deg, rgba(255,255,255,.45), transparent 48%)",
  backdropFilter: "blur(22px) saturate(155%)",
  WebkitBackdropFilter: "blur(22px) saturate(155%)",
  border: (theme) => `1px solid ${theme.palette.divider}`,
  boxShadow: (theme) =>
    theme.palette.mode === "dark"
      ? "0 18px 54px rgba(1,7,29,.24), inset 0 1px 0 rgba(255,255,255,.07)"
      : "0 18px 54px rgba(35,54,100,.13), inset 0 1px 0 rgba(255,255,255,.46)",
};

export const interactiveGlassCardSx: SxProps<Theme> = {
  ...glassCardSx,
  transition: "transform 250ms ease, box-shadow 250ms ease, border-color 250ms ease",
  "&:hover": {
    transform: "translateY(-3px)",
    borderColor: (theme) => alpha(theme.palette.primary.main, 0.5),
    boxShadow: (theme) =>
      `0 20px 48px ${theme.palette.mode === "dark" ? "rgba(82,100,220,.24)" : "rgba(37,62,155,.2)"}`,
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
