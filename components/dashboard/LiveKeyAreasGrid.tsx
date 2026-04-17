"use client";

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import type { DashboardKeyArea } from "@/lib/dashboard/types";

function severityClass(severity: string | null) {
  if (severity === "improving") return "border-emerald-200 bg-emerald-50/50";
  if (severity === "mild") return "border-amber-200 bg-amber-50/50";
  if (severity === "moderate") return "border-amber-300 bg-amber-50";
  if (severity === "mixed") return "border-black/[0.10] bg-black/[0.015]";
  return "border-black/[0.08] bg-[var(--background)]";
}

export function LiveKeyAreasGrid({ areas }: { areas: DashboardKeyArea[] }) {
  if (areas.length === 0) return null;
  return (
    <section className="dashboard-shell dashboard-section" aria-labelledby="key-areas-heading">
      <h2 id="key-areas-heading" className="text-[20px] font-semibold tracking-tight text-[var(--text-primary)]">
        Key areas
      </h2>
      <p className="mt-2 max-w-[70ch] text-[14px] leading-relaxed text-black/70">
        What&apos;s happening in your body right now, and where gentle adjustments may help.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {areas.map((a) => (
          <DashboardCard
            key={a.area}
            hover={false}
            className={["h-full", severityClass(a.severity)].join(" ")}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[15px] font-semibold text-[var(--text-primary)]">{a.title}</p>
              <span className="rounded-full border border-black/[0.10] bg-black/[0.02] px-2 py-0.5 text-[11px] font-semibold text-black/60">
                {a.state}
              </span>
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-black/75">{a.shortBody}</p>
            {a.longBody ? <p className="mt-2 text-[13px] leading-relaxed text-black/70">{a.longBody}</p> : null}
            {a.whyItMatters ? (
              <p className="mt-3 text-[13px] leading-relaxed text-black/70">
                <span className="font-medium text-black/75">Why it matters:</span> {a.whyItMatters}
              </p>
            ) : null}
            {a.whatInfluencesThis ? (
              <p className="mt-2 text-[13px] leading-relaxed text-black/65">
                <span className="font-medium text-black/75">What influences this:</span>{" "}
                {a.whatInfluencesThis}
              </p>
            ) : null}
          </DashboardCard>
        ))}
      </div>
    </section>
  );
}

