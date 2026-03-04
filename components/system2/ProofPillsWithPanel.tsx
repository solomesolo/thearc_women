"use client";

import type { ProofPanelItem } from "@/content/systemPageData";

type ProofPillsWithPanelProps = {
  items: ProofPanelItem[];
  selectedDomainId: string | null;
  onSelect: (id: string | null) => void;
  onOpenTrace: (traceId: string) => void;
  /** Optional micro label above pills (e.g. "PROOF") */
  microLabel?: string;
};

export function ProofPillsWithPanel({
  items,
  selectedDomainId,
  onSelect,
  onOpenTrace,
  microLabel,
}: ProofPillsWithPanelProps) {
  const selected = selectedDomainId ? items.find((i) => i.id === selectedDomainId) : null;

  return (
    <div className="w-full">
      {microLabel && (
        <p className="text-xs font-medium uppercase tracking-wider text-black/50 mb-2">
          {microLabel}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(selectedDomainId === item.id ? null : item.id)}
            aria-pressed={selectedDomainId === item.id}
            aria-label={item.label}
            className={`
              min-h-[44px] rounded-full border px-4 py-2 text-sm font-medium
              transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)]/30 focus-visible:ring-offset-2
              ${selectedDomainId === item.id
                ? "border-[var(--text-primary)]/35 bg-[var(--color-surface)]/60 text-[var(--text-primary)]"
                : "border-black/12 bg-[var(--background)] text-black/80 hover:border-black/20 hover:bg-black/[0.04]"
              }
            `}
          >
            {item.label}
          </button>
        ))}
      </div>
      {selected && (
        <div
          className="mt-4 rounded-xl border border-black/[0.06] bg-[var(--color-surface)]/30 p-4"
          role="region"
          aria-labelledby="proof-panel-claim"
        >
          <p id="proof-panel-claim" className="text-sm font-medium leading-snug text-[var(--text-primary)]">
            {selected.claim}
          </p>
          {selected.relatedSignals.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selected.relatedSignals.slice(0, 3).map((s, i) => (
                <span
                  key={i}
                  className="rounded-md border border-black/10 bg-[var(--background)]/80 px-2 py-0.5 text-xs text-black/75"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => onOpenTrace(selected.traceId)}
            className="mt-3 text-sm font-medium text-[var(--text-primary)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)]/30 rounded"
          >
            {selected.ctaLabel ?? "Show reasoning"}
          </button>
        </div>
      )}
    </div>
  );
}
