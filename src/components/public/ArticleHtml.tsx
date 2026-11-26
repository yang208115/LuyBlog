import { useEffect, useRef } from "react";

export function ArticleHtml({ html, className = "" }: { html: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const btn = target?.closest<HTMLButtonElement>(".code-copy-btn");
      if (!btn) return;
      const block = btn.closest(".code-block");
      const code = block?.querySelector("pre code")?.textContent ?? "";
      if (!code) return;

      void navigator.clipboard.writeText(code).then(() => {
        const original = btn.textContent || "复制";
        btn.textContent = "已复制";
        window.setTimeout(() => {
          btn.textContent = original;
        }, 1600);
      });
    };

    root.addEventListener("click", handleClick);
    return () => root.removeEventListener("click", handleClick);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`prose-article ${className}`}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML is sanitized server-side via rehype-sanitize
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
