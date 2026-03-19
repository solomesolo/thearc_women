"use client";

import { TodayThisWeekCard } from "./TodayThisWeekCard";
import { HeroHealthBaseline } from "./HeroHealthBaseline";
import { BodySystemsOverview } from "./BodySystemsOverview";
import { WhatToWatchNow } from "./WhatToWatchNow";
import { WeeklyInsightsSummary } from "./WeeklyInsightsSummary";
import { PrioritiesRightNow } from "./PrioritiesRightNow";
import { ProgressTrendsCard } from "./ProgressTrendsCard";
import { LabAwarenessSection } from "./LabAwarenessSection";
import { RecommendedForYou } from "./RecommendedForYou";
import { PreventiveStrategiesToExplore } from "./PreventiveStrategiesToExplore";
import { UnderlyingPatternsAdvanced } from "./UnderlyingPatternsAdvanced";

function RightRailCard({
  title,
  body,
  ctaLabel,
}: {
  title: string;
  body: string;
  ctaLabel?: string;
}) {
  return (
    <div className="rounded-[24px] border border-black/[0.08] bg-[var(--background)] p-6 shadow-[0_1px_0_rgba(12,12,12,0.04),0_10px_22px_rgba(12,12,12,0.04)]">
      <p className="text-[15px] font-semibold text-[var(--text-primary)]">{title}</p>
      <p className="mt-2 text-[14px] leading-relaxed text-black/70">{body}</p>
      {ctaLabel ? (
        <button
          type="button"
          className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-black/90 px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2"
        >
          {ctaLabel}
        </button>
      ) : null}
    </div>
  );
}

export function DashboardV3() {
  return (
    <div className="dashboard-shell">
      <div className="dashboard-section-stack pt-6 md:pt-8">
        {/* Top row: left stack (8/12) + right rail (4/12) */}
        <div className="dashboard-grid-12 items-start">
          <div className="col-span-12 lg:col-span-8">
            <div className="flex flex-col gap-7">
              <TodayThisWeekCard />
              <HeroHealthBaseline />
            </div>
          </div>
          <aside className="col-span-12 lg:col-span-4">
            <div className="flex flex-col gap-5">
              <RightRailCard
                title="Planning your next check-up?"
                body="Turn your current signals into a simple agenda so you can use your visit efficiently."
                ctaLabel="Prepare my visit"
              />
              <RightRailCard
                title="Your priorities this week"
                body="If you do only one thing this week: improve sleep consistency. Keep recovery ahead of intensity."
              />
              <RightRailCard
                title="Start with these 3"
                body="Sleep consistency · Recovery / HRV · Energy"
              />
            </div>
          </aside>
        </div>

        <BodySystemsOverview />

        {/* Watch + weekly row (7/12 + 5/12) — use existing sections for now */}
        <div className="dashboard-grid-12">
          <div className="col-span-12 lg:col-span-7">
            <WhatToWatchNow />
          </div>
          <div className="col-span-12 lg:col-span-5">
            <WeeklyInsightsSummary />
          </div>
        </div>

        <PrioritiesRightNow />

        {/* Progress + labs row — use tracking module as progress placeholder */}
        <div className="dashboard-grid-12">
          <div className="col-span-12 lg:col-span-7">
            <ProgressTrendsCard />
          </div>
          <div className="col-span-12 lg:col-span-5">
            <LabAwarenessSection />
          </div>
        </div>

        <RecommendedForYou />
        <PreventiveStrategiesToExplore />
        <UnderlyingPatternsAdvanced />
      </div>
    </div>
  );
}

