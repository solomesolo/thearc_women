"use client";

import { clsx } from "clsx";
import type { SystemStatus } from "@/types/dashboard";

/** Neutral styling: border + subtle fill, no saturated colors. */
const STYLES: Record<
  SystemStatus,
  { border: string; bg: string; text: string }
> = {
  stable: {
    border: "border-emerald-200",
    bg: "bg-emerald-100",
    text: "text-emerald-900",
  },
  variable: {
    border: "border-amber-200",
    bg: "bg-amber-100",
    text: "text-amber-900",
  },
  needs_attention: {
    border: "border-rose-200",
    bg: "bg-rose-100",
    text: "text-rose-900",
  },
};

const LABELS: Record<SystemStatus, string> = {
  stable: "Steady",
  variable: "Monitor",
  needs_attention: "Needs attention",
};

type StatusChipProps = {
  status: SystemStatus;
  className?: string;
};

export function StatusChip({ status, className }: StatusChipProps) {
  const s = STYLES[status];
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        s.border,
        s.bg,
        s.text,
        className
      )}
    >
      {LABELS[status]}
    </span>
  );
}
