"use client";

import { DashboardCard } from "./DashboardCard";

type PriorityCard = {
  title: string;
  action: string;
  benefit: string;
};

const PRIORITIES: PriorityCard[] = [
  {
    title: "Recovery first",
    action: "Prioritize sleep and recovery before increasing physical or mental load.",
    benefit: "This will improve energy, resilience, and hormonal balance.",
  },
  {
    title: "Phase-aware training",
    action: "Adjust intensity based on your cycle phase when possible.",
    benefit: "This helps maintain consistency and reduce fatigue.",
  },
  {
    title: "Stress signals",
    action: "Monitor HRV and resting heart rate trends.",
    benefit: "This helps prevent overload and long-term burnout.",
  },
];

export function PrioritiesRightNow() {
  return (
    <section className="dashboard-section dashboard-shell" aria-labelledby="priorities-right-now-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="priorities-right-now-heading" className="text-[20px] font-semibold tracking-tight text-[var(--text-primary)]">
          Your priorities right now
        </h2>
        <div className="rounded-full border border-black/[0.10] bg-black/[0.02] px-3 py-1.5 text-[12px] font-semibold text-black/70">
          If you do only one thing this week: Improve sleep consistency
        </div>
      </div>
      <p className="mt-2 max-w-[70ch] text-[14px] leading-relaxed text-black/70">
        Focus on these to improve how you feel fastest.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRIORITIES.map((p) => (
          <DashboardCard key={p.title} as="div" hover={true} className="h-full p-5">
            <p className="text-[15px] font-semibold text-[var(--text-primary)]">
              {p.title}
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-black/75">
              <span className="font-medium text-black/80">Action:</span> {p.action}
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-black/70">
              <span className="font-medium text-black/80">Benefit:</span> {p.benefit}
            </p>
          </DashboardCard>
        ))}
      </div>
    </section>
  );
}

