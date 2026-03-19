"use client";

import { DashboardCard } from "./DashboardCard";

export function WeeklyInsightsSummary() {
  return (
    <section className="dashboard-section dashboard-shell" aria-labelledby="weekly-summary-heading">
      <h2 id="weekly-summary-heading" className="text-[20px] font-semibold tracking-tight text-[var(--text-primary)]">
        What we’re seeing in your last 7 days
      </h2>
      <p className="mt-2 max-w-[70ch] text-[14px] leading-relaxed text-black/70">
        A quick read on recent changes so you can understand what feels normal and what may need attention.
      </p>

      <DashboardCard hover={false} className="mt-4 border-black/[0.08] bg-black/[0.015] p-6">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-black/55">
          Highlights
        </p>
        <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-black/75">
          <li className="flex gap-2">
            <span className="text-black/35">•</span>
            <span>Recovery dipped slightly mid-week</span>
          </li>
          <li className="flex gap-2">
            <span className="text-black/35">•</span>
            <span>Sleep variability increased</span>
          </li>
          <li className="flex gap-2">
            <span className="text-black/35">•</span>
            <span>Energy was lower on higher-stress days</span>
          </li>
        </ul>

        <div className="mt-5 rounded-[14px] border border-black/[0.08] bg-[var(--background)] p-5">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-black/55">
            What this likely means
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-black/75">
            These changes are common in this phase of your cycle and are usually not a concern. They may improve with more consistent sleep and recovery.
          </p>
        </div>
      </DashboardCard>
    </section>
  );
}

