"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

type TimelineEvent = { month: number; signals: string[] };

type HealthMemoryTimelineProps = {
  shortIntro: string;
  timelineEvents: TimelineEvent[];
};

export function HealthMemoryTimeline({
  shortIntro,
  timelineEvents,
}: HealthMemoryTimelineProps) {
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const [tappedMonth, setTappedMonth] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const eventsByMonth = Object.fromEntries(
    timelineEvents.map((e) => [e.month, e])
  );
  const activeMonth = hoveredMonth ?? tappedMonth;
  const activeData = activeMonth ? eventsByMonth[activeMonth] : null;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setTappedMonth(null);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="grid grid-cols-12 gap-8 md:gap-12">
      <div className="col-span-12 md:col-span-5">
        <p className="text-base leading-relaxed text-black/70 md:text-lg">
          {shortIntro}
        </p>
      </div>
      <div className="col-span-12 md:col-span-7">
        <div className="flex items-center gap-2 overflow-x-auto pb-4 pt-2">
          {[1, 2, 3, 4, 5, 6].map((month, i) => {
            const isActive = activeMonth === month;
            return (
              <motion.button
                key={month}
                type="button"
                initial={{ opacity: 0, y: 6 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                transition={{
                  duration: 0.3,
                  delay: i * 0.06,
                  ease: [0, 0, 0.2, 1],
                }}
                onMouseEnter={() => setHoveredMonth(month)}
                onMouseLeave={() => setHoveredMonth(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  setTappedMonth(tappedMonth === month ? null : month);
                }}
                className={`relative flex shrink-0 flex-col items-center rounded-xl border px-4 py-3 transition-colors ${
                  isActive
                    ? "border-[var(--text-primary)]/30 bg-[var(--color-surface)]/50"
                    : "border-black/10 bg-[var(--color-surface)]/30 hover:border-black/20"
                }`}
              >
                <span className="text-xs font-medium uppercase tracking-wider text-black/60">
                  Month {month}
                </span>
              </motion.button>
            );
          })}
        </div>
        <AnimatePresence mode="wait">
          {activeData ? (
            <motion.div
              key={activeMonth}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="rounded-xl border border-black/10 bg-[var(--background)] p-4"
            >
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Month {activeData.month}
              </p>
              <ul className="mt-2 space-y-1 text-sm leading-relaxed text-black/80">
                {activeData.signals.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
