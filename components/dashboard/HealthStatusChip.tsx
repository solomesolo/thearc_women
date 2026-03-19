"use client";

import { clsx } from "clsx";

export type HealthStatus = "Steady" | "Within expected range" | "Worth attention";

type HealthStatusChipProps = {
  status: HealthStatus;
  tooltip?: string;
  className?: string;
};

const STYLES: Record<HealthStatus, { border: string; bg: string; text: string }> = {
  Steady: {
    border: "border-emerald-200",
    bg: "bg-emerald-100",
    text: "text-emerald-900",
  },
  "Within expected range": {
    border: "border-emerald-200",
    bg: "bg-emerald-100",
    text: "text-emerald-900",
  },
  "Worth attention": {
    border: "border-amber-200",
    bg: "bg-amber-100",
    text: "text-amber-900",
  },
};

export function HealthStatusChip({
  status,
  tooltip,
  className,
}: HealthStatusChipProps) {
  const s = STYLES[status];
  return (
    <span className={clsx("inline-flex items-center gap-1.5", className)}>
      <span
        className={clsx(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] font-semibold",
          s.border,
          s.bg,
          s.text
        )}
      >
        {status}
      </span>
      {tooltip ? (
        <span
          title={tooltip}
          aria-label={tooltip}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-black/[0.10] bg-[var(--background)] text-[12px] font-semibold text-black/55 hover:bg-black/[0.03]"
        >
          i
        </span>
      ) : null}
    </span>
  );
}

