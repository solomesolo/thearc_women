"use client";

import { useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef } from "react";

type Domain = {
  id: string;
  label: string;
  whyItMatters: string;
  signals: string[];
  monitoring: string;
};

type PreventiveRadarProps = {
  shortIntro: string;
  domains: Domain[];
};

export function PreventiveRadar({ shortIntro, domains }: PreventiveRadarProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  const active = activeId
    ? domains.find((d) => d.id === activeId)
    : null;

  const n = domains.length;
  const angleStep = (2 * Math.PI) / n;

  return (
    <div ref={ref} className="grid grid-cols-12 gap-8 md:gap-12">
      <div className="col-span-12 md:col-span-5">
        <p className="text-base leading-relaxed text-black/70 md:text-lg">
          {shortIntro}
        </p>
      </div>
      <div className="col-span-12 md:col-span-7 flex flex-col md:flex-row gap-6 items-start">
        <div className="relative flex h-[240px] w-full min-w-[240px] items-center justify-center md:w-[260px]">
          <svg
            viewBox="0 0 100 100"
            className="absolute h-full w-full max-h-[240px] text-black/10"
            aria-hidden
          >
            <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="0.3" />
            {domains.map((d, i) => {
              const angle = -Math.PI / 2 + i * angleStep;
              const r = 42;
              const x = 50 + r * Math.cos(angle);
              const y = 50 + r * Math.sin(angle);
              return (
                <line
                  key={d.id}
                  x1="50"
                  y1="50"
                  x2={x}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="0.4"
                />
              );
            })}
          </svg>
          {domains.map((d, i) => {
            const angle = -90 + (360 / n) * i;
            const isActive = activeId === d.id;
            const rad = (angle * Math.PI) / 180;
            const r = 42;
            const x = 50 + r * Math.cos(rad);
            const y = 50 + r * Math.sin(rad);
            return (
              <motion.button
                key={d.id}
                type="button"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3, delay: i * 0.05, ease: [0, 0, 0.2, 1] }}
                onClick={() => setActiveId(activeId === d.id ? null : d.id)}
                onMouseEnter={() => setActiveId(d.id)}
                onMouseLeave={() => setActiveId(null)}
                className={`absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-[10px] font-medium leading-tight transition-all hover:scale-[1.02] ${
                  isActive
                    ? "bg-[var(--text-primary)] text-[var(--background)]"
                    : "bg-[var(--color-surface)] text-[var(--text-primary)] hover:bg-black/10"
                }`}
                style={{
                  transform: `translate(-50%, -50%) translate(${(x - 50) * 2.6}px, ${(y - 50) * 2.6}px)`,
                }}
              >
                {d.label.split(" ")[0]}
              </motion.button>
            );
          })}
        </div>
        <AnimatePresence mode="wait">
          {active ? (
            <motion.div
              key={active.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="w-full rounded-xl border border-black/10 bg-[var(--color-surface)]/30 p-4 md:max-w-[280px]"
            >
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                {active.label}
              </h3>
              <p className="mt-2 text-xs font-medium uppercase tracking-wider text-black/50">
                Why it matters
              </p>
              <p className="mt-1 text-sm leading-relaxed text-black/80">
                {active.whyItMatters}
              </p>
              <p className="mt-3 text-xs font-medium uppercase tracking-wider text-black/50">
                What signals matter
              </p>
              <ul className="mt-1 space-y-0.5 text-sm leading-relaxed text-black/80">
                {active.signals.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs font-medium uppercase tracking-wider text-black/50">
                Monitoring
              </p>
              <p className="mt-1 text-sm leading-relaxed text-black/80">
                {active.monitoring}
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="hidden min-h-[160px] w-full max-w-[280px] items-center justify-center rounded-xl border border-dashed border-black/10 text-sm text-black/50 md:flex"
            >
              Hover a domain
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
