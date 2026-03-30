"use client";

import Link from "next/link";
import { DashboardCard } from "@/components/dashboard/DashboardCard";

export function DashboardEmptyState() {
  return (
    <section className="dashboard-shell pt-8 pb-8">
      <DashboardCard hover={false}>
        <p className="text-[12px] font-semibold uppercase tracking-wider text-black/55">
          Your health baseline
        </p>
        <h2 className="mt-2 text-[24px] font-semibold tracking-tight text-[var(--text-primary)]">
          We’re building your baseline
        </h2>
        <p className="mt-2 max-w-[70ch] text-[15px] leading-relaxed text-black/70">
          Complete more tracking to make the dashboard more personalized.
        </p>
        <Link
          href="/survey"
          className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-black/90 px-4 text-[13px] font-semibold text-white no-underline transition-opacity hover:opacity-90"
        >
          Start or continue assessment
        </Link>
      </DashboardCard>
    </section>
  );
}

