"use client";

import Link from "next/link";
import type { MonitoringArea } from "@/types/dashboard";
import { DashboardCard } from "./DashboardCard";

type WhatToWatchGridProps = {
  areas: MonitoringArea[];
};

function monitoringHref(area: MonitoringArea): string {
  if (area.slug) return `/knowledge/${area.slug}`;
  return `/dashboard/monitoring/${area.id}`;
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
              <span className="mt-3 inline-block text-[14px] text-black/70 underline-offset-2 hover:underline">
                Why this matters
              </span>
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
              <span className="mt-3 inline-block text-[14px] text-black/70 underline-offset-2 hover:underline">
                Why this matters
              </span>
            </DashboardCard>
          </Link>
        ))}
      </div>
    </>
  );
}
