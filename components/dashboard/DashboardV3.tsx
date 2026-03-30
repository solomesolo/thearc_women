"use client";

import type { DashboardPayload } from "@/lib/dashboard/types";
import type { StartingLineViewModel } from "@/lib/dashboard/startingLineTypes";
import { StartingLineSection } from "./StartingLineSection";
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
import { TrackTheseOverTime } from "./TrackTheseOverTime";

const KEY_LEVER_LABELS: Record<string, string> = {
  sleep_consistency: "Improve sleep consistency",
  recovery: "Prioritize recovery first",
  stress_reduction: "Reduce overall stress load",
  energy_stability: "Support energy stability",
  metabolic_stability: "Support metabolic stability",
  nutrition_timing: "Optimize nutrition timing",
  cycle_alignment: "Align activity with your cycle",
  hormonal_balance: "Support hormonal balance",
  iron_support: "Support iron and energy levels",
};

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

type Props = {
  payload: DashboardPayload | null;
  startingLine?: StartingLineViewModel | null;
};

export function DashboardV3({ payload, startingLine }: Props) {
  const keyAreas = payload?.keyAreas ?? [];
  const signals = payload?.signals ?? [];
  const hero = payload?.hero ?? null;

  // Build right-rail "priorities" copy — prefer engine-resolved startingLine over old payload.
  const resolvedFocusLabel = startingLine?.debug.source === "resolved_run"
    ? startingLine.focus?.label
    : (hero?.keyLever ? (KEY_LEVER_LABELS[hero.keyLever] ?? hero.keyLever) : null);

  const resolvedTopAreas = startingLine?.debug.source === "resolved_run" && startingLine.keyAreas.length > 0
    ? startingLine.keyAreas.slice(0, 3).map((ka) => ka.title || ka.code).join(" · ")
    : keyAreas.slice(0, 3).map((a) => a.title || a.area).join(" · ");

  const prioritiesBody = resolvedFocusLabel
    ? `If you do only one thing this week: ${resolvedFocusLabel.toLowerCase()}.`
    : "Focus on consistent sleep and recovery this week.";

  const startWith3Body = resolvedTopAreas.length > 0
    ? resolvedTopAreas
    : "Sleep consistency · Recovery / HRV · Energy";

  return (
    <div className="dashboard-shell">
      <div className="dashboard-section-stack pt-6 md:pt-8">
        <StartingLineSection payload={payload} startingLine={startingLine ?? null} />

        {/* Top row: left stack (8/12) + right rail (4/12) */}
        <div className="dashboard-grid-12 items-start">
          <div className="col-span-12 lg:col-span-8">
            <div className="flex flex-col gap-7">
              <TodayThisWeekCard keyAreas={keyAreas} />
              <HeroHealthBaseline hero={hero} keyAreas={keyAreas} />
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
                body={prioritiesBody}
              />
              <RightRailCard
                title="Start with these"
                body={startWith3Body}
              />
            </div>
          </aside>
        </div>

        <BodySystemsOverview keyAreas={keyAreas} />

        {/* Watch + weekly row (7/12 + 5/12) */}
        <div className="dashboard-grid-12">
          <div className="col-span-12 lg:col-span-7">
            <WhatToWatchNow keyAreas={keyAreas} signals={signals} />
          </div>
          <div className="col-span-12 lg:col-span-5">
            <WeeklyInsightsSummary />
          </div>
        </div>

        <PrioritiesRightNow />
        <TrackTheseOverTime />

        {/* Progress + labs row */}
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
