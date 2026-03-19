"use client";

import { DashboardCard } from "./DashboardCard";

type LabCard = {
  name: string;
  body: string;
  relevance: string;
};

const LABS: LabCard[] = [
  {
    name: "Ferritin",
    body: "Supports energy and oxygen transport in the body.",
    relevance: "Relevant if fatigue persists despite good sleep.",
  },
  {
    name: "TSH",
    body: "Reflects thyroid function and metabolic regulation.",
    relevance: "Relevant if energy, weight, or mood begin to shift.",
  },
  {
    name: "Vitamin D",
    body: "Supports immune function, mood, and overall wellbeing.",
    relevance: "Low levels can contribute to low energy or mood changes.",
  },
];

export function LabAwarenessSection() {
  return (
    <section className="dashboard-section dashboard-shell" aria-labelledby="lab-awareness-heading">
      <h2 id="lab-awareness-heading" className="text-[20px] font-semibold tracking-tight text-[var(--text-primary)]">
        Lab awareness
      </h2>
      <p className="mt-2 max-w-[70ch] text-[14px] leading-relaxed text-black/70">
        These are not issues—just areas worth awareness based on your current signals.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LABS.map((l) => (
          <DashboardCard key={l.name} hover={false} className="p-5">
            <p className="text-[15px] font-semibold text-[var(--text-primary)]">
              {l.name}
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-black/75">
              {l.body}
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-black/65">
              <span className="font-medium text-black/75">When this may matter:</span>{" "}
              {l.relevance}
            </p>
          </DashboardCard>
        ))}
      </div>
    </section>
  );
}

