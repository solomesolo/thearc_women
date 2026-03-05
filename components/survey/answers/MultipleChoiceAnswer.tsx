"use client";

import { useCallback, useRef } from "react";
import { clsx } from "clsx";
import type { SurveyOption } from "@/lib/survey/surveySchema";

type MultipleChoiceAnswerProps = {
  questionId: string;
  options: SurveyOption[];
  value: string | number | (string | number)[] | undefined;
  onChange: (value: string | number | (string | number)[] | undefined) => void;
  multiple?: boolean;
};

/** Choice cards: full-width, premium selectable cards. Arrow keys move focus, Space selects. No auto-advance. */
export function MultipleChoiceAnswer({
  questionId,
  options,
  value,
  onChange,
  multiple,
}: MultipleChoiceAnswerProps) {
  const listRef = useRef<HTMLUListElement>(null);

  const isSelected = (opt: SurveyOption) => {
    if (Array.isArray(value)) return value.includes(opt.value);
    return value === opt.value;
  };

  const focusedIndex = options.findIndex((opt) => isSelected(opt));
  const currentIndex = focusedIndex >= 0 ? focusedIndex : 0;

  const handleClick = (opt: SurveyOption) => {
    if (multiple && Array.isArray(value)) {
      const next = value.includes(opt.value)
        ? value.filter((v) => v !== opt.value)
        : [...value, opt.value];
      onChange(next);
    } else {
      onChange(opt.value);
    }
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLUListElement>) => {
      if (options.length === 0) return;
      let nextIndex = currentIndex;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        nextIndex = Math.min(currentIndex + 1, options.length - 1);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        nextIndex = Math.max(currentIndex - 1, 0);
      } else if (e.key === " ") {
        e.preventDefault();
        handleClick(options[currentIndex]);
        return;
      } else return;
      const btn = listRef.current?.querySelectorAll<HTMLButtonElement>("button")[nextIndex];
      btn?.focus();
      if (!multiple) onChange(options[nextIndex].value);
    },
    [currentIndex, options, multiple, value, onChange]
  );

  return (
    <ul
      ref={listRef}
      className="flex flex-col gap-3"
      role={multiple ? "group" : "radiogroup"}
      aria-label="Choose an option"
      onKeyDown={handleKeyDown}
    >
      {options.map((opt, idx) => {
        const selected = isSelected(opt);
        const isFirst = idx === 0;
        const noSelection = value === undefined || (Array.isArray(value) && value.length === 0);
        return (
          <li key={String(opt.value)}>
            <button
              type="button"
              onClick={() => handleClick(opt)}
              aria-pressed={selected}
              aria-label={opt.label}
              tabIndex={selected || (noSelection && isFirst) ? 0 : -1}
              className={clsx(
                "flex min-h-[48px] w-full items-center justify-between rounded-[18px] border px-4 py-3.5 text-left transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/25 focus-visible:ring-offset-2",
                "text-[16px] md:text-[17px] leading-snug",
                selected
                  ? "border-black/[0.18] bg-black/[0.03] text-[var(--text-primary)]"
                  : "border-black/[0.08] bg-[var(--background)] text-[var(--text-primary)] hover:bg-black/[0.015] hover:border-black/[0.1]"
              )}
            >
              <span>{opt.label}</span>
              <span
                className={clsx(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  selected ? "border-black/30 bg-black/80" : "border-black/[0.2]"
                )}
                aria-hidden
              >
                {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}