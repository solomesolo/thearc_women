"use client";

import { useState } from "react";

type ChipProps = {
  label: string;
  selected?: boolean;
  tooltip?: string;
  onSelect?: () => void;
  onClick?: () => void;
  "aria-label"?: string;
  className?: string;
};

export function Chip({
  label,
  selected = false,
  tooltip,
  onSelect,
  onClick,
  "aria-label": ariaLabel,
  className = "",
}: ChipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const handleClick = () => {
    onSelect?.();
    onClick?.();
    setShowTooltip((prev) => !prev);
  };
  const handleMouseEnter = () => setShowTooltip(true);
  const handleMouseLeave = () => setShowTooltip(false);

  const reveal = showTooltip || selected;
  const displayTooltip = tooltip && (showTooltip || selected);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label={ariaLabel ?? label}
        aria-expanded={reveal && !!tooltip}
        aria-describedby={displayTooltip ? `chip-tt-${label.replace(/\s/g, "-")}` : undefined}
        className={`
          inline-flex items-center justify-center rounded-full border px-3 py-2 text-sm font-medium
          min-h-[44px] min-w-[44px]
          transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)]/30 focus-visible:ring-offset-2
          ${selected
            ? "border-[var(--text-primary)]/35 bg-[var(--color-surface)]/60 text-[var(--text-primary)]"
            : "border-black/12 bg-[var(--background)] text-black/80 hover:border-black/2 hover:bg-black/[0.04]"
          }
          ${className}
        `}
      >
        {label}
      </button>
      {displayTooltip && (
        <div
          id={`chip-tt-${label.replace(/\s/g, "-")}`}
          role="tooltip"
          className="absolute left-0 top-full z-10 mt-1.5 max-w-[280px] rounded-lg border border-black/10 bg-[var(--background)] px-3 py-2 shadow-lg text-sm leading-relaxed text-black/80"
        >
          {tooltip}
        </div>
      )}
    </div>
  );
}
