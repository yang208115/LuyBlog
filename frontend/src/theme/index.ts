import { alpha, createTheme } from "@mui/material";
import "./types.ts";

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#2563eb",
    },
    secondary: {
      main: "#db2777",
    },
    background: {
      default: "#f8fafc",
      paper: "rgba(255, 255, 255, 0.86)",
    },
  },
  pageBackground: "transparent",
  appBar: {
    background: "rgba(255, 255, 255, 0.62)",
  },
  glass: {
    background: "rgba(255, 255, 255, 0.58)",
  },
  hero: {
    background: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(37, 99, 235, 0.18), hsla(0, 0%, 100%, 0))`,
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", "Helvetica Neue", Arial, sans-serif',
    button: {
      textTransform: "none",
      fontWeight: 700,
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
      main: "#60a5fa",
    },
    secondary: {
      main: "#f472b6",
    },
    background: {
      default: "#07111f",
      paper: "rgba(15, 23, 42, 0.88)",
    },
  },
  pageBackground: "transparent",
  appBar: {
    background: "rgba(7, 17, 31, 0.72)",
  },
  glass: {
    background: "rgba(15, 23, 42, 0.58)",
  },
  hero: {
    background: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(96, 165, 250, 0.28), hsla(0, 0%, 100%, 0))`,
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", "Helvetica Neue", Arial, sans-serif',
    button: {
      textTransform: "none",
      fontWeight: 700,
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
