"use client";

import { useState } from "react";
import { DashboardCard } from "./DashboardCard";

type Pattern = {
  title: string;
  body: string;
  technical: string;
};

const PATTERNS: Pattern[] = [
  {
    title: "Sleep disruption pattern",
    body: "Your responses suggest that sleep variability may be influencing energy and recovery.",
    technical: "CL_SLEEP_DISRUPT",
  },
  {
    title: "Stress-recovery pattern",
    body: "Periods of higher stress appear to coincide with lower recovery.",
    technical: "CL_STRESS_RECOVERY",
  },
  {
    title: "Cycle-energy pattern",
    body: "Energy changes may be following a cycle-related rhythm rather than appearing randomly.",
    technical: "CL_CYCLE_ENERGY",
  },
];

export function UnderlyingPatternsAdvanced() {
  const [open, setOpen] = useState(false);
  const [showTech, setShowTech] = useState(false);

  return (
    <section className="dashboard-section dashboard-shell" aria-labelledby="underlying-patterns-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="underlying-patterns-heading" className="text-[18px] font-semibold tracking-tight text-[var(--text-primary)]">
            Underlying patterns (advanced)
          </h2>
          <p className="mt-2 max-w-[70ch] text-[14px] leading-relaxed text-black/70">
            These are deeper patterns detected in your data. You do not need to review these unless you want more detail.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="rounded-lg px-3 py-2 text-[13px] font-semibold text-black/70 hover:bg-black/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2"
        >
          {open ? "Hide" : "View"}
        </button>
      </div>

      {open ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowTech((v) => !v)}
            className="text-[13px] font-medium text-black/65 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2 rounded"
          >
            Show technical labels
          </button>

          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PATTERNS.map((p) => (
              <DashboardCard key={p.title} hover={false} className="p-5">
                <p className="text-[15px] font-semibold text-[var(--text-primary)]">
                  {p.title}
                </p>
                <p className="mt-2 text-[14px] leading-relaxed text-black/75">
                  {p.body}
                </p>
                {showTech ? (
                  <p className="mt-3 text-[12px] font-semibold text-black/45">
                    {p.technical}
                  </p>
                ) : null}
              </DashboardCard>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

