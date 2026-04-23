"use client";

type Props = {
  score: number | null;
  topGapCount: number | null;
  subtitle: string;
  isLoading?: boolean;
  error?: string | null;
};

export function ActionPlanScoreSummary({ score, topGapCount, subtitle, isLoading, error }: Props) {
  return (
    <div className="rounded-[20px] border border-black/[0.08] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.03)] md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">Health completeness</p>
          <p className="mt-2 text-[0.9375rem] text-[#737373]">{error ? "Score unavailable" : subtitle}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[2.25rem] font-semibold tabular-nums leading-none text-[#0c0c0c]">
            {isLoading ? "—" : score != null ? `${score}%` : "—"}
          </p>
          <p className="mt-1 text-[0.8125rem] text-[#737373]">
            {isLoading ? "Loading…" : topGapCount != null ? `${topGapCount} top gaps` : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

