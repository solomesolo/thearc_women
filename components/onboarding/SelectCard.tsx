"use client";

import { clsx } from "clsx";

type Props = {
  label: string;
  selected: boolean;
  onClick: () => void;
  multi?: boolean;
};

export function SelectCard({ label, selected, onClick, multi = false }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={clsx(
        "flex w-full items-center gap-3 rounded-[14px] border px-4 py-3.5 text-left text-[0.9375rem] transition-all duration-150",
        selected
          ? "border-[#0c0c0c] bg-[#0c0c0c] text-white shadow-[0_2px_12px_rgba(0,0,0,0.12)]"
          : "border-black/[0.1] bg-white/[0.6] text-[#404040] hover:border-black/[0.2] hover:bg-white"
      )}
    >
      <span
        className={clsx(
          "flex h-5 w-5 shrink-0 items-center justify-center",
          multi ? "rounded-[5px] border" : "rounded-full border",
          selected
            ? "border-white/[0.4] bg-white/[0.15]"
            : "border-black/[0.2]"
        )}
        aria-hidden
      >
        {selected && (
          multi ? (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <span className="h-2 w-2 rounded-full bg-white" />
          )
        )}
      </span>
      <span className="leading-snug">{label}</span>
    </button>
  );
}
