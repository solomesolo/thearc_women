"use client";

import { clsx } from "clsx";
import type { DashboardTimeRange } from "@/types/dashboard";

const TIME_RANGE_OPTIONS: { id: DashboardTimeRange; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
];

type DashboardStickyHeaderProps = {
  timeRange: DashboardTimeRange;
  onTimeRangeChange: (range: DashboardTimeRange) => void;
  onUpdateSignals?: () => void;
};

/** Compact utility bar: ~44–52px, subtle divider, sticky. */
export function DashboardStickyHeader({
  timeRange,
  onTimeRangeChange,
  onUpdateSignals,
}: DashboardStickyHeaderProps) {
  return (
    <header
      className="sticky top-0 z-30 border-b border-black/[0.06] bg-[var(--background)]/98 backdrop-blur-sm"
      role="banner"
    >
      <div className="dashboard-shell flex h-[48px] min-h-[44px] max-h-[52px] flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Time range"
          className="flex rounded-lg bg-black/[0.04] p-0.5"
        >
          {TIME_RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onTimeRangeChange(opt.id)}
              className={clsx(
                "min-h-[36px] rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
                timeRange === opt.id
                  ? "bg-black/90 text-white"
                  : "text-black/60 hover:bg-black/[0.06] hover:text-black/80"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onUpdateSignals}
          className="inline-flex h-9 items-center justify-center rounded-lg bg-black/90 px-4 text-sm font-medium text-white transition-opacity hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
        >
          Update signals
        </button>
      </div>
    </header>
  );
}
