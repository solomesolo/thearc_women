"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MonthCard } from "@/content/systemPageData";

type TimelineWithDetailRailProps = {
  months: MonthCard[];
  selectedIndex: number | null;
  onSelectIndex: (index: number | null) => void;
  onOpenTrace: (traceId: string) => void;
};

export function TimelineWithDetailRail({
  months,
  selectedIndex,
  onSelectIndex,
  onOpenTrace,
}: TimelineWithDetailRailProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onSelectIndex(selectedIndex > 0 ? selectedIndex - 1 : null);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onSelectIndex(selectedIndex < months.length - 1 ? selectedIndex + 1 : selectedIndex);
      } else if (e.key === "Escape") {
        onSelectIndex(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, months.length, onSelectIndex]);

  const selected = selectedIndex !== null ? months[selectedIndex] ?? null : null;

  return (
    <div className="w-full">
      <div ref={listRef} role="tablist" aria-label="Months" className="flex flex-wrap gap-2 justify-center md:justify-start">
        {months.map((m, i) => (
          <button
            key={m.label}
            type="button"
            role="tab"
            aria-selected={selectedIndex === i}
            aria-label={`Month ${m.label}`}
            tabIndex={selectedIndex === i || (selectedIndex === null && i === 0) ? 0 : -1}
            onClick={() => onSelectIndex(selectedIndex === i ? null : i)}
            className={`min-h-[44px] min-w-[44px] rounded-xl border px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)]/30 focus-visible:ring-offset-2 ${
              selectedIndex === i ? "border-[var(--text-primary)]/25 bg-[var(--color-surface)]/50 text-[var(--text-primary)]" : "border-black/10 text-black/80 hover:border-black/20"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {selected ? (
          <motion.div
            key={selected.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mt-6 rounded-xl border border-black/[0.06] bg-[var(--color-surface)]/30 p-4 overflow-visible"
            role="tabpanel"
          >
            <p className="text-sm leading-relaxed text-black/80">{selected.summary}</p>
            {selected.patternBullets.length > 0 && (
              <>
                <p className="mt-3 text-xs font-medium uppercase tracking-wider text-black/50">Patterns</p>
                <ul className="mt-1 space-y-0.5 text-sm text-black/80">
                  {selected.patternBullets.slice(0, 2).map((b, i) => (
                    <li key={i}>• {b}</li>
                  ))}
                </ul>
              </>
            )}
            {selected.watchNext.length > 0 && (
              <>
                <p className="mt-3 text-xs font-medium uppercase tracking-wider text-black/50">What to watch</p>
                <ul className="mt-1 space-y-0.5 text-sm text-black/80">
                  {selected.watchNext.slice(0, 2).map((w, i) => (
                    <li key={i}>• {w}</li>
                  ))}
                </ul>
              </>
            )}
            <button
              type="button"
              onClick={() => onOpenTrace(selected.traceId)}
              className="mt-4 rounded-lg border border-black/15 px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-black/[0.04]"
            >
              Show reasoning
            </button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6 flex min-h-[120px] items-center justify-center rounded-xl border border-dashed border-black/10 text-sm text-black/45">
            Select a month
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
