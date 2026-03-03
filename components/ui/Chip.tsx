"use client";

import { clsx } from "clsx";

type ChipProps = {
  label: string;
  selected?: boolean;
  onToggle?: () => void;
  disabled?: boolean;
  className?: string;
};

/** Chip — selectable pill, no shadow, subtle border */
export function Chip({
  label,
  selected = false,
  onToggle,
  disabled = false,
  className,
}: ChipProps) {
  const isButton = typeof onToggle === "function";

  const base =
    "rounded-[10px] border px-3.5 py-2 text-left text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)]";
  const selectedStyles =
    "border-[var(--text-primary)] bg-[var(--text-primary)]/0.06 text-[var(--text-primary)]";
  const unselectedStyles =
    "border-[var(--color-border-hairline)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--text-primary)]/40 hover:text-[var(--text-primary)]";

  if (isButton && !disabled) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className={clsx(
          base,
          selected ? selectedStyles : unselectedStyles,
          className
        )}
      >
        {label}
      </button>
    );
  }

  return (
    <span
      className={clsx(
        base,
        selected ? selectedStyles : unselectedStyles,
        disabled && "opacity-60 cursor-not-allowed",
        className
      )}
      aria-pressed={isButton ? selected : undefined}
    >
      {label}
    </span>
  );
}
