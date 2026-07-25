import { alpha, createTheme, type PaletteMode } from "@mui/material";
import "./types.ts";

const displayFont = '"SF Pro Rounded", "Outfit", "PingFang SC", "Microsoft YaHei", ui-rounded, system-ui, sans-serif';
const bodyFont =
  '"Plus Jakarta Sans", "PingFang SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

function createLuyTheme(mode: PaletteMode) {
  const dark = mode === "dark";
  const primary = dark ? "#aab6ff" : "#5f6fdd";
  const secondary = dark ? "#ff8fae" : "#d94778";
  const paper = dark ? "rgba(12, 21, 43, 0.72)" : "rgba(249, 252, 255, 0.72)";
  const divider = dark ? "rgba(218, 230, 255, 0.15)" : "rgba(33, 56, 98, 0.14)";

  return createTheme({
    palette: {
      mode,
      primary: {
        main: primary,
        light: dark ? "#c9d0ff" : "#7f8cf1",
        dark: dark ? "#7d89ee" : "#4656c8",
        contrastText: dark ? "#0a1020" : "#ffffff",
      },
      secondary: {
        main: secondary,
        light: dark ? "#ffb7ca" : "#eb729a",
        dark: dark ? "#e86f96" : "#bc2f60",
        contrastText: "#ffffff",
      },
      background: {
        default: dark ? "#08101f" : "#dbe8ff",
        paper,
      },
      text: {
        primary: dark ? "#f7f9ff" : "#18223d",
        secondary: dark ? "#a8b5d0" : "#53617d",
      },
      divider,
      success: { main: dark ? "#70e0c8" : "#16856f" },
      warning: { main: dark ? "#ffd27a" : "#b77716" },
      error: { main: dark ? "#ff8cae" : "#c93e65" },
      info: { main: dark ? "#79d8ff" : "#247ca8" },
    },
    pageBackground: "transparent",
    appBar: {
      background: dark ? "rgba(7, 14, 29, 0.72)" : "rgba(245, 249, 255, 0.7)",
    },
    glass: {
      background: paper,
    },
    hero: {
      background: dark
        ? "linear-gradient(135deg, rgba(255,255,255,.11), transparent 45%), rgba(10,18,38,.54)"
        : "linear-gradient(135deg, rgba(255,255,255,.56), transparent 45%), rgba(245,249,255,.54)",
    },
    shape: {
      borderRadius: 18,
    },
    typography: {
      fontFamily: bodyFont,
      h1: { fontFamily: displayFont, fontWeight: 900, letterSpacing: "-0.045em" },
      h2: { fontFamily: displayFont, fontWeight: 900, letterSpacing: "-0.035em" },
      h3: { fontFamily: displayFont, fontWeight: 900, letterSpacing: "-0.03em" },
      h4: { fontFamily: displayFont, fontWeight: 850, letterSpacing: "-0.025em" },
      h5: { fontFamily: displayFont, fontWeight: 800, letterSpacing: "-0.02em" },
      h6: { fontFamily: displayFont, fontWeight: 800, letterSpacing: "-0.015em" },
      body1: { lineHeight: 1.78 },
      body2: { lineHeight: 1.68 },
      overline: { fontWeight: 800, letterSpacing: "0.14em", fontSize: "0.68rem" },
      button: {
        textTransform: "none",
        fontWeight: 800,
        letterSpacing: "0.01em",
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            scrollBehavior: "smooth",
          },
          body: {
            minWidth: 320,
            backgroundColor: dark ? "#08101f" : "#dbe8ff",
          },
          "::selection": {
            color: "#ffffff",
            backgroundColor: alpha(secondary, 0.72),
          },
          "*": {
            scrollbarWidth: "thin",
            scrollbarColor: `${alpha(dark ? "#cbd5e1" : "#64748b", 0.34)} transparent`,
          },
          "*::-webkit-scrollbar": {
            width: 10,
            height: 10,
          },
          "*::-webkit-scrollbar-track": {
            backgroundColor: "transparent",
          },
          "*::-webkit-scrollbar-thumb": {
            backgroundClip: "content-box",
            backgroundColor: alpha(dark ? "#cbd5e1" : "#64748b", 0.28),
            border: "3px solid transparent",
            borderRadius: 999,
          },
          "@media (prefers-reduced-motion: reduce)": {
            "*, *::before, *::after": {
              scrollBehavior: "auto !important",
              animationDuration: "0.01ms !important",
              animationIterationCount: "1 !important",
              transitionDuration: "0.01ms !important",
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            borderColor: divider,
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            minHeight: 40,
            borderRadius: 12,
          },
          containedPrimary: {
            color: "#ffffff",
            background: dark
              ? "linear-gradient(135deg, #7589f7, #df68a1)"
              : "linear-gradient(135deg, #5668dc, #cf4f82)",
            boxShadow: `0 12px 30px ${alpha(primary, 0.24)}`,
            "&:hover": {
              background: dark
                ? "linear-gradient(135deg, #8496ff, #eb78ae)"
                : "linear-gradient(135deg, #6374e7, #d85b8d)",
              boxShadow: `0 15px 38px ${alpha(primary, 0.32)}`,
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            border: `1px solid ${divider}`,
            backgroundColor: alpha(paper, 0.45),
            backdropFilter: "blur(16px) saturate(150%)",
            "&:hover": {
              backgroundColor: alpha(primary, 0.14),
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 13,
            backgroundColor: dark ? "rgba(4, 11, 29, 0.28)" : "rgba(255, 255, 255, 0.38)",
            transition: "border-color 200ms ease, box-shadow 200ms ease",
            "&.Mui-focused": {
              boxShadow: `0 0 0 3px ${alpha(primary, 0.14)}`,
            },
          },
          notchedOutline: {
            borderColor: divider,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            fontWeight: 750,
            backdropFilter: "blur(12px)",
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            border: `1px solid ${divider}`,
            borderRadius: 24,
            backgroundColor: dark ? "rgba(12, 21, 43, 0.94)" : "rgba(249, 252, 255, 0.94)",
            boxShadow: dark ? "0 30px 90px rgba(0,5,24,.52)" : "0 30px 90px rgba(35,54,100,.22)",
            backdropFilter: "blur(32px) saturate(160%)",
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: divider,
          },
          head: {
            color: dark ? "#7887a8" : "#5f6d88",
            fontSize: "0.72rem",
            fontWeight: 850,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            backdropFilter: "blur(16px)",
          },
        },
      },
    },
  });
}

export const lightTheme = createLuyTheme("light");
export const darkTheme = createLuyTheme("dark");
