"use client";

import Link from "next/link";
import type { RootPattern } from "@/types/dashboard";
import { DashboardCard } from "./DashboardCard";

type RootPatternLayerProps = {
  patterns: RootPattern[];
};

export function RootPatternLayer({ patterns }: RootPatternLayerProps) {
  const show = patterns.slice(0, 4);
  if (show.length === 0) return null;

  return (
    <section className="dashboard-section dashboard-shell" aria-labelledby="root-pattern-heading">
      <h2 id="root-pattern-heading" className="text-[17px] font-semibold text-[var(--text-primary)]">
        Root pattern layer
      </h2>
      <p className="mt-1 max-w-[680px] text-[14px] leading-relaxed text-black/70">
        Patterns we look for in your data. Not diagnostic — for awareness and context.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {show.map((p) => (
          <Link key={p.id} href={`/dashboard/pattern/${p.id}`} className="block">
            <DashboardCard as="div" className="h-full">
              <span className="text-[15px] font-medium text-[var(--text-primary)]">
                {p.title}
              </span>
              <p className="mt-2 text-[14px] leading-relaxed text-black/70">
                {p.summary}
              </p>
              <span className="mt-3 inline-block text-[13px] text-black/70 underline-offset-2 hover:underline">
                Explanation →
              </span>
            </DashboardCard>
          </Link>
        ))}
      </div>
    </section>
  );
}
