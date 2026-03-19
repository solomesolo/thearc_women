"use client";

import type { DashboardVM } from "@/types/dashboard";
import { LabAwarenessSection } from "./LabAwarenessSection";
import { RecommendedForYou } from "./RecommendedForYou";
import { PreventiveStrategiesToExplore } from "./PreventiveStrategiesToExplore";
import { UnderlyingPatternsAdvanced } from "./UnderlyingPatternsAdvanced";

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
  void vm;
  void onOpenTrace;
  void onUpdateSignals;
  return (
    <div className="border-t border-black/5">
      <LabAwarenessSection />
      <RecommendedForYou />
      <PreventiveStrategiesToExplore />
      <UnderlyingPatternsAdvanced />
    </div>
  );
}
