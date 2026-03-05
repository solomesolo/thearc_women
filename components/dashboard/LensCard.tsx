"use client";

import type { Lens as LensType } from "@/types/dashboard";
import { DashboardCard } from "./DashboardCard";

type LensCardProps = {
  lens: LensType;
  tags?: string[];
  onShowReasoning: () => void;
};

export function LensCard({ lens, tags = [], onShowReasoning }: LensCardProps) {
  const displayTags = tags.length > 0 ? tags : [lens.id.replace(/_/g, " ")];
  return (
    <DashboardCard as="article">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-5">
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-semibold text-[var(--text-primary)]">
            {lens.title}
          </h2>
          <p className="mt-1.5 text-[15px] leading-relaxed text-black/70">
            {lens.oneLine}
          </p>
          <button
            type="button"
            onClick={onShowReasoning}
            className="mt-3 text-[14px] text-black/70 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-1 rounded"
          >
            Show reasoning
          </button>
        </div>
        <div className="flex flex-wrap gap-2 md:justify-end">
          {displayTags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-black/[0.08] bg-black/[0.02] px-2.5 py-1 text-[12px] font-medium text-black/60"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
}
