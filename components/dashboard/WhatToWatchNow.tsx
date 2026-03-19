"use client";

import { DashboardCard } from "./DashboardCard";

type WatchCard = {
  title: string;
  body: string;
  why: string;
};

const WATCH: WatchCard[] = [
  {
    title: "Recovery & HRV",
    body: "Track recovery score and HRV to understand how your body responds to stress and rest.",
    why: "Low recovery can lead to fatigue and slower progress.",
  },
  {
    title: "Sleep quality",
    body: "Sleep consistency directly affects energy, hormones, and recovery.",
    why: "Improving sleep is often the fastest way to improve overall balance.",
  },
  {
    title: "Energy & cycle",
    body: "Track energy patterns across your cycle to understand normal versus unusual changes.",
    why: "Energy fluctuations often reflect sleep, stress, and hormonal shifts.",
  },
];

export function WhatToWatchNow() {
  return (
    <section className="dashboard-section dashboard-shell" aria-labelledby="what-to-watch-heading">
      <h2 id="what-to-watch-heading" className="text-[20px] font-semibold tracking-tight text-[var(--text-primary)]">
        What to watch now
      </h2>
      <p className="mt-2 max-w-[70ch] text-[14px] leading-relaxed text-black/70">
        These areas are worth paying attention to because they can influence how you feel before they become bigger issues.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {WATCH.map((c) => (
          <DashboardCard key={c.title} as="div" className="h-full p-5">
            <p className="text-[15px] font-semibold text-[var(--text-primary)]">
              {c.title}
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-black/75">
              {c.body}
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-black/65">
              <span className="font-medium text-black/75">Why it matters:</span>{" "}
              {c.why}
            </p>
            <button
              type="button"
              className="mt-4 inline-flex rounded-lg px-3 py-2 text-[13px] font-medium text-black/70 hover:bg-black/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2"
            >
              Track this
            </button>
          </DashboardCard>
        ))}
      </div>
    </section>
  );
}

