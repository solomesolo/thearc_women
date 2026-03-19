"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type StrategyDetail = {
  id: string;
  title: string;
  relevanceLine: string;
  tags: string[];
  why: string[];
  tryThisWeek: string[];
  mayImprove: string[];
  trackSignals: string[];
  lookDeeper: string;
  relatedIds: string[];
};

export function StrategyDetailDrawer({
  open,
  detail,
  relatedLookup,
  onClose,
  onUseAsFocus,
  onAddTracking,
  onPrepareDoctor,
  onOpenRelated,
  currentFocusId,
}: {
  open: boolean;
  detail: StrategyDetail | null;
  relatedLookup: (id: string) => { id: string; title: string } | null;
  onClose: () => void;
  onUseAsFocus: () => void;
  onAddTracking: () => void;
  onPrepareDoctor: () => void;
  onOpenRelated: (id: string) => void;
  currentFocusId: string | null;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && detail ? (
        <motion.div
          className="fixed inset-0 z-[90]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/20"
            aria-label="Close"
            onClick={onClose}
          />

          <motion.aside
            className="absolute right-0 top-0 h-full w-full bg-[var(--background)] shadow-[0_10px_40px_rgba(12,12,12,0.18)] sm:w-[460px] lg:w-[520px]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.22 }}
            role="dialog"
            aria-modal="true"
            aria-label="Strategy details"
          >
            {/* Sticky header */}
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-black/5 bg-[var(--background)] px-6 py-5">
              <div className="min-w-0">
                <p className="text-[20px] font-semibold tracking-tight text-[var(--text-primary)]">
                  {detail.title}
                </p>
                {currentFocusId === detail.id ? (
                  <p className="mt-1 text-[12px] font-semibold text-black/55">
                    Current focus
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.10] bg-black/[0.02] text-[14px] font-semibold text-black/70 hover:bg-black/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Scrollable body */}
            <div className="h-[calc(100%-112px)] overflow-y-auto px-6 pb-28 pt-6">
              {/* Relevance block */}
              <div className="rounded-[18px] border border-black/[0.08] bg-black/[0.02] p-5">
                <p className="text-[15px] leading-relaxed text-black/80">
                  {detail.relevanceLine}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {detail.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-black/[0.10] bg-[var(--background)] px-3 py-1.5 text-[12px] font-semibold text-black/65"
                    >
                      {t}
                    </span>
                  ))}
                  <span className="rounded-full border border-black/[0.10] bg-[var(--background)] px-3 py-1.5 text-[12px] font-semibold text-black/65">
                    This week’s priority
                  </span>
                </div>
              </div>

              <div className="mt-7 space-y-7">
                <Section title="Why this may help right now" items={detail.why} />
                <Section title="What to try this week" items={detail.tryThisWeek} />
                <Section title="What may improve if this helps" items={detail.mayImprove} />

                <div>
                  <p className="text-[13px] font-semibold uppercase tracking-wider text-black/55">
                    Track these signals
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {detail.trackSignals.map((s) => (
                      <span
                        key={s}
                        className="rounded-full border border-black/[0.10] bg-black/[0.02] px-3 py-1.5 text-[13px] font-medium text-black/70"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={onAddTracking}
                    className="mt-4 inline-flex rounded-xl border border-black/[0.12] bg-[var(--background)] px-4 py-2.5 text-[13px] font-semibold text-black/75 hover:bg-black/[0.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2"
                  >
                    Add these to my tracked signals
                  </button>
                </div>

                <div>
                  <p className="text-[13px] font-semibold uppercase tracking-wider text-black/55">
                    When to look deeper
                  </p>
                  <p className="mt-3 text-[15px] leading-relaxed text-black/75">
                    {detail.lookDeeper}
                  </p>
                  <button
                    type="button"
                    onClick={onPrepareDoctor}
                    className="mt-4 inline-flex rounded-lg text-[13px] font-medium text-black/65 underline-offset-2 hover:text-black/80 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2"
                  >
                    Prepare questions for my doctor
                  </button>
                </div>

                <div>
                  <p className="text-[13px] font-semibold uppercase tracking-wider text-black/55">
                    You may also want to explore
                  </p>
                  <div className="mt-3 space-y-2">
                    {detail.relatedIds.map((id) => {
                      const r = relatedLookup(id);
                      if (!r) return null;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => onOpenRelated(id)}
                          className="flex w-full items-center justify-between gap-3 rounded-[14px] border border-black/[0.08] bg-black/[0.015] px-4 py-3 text-left text-[14px] font-medium text-black/75 hover:bg-black/[0.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2"
                        >
                          <span className="min-w-0">{r.title}</span>
                          <span className="text-black/40">→</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky footer */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-black/5 bg-[var(--background)] px-6 py-4 shadow-[0_-8px_24px_rgba(12,12,12,0.06)]">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onUseAsFocus}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-black/90 px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2"
                >
                  Use this as my focus
                </button>
                <button
                  type="button"
                  onClick={onAddTracking}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-black/[0.12] bg-[var(--background)] px-4 text-[13px] font-semibold text-black/75 hover:bg-black/[0.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2"
                >
                  Add these to tracking
                </button>
              </div>
              <button
                type="button"
                onClick={onPrepareDoctor}
                className="mt-3 text-[13px] font-medium text-black/60 underline-offset-2 hover:text-black/80 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2 rounded"
              >
                Prepare questions for my doctor
              </button>
            </div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-[13px] font-semibold uppercase tracking-wider text-black/55">
        {title}
      </p>
      <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-black/75">
        {items.map((x) => (
          <li key={x} className="flex gap-2">
            <span className="text-black/35">•</span>
            <span className="min-w-0">{x}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

