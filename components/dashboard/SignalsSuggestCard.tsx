"use client";

import type { Cluster } from "@/types/dashboard";
import { DashboardCard } from "./DashboardCard";

type SignalsSuggestCardProps = {
  clusters: Cluster[];
  onWhy: (traceId: string) => void;
};

/**
 * List in a card: row layout with cluster label left, "Why?" button right-aligned.
 * More padding, line-height; scannable.
 */
export function SignalsSuggestCard({ clusters, onWhy }: SignalsSuggestCardProps) {
  return (
    <DashboardCard className="max-w-[1000px]">
      <ul className="space-y-4">
        {clusters.map((cluster) => (
          <li
            key={cluster.id}
            className="flex flex-wrap items-center justify-between gap-3 py-0.5"
          >
            <span className="text-[15px] leading-relaxed text-[var(--text-primary)]">
              • {cluster.label}
            </span>
            {cluster.traceId ? (
              <button
                type="button"
                onClick={() => onWhy(cluster.traceId!)}
                className="shrink-0 text-[14px] text-black/70 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-1 rounded"
              >
                Why?
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}
