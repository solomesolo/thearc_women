"use client";

import type { System as SystemType } from "@/types/dashboard";
import { StatusChip } from "./StatusChip";
import { DashboardCard } from "./DashboardCard";

type SystemDetailPanelProps = {
  system: SystemType | null;
  onShowReasoning: (traceId: string) => void;
};

/** Inspector-style panel: "Selected system" label, title, description, Show reasoning. Optional sticky. */
export function SystemDetailPanel({
  system,
  onShowReasoning,
}: SystemDetailPanelProps) {
  if (!system) {
    return (
      <DashboardCard hover={false} className="flex min-h-[120px] items-center justify-center">
        <p className="text-sm text-black/55">
          Click a system to see details
        </p>
      </DashboardCard>
    );
  }

  const status = system.status ?? "stable";
  const hasTrace = Boolean(system.traceId);

  return (
    <DashboardCard
      hover={false}
      className="md:sticky md:top-[calc(48px+24px)] md:self-start"
    >
      <p className="text-[12px] font-medium uppercase tracking-wider text-black/55">
        Selected system
      </p>
      <h3 className="mt-1.5 text-[17px] font-semibold text-[var(--text-primary)]">
        {system.label}
      </h3>
      {system.description && (
        <p className="mt-2 text-[14px] leading-relaxed text-black/70">
          {system.description}
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusChip status={status} />
        {hasTrace && (
          <button
            type="button"
            onClick={() => onShowReasoning(system.traceId!)}
            className="text-[14px] text-black/70 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-1 rounded"
          >
            Show reasoning
          </button>
        )}
      </div>
    </DashboardCard>
  );
}
