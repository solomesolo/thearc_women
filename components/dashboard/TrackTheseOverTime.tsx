"use client";

import { useMemo, useState } from "react";
import { clsx } from "clsx";

type Chip = {
  id: string;
  label: string;
  recommended?: boolean;
};

const CHIPS: Chip[] = [
  { id: "sleep-consistency", label: "Sleep consistency", recommended: true },
  { id: "recovery-hrv", label: "Recovery / HRV", recommended: true },
  { id: "energy", label: "Energy", recommended: true },
  { id: "cycle-symptoms", label: "Cycle symptoms" },
  { id: "resting-hr", label: "Resting heart rate" },
  { id: "mood-stress", label: "Mood / stress load" },
];

export function TrackTheseOverTime() {
  const recommendedSet = useMemo(
    () => new Set(CHIPS.filter((c) => c.recommended).map((c) => c.id)),
    []
  );
  const [selected, setSelected] = useState<Set<string>>(() => new Set(recommendedSet));

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section className="dashboard-section dashboard-shell" aria-labelledby="track-over-time-heading">
      <h2 id="track-over-time-heading" className="text-[20px] font-semibold tracking-tight text-[var(--text-primary)]">
        Track these over time
      </h2>
      <p className="mt-2 max-w-[70ch] text-[14px] leading-relaxed text-black/70">
        These signals will help you understand whether your baseline is improving and what may be influencing your health.
      </p>
      <p className="mt-3 max-w-[70ch] text-[14px] leading-relaxed text-black/75">
        Tracking a few signals consistently is often more useful than tracking everything.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {CHIPS.map((c) => {
          const isOn = selected.has(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              className={clsx(
                "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[14px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2",
                isOn
                  ? "border-black/[0.16] bg-black/[0.04] text-black/85"
                  : "border-black/[0.10] bg-black/[0.02] text-black/70 hover:bg-black/[0.04]"
              )}
            >
              <span>{c.label}</span>
              {c.recommended ? (
                <span className="rounded-full border border-black/[0.10] bg-[var(--background)] px-2 py-0.5 text-[11px] font-semibold text-black/60">
                  Recommended starting set
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <p className="mt-4 max-w-[70ch] text-[13px] leading-relaxed text-black/65">
        Start with sleep, recovery, and energy if you want the clearest picture with the least effort.
      </p>
    </section>
  );
}

