"use client";

import { DashboardCard } from "./DashboardCard";

export function TodayThisWeekCard() {
  return (
    <DashboardCard
      as="section"
      hover={false}
      className="min-h-[320px]"
      aria-label="Today and this week"
    >
      <div className="flex h-full flex-col">
        {/* Header area */}
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wider text-black/55">
            TODAY&apos;S CONTEXT
          </p>
          <p className="mt-2 text-[18px] font-semibold tracking-tight text-[var(--text-primary)]">
            Cycle day 19 · Luteal phase
          </p>
          <p className="mt-2 max-w-[70ch] text-[14px] leading-relaxed text-black/70">
            This week, you may feel slightly lower energy and higher sensitivity to stress.
          </p>
        </div>

        {/* Two-column insights area */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p className="text-[13px] font-semibold text-[var(--text-primary)]">
              What’s typical for you in this phase
            </p>
            <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-black/75">
              <li>More fatigue mid-week</li>
              <li>Slightly lighter sleep</li>
              <li>Higher stress sensitivity</li>
            </ul>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[var(--text-primary)]">
              What to expect this week
            </p>
            <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-black/75">
              <li>Recovery may matter more than intensity</li>
              <li>Sleep timing will have a bigger effect on energy</li>
              <li>A lighter schedule may feel better by the end of the week</li>
            </ul>
          </div>
        </div>

        {/* Bottom action strip */}
        <div className="mt-auto pt-6">
          <div className="rounded-[18px] border border-black/[0.08] bg-black/[0.02] p-5">
            <p className="text-[13px] font-semibold text-[var(--text-primary)]">
              Today’s focus
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                "Keep activity light",
                "Prioritize recovery",
                "Aim for consistent sleep timing",
              ].map((pill) => (
                <span
                  key={pill}
                  className="inline-flex items-center rounded-full border border-black/[0.10] bg-[var(--background)] px-3 py-1.5 text-[13px] font-medium text-black/70"
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

