"use client";

import { DashboardCard } from "./DashboardCard";

type Trend = {
  title: string;
  detail: string;
  direction: "up" | "down" | "flat";
  note: string;
};

const TRENDS: Trend[] = [
  {
    title: "Sleep consistency",
    detail: "Slightly variable",
    direction: "flat",
    note: "Small shifts in timing are likely affecting energy.",
  },
  {
    title: "Recovery",
    detail: "Dip mid-week",
    direction: "down",
    note: "A recovery-first week may feel better by the end.",
  },
  {
    title: "Stress load",
    detail: "Worth attention",
    direction: "up",
    note: "Keeping activity light can protect sleep quality.",
  },
];

function Arrow({ dir }: { dir: Trend["direction"] }) {
  const label = dir === "up" ? "Up" : dir === "down" ? "Down" : "Stable";
  return (
    <span
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/[0.08] bg-black/[0.02] text-[12px] font-semibold text-black/60"
    >
      {dir === "up" ? "↗" : dir === "down" ? "↘" : "→"}
    </span>
  );
}

export function ProgressTrendsCard() {
  return (
    <section aria-label="Progress and trends">
      <DashboardCard as="article" hover={false}>
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-semibold tracking-tight text-[var(--text-primary)]">
              Progress & trends
            </h2>
            <p className="mt-2 max-w-[70ch] text-[14px] leading-relaxed text-black/70">
              A light snapshot of what’s moving, so you can stay ahead without over-tracking.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {TRENDS.map((t) => (
            <div
              key={t.title}
              className="rounded-[18px] border border-black/[0.08] bg-black/[0.015] p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                    {t.title}
                  </p>
                  <p className="mt-1 text-[13px] text-black/65">{t.detail}</p>
                </div>
                <Arrow dir={t.direction} />
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-black/70">
                {t.note}
              </p>
            </div>
          ))}
        </div>
      </DashboardCard>
    </section>
  );
}

