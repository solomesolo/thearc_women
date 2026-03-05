"use client";

type ProgressBarProps = {
  completed: number;
  total: number;
  /** Section X of Y or Step X of Y */
  sectionIndex: number;
  sectionTotal: number;
  /** Default "Section"; use "Step" for one-question-per-screen stepper */
  stepLabel?: "Section" | "Step";
};

export function ProgressBar({
  completed,
  total,
  sectionIndex,
  sectionTotal,
  stepLabel = "Section",
}: ProgressBarProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="w-full" role="progressbar" aria-valuenow={completed} aria-valuemin={0} aria-valuemax={total} aria-label={`Progress: ${completed} of ${total}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[14px] text-black/70">
          {stepLabel} {sectionIndex + 1} of {sectionTotal}
        </span>
        <span className="text-[14px] text-black/70">
          {stepLabel === "Step" ? `${sectionIndex + 1} of ${total}` : `${completed} / ${total} questions`}
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/[0.08]">
        <div
          className="h-full rounded-full bg-black/20 transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
