"use client";

import Link from "next/link";
import { useState } from "react";
import { HealthScoreCard } from "@/components/app/HealthScoreCard";
import { TimelineWidget } from "@/components/app/TimelineWidget";
import { useSession } from "next-auth/react";
import { useActiveProfile } from "@/lib/profile-engine-a/hooks";
import { useDashboardStatus } from "@/lib/status/useDashboardStatus";
import { RecommendationCard } from "@/components/app/RecommendationCard";
import { mapBundleStatusToBadge } from "@/lib/status/statusAdapter";
import { useApplyProgressEvent, useRecommendationProgressList } from "@/lib/progress/progressHooks";
import type { RecommendationStatus } from "@/lib/progress/progressTypes";
import { useMemo } from "react";
import { useHealthScore } from "@/lib/health-score/useHealthScore";
import { useTimeline } from "@/lib/timeline/useTimeline";
import { mapTimelineResponseToUI } from "@/lib/timeline/timelineMappers";
import { getOrCreateAnonId } from "@/lib/profile-engine-a/frontendClient";
import { useEffect } from "react";
import { useDashboardSummary } from "@/lib/dashboard-summary/useDashboardSummary";
import { useLocale } from "@/lib/i18n/useLocale";
import { t } from "@/content/i18n/appCopy";

export default function ResultsOverviewPage() {
  const { data: session } = useSession();
  const locale = useLocale();
  const { loading, profileSnapshot } = useActiveProfile();
  const userId = session?.user?.email ?? null;
  const { data: statusData } = useDashboardStatus(userId);
  const { apply } = useApplyProgressEvent({ userId });
  const { data: healthScoreData, isLoading: healthScoreLoading, error: healthScoreError, reload: reloadHealthScore } = useHealthScore();
  const { data: timelineData, isLoading: timelineLoading, error: timelineError } = useTimeline(userId);
  const { data: dashSummary, isLoading: dashLoading } = useDashboardSummary();
  const timelineUI = mapTimelineResponseToUI(timelineData);

  const isAnonymous = !session?.user?.email;
  const [saveBannerDismissed, setSaveBannerDismissed] = useState(false);

  const userName = (profileSnapshot?.userName as string | null) ?? session?.user?.email ?? "your profile";
  const summary = (profileSnapshot?.profileSummary as any) ?? {};
  const ageGroupLabel = (summary.age_group_label as string | null) ?? (profileSnapshot?.ageGroupLabel as string | null) ?? "—";
  const lifeStageLabel = (summary.life_stage_label as string | null) ?? (profileSnapshot?.lifeStageLabel as string | null) ?? "—";
  const goalsLabel = (summary.goals_label as string | null) ?? "—";
  const riskFlags = Array.isArray(profileSnapshot?.riskFlags) ? (profileSnapshot.riskFlags as string[]) : [];
  const familyHistoryFlags = Array.isArray(profileSnapshot?.familyHistoryFlags)
    ? (profileSnapshot.familyHistoryFlags as string[])
    : [];
  const completeness = healthScoreData?.score ?? null;
  const ids = useMemo(() => dashSummary?.top_priorities?.map((p) => p.bundle_key) ?? [], [dashSummary]);
  const hasSummaryPriorities = Boolean(dashSummary?.top_priorities?.length);
  const recommendationStatusById = useMemo(() => {
    const m: Record<string, RecommendationStatus> = {};
    for (const id of ids) {
      const s = statusData?.by_bundle?.[id] as any;
      const raw = (s?.recency_status ?? s?.final_status ?? "missing") as string;
      m[id] = raw === "outdated" ? "outdated" : raw === "current" ? "current" : raw === "optional" ? "optional" : "missing";
    }
    return m;
  }, [ids, statusData]);
  const { byId: progressById } = useRecommendationProgressList({ userId, ids, recommendationStatusById });

  useEffect(() => {
    // Mark results as seen so Engine I can route returning users to dashboard.
    const anonId = getOrCreateAnonId();
    fetch("/api/navigation/mark-results-seen", { method: "POST", headers: { "x-arc-anon-id": anonId } }).catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-[72rem] px-5 py-10 md:px-8">

      {/* Save your results — shown to anonymous users */}
      {isAnonymous && !saveBannerDismissed && (
        <div className="mb-8 flex flex-col gap-4 rounded-[20px] border border-black/[0.1] bg-[#0c0c0c] p-5 text-white sm:flex-row sm:items-center sm:justify-between md:p-6">
          <div className="min-w-0">
            <p className="text-[0.9375rem] font-semibold">Your results are ready — save them to your account</p>
            <p className="mt-1 text-[0.8125rem] text-white/60">
              Create a free account to keep your results, track progress, and revisit your plan any time.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/auth/register"
              className="rounded-[12px] bg-white px-4 py-2.5 text-[0.875rem] font-medium text-[#0c0c0c] transition-[filter] hover:brightness-[0.92]"
            >
              Create free account
            </Link>
            <button
              type="button"
              onClick={() => setSaveBannerDismissed(true)}
              className="text-[0.8125rem] text-white/50 hover:text-white/80"
            >
              Later
            </button>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a3a3a3]">
          {t(locale, "results.overview.eyebrow")}
        </p>
        <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-[#0c0c0c] md:text-[2rem]">
          {t(locale, "results.overview.title")}
        </h1>
        <p className="mt-2 text-[0.9375rem] text-[#737373]">
          {loading
            ? (locale === "de" ? "Profil wird geladen…" : "Loading your profile…")
            : t(locale, "results.overview.basedOn", { age: ageGroupLabel, stage: lifeStageLabel.toLowerCase() })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">

        {/* Left column */}
        <div className="space-y-5">

          {/* Score + summary */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr]">
            <HealthScoreCard
              score={completeness ?? 0}
              subtitle={healthScoreData?.widget?.subtitle ?? (healthScoreLoading ? "Loading…" : healthScoreError ? "Score unavailable" : "Based on your current health data")}
            />

            <div className="rounded-[20px] border border-black/[0.08] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.03)] md:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                Your profile (Engine A)
              </p>
              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-[#a3a3a3]">
                    Hello
                  </p>
                  <p className="mt-1 text-[0.9375rem] text-[#404040]">{userName}</p>
                </div>
                <div>
                  <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-[#a3a3a3]">
                    Summary
                  </p>
                  <div className="mt-2 grid grid-cols-1 gap-2 text-[0.9375rem] text-[#404040]">
                    <div>Age group: <span className="font-medium text-[#0c0c0c]">{ageGroupLabel}</span></div>
                    <div>Life stage: <span className="font-medium text-[#0c0c0c]">{lifeStageLabel}</span></div>
                    <div>Goals: <span className="font-medium text-[#0c0c0c]">{goalsLabel}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile signals (real) */}
          <div className="rounded-[20px] border border-black/[0.08] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.03)] md:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
              Signals from your answers
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {(riskFlags.length ? riskFlags : ["No signals flagged yet"]).map((flag) => (
                <span
                  key={flag}
                  className="rounded-full border border-black/[0.08] bg-[#fafaf9] px-2.5 py-1 text-[0.8125rem] text-[#525252]"
                >
                  {flag}
                </span>
              ))}
            </div>
          </div>

          {/* Recommendations (Engine H + Engine C/D + Engine E rationale) */}
          <div className="space-y-4">
            <div className="rounded-[20px] border border-black/[0.08] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.03)] md:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                Top priorities
              </p>
              <p className="mt-3 text-[0.9375rem] leading-[1.65] text-[#404040]">
                These are your highest-impact checks to action next, based on your current status and score gaps.
              </p>
            </div>
            {(dashLoading || !hasSummaryPriorities) && (
              <div className="rounded-[20px] border border-black/[0.08] bg-white p-5 text-[0.9375rem] text-[#737373] md:p-6">
                Loading your top priorities…
              </div>
            )}

            {hasSummaryPriorities && (dashSummary?.top_priorities ?? []).map((p) => {
              const bundleKey = p.bundle_key as string;
              const status = bundleKey ? (statusData?.by_bundle?.[bundleKey] as any) : null;
              const badge = status ? mapBundleStatusToBadge(status) : null;
              const progress = progressById.get(bundleKey) ?? null;
              const isTopGap = Boolean(healthScoreData?.top_gaps?.includes(bundleKey));
              const scoreMeta = healthScoreData?.bundle_breakdown?.find((x) => x.bundle_key === bundleKey) ?? null;
              const whyBits = (scoreMeta?.rationale ?? []).slice(0, 3);
              const whyBody =
                whyBits.length > 0
                  ? `Relevance signals: ${whyBits.join(", ")}.`
                  : "This check is prioritized based on your current status and profile signals.";

              const applyAndRefresh = async (req: Parameters<typeof apply>[0]) => {
                await apply(req);
                await reloadHealthScore();
              };
              return (
                <RecommendationCard
                  key={bundleKey}
                  card={{
                    id: bundleKey,
                    bundleKey,
                    country: (profileSnapshot as any)?.country ?? "DE",
                    testName: p.display_name,
                    statusBadge: (badge?.label as any) ?? (p.badge_label === "OUTDATED" ? "Outdated" : p.badge_label === "MISSING" ? "Missing" : "Recommended"),
                    priority: p.rank,
                    whyTitle: "Why this matters now",
                    whyBody,
                    labsTitle: "Book at a lab",
                    labs: [{ name: "Local lab", price: "—", address: "Choose a nearby lab", note: "", mapsHref: "#" }],
                    homeTitle: "Home test",
                    homeTests: [{ name: "Home test option", price: "—", descriptor: "If available in your area", orderHref: "#" }],
                    doctorTitle: "Through your doctor",
                    doctorLines: ["Bring this recommendation to your next appointment", "Ask if it can be added to routine bloodwork"],
                    ctaBook: "Book at lab",
                    ctaBookHref: "#",
                    ctaOrder: "Order home test",
                    ctaOrderHref: "#",
                    ctaPlanned: "Mark as planned",
                    ctaDone: "Mark as done",
                  } as any}
                  engineStatus={status}
                  isTopGap={isTopGap}
                  scoreMeta={scoreMeta as any}
                  progress={
                    progress
                      ? { progress_state: progress.progress_state, selected_route: progress.selected_route }
                      : null
                  }
                  onBookAtLab={() =>
                    applyAndRefresh({
                      recommendation_instance_id: bundleKey,
                      event_type: "select_lab_option",
                      selected_route: "lab",
                      selected_action_option_id: "act_lab_default",
                      selected_product_id: "prod_lab_default",
                    })
                  }
                  onOrderHomeTest={() =>
                    applyAndRefresh({
                      recommendation_instance_id: bundleKey,
                      event_type: "select_home_test_option",
                      selected_route: "home_test",
                      selected_action_option_id: "act_home_default",
                      selected_product_id: "prod_home_default",
                    })
                  }
                  onMarkPlanned={() => applyAndRefresh({ recommendation_instance_id: bundleKey, event_type: "mark_planned" })}
                  onMarkDone={() => applyAndRefresh({ recommendation_instance_id: bundleKey, event_type: "mark_completed" })}
                />
              );
            })}
          </div>

        </div>

        {/* Right column */}
        <div className="space-y-5">
          <TimelineWidget
            isLoading={timelineLoading}
            errorText={timelineError ? "Upcoming checks unavailable right now." : null}
            nextCheckTitle={timelineUI.firstUpcomingCheck?.title ?? null}
            entries={timelineUI.groupedTimeline
              .flatMap((g) => g.items.map((it) => ({ month: g.labelText, item: it.title })))
              .slice(0, 6)}
          />

          {/* Quick stat */}
          <div className="rounded-[20px] border border-black/[0.08] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
              Family history (Engine A)
            </p>
            <p className="mt-2 font-mono text-[2.5rem] font-semibold tabular-nums leading-none text-[#0c0c0c]">
              {familyHistoryFlags.length}
            </p>
            <p className="mt-1 text-[0.8125rem] text-[#737373]">items noted</p>
          </div>

          {/* CTA to action plan */}
          <Link
            href="/results/action-plan"
            className="flex w-full items-center justify-between rounded-[20px] border border-black/[0.08] bg-[#0c0c0c] p-5 text-white shadow-[0_1px_0_rgba(0,0,0,0.03)] transition-[filter] hover:brightness-[0.88]"
          >
            <div>
              <p className="text-[0.875rem] font-semibold">See your action plan</p>
              <p className="mt-0.5 text-[0.8125rem] text-white/60">
                Step-by-step — labs, home tests, doctor
              </p>
            </div>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden className="shrink-0 opacity-60">
              <path d="M4 10h12M11 4l6 6-6 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

      </div>
    </div>
  );
}
