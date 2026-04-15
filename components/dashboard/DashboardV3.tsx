"use client";

import Link from "next/link";
import type { DashboardPayload } from "@/lib/dashboard/types";
import type { StartingLineViewModel } from "@/lib/dashboard/startingLineTypes";
import { StartingLineSection } from "./StartingLineSection";
import { TodayThisWeekCard } from "./TodayThisWeekCard";
import { HeroHealthBaseline } from "./HeroHealthBaseline";
import { BodySystemsOverview } from "./BodySystemsOverview";
import { WhatToWatchNow } from "./WhatToWatchNow";
import { WeeklyInsightsSummary } from "./WeeklyInsightsSummary";
import { PrioritiesRightNow } from "./PrioritiesRightNow";
import { ProgressTrendsCard } from "./ProgressTrendsCard";
import { LabAwarenessSection } from "./LabAwarenessSection";
import { RecommendedForYou } from "./RecommendedForYou";
import { PreventiveStrategiesToExplore } from "./PreventiveStrategiesToExplore";
import { UnderlyingPatternsAdvanced } from "./UnderlyingPatternsAdvanced";
import { TrackTheseOverTime } from "./TrackTheseOverTime";
import { useEffect, useState } from "react";

const KEY_LEVER_LABELS: Record<string, string> = {
  sleep_consistency: "Improve sleep consistency",
  recovery: "Prioritize recovery first",
  stress_reduction: "Reduce overall stress load",
  energy_stability: "Support energy stability",
  metabolic_stability: "Support metabolic stability",
  nutrition_timing: "Optimize nutrition timing",
  cycle_alignment: "Align activity with your cycle",
  hormonal_balance: "Support hormonal balance",
  iron_support: "Support iron and energy levels",
};

function RightRailCard({
  title,
  body,
  ctaLabel,
}: {
  title: string;
  body: string;
  ctaLabel?: string;
}) {
  return (
    <div className="rounded-[24px] border border-black/[0.08] bg-[var(--background)] p-6 shadow-[0_1px_0_rgba(12,12,12,0.04),0_10px_22px_rgba(12,12,12,0.04)]">
      <p className="text-[15px] font-semibold text-[var(--text-primary)]">{title}</p>
      <p className="mt-2 text-[14px] leading-relaxed text-black/70">{body}</p>
      {ctaLabel ? (
        <button
          type="button"
          className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-black/90 px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2"
        >
          {ctaLabel}
        </button>
      ) : null}
    </div>
  );
}

type HealthDataSummary = {
  observationsCount: number;
  imagingCount: number;
  lastObservationDate: string | null;
  recentUploads: {
    documentId: string;
    fileName: string;
    mimeType: string;
    uploadedAt: string;
    processingStatus: string;
    documentType: string | null;
    documentTypeConfidence: number | null;
  }[];
};

function HealthDataCard() {
  const [data, setData] = useState<HealthDataSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/health-data/summary?limit=5");
        if (!res.ok) return;
        const json: HealthDataSummary = await res.json();
        if (!cancelled) setData(json);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const last = data?.lastObservationDate
    ? new Date(data.lastObservationDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  return (
    <div className="rounded-[24px] border border-black/[0.08] bg-[var(--background)] p-6 shadow-[0_1px_0_rgba(12,12,12,0.04),0_10px_22px_rgba(12,12,12,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[15px] font-semibold text-[var(--text-primary)]">Your health data</p>
          <p className="mt-1 text-[13px] leading-relaxed text-black/60">
            All extracted results, imaging notes, and trends.
          </p>
        </div>
        <Link
          href="/upload/files"
          className="shrink-0 rounded-xl bg-black/90 px-3 py-2 text-[12px] font-semibold text-white hover:opacity-90 transition-opacity no-underline"
        >
          + Upload
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-[14px] border border-black/[0.07] bg-white px-3 py-3">
          <p className="text-[11px] text-black/40">Observations</p>
          <p className="mt-1 text-[15px] font-semibold text-[var(--text-primary)]">
            {data ? String(data.observationsCount) : "—"}
          </p>
        </div>
        <div className="rounded-[14px] border border-black/[0.07] bg-white px-3 py-3">
          <p className="text-[11px] text-black/40">Imaging</p>
          <p className="mt-1 text-[15px] font-semibold text-[var(--text-primary)]">
            {data ? String(data.imagingCount) : "—"}
          </p>
        </div>
        <div className="rounded-[14px] border border-black/[0.07] bg-white px-3 py-3">
          <p className="text-[11px] text-black/40">Last updated</p>
          <p className="mt-1 text-[12px] font-semibold text-[var(--text-primary)]">{last}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/health-data/observations"
          className="rounded-full border border-black/[0.1] bg-white px-3 py-1.5 text-[12px] font-medium text-[var(--text-primary)] hover:bg-black/[0.03] transition-colors no-underline"
        >
          Observations
        </Link>
        <Link
          href="/health-data/trends"
          className="rounded-full border border-black/[0.1] bg-white px-3 py-1.5 text-[12px] font-medium text-[var(--text-primary)] hover:bg-black/[0.03] transition-colors no-underline"
        >
          Trends
        </Link>
        <Link
          href="/health-data/imaging"
          className="rounded-full border border-black/[0.1] bg-white px-3 py-1.5 text-[12px] font-medium text-[var(--text-primary)] hover:bg-black/[0.03] transition-colors no-underline"
        >
          Imaging
        </Link>
      </div>

      {data?.recentUploads?.length ? (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/35">
            Recent uploads
          </p>
          <div className="mt-2 space-y-2">
            {data.recentUploads.slice(0, 3).map((u) => (
              <Link
                key={u.documentId}
                href={`/upload/${u.documentId}`}
                className="block rounded-[14px] border border-black/[0.07] bg-white px-3 py-2 no-underline hover:border-black/[0.14] transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-medium text-[var(--text-primary)]">
                      {u.fileName}
                    </p>
                    <p className="mt-0.5 text-[11px] text-black/40">
                      {(u.documentType ?? "document").replace(/_/g, " ")} · {u.processingStatus}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] text-black/35">
                    {new Date(u.uploadedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

type Props = {
  payload: DashboardPayload | null;
  startingLine?: StartingLineViewModel | null;
};

export function DashboardV3({ payload, startingLine }: Props) {
  const keyAreas = payload?.keyAreas ?? [];
  const signals = payload?.signals ?? [];
  const hero = payload?.hero ?? null;

  // Build right-rail "priorities" copy — prefer engine-resolved startingLine over old payload.
  const resolvedFocusLabel = startingLine?.debug.source === "resolved_run"
    ? startingLine.focus?.label
    : (hero?.keyLever ? (KEY_LEVER_LABELS[hero.keyLever] ?? hero.keyLever) : null);

  const resolvedTopAreas = startingLine?.debug.source === "resolved_run" && startingLine.keyAreas.length > 0
    ? startingLine.keyAreas.slice(0, 3).map((ka) => ka.title || ka.code).join(" · ")
    : keyAreas.slice(0, 3).map((a) => a.title || a.area).join(" · ");

  const prioritiesBody = resolvedFocusLabel
    ? `If you do only one thing this week: ${resolvedFocusLabel.toLowerCase()}.`
    : "Focus on consistent sleep and recovery this week.";

  const startWith3Body = resolvedTopAreas.length > 0
    ? resolvedTopAreas
    : "Sleep consistency · Recovery / HRV · Energy";

  return (
    <div className="dashboard-shell">
      <div className="dashboard-section-stack pt-6 md:pt-8">
        <StartingLineSection payload={payload} startingLine={startingLine ?? null} />

        {/* Top row: left stack (8/12) + right rail (4/12) */}
        <div className="dashboard-grid-12 items-start">
          <div className="col-span-12 lg:col-span-8">
            <div className="flex flex-col gap-7">
              <TodayThisWeekCard keyAreas={keyAreas} />
              <HeroHealthBaseline hero={hero} keyAreas={keyAreas} />
            </div>
          </div>
          <aside className="col-span-12 lg:col-span-4">
            <div className="flex flex-col gap-5">
              <HealthDataCard />
              <RightRailCard
                title="Planning your next check-up?"
                body="Turn your current signals into a simple agenda so you can use your visit efficiently."
                ctaLabel="Prepare my visit"
              />
              <RightRailCard
                title="Your priorities this week"
                body={prioritiesBody}
              />
              <RightRailCard
                title="Start with these"
                body={startWith3Body}
              />
            </div>
          </aside>
        </div>

        <BodySystemsOverview keyAreas={keyAreas} />

        {/* Watch + weekly row (7/12 + 5/12) */}
        <div className="dashboard-grid-12">
          <div className="col-span-12 lg:col-span-7">
            <WhatToWatchNow keyAreas={keyAreas} signals={signals} />
          </div>
          <div className="col-span-12 lg:col-span-5">
            <WeeklyInsightsSummary />
          </div>
        </div>

        <PrioritiesRightNow />
        <TrackTheseOverTime />

        {/* Progress + labs row */}
        <div className="dashboard-grid-12">
          <div className="col-span-12 lg:col-span-7">
            <ProgressTrendsCard />
          </div>
          <div className="col-span-12 lg:col-span-5">
            <LabAwarenessSection />
          </div>
        </div>

        <RecommendedForYou />
        <PreventiveStrategiesToExplore />
        <UnderlyingPatternsAdvanced />
      </div>
    </div>
  );
}
