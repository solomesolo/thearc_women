"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type LensId = "energy" | "stress" | "hormonal" | "recovery";

type LensData = {
  label: string;
  signalsDetected: string[];
  observesNext: string[];
  commonPatterns: string[];
};

type LensExplorerProps = {
  shortIntro: string;
  lenses: Record<LensId, LensData>;
};

const LENS_IDS: LensId[] = ["energy", "stress", "hormonal", "recovery"];

export function LensExplorer({ shortIntro, lenses }: LensExplorerProps) {
  const [activeLens, setActiveLens] = useState<LensId | null>(null);
  const selected = activeLens ? lenses[activeLens] : null;

  return (
    <div className="grid grid-cols-12 gap-8 md:gap-12">
      <div className="col-span-12 md:col-span-5">
        <p className="text-base leading-relaxed text-black/70 md:text-lg">
          {shortIntro}
        </p>
        <p className="mt-4 text-sm font-medium text-black/60">Select a lens</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {LENS_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveLens(activeLens === id ? null : id)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                activeLens === id
                  ? "border-[var(--text-primary)]/40 bg-[var(--color-surface)] text-[var(--text-primary)]"
                  : "border-black/10 bg-[var(--background)] text-black/70 hover:border-black/20 hover:text-[var(--text-primary)]"
              }`}
            >
              {lenses[id].label}
            </button>
          ))}
        </div>
      </div>
      <div className="col-span-12 md:col-span-7">
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={activeLens}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0, 0, 0.2, 1] }}
              className="rounded-xl border border-black/10 bg-[var(--color-surface)]/30 p-5"
            >
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                {selected.label}
              </h3>
              <div className="mt-4 grid gap-6 sm:grid-cols-1 md:grid-cols-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-black/50">
                    Signals the system detects
                  </p>
                  <ul className="mt-2 space-y-1 text-sm leading-relaxed text-black/80">
                    {selected.signalsDetected.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-black/50">
                    What the system observes next
                  </p>
                  <ul className="mt-2 space-y-1 text-sm leading-relaxed text-black/80">
                    {selected.observesNext.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-black/50">
                    Common patterns
                  </p>
                  <ul className="mt-2 space-y-1 text-sm leading-relaxed text-black/80">
                    {selected.commonPatterns.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-black/10 text-sm text-black/50"
            >
              Select a lens to see what the system detects and observes
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
