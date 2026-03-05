"use client";

import Link from "next/link";
import type { Priority } from "@/types/dashboard";
import { DashboardCard } from "./DashboardCard";

type BiologicalPrioritiesProps = {
  priorities: Priority[];
};

function frameworkHref(p: Priority): string {
  if (p.frameworkId) return `/dashboard/framework/${p.frameworkId}`;
  return `/dashboard/framework/${p.id}`;
}

export function BiologicalPriorities({ priorities }: BiologicalPrioritiesProps) {
  const top3 = priorities.slice(0, 3);
  if (top3.length === 0) return null;

  return (
    <section className="dashboard-section dashboard-shell" aria-labelledby="biological-priorities-heading">
      <h2 id="biological-priorities-heading" className="text-[17px] font-semibold text-[var(--text-primary)]">
        Biological priorities
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {top3.map((p) => (
          <Link key={p.id} href={frameworkHref(p)} className="block">
            <DashboardCard as="div" className="h-full">
              <span className="text-[15px] font-medium text-[var(--text-primary)]">
                {p.label}
              </span>
              <p className="mt-2 text-[14px] leading-relaxed text-black/70">
                {p.focus}
              </p>
              <span className="mt-3 inline-block text-[13px] text-black/70 underline-offset-2 hover:underline">
                View framework →
              </span>
            </DashboardCard>
          </Link>
        ))}
      </div>
    </section>
  );
}
