import { Box, keyframes } from "@mui/material";
import { alpha } from "@mui/material/styles";

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(0.8); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 1; }
`;

export function ModernLoader({ size = 48 }: { size?: number }) {
  return (
    <Box sx={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* Outer spinning gradient ring */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          padding: "3px", // border thickness
          background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main}, transparent)`,
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          animation: `${spin} 1.2s linear infinite`,
        }}
      />
      {/* Inner pulsing dot */}
      <Box
        sx={{
          width: size * 0.35,
          height: size * 0.35,
          borderRadius: "50%",
          background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          boxShadow: (theme) => `0 0 16px ${alpha(theme.palette.primary.main, 0.6)}`,
          animation: `${pulse} 1.2s ease-in-out infinite`,
        }}
      />
    </Box>
  );
}
