"use client";

import type { WeeklyInsight } from "@/types/dashboard";
import { DashboardCard } from "./DashboardCard";

type WeeklyBiologicalInsightsProps = {
  insights: WeeklyInsight[];
  onOpenTrace?: (traceId: string) => void;
};

export function WeeklyBiologicalInsights({
  insights,
  onOpenTrace,
}: WeeklyBiologicalInsightsProps) {
  if (insights.length === 0) return null;

  const primary = insights[0]!;

  return (
    <section className="dashboard-section dashboard-shell" aria-labelledby="weekly-insights-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="weekly-insights-heading"
            className="text-[20px] font-semibold tracking-tight text-[var(--text-primary)]"
          >
            Your last 7 days
          </h2>
          {primary.weekLabel ? (
            <p className="mt-1 text-[13px] text-black/55">{primary.weekLabel}</p>
          ) : null}
        </div>
        {primary.traceIds && primary.traceIds.length > 0 && onOpenTrace ? (
          <button
            type="button"
            onClick={() => onOpenTrace(primary.traceIds![0])}
            className="rounded-lg px-3 py-2 text-[14px] font-medium text-black/70 hover:bg-black/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-1"
          >
            Show reasoning
          </button>
        ) : null}
      </div>

      <DashboardCard
        hover={false}
        className="mt-4 border-black/[0.08] bg-black/[0.015] p-5 md:p-6"
      >
        <p className="text-[12px] font-semibold uppercase tracking-wider text-black/55">
          Highlights
        </p>
        <ul className="mt-2 space-y-2 text-[14px] leading-relaxed text-black/80">
          {primary.noticed.map((n, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-black/35">•</span>
              <span className="min-w-0">{n}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 border-t border-black/5 pt-4">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-black/55">
            Summary
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-black/80 line-clamp-2">
            {primary.interpretation}
          </p>
        </div>
      </DashboardCard>
    </section>
  );
}
