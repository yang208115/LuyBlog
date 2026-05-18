import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { defaultSiteConfig, normalizeSiteConfig, SiteConfig } from "../config/siteConfig";

const SiteConfigContext = createContext<SiteConfig>(defaultSiteConfig);

async function fetchSiteConfig(): Promise<SiteConfig> {
  const response = await fetch("/api/site-config");
  if (!response.ok) throw new Error("加载站点配置失败");
  return normalizeSiteConfig(await response.json());
}

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>(defaultSiteConfig);

  useEffect(() => {
    let cancelled = false;
    fetchSiteConfig()
      .then((value) => {
        if (!cancelled) setConfig(value);
      })
      .catch(() => {
        if (!cancelled) setConfig(defaultSiteConfig);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => config, [config]);
  return <SiteConfigContext.Provider value={value}>{children}</SiteConfigContext.Provider>;
}

export function useSiteConfig() {
  return useContext(SiteConfigContext);
}
