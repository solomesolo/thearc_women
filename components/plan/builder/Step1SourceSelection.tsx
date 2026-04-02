"use client";

import { useState } from "react";
import { clsx } from "clsx";
import type { BuilderState } from "./PlanBuilderShell";

type Props = {
  initialSourceArticleId: number | null;
  onNext: (data: Partial<BuilderState>) => void;
};

const SOURCE_OPTIONS = [
  {
    key: "manual",
    label: "Start from scratch",
    description: "Add your own custom steps",
    icon: "✏️",
  },
  {
    key: "articles",
    label: "From an article",
    description: "Pull from an article you saved from the Knowledge Base",
    icon: "📄",
  },
  {
    key: "protocol",
    label: "From a protocol",
    description: "Use a pre-built Arc protocol as a starting point",
    icon: "🧬",
  },
] as const;

export function Step1SourceSelection({ initialSourceArticleId, onNext }: Props) {
  const [sourceType, setSourceType] = useState<string>(
    initialSourceArticleId ? "articles" : "manual"
  );
  const [planName, setPlanName] = useState("");

  function handleNext() {
    if (!planName.trim()) return;
    onNext({ name: planName.trim(), sourceType });
  }

  return (
    <div className="space-y-6">
      {/* Plan name */}
      <div>
        <label className="text-[13px] font-medium text-[var(--text-primary)] mb-2 block">
          Plan name
        </label>
        <input
          type="text"
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          placeholder="e.g. Hormone Support, Sleep Reset"
          className="w-full rounded-[12px] border border-black/[0.09] bg-white px-4 py-3 text-[14px] text-[var(--text-primary)] placeholder:text-black/30 focus:outline-none focus:border-black/[0.25]"
          maxLength={80}
          autoFocus
        />
      </div>

      {/* Source type */}
      <div>
        <p className="text-[13px] font-medium text-[var(--text-primary)] mb-3">
          Choose source
        </p>
        <div className="space-y-2">
          {SOURCE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setSourceType(opt.key)}
              className={clsx(
                "w-full flex items-center gap-4 rounded-[14px] border px-5 py-4 text-left transition-all",
                sourceType === opt.key
                  ? "border-black/[0.25] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.12)]"
                  : "border-black/[0.07] bg-white hover:border-black/[0.16]"
              )}
            >
              <span className="text-[20px]" aria-hidden>{opt.icon}</span>
              <div>
                <p className="text-[14px] font-medium text-[var(--text-primary)]">{opt.label}</p>
                <p className="text-[12px] text-[var(--text-secondary)]">{opt.description}</p>
              </div>
              {sourceType === opt.key && (
                <span className="ml-auto text-[13px] text-emerald-500" aria-hidden>✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleNext}
        disabled={!planName.trim()}
        className="w-full rounded-[14px] bg-black/90 py-3 text-[14px] font-semibold text-white disabled:opacity-40 hover:opacity-85 transition-opacity"
      >
        Next — Add items
      </button>
    </div>
  );
}
