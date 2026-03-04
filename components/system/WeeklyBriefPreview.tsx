"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Tab = { id: string; label: string };
type WeeklyBriefPreviewProps = {
  shortIntro: string;
  tabs: Tab[];
  patterns: {
    notice: string;
    bullets: string[];
    interpretation: string;
  };
  interactions: { pairs: { a: string; b: string }[] };
  research: { example: string; whatItMeans: string };
};

export function WeeklyBriefPreview({
  shortIntro,
  tabs,
  patterns,
  interactions,
  research,
}: WeeklyBriefPreviewProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? "patterns");

  return (
    <div className="grid grid-cols-12 gap-8 md:gap-12">
      <div className="col-span-12 md:col-span-4">
        <p className="text-base leading-relaxed text-black/70 md:text-lg">
          {shortIntro}
        </p>
        <div
          className="mt-6 flex flex-col gap-1"
          role="tablist"
          aria-label="Brief sections"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-[var(--color-surface)] text-[var(--text-primary)]"
                  : "text-black/70 hover:bg-black/5 hover:text-[var(--text-primary)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="col-span-12 md:col-span-8">
        <AnimatePresence mode="wait">
          {activeTab === "patterns" && (
            <motion.div
              key="patterns"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="rounded-xl border border-black/10 bg-[var(--color-surface)]/30 p-5"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-black/50">
                Example output
              </p>
              <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">
                {patterns.notice}
              </p>
              <ul className="mt-2 space-y-1 text-sm leading-relaxed text-black/80">
                {patterns.bullets.map((b, i) => (
                  <li key={i}>• {b}</li>
                ))}
              </ul>
              <p className="mt-4 text-sm font-medium text-[var(--text-primary)]">
                Interpretation
              </p>
              <p className="mt-1 text-sm leading-relaxed text-black/80">
                {patterns.interpretation}
              </p>
            </motion.div>
          )}
          {activeTab === "interactions" && (
            <motion.div
              key="interactions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="rounded-xl border border-black/10 bg-[var(--color-surface)]/30 p-5"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-black/50">
                System interactions
              </p>
              <p className="mt-3 text-sm text-black/80">
                Each connection is clickable in the full brief.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {interactions.pairs.map((pair, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-[var(--background)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--text-primary)]/30 hover:shadow-sm"
                  >
                    <span>{pair.a}</span>
                    <span className="text-black/40" aria-hidden>↔</span>
                    <span>{pair.b}</span>
                  </span>
                ))}
              </div>
            </motion.div>
          )}
          {activeTab === "research" && (
            <motion.div
              key="research"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="rounded-xl border border-black/10 bg-[var(--color-surface)]/30 p-5"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-black/50">
                Research insight
              </p>
              <p className="mt-3 text-sm leading-relaxed text-black/80 italic">
                {research.example}
              </p>
              <p className="mt-4 text-sm font-medium text-[var(--text-primary)]">
                What this means
              </p>
              <p className="mt-1 text-sm leading-relaxed text-black/80">
                {research.whatItMeans}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
