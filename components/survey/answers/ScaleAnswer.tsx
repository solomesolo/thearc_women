"use client";

import { useCallback, useRef } from "react";
import { clsx } from "clsx";

type ScaleOptions = { min: number; max: number; step?: number; lowLabel?: string; highLabel?: string };

type ScaleAnswerProps = {
  questionId: string;
  options: ScaleOptions;
  value: number | undefined;
  onChange: (value: number) => void;
};

/** Scale as choice cards. Arrow keys move selection, Space/click select. No auto-advance. */
export function ScaleAnswer({ questionId, options, value, onChange }: ScaleAnswerProps) {
  const { min, max, step = 1, lowLabel, highLabel } = options;
  const steps = Array.from({ length: (max - min) / step + 1 }, (_, i) => min + i * step);
  const listRef = useRef<HTMLDivElement>(null);
  const currentIndex = value !== undefined ? steps.indexOf(value) : 0;
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (steps.length === 0) return;
      let nextIndex = safeIndex;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        nextIndex = Math.min(safeIndex + 1, steps.length - 1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        nextIndex = Math.max(safeIndex - 1, 0);
      } else if (e.key === " ") {
        e.preventDefault();
        onChange(steps[safeIndex]);
        return;
      } else return;
      const btn = listRef.current?.querySelectorAll<HTMLButtonElement>("button")[nextIndex];
      btn?.focus();
      onChange(steps[nextIndex]);
    },
    [safeIndex, steps, onChange]
  );

  return (
    <div
      ref={listRef}
      role="group"
      aria-label="Scale"
      className="flex flex-col gap-3"
      onKeyDown={handleKeyDown}
    >
      <div className="flex flex-wrap gap-3">
        {steps.map((n, idx) => {
          const selected = value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-pressed={selected}
              aria-label={`${n}`}
              tabIndex={selected || (value === undefined && idx === 0) ? 0 : -1}
              className={clsx(
                "flex min-h-[48px] min-w-[48px] items-center justify-center rounded-[18px] border px-4 py-3 text-[16px] font-medium transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/25 focus-visible:ring-offset-2",
                selected
                  ? "border-black/[0.18] bg-black/[0.03] text-[var(--text-primary)]"
                  : "border-black/[0.08] bg-[var(--background)] hover:bg-black/[0.015] hover:border-black/[0.1]"
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
      {(lowLabel || highLabel) && (
        <div className="flex justify-between text-[14px] text-black/60">
          <span>{lowLabel ?? ""}</span>
          <span>{highLabel ?? ""}</span>
        </div>
      )}
    </div>
  );
}
