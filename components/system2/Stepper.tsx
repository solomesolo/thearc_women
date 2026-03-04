"use client";

import { motion, AnimatePresence } from "framer-motion";

export type Step = {
  id: string;
  label: string;
  intro: string;
  bullets: string[];
  exampleTraceId?: string;
};

type StepperProps = {
  steps: Step[];
  activeId: string;
  onStepChange: (id: string) => void;
  onExampleTrace?: (traceId: string) => void;
  className?: string;
};

export function Stepper({
  steps,
  activeId,
  onStepChange,
  onExampleTrace,
  className = "",
}: StepperProps) {
  const active = steps.find((s) => s.id === activeId) ?? steps[0];

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label="Pipeline steps"
        className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-1 border-b border-black/10 pb-4"
      >
        {steps.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={activeId === s.id}
            onClick={() => onStepChange(s.id)}
            className={
              activeId === s.id
                ? "min-h-[44px] rounded-lg px-4 py-2 text-sm font-medium bg-black/8 text-[var(--text-primary)]"
                : "min-h-[44px] rounded-lg px-4 py-2 text-sm font-medium text-black/60 hover:bg-black/[0.04]"
            }
          >
            <span className="text-black/40 mr-2">{i + 1}.</span>
            {s.label}
          </button>
        ))}
      </div>
      <div className="mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-base leading-relaxed text-black/80">{active.intro}</p>
            <ul className="mt-3 space-y-1 text-sm text-black/75">
              {active.bullets.map((b, i) => (
                <li key={i}>• {b}</li>
              ))}
            </ul>
            {active.exampleTraceId && onExampleTrace && (
              <button
                type="button"
                onClick={() => onExampleTrace(active.exampleTraceId!)}
                className="mt-4 rounded-lg border border-black/15 px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-black/[0.04]"
              >
                Example
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
