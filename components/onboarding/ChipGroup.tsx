"use client";

import { clsx } from "clsx";

type Props = {
  options: readonly { key: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
};

export function ChipGroup({ options, selected, onChange }: Props) {
  function toggle(key: string) {
    onChange(
      selected.includes(key)
        ? selected.filter((s) => s !== key)
        : [...selected, key]
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt.key);
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => toggle(opt.key)}
            aria-pressed={active}
            className={clsx(
              "rounded-full border px-3.5 py-1.5 text-[0.875rem] transition-all duration-150",
              active
                ? "border-[#0c0c0c] bg-[#0c0c0c] text-white"
                : "border-black/[0.12] bg-white/[0.6] text-[#525252] hover:border-black/[0.25] hover:text-[#0c0c0c]"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
