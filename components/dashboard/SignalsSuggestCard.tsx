"use client";

import { useMemo, useState } from "react";
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
  const [showTechnical, setShowTechnical] = useState(false);

  const toHumanLabel = (label: string): string => {
    const trimmed = label.trim();
    const map: Record<string, string> = {
      CL_ENERGY_VAR: "Energy variability",
      CL_SLEEP_DISRUPT: "Sleep disruption",
    };
    if (map[trimmed]) return map[trimmed];
    if (/^CL_[A-Z0-9_]+$/.test(trimmed)) {
      return trimmed
        .replace(/^CL_/, "")
        .toLowerCase()
        .split("_")
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
        .join(" ");
    }
    return trimmed;
  };

  const groupOf = (c: Cluster): "Energy" | "Hormones" | "Stress" | "Metabolism" | "Other" => {
    const text = `${c.label} ${(c.systemIds ?? []).join(" ")}`.toLowerCase();
    if (text.includes("sleep") || text.includes("stress") || text.includes("recovery")) return "Stress";
    if (text.includes("hormon")) return "Hormones";
    if (text.includes("metabol") || text.includes("glucose") || text.includes("appetite")) return "Metabolism";
    if (text.includes("energy") || text.includes("fatigue")) return "Energy";
    return "Other";
  };

  const grouped = useMemo(() => {
    const groups: Record<string, Cluster[]> = {};
    for (const c of clusters) {
      const g = groupOf(c);
      groups[g] ||= [];
      groups[g].push(c);
    }
    const order = ["Energy", "Hormones", "Stress", "Metabolism", "Other"];
    return order
      .filter((k) => (groups[k]?.length ?? 0) > 0)
      .map((k) => ({ key: k, items: groups[k] }));
  }, [clusters]);

  return (
    <DashboardCard className="max-w-[1000px]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-black/55">
          Clusters
        </p>
        <button
          type="button"
          onClick={() => setShowTechnical((v) => !v)}
          className="rounded-lg px-2.5 py-1 text-[12px] font-medium text-black/65 hover:bg-black/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-1"
        >
          {showTechnical ? "Hide technical labels" : "Show technical labels"}
        </button>
      </div>

      <div className="mt-4 space-y-6">
        {grouped.map((g) => (
          <div key={g.key}>
            <p className="text-[12px] font-semibold uppercase tracking-wider text-black/45">
              {g.key}
            </p>
            <ul className="mt-2 space-y-3">
              {g.items.map((cluster) => {
                const human = toHumanLabel(cluster.label);
                const isTechnical = /^CL_[A-Z0-9_]+$/.test(cluster.label.trim());
                const label = showTechnical && isTechnical ? cluster.label : human;
                const showAlt = showTechnical && !isTechnical ? null : isTechnical ? cluster.label : null;
                return (
                  <li
                    key={cluster.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-0.5"
                  >
                    <span className="text-[15px] leading-relaxed text-[var(--text-primary)]">
                      • {label}
                      {showTechnical && isTechnical ? (
                        <span className="ml-2 text-[13px] text-black/45">
                          ({human})
                        </span>
                      ) : null}
                      {showAlt ? (
                        <span className="ml-2 text-[13px] text-black/45">
                          ({showAlt})
                        </span>
                      ) : null}
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
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
