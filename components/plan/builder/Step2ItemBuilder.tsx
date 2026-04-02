"use client";

import { useState } from "react";
import type { PlanBuilderItem } from "./PlanBuilderShell";

const TIMING_OPTIONS = [
  { value: "morning", label: "Morning" },
  { value: "evening", label: "Evening" },
  { value: "weekly",  label: "Weekly" },
  { value: "anytime", label: "Any time" },
];

type Props = {
  initialItems: PlanBuilderItem[];
  onNext: (items: PlanBuilderItem[]) => void;
  onBack: () => void;
};

function ItemRow({
  item,
  index,
  onChange,
  onRemove,
}: {
  item: PlanBuilderItem;
  index: number;
  onChange: (i: number, patch: Partial<PlanBuilderItem>) => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div className="rounded-[14px] border border-black/[0.09] bg-white p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <input
          type="text"
          value={item.title}
          onChange={(e) => onChange(index, { title: e.target.value })}
          placeholder="Action title"
          className="flex-1 rounded-[10px] border border-black/[0.09] bg-[#f8f7f5] px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-black/30 focus:outline-none focus:border-black/[0.25]"
        />
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="shrink-0 text-[12px] text-black/30 hover:text-red-500 transition-colors mt-2"
          aria-label="Remove item"
        >
          ✕
        </button>
      </div>
      <input
        type="text"
        value={item.description}
        onChange={(e) => onChange(index, { description: e.target.value })}
        placeholder="Description (optional)"
        className="w-full rounded-[10px] border border-black/[0.09] bg-[#f8f7f5] px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-black/30 focus:outline-none focus:border-black/[0.25]"
      />
      <div className="flex gap-2">
        {TIMING_OPTIONS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(index, { timing: t.value })}
            className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-all ${
              item.timing === t.value
                ? "border-black/[0.25] bg-black/90 text-white"
                : "border-black/[0.09] text-black/50 hover:border-black/[0.2]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Step2ItemBuilder({ initialItems, onNext, onBack }: Props) {
  const [items, setItems] = useState<PlanBuilderItem[]>(
    initialItems.length > 0
      ? initialItems
      : [{ title: "", description: "", timing: "anytime" }]
  );

  function addItem() {
    setItems((prev) => [...prev, { title: "", description: "", timing: "anytime" }]);
  }

  function changeItem(i: number, patch: Partial<PlanBuilderItem>) {
    setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, ...patch } : item));
  }

  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleNext() {
    const valid = items.filter((i) => i.title.trim());
    if (valid.length === 0) return;
    onNext(valid);
  }

  const hasValidItems = items.some((i) => i.title.trim());

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[14px] font-medium text-[var(--text-primary)] mb-1">Add items to your plan</p>
        <p className="text-[13px] text-[var(--text-secondary)]">Each item is one action or focus area.</p>
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => (
          <ItemRow
            key={idx}
            item={item}
            index={idx}
            onChange={changeItem}
            onRemove={removeItem}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <span className="text-[16px] leading-none" aria-hidden>+</span>
        Add item
      </button>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="rounded-[14px] border border-black/[0.09] px-5 py-3 text-[13px] text-[var(--text-secondary)] hover:border-black/[0.2] transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!hasValidItems}
          className="flex-1 rounded-[14px] bg-black/90 py-3 text-[14px] font-semibold text-white disabled:opacity-40 hover:opacity-85 transition-opacity"
        >
          Review plan
        </button>
      </div>
    </div>
  );
}
