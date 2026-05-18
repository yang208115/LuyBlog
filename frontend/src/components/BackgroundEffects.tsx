import { Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { useSiteConfig } from "../context/SiteConfigProvider";

export function BackgroundEffects() {
  const theme = useTheme();
  const [index, setIndex] = useState(0);
  const siteConfig = useSiteConfig();
  const images = siteConfig.bgImages;

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % images.length);
    }, 10000);
    return () => window.clearInterval(timer);
  }, [images.length]);

  return (
    <Box aria-hidden sx={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
      {images.map((image, imageIndex) => (
        <Box
          key={image}
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: imageIndex === index ? 1 : 0,
            transform: imageIndex === index ? "scale(1.04)" : "scale(1)",
            transition: "opacity 2000ms ease, transform 9000ms ease",
            visibility:
              Math.abs(imageIndex - index) <= 1 || (imageIndex === images.length - 1 && index === 0) ? "visible" : "hidden",
          }}
        />
      ))}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(180deg, rgba(2,6,23,0.58), rgba(2,6,23,0.72))"
              : "linear-gradient(180deg, rgba(248,250,252,0.28), rgba(248,250,252,0.54))",
          backdropFilter: "blur(1px)",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: "-12%",
          right: "4%",
          width: { xs: 220, md: 360 },
          height: { xs: 220, md: 360 },
          borderRadius: "50%",
          background: alpha(theme.palette.primary.main, 0.18),
          filter: "blur(78px)",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: "2%",
          left: "4%",
          width: { xs: 200, md: 300 },
          height: { xs: 200, md: 300 },
          borderRadius: "50%",
          background: alpha(theme.palette.secondary.main, 0.16),
          filter: "blur(78px)",
        }}
      />
    </Box>
  );
}
