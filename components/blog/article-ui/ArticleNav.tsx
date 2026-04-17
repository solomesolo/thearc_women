"use client";

/**
 * ArticleNav — sticky section navigation for article pages.
 *
 * Desktop: sticky horizontal pill bar below the hero.
 *          Sticks to top when scrolled past the hero.
 * Mobile:  horizontally scrollable pills row in the flow (not sticky).
 *
 * Active section is tracked via IntersectionObserver.
 * Each pill scrolls to the section anchor on click.
 */

import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";

type NavSection = {
  sectionIndex: number;
  title: string | null;
};

type ArticleNavProps = {
  sections: NavSection[];
};

export function ArticleNav({ sections }: ArticleNavProps) {
  const [activeIndex, setActiveIndex] = useState<number>(
    sections[0]?.sectionIndex ?? 1
  );
  const pillsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sections.length === 0) return;

    const ids = sections.map((s) => `section-${s.sectionIndex}`);
    const els = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the topmost visible section
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          const id = visible[0].target.id;
          const idx = Number(id.replace("section-", ""));
          if (!Number.isNaN(idx)) setActiveIndex(idx);
        }
      },
      {
        rootMargin: "-60px 0px -40% 0px",
        threshold: 0,
      }
    );

    for (const el of els) observer.observe(el);
    return () => observer.disconnect();
  }, [sections]);

  // Scroll the active pill into view when activeIndex changes (mobile)
  useEffect(() => {
    const container = pillsRef.current;
    if (!container) return;
    const pill = container.querySelector<HTMLElement>(
      `[data-idx="${activeIndex}"]`
    );
    if (pill) {
      pill.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }
  }, [activeIndex]);

  if (sections.length === 0) return null;

  function scrollToSection(idx: number) {
    const el = document.getElementById(`section-${idx}`);
    if (!el) return;
    const offset = 88; // nav bar height + buffer
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
    setActiveIndex(idx);
  }

  return (
    <nav
      aria-label="Article sections"
      /* Sticky on desktop, static on mobile.
         top-[65px] assumes ~64px main site header. Adjust if header height changes. */
      className="sticky top-[65px] z-30 -mx-4 sm:-mx-6 lg:-mx-8 mb-8 border-b border-black/[0.07] bg-[rgba(250,250,249,0.92)] backdrop-blur-md"
    >
      {/* Inner wrapper: scrollable row */}
      <div
        ref={pillsRef}
        className="flex items-center gap-1 overflow-x-auto px-4 py-2.5 sm:px-6 lg:px-8 scrollbar-none"
        style={{ scrollbarWidth: "none" }}
      >
        {sections.map((s) => {
          const isActive = activeIndex === s.sectionIndex;
          const label = s.title ?? `Section ${s.sectionIndex}`;
          return (
            <button
              key={s.sectionIndex}
              data-idx={s.sectionIndex}
              type="button"
              onClick={() => scrollToSection(s.sectionIndex)}
              className={clsx(
                "shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 whitespace-nowrap",
                isActive
                  ? "bg-black/90 text-white shadow-sm"
                  : "text-black/55 hover:bg-black/[0.06] hover:text-black/80"
              )}
              aria-current={isActive ? "true" : undefined}
            >
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
