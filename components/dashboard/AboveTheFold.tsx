"use client";

import { useState } from "react";
import type { DashboardVM } from "@/types/dashboard";
import { LensCard } from "./LensCard";
import { SystemsGrid } from "./SystemsGrid";
import { SignalsSuggestCard } from "./SignalsSuggestCard";
import { WhatToWatchGrid } from "./WhatToWatchGrid";

type AboveTheFoldProps = {
  vm: DashboardVM;
  onOpenTrace: (traceId: string) => void;
  onSystemOpened?: (systemId: string) => void;
};

/**
 * Three full-width bands: Row 1 — Systems. Row 2 — What to watch. Row 3 — Signal clusters.
 * Section header margin-bottom 12–16px; grid gap 16–20px; between sections 32–40px.
 */
export function AboveTheFold({ vm, onOpenTrace, onSystemOpened }: AboveTheFoldProps) {
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(
    vm.systems[0]?.id ?? null
  );

  const selectedSystem =
    vm.systems.find((s) => s.id === selectedSystemId) ?? null;

  const openLensReasoning = () => {
    if (vm.lens.traceId) onOpenTrace(vm.lens.traceId);
  };

  const handleSystemSelect = (system: { id: string }) => {
    setSelectedSystemId(system.id);
    onSystemOpened?.(system.id);
  };

  return (
    <section
      className="dashboard-shell pt-8 pb-8 md:pt-10 md:pb-10"
      aria-label="Dashboard overview"
    >
      <div className="flex flex-col gap-8 md:gap-10">
        <LensCard lens={vm.lens} onShowReasoning={openLensReasoning} />

        {/* Row 1 — Systems (full width). Stronger header + breathing room. */}
        <div>
          <div className="mb-4 flex flex-wrap items-baseline gap-3">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[var(--text-primary)]">
              Systems
            </h2>
            {selectedSystem && (
              <span className="text-[13px] text-black/55">
                Selected: {selectedSystem.label}
              </span>
            )}
          </div>
          <SystemsGrid
            systems={vm.systems}
            selectedId={selectedSystemId}
            onSelect={handleSystemSelect}
          />
          {selectedSystem && selectedSystem.traceId && (
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-[18px] border border-black/[0.07] bg-black/[0.02] px-4 py-3">
              <p className="text-[14px] leading-relaxed text-black/70">
                {selectedSystem.description}
              </p>
              <button
                type="button"
                onClick={() => onOpenTrace(selectedSystem.traceId!)}
                className="text-[14px] text-black/70 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-1 rounded"
              >
                Show reasoning
              </button>
            </div>
          )}
        </div>

        {/* Row 2 — What to watch (full width). Slightly smaller header. */}
        <div>
          <h2 className="mb-4 text-[12px] font-medium uppercase tracking-wider text-black/55">
            What to watch
          </h2>
          <WhatToWatchGrid areas={vm.monitoringAreas} />
        </div>

        {/* Row 3 — Signal clusters (full width). */}
        <div>
          <h2 className="mb-4 text-[12px] font-medium uppercase tracking-wider text-black/55">
            Signal clusters
          </h2>
          <SignalsSuggestCard clusters={vm.clusters} onWhy={onOpenTrace} />
        </div>
      </div>
    </section>
  );
}
