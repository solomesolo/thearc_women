"use client";

import Link from "next/link";
import type { MonitoringArea } from "@/types/dashboard";
import { DashboardCard } from "./DashboardCard";

type MonitoringAreasRowProps = {
  areas: MonitoringArea[];
};

function monitoringHref(area: MonitoringArea): string {
  if (area.slug) return `/knowledge/${area.slug}`;
  return `/dashboard/monitoring/${area.id}`;
}

export function MonitoringAreasRow({ areas }: MonitoringAreasRowProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {areas.slice(0, 5).map((area) => (
        <Link
          key={area.id}
          href={monitoringHref(area)}
          className="block"
        >
          <DashboardCard as="div" className="h-full">
            <span className="text-[15px] font-medium text-[var(--text-primary)]">
              {area.label}
            </span>
            {area.description && (
              <span className="mt-1 line-clamp-2 block text-[13px] leading-relaxed text-black/70">
                {area.description}
              </span>
            )}
          </DashboardCard>
        </Link>
      ))}
    </div>
  );
}
