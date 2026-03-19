"use client";

import type { DashboardVM } from "@/types/dashboard";
import { HeroHealthBaseline } from "./HeroHealthBaseline";
import { BodySystemsOverview } from "./BodySystemsOverview";
import { WhatToWatchNow } from "./WhatToWatchNow";
import { WeeklyInsightsSummary } from "./WeeklyInsightsSummary";
import { PrioritiesRightNow } from "./PrioritiesRightNow";
import { TrackTheseOverTime } from "./TrackTheseOverTime";

type AboveTheFoldProps = {
  vm: DashboardVM;
  onOpenTrace: (traceId: string) => void;
  onSystemOpened?: (systemId: string) => void;
};

/**
 * Section order (spec): baseline → systems → watch → weekly → priorities → tracking.
 */
export function AboveTheFold({ vm, onOpenTrace, onSystemOpened }: AboveTheFoldProps) {
  void vm;
  void onOpenTrace;
  void onSystemOpened;

  return (
    <div aria-label="Dashboard overview">
      <HeroHealthBaseline />
      <BodySystemsOverview />
      <WhatToWatchNow />
      <WeeklyInsightsSummary />
      <PrioritiesRightNow />
      <TrackTheseOverTime />
    </div>
  );
}
