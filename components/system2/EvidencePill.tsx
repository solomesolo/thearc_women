"use client";

import type { EvidenceLevel } from "@/content/systemPageData";

const STYLES: Record<
  EvidenceLevel,
  { border: string; bg: string; fontWeight: string }
> = {
  strong: {
    border: "border-black/25",
    bg: "bg-black/[0.06]",
    fontWeight: "font-semibold",
  },
  established: {
    border: "border-black/18",
    bg: "bg-black/[0.04]",
    fontWeight: "font-medium",
  },
  emerging: {
    border: "border-black/12",
    bg: "bg-black/[0.02]",
    fontWeight: "font-medium",
  },
  exploratory: {
    border: "border-black/08",
    bg: "bg-transparent",
    fontWeight: "font-normal",
  },
};

const LABELS: Record<EvidenceLevel, string> = {
  strong: "Strong",
  established: "Established",
  emerging: "Emerging",
  exploratory: "Exploratory",
};

type EvidencePillProps = {
  level: EvidenceLevel;
  className?: string;
};

export function EvidencePill({ level, className = "" }: EvidencePillProps) {
  const s = STYLES[level];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs ${s.border} ${s.bg} ${s.fontWeight} text-black/80 ${className}`}
    >
      {LABELS[level]}
    </span>
  );
}
