"use client";

import Link from "next/link";
import type { BundleStatus } from "@/lib/status/statusApi";
import { badgeClassName, ctaIntentForFinalStatus, mapBundleStatusToBadge } from "@/lib/status/statusAdapter";
import type { ProgressState, SelectedRoute } from "@/lib/progress/progressTypes";
import { InsuranceAndDoctorGuidanceCard } from "@/components/app/InsuranceAndDoctorGuidanceCard";
import { useDoctorGuidance } from "@/lib/doctor-guidance/useDoctorGuidance";

type LabEntry = { name: string; price: string; address: string; note: string; mapsHref: string };
type HomeTestEntry = { name: string; price: string; descriptor: string; orderHref: string };

export type RecommendationCardData = {
  id: string;
  bundleKey?: string;
  country?: string | null;
  testName: string;
  statusBadge: "Missing" | "Outdated" | "Recommended";
  priority: number;
  whyTitle: string;
  whyBody: string;
  labsTitle: string;
  labs: LabEntry[];
  homeTitle: string;
  homeTests: HomeTestEntry[];
  doctorTitle: string;
  doctorLines: string[];
  ctaBook: string;
  ctaBookHref: string;
  ctaOrder: string;
  ctaOrderHref: string;
  ctaPlanned: string;
  ctaDone: string;
};

const STATUS_COLORS: Record<RecommendationCardData["statusBadge"], string> = {
  Missing: "bg-[#0c0c0c] text-white",
  Outdated: "bg-[#525252] text-white",
  Recommended: "bg-[#404040] text-white",
};

function IconPin() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className="shrink-0 text-[#737373]">
      <path d="M6 1a3 3 0 0 1 3 3c0 2-3 7-3 7S3 6 3 4a3 3 0 0 1 3-3Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
      <circle cx="6" cy="4" r="1" fill="currentColor" opacity="0.5"/>
    </svg>
  );
}
function IconHome() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className="shrink-0 text-[#737373]">
      <path d="M1 6l5-5 5 5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2.5 5v5.5h7V5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconDoc() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className="shrink-0 text-[#737373]">
      <rect x="2" y="1" width="8" height="10" rx="1.2" stroke="currentColor" strokeWidth="1.1"/>
      <path d="M4 4h4M4 6.5h4M4 9h2" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  );
}

export function RecommendationCard({
  card,
  engineStatus,
  progress,
  isTopGap,
  scoreMeta,
  timelineContext,
  followUpHint,
  onBookAtLab,
  onOrderHomeTest,
  onMarkPlanned,
  onMarkDone,
}: {
  card: RecommendationCardData;
  engineStatus?: BundleStatus | null;
  progress?: {
    progress_state: ProgressState;
    selected_route: SelectedRoute;
  } | null;
  isTopGap?: boolean;
  scoreMeta?: {
    status?: string;
    relevance_weight?: number;
    coverage_ratio?: number;
    numerator_value?: number;
  } | null;
  timelineContext?: string | null;
  followUpHint?: string | null;
  onBookAtLab?: () => void;
  onOrderHomeTest?: () => void;
  onMarkPlanned?: () => void;
  onMarkDone?: () => void;
}) {
  const badge = engineStatus ? mapBundleStatusToBadge(engineStatus) : null;
  const cta = engineStatus ? ctaIntentForFinalStatus(engineStatus.final_status) : null;
  const progressState = progress?.progress_state ?? "not_started";
  const selectedRoute = progress?.selected_route ?? null;
  const isCompleted = progressState === "completed";
  const isPlanned = progressState === "planned";

  const { data: doctorGuidance, isLoading: guidanceLoading } = useDoctorGuidance(card.bundleKey, card.country);

  return (
    <div
      className={`overflow-hidden rounded-[24px] border bg-white shadow-[0_4px_32px_rgba(0,0,0,0.07)] ${
        isCompleted ? "border-black/[0.12] opacity-[0.92]" : "border-black/[0.1]"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-black/[0.07] px-6 py-5 md:px-8 md:py-6">
        <div>
          <h3 className="text-[1.125rem] font-semibold leading-snug tracking-tight text-[#0c0c0c] md:text-[1.25rem]">
            {card.testName}
          </h3>
          <p className="mt-1 text-[0.875rem] text-[#737373]">
            Priority {card.priority} — recommended now
          </p>
          {timelineContext && (
            <p className="mt-1 text-[0.8125rem] text-[#737373]">{timelineContext}</p>
          )}
          {followUpHint && (
            <p className="mt-1 text-[0.8125rem] text-[#a3a3a3]">{followUpHint}</p>
          )}
          {isTopGap && (
            <p className="mt-2 inline-flex items-center rounded-full border border-black/[0.1] bg-white px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[#0c0c0c]">
              High impact
            </p>
          )}
          <p className="mt-1 text-[0.8125rem] text-[#a3a3a3]">
            {isCompleted ? "Completed" : isPlanned ? "Planned" : "Not started"}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-[0.75rem] font-semibold uppercase tracking-[0.1em] ${
            badge ? badgeClassName(badge.tone) : STATUS_COLORS[card.statusBadge]
          }`}
        >
          {badge ? badge.label : card.statusBadge}
        </span>
      </div>

      {/* Why */}
      <div className="border-b border-black/[0.07] bg-[#fafaf9] px-6 py-5 md:px-8 md:py-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">{card.whyTitle}</p>
        <p className="mt-2.5 text-[0.9375rem] leading-[1.65] text-[#404040]">{card.whyBody}</p>
      </div>

      {/* Action columns */}
      <div className="grid grid-cols-1 divide-y divide-black/[0.07] md:grid-cols-3 md:divide-x md:divide-y-0">
        {/* Labs */}
        <div className="px-6 py-5 md:px-7 md:py-6">
          <div className="mb-4 flex items-center gap-2">
            <IconPin />
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">{card.labsTitle}</p>
          </div>
          <div className="space-y-3">
            {card.labs.map((lab) => (
              <div key={lab.name} className="rounded-[12px] border border-black/[0.07] bg-[#fafaf9] p-3.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[0.9375rem] font-semibold text-[#0c0c0c]">{lab.name}</span>
                  <span className="shrink-0 text-[0.9375rem] font-semibold text-[#0c0c0c]">{lab.price}</span>
                </div>
                <p className="mt-1 text-[0.8125rem] leading-snug text-[#737373]">{lab.address}</p>
                {lab.note && <p className="mt-1 text-[0.75rem] font-medium text-[#a3a3a3]">{lab.note}</p>}
                <Link href={lab.mapsHref} className="mt-2.5 inline-flex items-center gap-1 rounded-[8px] border border-black/[0.1] bg-white px-3 py-1.5 text-[0.8125rem] font-medium text-[#404040] transition-colors hover:bg-[#f0f0ef]">
                  Open in Maps
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Home tests */}
        <div className="px-6 py-5 md:px-7 md:py-6">
          <div className="mb-4 flex items-center gap-2">
            <IconHome />
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">{card.homeTitle}</p>
          </div>
          <div className="space-y-3">
            {card.homeTests.map((t) => (
              <div key={t.name} className="rounded-[12px] border border-black/[0.07] bg-[#fafaf9] p-3.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[0.9375rem] font-semibold text-[#0c0c0c]">{t.name}</span>
                  <span className="shrink-0 text-[0.9375rem] font-semibold text-[#0c0c0c]">{t.price}</span>
                </div>
                <p className="mt-1 text-[0.8125rem] leading-snug text-[#737373]">{t.descriptor}</p>
                <Link href={t.orderHref} className="mt-2.5 inline-flex items-center gap-1 rounded-[8px] border border-black/[0.1] bg-white px-3 py-1.5 text-[0.8125rem] font-medium text-[#404040] transition-colors hover:bg-[#f0f0ef]">
                  Order online
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Doctor / insurance guidance */}
        <div className="px-6 py-5 md:px-7 md:py-6">
          <div className="mb-4 flex items-center gap-2">
            <IconDoc />
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
              Through your doctor
            </p>
          </div>
          <InsuranceAndDoctorGuidanceCard
            guidance={doctorGuidance}
            isLoading={guidanceLoading}
            country={card.country}
          />
        </div>
      </div>

      {/* CTA row */}
      <div className="border-t border-black/[0.07] bg-[#fafaf9] px-6 py-4 md:px-8">
        {cta?.supportLine && (
          <p className="mb-3 text-[0.8125rem] text-[#737373]">{cta.supportLine}</p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onBookAtLab}
            disabled={isCompleted}
            className={`rounded-[10px] px-4 py-2.5 text-[0.875rem] font-medium transition-[filter] ${
              isCompleted
                ? "border border-black/[0.12] bg-white text-[#a3a3a3]"
                : selectedRoute === "lab"
                  ? "bg-[#0c0c0c] text-white"
                  : cta?.emphasizePrimary === false
                ? "border border-black/[0.14] bg-white text-[#0c0c0c] hover:bg-[#f5f5f4]"
                : "bg-[#0c0c0c] text-white hover:brightness-[0.9]"
            }`}
          >
            {selectedRoute === "lab" ? "Booked at lab" : card.ctaBook}
          </button>

          <button
            type="button"
            onClick={onOrderHomeTest}
            disabled={isCompleted}
            className={`rounded-[10px] border px-4 py-2.5 text-[0.875rem] font-medium transition-colors ${
              isCompleted
                ? "border-black/[0.12] bg-white text-[#a3a3a3]"
                : selectedRoute === "home_test"
                  ? "border-[#0c0c0c]/[0.2] bg-[#0c0c0c]/[0.05] text-[#0c0c0c]"
                  : "border-black/[0.14] bg-white text-[#0c0c0c] hover:bg-[#f5f5f4]"
            }`}
          >
            {selectedRoute === "home_test" ? "Home test selected" : card.ctaOrder}
          </button>

          <button
            type="button"
            onClick={onMarkPlanned}
            disabled={cta?.disablePlan === true}
            className={`rounded-[10px] border px-4 py-2.5 text-[0.875rem] transition-colors ${
              isCompleted
                ? "border-black/[0.12] bg-white text-[#a3a3a3]"
                : isPlanned
                  ? "border-[#0c0c0c]/[0.2] bg-[#0c0c0c]/[0.05] text-[#0c0c0c]"
                  : "border-black/[0.1] bg-white text-[#737373] hover:bg-[#f5f5f4]"
            }`}
          >
            {isPlanned ? "Planned" : card.ctaPlanned}
          </button>
          <button
            type="button"
            onClick={onMarkDone}
            disabled={cta?.disableDone === true}
            className={`rounded-[10px] border px-4 py-2.5 text-[0.875rem] transition-colors ${
              isCompleted
                ? "border-[#0c0c0c]/[0.2] bg-[#0c0c0c]/[0.05] text-[#0c0c0c]"
                : "border-black/[0.1] bg-white text-[#737373] hover:bg-[#f5f5f4]"
            }`}
          >
            {isCompleted ? "Done" : card.ctaDone}
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 text-[0.75rem] text-[#a3a3a3]">
          <span>
            {selectedRoute === "lab" ? "Route: Lab" : selectedRoute === "home_test" ? "Route: Home test" : selectedRoute ? `Route: ${selectedRoute}` : "Route: —"}
          </span>
          <span className="hidden sm:inline">
            <Link href={card.ctaBookHref} className="underline underline-offset-2 hover:text-[#737373]">
              Details
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
