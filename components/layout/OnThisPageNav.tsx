"use client";

import { useState, useEffect } from "react";

type Item = { id: string; label: string };

type OnThisPageNavProps = {
  items: Item[];
  className?: string;
};

export function OnThisPageNav({ items, className = "" }: OnThisPageNavProps) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    const els = items.map(({ id }) => document.getElementById(id)).filter(Boolean);
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setActiveId(e.target.id);
            break;
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );

    els.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      aria-label="On this page"
      className={`hidden lg:block sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto ${className}`}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-black/50">
        On this page
      </p>
      <ul className="mt-3 space-y-1.5">
        {items.map(({ id, label }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className={`block py-1 text-sm transition-colors ${
                activeId === id
                  ? "font-medium text-[var(--text-primary)]"
                  : "text-black/60 hover:text-[var(--text-primary)]"
              }`}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
