"use client";

import { useRouter } from "next/navigation";

type Props = {
  step: number;
  totalSteps: number;
  onBack?: () => void;
};

export function ProgressHeader({ step, totalSteps, onBack }: Props) {
  const router = useRouter();
  const pct = Math.round((step / totalSteps) * 100);

  return (
    <div className="mb-8 space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack ?? (() => router.back())}
          className="flex items-center gap-1.5 text-[0.8125rem] text-[#737373] transition-colors hover:text-[#0c0c0c]"
          aria-label="Go back"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
        <span className="text-[0.8125rem] text-[#a3a3a3]">
          Step {step} of {totalSteps}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/[0.07]">
        <div
          className="h-full rounded-full bg-[#0c0c0c] transition-all duration-300"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
