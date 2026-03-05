"use client";

type SurveyProgressHeaderProps = {
  sectionLabel: string;
  current: number;
  total: number;
};

/** Single progress system: section label + count right-aligned, thin bar below. */
export function SurveyProgressHeader({ sectionLabel, current, total }: SurveyProgressHeaderProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="w-full" role="progressbar" aria-valuenow={current} aria-valuemin={0} aria-valuemax={total} aria-label={`${sectionLabel}, step ${current} of ${total}`}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[14px] font-medium text-black/80">{sectionLabel}</span>
        <span className="text-[14px] text-black/60 tabular-nums">
          {current} of {total}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.08]">
        <div
          className="h-full rounded-full bg-black/20 transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
