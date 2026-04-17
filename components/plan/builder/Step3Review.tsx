"use client";

import type { BuilderState } from "./PlanBuilderShell";

const TIMING_LABEL: Record<string, string> = {
  morning: "Morning", evening: "Evening", weekly: "Weekly", anytime: "Any time",
};

type Props = {
  state: BuilderState;
  saving: boolean;
  onBack: () => void;
  onSave: () => void;
};

export function Step3Review({ state, saving, onBack, onSave }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-black/35 mb-1">Plan name</p>
        <p className="text-[18px] font-semibold text-[var(--text-primary)]">{state.name}</p>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-black/35 mb-3">
          {state.items.length} item{state.items.length !== 1 ? "s" : ""}
        </p>
        <ul className="space-y-2">
          {state.items.map((item, i) => (
            <li key={i} className="flex items-start gap-3 rounded-[12px] border border-black/[0.07] bg-white px-4 py-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-black/[0.12] text-[11px] font-semibold text-black/40">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[var(--text-primary)]">{item.title}</p>
                {item.description && (
                  <p className="mt-0.5 text-[12px] text-[var(--text-secondary)]">{item.description}</p>
                )}
                <span className="mt-1 inline-block rounded-full border border-black/[0.08] px-2 py-0.5 text-[10px] text-black/40">
                  {TIMING_LABEL[item.timing] ?? item.timing}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={saving}
          className="rounded-[14px] border border-black/[0.09] px-5 py-3 text-[13px] text-[var(--text-secondary)] hover:border-black/[0.2] transition-colors disabled:opacity-40"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="flex-1 rounded-[14px] bg-black/90 py-3 text-[14px] font-semibold text-white disabled:opacity-60 hover:opacity-85 transition-opacity"
        >
          {saving ? "Saving…" : "Save plan"}
        </button>
      </div>
    </div>
  );
}
