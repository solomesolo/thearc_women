"use client";

import { RECENCY_OPTIONS, type RecencyOption } from "@/content/onboarding/survey-options";

type Props = {
  label: string;
  value: RecencyOption | "";
  onChange: (v: RecencyOption) => void;
};

export function TestRecencyRow({ label, value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2 rounded-[14px] border border-black/[0.08] bg-white/[0.55] p-4 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-[0.9375rem] font-medium text-[#0c0c0c]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as RecencyOption)}
        className="w-full rounded-[10px] border border-black/[0.1] bg-white px-3 py-2 text-[0.875rem] text-[#404040] focus:border-[#0c0c0c]/[0.4] focus:outline-none sm:w-auto sm:min-w-[200px]"
      >
        <option value="">Select…</option>
        {RECENCY_OPTIONS.map((opt) => (
          <option key={opt.key} value={opt.key}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
