"use client";

import { clsx } from "clsx";
import type { SystemStatus } from "@/types/dashboard";

/** Neutral styling: border + subtle fill, no saturated colors. */
const STYLES: Record<
  SystemStatus,
  { border: string; bg: string; text: string }
> = {
  stable: {
    border: "border-black/[0.10]",
    bg: "bg-black/[0.02]",
    text: "text-black/70",
  },
  variable: {
    border: "border-black/[0.14]",
    bg: "bg-black/[0.03]",
    text: "text-black/75",
  },
  needs_attention: {
    border: "border-black/[0.18]",
    bg: "bg-black/[0.04]",
    text: "text-black/90",
  },
};

const LABELS: Record<SystemStatus, string> = {
  stable: "Stable",
  variable: "Variable",
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
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
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
