"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type SignalTypeId = "wearable" | "labs" | "symptoms" | "research";

type InterpretationEntry = {
  inputs: string[];
  systems: string[];
  systemsLabel?: string;
  observation?: string;
  observationLabel?: string;
  context?: string;
};

type DataInterpretationDemoProps = {
  narrative: string[];
  signalTypes: { id: SignalTypeId; label: string }[];
  interpretationData: Record<SignalTypeId, InterpretationEntry>;
};

export function DataInterpretationDemo({
  narrative,
  signalTypes,
  interpretationData,
}: DataInterpretationDemoProps) {
  const [activeSignalType, setActiveSignalType] =
    useState<SignalTypeId | null>(null);

  const data = activeSignalType
    ? interpretationData[activeSignalType]
    : null;

  return (
    <div className="grid grid-cols-12 gap-8 md:gap-12">
      <div className="col-span-12 md:col-span-5">
        <div className="space-y-3 text-base leading-relaxed text-black/70 md:text-lg">
          {narrative.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </div>
      <div className="col-span-12 md:col-span-7">
        <p className="text-sm font-medium text-black/60">
          Select a signal type
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {signalTypes.map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() =>
                setActiveSignalType(activeSignalType === st.id ? null : st.id)
              }
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                activeSignalType === st.id
                  ? "border-[var(--text-primary)]/40 bg-[var(--color-surface)] text-[var(--text-primary)]"
                  : "border-black/10 bg-[var(--background)] text-black/70 hover:border-black/20 hover:text-[var(--text-primary)]"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          {data ? (
            <motion.div
              key={activeSignalType}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
              className="mt-6 rounded-[14px] border border-black/[0.06] bg-[var(--color-surface)]/30 p-6"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-black/50">
                Input signals
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {data.inputs.map((s, i) => (
                  <span
                    key={i}
                    className="rounded-md border border-black/10 bg-[var(--background)] px-2.5 py-1 text-sm text-[var(--text-primary)]"
                  >
                    {s}
                  </span>
                ))}
              </div>
              {(data.systems.length > 0 || data.systemsLabel) && (
                <>
                  <p className="mt-5 text-xs font-medium uppercase tracking-wider text-black/50">
                    {data.systemsLabel ?? "System interpretation"}
                  </p>
                  {data.systems.length > 0 && (
                <ul className="mt-2 space-y-1 text-sm leading-relaxed text-black/80">
                  {data.systems.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
                  )}
                </>
              )}
              {(data.observation ?? data.context) && (
                <>
                  <p className="mt-5 text-xs font-medium uppercase tracking-wider text-black/50">
                    {data.observationLabel ??
                      (data.context
                        ? "Context matters"
                        : "Suggested observation")}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-black/80">
                    {data.observation ?? data.context}
                  </p>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-6 flex min-h-[200px] items-center justify-center rounded-[14px] border border-dashed border-black/10 text-sm text-black/50"
            >
              Select a signal type to see how the system interprets it
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
