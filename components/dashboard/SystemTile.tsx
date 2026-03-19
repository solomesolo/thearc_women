"use client";

import { clsx } from "clsx";
import type { System as SystemType } from "@/types/dashboard";
import { StatusChip } from "./StatusChip";

type SystemTileProps = {
  system: SystemType;
  isSelected: boolean;
  onSelect: () => void;
};

/**
 * Full-width tile: title (wraps, no truncation), status pill right, optional micro line.
 * Min-height ~72–84px; hover subtle. Never truncate system label on desktop/tablet.
 */
export function SystemTile({ system, isSelected, onSelect }: SystemTileProps) {
  const status = system.status ?? "stable";
  const meaning =
    status === "stable"
      ? "Stable with no major disruption"
      : status === "variable"
        ? "Mild variability detected"
        : "Worth monitoring";
  const isPriority = status === "variable" || status === "needs_attention";

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      onClick={onSelect}
      className={clsx(
        "flex min-h-[88px] flex-col justify-between gap-3 rounded-[18px] border p-4 text-left transition-colors",
        "border-black/[0.07] bg-[var(--background)] hover:border-black/[0.16] hover:bg-black/[0.02]",
        isPriority && "border-black/[0.12] bg-black/[0.015]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2",
        "md:min-h-[96px]",
        isSelected && "border-black/[0.18] bg-black/[0.02]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 flex-1 text-[15px] font-semibold leading-snug text-[var(--text-primary)]">
          {system.label}
        </span>
        <StatusChip status={status} className="shrink-0" />
      </div>
      <p className="text-[13px] leading-snug text-black/70">
        {system.micro ?? meaning}
      </p>
    </button>
  );
}
