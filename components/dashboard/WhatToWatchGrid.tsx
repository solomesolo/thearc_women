"use client";

import Link from "next/link";
import type { MonitoringArea } from "@/types/dashboard";
import { DashboardCard } from "./DashboardCard";

type WhatToWatchGridProps = {
  areas: MonitoringArea[];
};

function monitoringHref(area: MonitoringArea): string {
  if (area.slug) return `/blog/${area.slug}`;
  return `/dashboard/monitoring/${area.id}`;
}

function whyThisMatters(area: MonitoringArea): string {
  const key = `${area.id} ${area.label}`.toLowerCase();
  if (key.includes("sleep")) return "Sleep consistency affects energy and hormone balance.";
  if (key.includes("recovery") || key.includes("hrv"))
    return "Recovery trends help you balance load and avoid slow fatigue build-up.";
  if (key.includes("energy")) return "Energy stability often reflects sleep, stress, and fueling.";
  return "This signal is a high-leverage input to your baseline.";
}

/**
 * Desktop: 3 cols. Tablet: 2 cols. Mobile: horizontal scroll with snap, min-width 280px.
 * Cards: title (2 lines max), 1 sentence body, optional "Why this matters" link.
 */
export function WhatToWatchGrid({ areas }: WhatToWatchGridProps) {
  const list = areas.slice(0, 5);

  return (
    <>
      {/* Desktop + tablet: grid. Min column width so body copy stays 2–3 lines. */}
      <div className="hidden grid-cols-1 gap-4 sm:grid sm:grid-cols-2 sm:gap-5 lg:grid lg:gap-5 lg:[grid-template-columns:repeat(3,minmax(280px,1fr))]">
        {list.map((area) => (
          <Link key={area.id} href={monitoringHref(area)} className="block min-w-0">
            <DashboardCard as="div" className="h-full min-w-0">
              <span className="line-clamp-2 text-[15px] font-medium leading-snug text-[var(--text-primary)]">
                {area.label}
              </span>
              {area.description && (
                <p className="mt-2 line-clamp-3 text-[14px] leading-relaxed text-black/70">
                  {area.description}
                </p>
              )}
              <p className="mt-3 text-[13px] leading-relaxed text-black/70">
                <span className="font-medium text-black/80">Why this matters:</span>{" "}
                {whyThisMatters(area)}
              </p>
            </DashboardCard>
          </Link>
        ))}
      </div>

      {/* Mobile: horizontal scroll with snap */}
      <div className="flex gap-4 overflow-x-auto pb-2 scroll-smooth px-[1px] sm:hidden [scroll-snap-type:x_mandatory]">
        {list.map((area) => (
          <Link
            key={area.id}
            href={monitoringHref(area)}
            className="w-[min(280px,85vw)] shrink-0 snap-start"
          >
            <DashboardCard as="div" className="h-full min-h-[120px]">
              <span className="line-clamp-2 text-[15px] font-medium leading-snug text-[var(--text-primary)]">
                {area.label}
              </span>
              {area.description && (
                <p className="mt-2 line-clamp-3 text-[14px] leading-relaxed text-black/70">
                  {area.description}
                </p>
              )}
              <p className="mt-3 text-[13px] leading-relaxed text-black/70">
                <span className="font-medium text-black/80">Why this matters:</span>{" "}
                {whyThisMatters(area)}
              </p>
            </DashboardCard>
          </Link>
        ))}
      </div>
    </>
  );
}
