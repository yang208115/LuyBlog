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
          className="astral-card flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--ink)]"
        >
          <span className="inline-flex items-center gap-2">
            <List className="h-4 w-4 text-[var(--accent)]" />
            文章目录（{items.length}）
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${mobileOpen ? "rotate-180" : ""}`} />
        </button>
        {mobileOpen && (
          <nav className="astral-card mt-2 rounded-xl p-3" aria-label="文章目录">
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
                        ? "bg-[var(--accent-soft)] font-medium text-[var(--accent)]"
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

      {/* 桌面端粘性目录 */}
      <aside className="hidden lg:block">
        <div className="astral-card max-h-[calc(100vh-7.5rem)] overflow-y-auto rounded-2xl p-4">
          <p className="mb-3 flex items-center gap-2 font-mono text-xs font-semibold tracking-wider text-[var(--muted)] uppercase">
            <List className="h-3.5 w-3.5 text-[var(--accent)]" />
            On This Page
          </p>
          <nav aria-label="文章目录">
            <ul className="space-y-1 border-l border-[var(--border)] pl-3 text-sm">
              {items.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className={`block rounded-r-lg py-1 transition-colors ${
                      item.depth === 3 ? "pl-3 text-xs" : "text-[13px]"
                    } ${
                      activeId === item.id
                        ? "font-medium text-[var(--accent)]"
                        : "text-[var(--muted)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
}
