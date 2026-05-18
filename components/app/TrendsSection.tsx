"use client";

import type { WomensHealthDomainId, TrendDirection, TrendItem } from "@/lib/health-map/domainEngine";

export type { TrendDirection, TrendItem };

// ── Arrow icons ───────────────────────────────────────────────────────────────

function ArrowUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M7 11V3M3.5 6.5L7 3l3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M7 3v8M3.5 7.5L7 11l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M3 7h8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Trend card ────────────────────────────────────────────────────────────────

function TrendCard({ item, isDE }: { item: TrendItem; isDE: boolean }) {
  const trendLabel: Record<TrendDirection, { en: string; de: string }> = {
    up: { en: "Up", de: "Ansteigend" },
    down: { en: "Down", de: "Fallend" },
    stable: { en: "Stable", de: "Stabil" },
    not_enough_data: { en: "Not enough data", de: "Nicht genug Daten" },
  };

  const label = isDE ? trendLabel[item.trend].de : trendLabel[item.trend].en;

  return (
    <div className="rounded-[14px] border border-black/[0.07] bg-[#fafaf9] p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[0.875rem] font-semibold text-[#0c0c0c]">{item.name}</p>
        <span className="flex shrink-0 items-center gap-1 text-[#737373]">
          {item.trend === "up" && <ArrowUpIcon />}
          {item.trend === "down" && <ArrowDownIcon />}
          {(item.trend === "stable" || item.trend === "not_enough_data") && <DashIcon />}
          <span className="text-[0.75rem] font-medium">{label}</span>
        </span>
      </div>

      {(item.latestValue !== undefined || item.unit !== undefined) && (
        <p className="mt-1 text-[0.9375rem] font-semibold tabular-nums text-[#0c0c0c]">
          {[item.latestValue, item.unit].filter(Boolean).join(" ")}
        </p>
      )}

      <p className="mt-1.5 text-[0.8125rem] leading-snug text-[#737373]">{item.summary}</p>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface TrendsSectionProps {
  trends: TrendItem[];
  isDE: boolean;
}

export function TrendsSection({ trends, isDE }: TrendsSectionProps) {
  if (trends.length === 0) {
    return (
      <p className="text-[0.9375rem] text-[#737373]">
        {isDE
          ? "Trends erscheinen, sobald Sie einen weiteren Wert für denselben Biomarker hinzufügen."
          : "Trends will appear after you add another result for the same biomarker."}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
      {trends.slice(0, 3).map((item) => (
        <TrendCard key={item.id} item={item} isDE={isDE} />
      ))}
    </div>
  );
}
