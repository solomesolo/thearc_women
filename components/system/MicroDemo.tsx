"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Signal = { id: string; label: string };
type Output = {
  checksFirst: string[];
  interacting: string[];
  track: string[];
};

type MicroDemoProps = {
  title?: string;
  signals: Signal[];
  outputs: Record<string, Output>;
};

export function MicroDemo({ signals, outputs }: MicroDemoProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const output = selectedId ? outputs[selectedId] : null;

  return (
    <div className="grid grid-cols-12 gap-8 md:gap-12">
      <div className="col-span-12 md:col-span-5">
        <p className="text-base font-medium text-[var(--text-primary)]">
          Pick a signal
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {signals.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedId(selectedId === s.id ? null : s.id)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                selectedId === s.id
                  ? "border-[var(--text-primary)]/40 bg-[var(--color-surface)] text-[var(--text-primary)]"
                  : "border-black/10 bg-[var(--background)] text-black/70 hover:border-black/20 hover:text-[var(--text-primary)]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="col-span-12 md:col-span-7">
        <p className="text-sm font-medium text-black/60">System interpretation</p>
        <AnimatePresence mode="wait">
          {output ? (
            <motion.div
              key={selectedId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 rounded-xl border border-black/10 bg-[var(--color-surface)]/30 p-5"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-black/50">
                What the system checks first
              </p>
              <ul className="mt-2 space-y-1 text-sm leading-relaxed text-black/80">
                {output.checksFirst.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
              <p className="mt-4 text-xs font-medium uppercase tracking-wider text-black/50">
                Possible interacting systems
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {output.interacting.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-black/10 bg-[var(--background)] px-2 py-1 text-xs font-medium text-[var(--text-primary)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-xs font-medium uppercase tracking-wider text-black/50">
                What you might track this week
              </p>
              <ul className="mt-2 space-y-1 text-sm leading-relaxed text-black/80">
                {output.track.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-4 flex min-h-[160px] items-center justify-center rounded-xl border border-dashed border-black/10 text-sm text-black/50"
            >
              Select a signal to see how the system interprets it
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
