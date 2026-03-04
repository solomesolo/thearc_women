"use client";

import { useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef } from "react";

const RADAR_R = 38;
const LABEL_R = 52;
const SEGMENTS = 6;
const ANGLE_STEP = (2 * Math.PI) / SEGMENTS;
const START_ANGLE = -Math.PI / 2;

type Domain = {
  id: string;
  label: string;
  whyItMatters: string;
  signals: string[];
  patterns: string;
};

type PreventiveRadarProps = {
  shortIntro: string;
  domains: Domain[];
};

function wedgePath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const large = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

export function PreventiveRadar({ shortIntro, domains }: PreventiveRadarProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  const active = activeId ? domains.find((d) => d.id === activeId) : null;

  if (domains.length !== SEGMENTS) {
    return null;
  }

  return (
    <div ref={ref} className="grid grid-cols-12 gap-8 md:gap-12">
      <div className="col-span-12 md:col-span-5">
        <p className="text-base leading-relaxed text-black/70 md:text-lg">
          {shortIntro}
        </p>
      </div>
      <div className="col-span-12 md:col-span-7 flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
        <div className="relative flex min-h-[280px] w-full shrink-0 items-center justify-center md:min-h-0 md:w-[260px]">
          <svg
            viewBox="0 0 100 100"
            className="h-[240px] w-[240px] md:h-[260px] md:w-[260px]"
            aria-hidden
          >
            {/* Outer circle — more visible stroke */}
            <circle
              cx="50"
              cy="50"
              r={RADAR_R}
              fill="none"
              stroke="rgba(0,0,0,0.15)"
              strokeWidth="1.2"
            />
            {/* 6 segment wedges */}
            {domains.map((d, i) => {
              const start = START_ANGLE + i * ANGLE_STEP;
              const end = start + ANGLE_STEP;
              const isActive = activeId === d.id;
              const dPath = wedgePath(50, 50, RADAR_R, start, end);
              return (
                <g key={d.id}>
                  <path
                    d={dPath}
                    fill={isActive ? "rgba(0,0,0,0.06)" : "transparent"}
                    stroke={isActive ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.15)"}
                    strokeWidth={isActive ? "1.8" : "1"}
                    onMouseEnter={() => setActiveId(d.id)}
                    onMouseLeave={() => setActiveId(null)}
                    onClick={() => setActiveId(activeId === d.id ? null : d.id)}
                    style={{ cursor: "pointer" }}
                  />
                </g>
              );
            })}
          </svg>
          {/* Labels outside radar */}
          {domains.map((d, i) => {
            const angle = START_ANGLE + (i + 0.5) * ANGLE_STEP;
            const x = 50 + LABEL_R * Math.cos(angle);
            const y = 50 + LABEL_R * Math.sin(angle);
            const isActive = activeId === d.id;
            return (
              <motion.span
                key={d.id}
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                className={`pointer-events-none absolute text-[10px] font-medium leading-tight md:text-[11px] ${
                  isActive ? "text-[var(--text-primary)]" : "text-black/60"
                }`}
                style={{
                  left: "50%",
                  top: "50%",
                  transform: `translate(calc(-50% + ${(x - 50) * 2.6}px), calc(-50% + ${(y - 50) * 2.6}px))`,
                }}
              >
                {d.label}
              </motion.span>
            );
          })}
        </div>

        {/* Panel: below radar on mobile, right on desktop — same order for both */}
        <AnimatePresence mode="wait">
          {active ? (
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0, 0, 0.2, 1] }}
              className="w-full rounded-xl border border-black/[0.06] bg-[var(--color-surface)]/30 p-5 md:max-w-[320px] md:self-start"
            >
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                {active.label}
              </h3>
              <p className="mt-3 text-xs font-medium uppercase tracking-wider text-black/50">
                Why it matters
              </p>
              <p className="mt-1 text-sm leading-relaxed text-black/80">
                {active.whyItMatters}
              </p>
              <p className="mt-4 text-xs font-medium uppercase tracking-wider text-black/50">
                Signals the system monitors
              </p>
              <ul className="mt-1 space-y-0.5 text-sm leading-relaxed text-black/80">
                {active.signals.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
              <p className="mt-4 text-xs font-medium uppercase tracking-wider text-black/50">
                Early patterns
              </p>
              <p className="mt-1 text-sm leading-relaxed text-black/80">
                {active.patterns}
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex min-h-[120px] w-full max-w-[320px] items-center justify-center rounded-xl border border-dashed border-black/10 py-8 text-center text-sm text-black/50"
            >
              Select a domain to see how the system monitors it
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
