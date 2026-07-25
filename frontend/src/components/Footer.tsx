import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useSiteConfig } from "../context/SiteConfigProvider";

function formatUptime(buildDate: string) {
  const start = new Date(buildDate || "2026-03-23T00:00:00").getTime();
  const elapsed = Math.max(0, Date.now() - start);
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;
  return `${Math.floor(elapsed / day)}天 ${Math.floor((elapsed % day) / hour)}小时`;
}

export function Footer() {
  const siteConfig = useSiteConfig();
  const location = useLocation();
  const [time, setTime] = useState("00:00:00");
  const [uptime, setUptime] = useState(() => formatUptime(siteConfig.buildDate));

  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
      setUptime(formatUptime(siteConfig.buildDate));
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [siteConfig.buildDate]);

  return (
    <footer className="legacy-footer-wrap">
      {location.pathname === "/" && (
        <section className="site-status-strip" aria-label="站点运行状态">
          <time className="footer-clock">{time}</time>
          <div className="footer-status-main">
            <strong><i />系统已稳定运行：<span>{uptime}</span></strong>
            <div className="footer-badges">
              {siteConfig.footerBadges.map((badge) => (
                <span key={badge.name}>{badge.name}</span>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="legacy-footer-bar">
        <small>© {new Date().getFullYear()} {siteConfig.title}. Built with Cloudflare.</small>
        <nav aria-label="页脚链接">
          {siteConfig.social.github && (
            <a href={siteConfig.social.github} target="_blank" rel="noopener noreferrer">GitHub</a>
          )}
          {siteConfig.social.demo && (
            <a href={siteConfig.social.demo} target="_blank" rel="noopener noreferrer">Demo</a>
          )}
          <a href="https://cloudflare.com" target="_blank" rel="noopener noreferrer">Cloudflare</a>
          {siteConfig.icpConfig && (
            <a href={siteConfig.icpConfig.link} target="_blank" rel="noopener noreferrer">{siteConfig.icpConfig.name}</a>
          )}
        </nav>
      </div>
    </footer>
  );
}
