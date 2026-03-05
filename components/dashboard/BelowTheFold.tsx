"use client";

import type { DashboardVM } from "@/types/dashboard";
import { RecommendedKnowledge } from "./RecommendedKnowledge";
import { LabAwarenessGrid } from "./LabAwarenessGrid";
import { BiologicalPriorities } from "./BiologicalPriorities";
import { TrackingSignalsPanel } from "./TrackingSignalsPanel";
import { RootPatternLayer } from "./RootPatternLayer";
import { PreventiveStrategyLibrary } from "./PreventiveStrategyLibrary";
import { WeeklyBiologicalInsights } from "./WeeklyBiologicalInsights";

type BelowTheFoldProps = {
  vm: DashboardVM;
  onOpenTrace: (traceId: string) => void;
  onUpdateSignals: () => void;
};

export function BelowTheFold({
  vm,
  onOpenTrace,
  onUpdateSignals,
}: BelowTheFoldProps) {
  return (
    <div className="border-t border-black/5">
      <RecommendedKnowledge cards={vm.knowledgeCards} />
      <LabAwarenessGrid labs={vm.labs} />
      <BiologicalPriorities priorities={vm.priorities} />
      <TrackingSignalsPanel
        signals={vm.trackingSignals}
        onUpdateSignals={onUpdateSignals}
      />
      <RootPatternLayer patterns={vm.rootPatterns} />
      <PreventiveStrategyLibrary strategies={vm.strategies} />
      <WeeklyBiologicalInsights
        insights={vm.weeklyInsights}
        onOpenTrace={onOpenTrace}
      />
    </div>
  );
}
