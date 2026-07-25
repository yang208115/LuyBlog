import { useEffect, useMemo, useState } from "react";
import { useSiteConfig } from "../context/SiteConfigProvider";

const fallbackBackground = "/anime-night-studio.png";

function cssUrl(value: string) {
  return `url(${JSON.stringify(value)})`;
}

export function BackgroundEffects() {
  const siteConfig = useSiteConfig();
  const [index, setIndex] = useState(0);
  const images = useMemo(
    () => Array.from(new Set(siteConfig.bgImages.map((image) => image.trim()).filter(Boolean))),
    [siteConfig.bgImages],
  );

  useEffect(() => {
    setIndex(0);
  }, [images]);

  useEffect(() => {
    const activeImage = images[index] || fallbackBackground;
    document.documentElement.style.setProperty("--site-background-image", cssUrl(activeImage));
    return () => {
      document.documentElement.style.removeProperty("--site-background-image");
    };
  }, [images, index]);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % images.length);
    }, 10_000);
    return () => window.clearInterval(timer);
  }, [images.length]);

  return null;
}
