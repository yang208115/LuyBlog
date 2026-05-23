import { alpha, createTheme } from "@mui/material";
import "./types.ts";

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#18181b", // Zinc 900
      light: "#3f3f46", // Zinc 700
      dark: "#09090b", // Zinc 950
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#f43f5e", // Rose 500
      light: "#fb7185", // Rose 400
      dark: "#e11d48", // Rose 600
      contrastText: "#ffffff",
    },
    background: {
      default: "#fafafa", // Zinc 50
      paper: "rgba(255, 255, 255, 0.7)",
    },
    divider: "rgba(24, 24, 27, 0.08)",
  },
  pageBackground: "transparent",
  appBar: {
    background: "rgba(250, 250, 250, 0.6)",
  },
  glass: {
    background: "rgba(255, 255, 255, 0.6)",
  },
  hero: {
    background: `radial-gradient(circle at 50% 0%, rgba(24, 24, 27, 0.04) 0%, transparent 70%)`,
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily:
      '"Plus Jakarta Sans", "Outfit", "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif',
    h1: { fontFamily: '"Outfit", "PingFang SC", sans-serif', fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontFamily: '"Outfit", "PingFang SC", sans-serif', fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontFamily: '"Outfit", "PingFang SC", sans-serif', fontWeight: 700, letterSpacing: '-0.01em' },
    h4: { fontFamily: '"Outfit", "PingFang SC", sans-serif', fontWeight: 600 },
    h5: { fontFamily: '"Outfit", "PingFang SC", sans-serif', fontWeight: 600 },
    h6: { fontFamily: '"Outfit", "PingFang SC", sans-serif', fontWeight: 600 },
    button: {
      textTransform: "none",
      fontWeight: 600,
      letterSpacing: '0.01em',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: "none",
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        "*": {
          scrollbarWidth: "thin",
          scrollbarColor: `${alpha("#64748b", 0.42)} transparent`,
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
          backgroundColor: alpha("#64748b", 0.28),
          border: "3px solid transparent",
          borderRadius: 999,
        },
        "*::-webkit-scrollbar-thumb:hover": {
          backgroundColor: alpha("#64748b", 0.48),
        },
        "*::-webkit-scrollbar-corner": {
          backgroundColor: "transparent",
        },
      },
    },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#fafafa", // Zinc 50
      light: "#ffffff", // White
      dark: "#f4f4f5", // Zinc 100
      contrastText: "#18181b",
    },
    secondary: {
      main: "#fb7185", // Rose 400
      light: "#fda4af", // Rose 300
      dark: "#f43f5e", // Rose 500
      contrastText: "#18181b",
    },
    background: {
      default: "#09090b", // Zinc 950
      paper: "rgba(24, 24, 27, 0.7)", // Zinc 900 with opacity
    },
    divider: "rgba(255, 255, 255, 0.08)",
  },
  pageBackground: "transparent",
  appBar: {
    background: "rgba(9, 9, 11, 0.6)",
  },
  glass: {
    background: "rgba(24, 24, 27, 0.6)",
  },
  hero: {
    background: `radial-gradient(circle at 50% 0%, rgba(250, 250, 250, 0.05) 0%, transparent 70%)`,
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily:
      '"Plus Jakarta Sans", "Outfit", "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif',
    h1: { fontFamily: '"Outfit", "PingFang SC", sans-serif', fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontFamily: '"Outfit", "PingFang SC", sans-serif', fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontFamily: '"Outfit", "PingFang SC", sans-serif', fontWeight: 700, letterSpacing: '-0.01em' },
    h4: { fontFamily: '"Outfit", "PingFang SC", sans-serif', fontWeight: 600 },
    h5: { fontFamily: '"Outfit", "PingFang SC", sans-serif', fontWeight: 600 },
    h6: { fontFamily: '"Outfit", "PingFang SC", sans-serif', fontWeight: 600 },
    button: {
      textTransform: "none",
      fontWeight: 600,
      letterSpacing: '0.01em',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: "none",
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        "*": {
          scrollbarWidth: "thin",
          scrollbarColor: `${alpha("#cbd5e1", 0.36)} transparent`,
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
          backgroundColor: alpha("#cbd5e1", 0.24),
          border: "3px solid transparent",
          borderRadius: 999,
        },
        "*::-webkit-scrollbar-thumb:hover": {
          backgroundColor: alpha("#cbd5e1", 0.42),
        },
        "*::-webkit-scrollbar-corner": {
          backgroundColor: "transparent",
        },
      },
    },
  },
});
