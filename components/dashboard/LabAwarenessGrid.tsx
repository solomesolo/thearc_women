"use client";

import type { Lab } from "@/types/dashboard";
import { DashboardCard } from "./DashboardCard";

type LabAwarenessGridProps = {
  labs: Lab[];
};

export function LabAwarenessGrid({ labs }: LabAwarenessGridProps) {
  if (labs.length === 0) return null;

  return (
    <section className="dashboard-section dashboard-shell" aria-labelledby="lab-awareness-heading">
      <h2 id="lab-awareness-heading" className="text-[17px] font-semibold text-[var(--text-primary)]">
        Lab awareness
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {labs.map((lab) => (
          <DashboardCard key={lab.id} hover={false}>
            <span className="text-[15px] font-medium text-[var(--text-primary)]">
              {lab.name}
            </span>
            <p className="mt-2 text-[14px] leading-relaxed text-black/70">
              {lab.reflects ?? lab.whenToCheck ?? "—"}
            </p>
          </DashboardCard>
        ))}
      </div>
      <p className="mt-4 max-w-[680px] text-[13px] leading-relaxed text-black/60">
        This is not diagnostic. Use it for awareness and to inform conversations with your care provider.
      </p>
    </section>
  );
}
