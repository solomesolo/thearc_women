"use client";

import Link from "next/link";

type SurveyModalPlaceholderProps = {
  onClose: () => void;
};

export function SurveyModalPlaceholder({ onClose }: SurveyModalPlaceholderProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="survey-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-2xl border border-black/10 bg-[var(--background)] p-6 shadow-xl">
        <h2 id="survey-modal-title" className="text-lg font-semibold text-[var(--text-primary)]">
          Update your signals
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Complete the survey to refresh your dashboard with your latest goals, symptoms, and context.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/survey"
            className="inline-flex items-center justify-center rounded-[14px] bg-[var(--foreground)] px-4 py-2.5 text-sm font-medium text-[var(--background)] no-underline hover:brightness-95"
          >
            Go to survey
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-[14px] border border-black/15 bg-transparent px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-black/[0.04]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
