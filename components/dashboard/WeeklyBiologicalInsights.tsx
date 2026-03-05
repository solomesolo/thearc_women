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

  return (
    <section className="dashboard-section dashboard-shell" aria-labelledby="weekly-insights-heading">
      <h2 id="weekly-insights-heading" className="text-[17px] font-semibold text-[var(--text-primary)]">
        Weekly biological insights
      </h2>
      <ul className="mt-4 space-y-4">
        {insights.map((w) => (
          <li key={w.id}>
            <DashboardCard hover={false}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-[15px] font-medium text-[var(--text-primary)]">
                  {w.title}
                  {w.weekLabel && (
                    <span className="ml-2 font-normal text-black/60">· {w.weekLabel}</span>
                  )}
                </span>
                {w.traceIds && w.traceIds.length > 0 && onOpenTrace && (
                  <button
                    type="button"
                    onClick={() => onOpenTrace(w.traceIds![0])}
                    className="text-[14px] text-black/70 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-1 rounded"
                  >
                    Show reasoning
                  </button>
                )}
              </div>
              <ul className="mt-2 list-inside list-disc space-y-0.5 text-[14px] text-black/70">
                {w.noticed.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
              <p className="mt-2 text-[14px] leading-relaxed text-black/70">
                {w.interpretation}
              </p>
            </DashboardCard>
          </li>
        ))}
      </ul>
    </section>
  );
}
