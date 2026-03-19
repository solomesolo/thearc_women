"use client";

import type { TrackingSignal } from "@/types/dashboard";

type TrackingSignalsPanelProps = {
  signals: TrackingSignal[];
  onUpdateSignals: () => void;
};

export function TrackingSignalsPanel({
  signals,
  onUpdateSignals,
}: TrackingSignalsPanelProps) {
  return (
    <section className="dashboard-section dashboard-shell" aria-labelledby="tracking-signals-heading">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 id="tracking-signals-heading" className="text-[17px] font-semibold text-[var(--text-primary)]">
          Trackable signals
        </h2>
        <button
          type="button"
          onClick={onUpdateSignals}
          className="inline-flex h-9 items-center justify-center rounded-lg bg-black/90 px-4 text-sm font-medium text-white transition-opacity hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2"
        >
          Update signals
        </button>
      </div>
      <p className="mt-1 max-w-[680px] text-[14px] leading-relaxed text-black/70">
        Track these to improve your baseline.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {signals.map((s) => (
          <button
            key={s.id}
            type="button"
            className="rounded-full border border-black/[0.10] bg-black/[0.02] px-3 py-1.5 text-[14px] text-black/75 transition-colors hover:border-black/[0.16] hover:bg-black/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2 active:bg-black/[0.06]"
          >
            {s.label}
          </button>
        ))}
      </div>
    </section>
  );
}
