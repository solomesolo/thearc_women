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
      <div className="mt-4 flex flex-wrap gap-2">
        {signals.map((s) => (
          <span
            key={s.id}
            className="rounded-full border border-black/[0.10] bg-black/[0.02] px-3 py-1.5 text-[14px] text-black/75"
          >
            {s.label}
          </span>
        ))}
      </div>
    </section>
  );
}
