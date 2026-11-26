import { ChevronDown, List } from "lucide-react";
import { useEffect, useState } from "react";
import type { TocItem } from "@/shared/types";

export function ArticleToc({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (items.length === 0) return;
    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -65% 0px", threshold: 0.1 },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <>
      {/* 移动端折叠目录 */}
      <div className="mb-6 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--border-strong)]"
        >
          <span className="inline-flex items-center gap-2">
            <List className="h-4 w-4 text-[var(--sakura)]" />
            <span className="font-editorial">目录</span>
            <span className="font-mono text-xs text-[var(--muted-soft)] tabular-nums">({items.length})</span>
          </span>
          <ChevronDown
            className={`h-4 w-4 text-[var(--muted)] transition-transform ${mobileOpen ? "rotate-180" : ""}`}
          />
        </button>
        {mobileOpen && (
          <nav
            className="mt-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3"
            aria-label="文章目录"
          >
            <ul className="space-y-1 text-sm">
              {items.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={() => setMobileOpen(false)}
                    className={`block rounded-lg px-2.5 py-1.5 transition-colors ${
                      item.depth === 3 ? "pl-5 text-xs" : ""
                    } ${
                      activeId === item.id
                        ? "bg-[var(--sakura-soft)] font-medium text-[var(--sakura)]"
                        : "text-[var(--muted)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      {/* 桌面端留白粘性目录 */}
      <aside className="hidden lg:block">
        <div className="max-h-[calc(100vh-7.5rem)] overflow-y-auto pr-1">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <p className="flex items-center gap-2 font-editorial text-sm font-semibold text-[var(--ink)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--sakura)]" aria-hidden="true" />
              目录
            </p>
            <span className="font-mono text-[11px] text-[var(--muted-soft)] tabular-nums">
              {String(items.length).padStart(2, "0")} 节
            </span>
          </div>
          <nav aria-label="文章目录">
            <ul className="space-y-1.5 border-l border-[var(--border)] text-sm">
              {items.map((item) => {
                const isActive = activeId === item.id;
                return (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className={`block py-1 leading-snug transition-colors ${
                        item.depth === 3 ? "pl-5 text-xs" : "pl-3 text-[13px]"
                      } ${
                        isActive
                          ? "-ml-px border-l-2 border-l-[var(--sakura)] font-medium text-[var(--ink)]"
                          : "text-[var(--muted)] hover:text-[var(--ink)]"
                      }`}
                    >
                      {item.text}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
}
