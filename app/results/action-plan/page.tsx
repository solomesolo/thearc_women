"use client";

import Link from "next/link";
import { RecommendationCard } from "@/components/app/RecommendationCard";
import { useActiveProfile } from "@/lib/profile-engine-a/hooks";
import { useSession } from "next-auth/react";
import { useDashboardStatus } from "@/lib/status/useDashboardStatus";
import { mapBundleStatusToBadge } from "@/lib/status/statusAdapter";
import { useApplyProgressEvent, useRecommendationProgressList } from "@/lib/progress/progressHooks";
import type { RecommendationStatus } from "@/lib/progress/progressTypes";
import { useMemo } from "react";
import { useHealthScore } from "@/lib/health-score/useHealthScore";
import { ActionPlanScoreSummary } from "@/components/app/ActionPlanScoreSummary";
import { useDashboardSummary } from "@/lib/dashboard-summary/useDashboardSummary";
import { ProtectedRouteGate } from "@/components/navigation/ProtectedRouteGate";
import { useLocale } from "@/lib/i18n/useLocale";
import { t } from "@/content/i18n/appCopy";

function statusBadgeFromEngineH(badgeLabel: string): "Missing" | "Outdated" | "Recommended" {
  const x = (badgeLabel || "").toUpperCase();
  if (x === "MISSING") return "Missing";
  if (x === "OUTDATED") return "Outdated";
  if (x === "PLANNED" || x === "DONE" || x === "CURRENT") return "Recommended";
  return "Recommended";
}

export default function ActionPlanPage() {
  const { data: session } = useSession();
  const locale = useLocale();
  const isAnonymous = !session?.user?.email;
  const { profileSnapshot } = useActiveProfile();
  const userId = session?.user?.email ?? null;
  const { data: statusData, isLoading: statusLoading, error: statusError, reload } = useDashboardStatus(userId);
  const { apply } = useApplyProgressEvent({ userId });
  const { data: healthScoreData, isLoading: healthScoreLoading, error: healthScoreError, reload: reloadHealthScore } = useHealthScore();
  const { data: dashSummary, isLoading: dashLoading, error: dashError, reload: reloadDash } = useDashboardSummary();

  const hasSummaryPriorities = Boolean(dashSummary?.top_priorities?.length);

  const ids = useMemo(() => {
    const fromSummary = dashSummary?.top_priorities?.map((p) => p.bundle_key) ?? [];
    if (fromSummary.length) return fromSummary;
    const fromStatus = statusData?.by_bundle ? Object.keys(statusData.by_bundle) : [];
    return fromStatus.slice(0, 3);
  }, [dashSummary, statusData]);

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
  const bundleAffinities = (profileSnapshot?.bundleAffinities ?? {}) as Record<string, number>;
  const topBundles = Object.entries(bundleAffinities)
    .filter(([, v]) => typeof v === "number" && v > 0)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .slice(0, 3);

  return (
    <ProtectedRouteGate
      requestedRoute="/results/action-plan"
      allowStates={["AUTH_PROFILE_READY_RESULTS_UNSEEN", "AUTH_ACTIVE_DASHBOARD_READY", "ANON_COMPLETED_SURVEY_UNREGISTERED", "AUTH_PROFILE_READY_NO_RECOMMENDATIONS"]}
      loadingText={locale === "de" ? "Dein Plan wird geladen…" : "Loading your health plan…"}
    >
    <div className="mx-auto max-w-[72rem] px-5 py-10 md:px-8">

      {/* Save your results — shown to anonymous users */}
      {isAnonymous && (
        <div className="mb-8 flex flex-col gap-4 rounded-[20px] border border-black/[0.1] bg-[#0c0c0c] p-5 text-white sm:flex-row sm:items-center sm:justify-between md:p-6">
          <div className="min-w-0">
            <p className="text-[0.9375rem] font-semibold">Save your action plan</p>
            <p className="mt-1 text-[0.8125rem] text-white/60">
              Create a free account to keep your results and track your progress over time.
            </p>
          </div>
          <Link
            href="/auth/register"
            className="shrink-0 rounded-[12px] bg-white px-4 py-2.5 text-[0.875rem] font-medium text-[#0c0c0c] transition-[filter] hover:brightness-[0.92]"
          >
            Create free account
          </Link>
        </div>
      )}

      {/* Page header */}
      <div className="mb-2">
        <Link
          href="/results/overview"
          className="inline-flex items-center gap-1.5 text-[0.8125rem] text-[#737373] transition-colors hover:text-[#0c0c0c]"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {locale === "de" ? "Zur Übersicht" : "Back to overview"}
        </Link>
      </div>

      <div className="mb-8 mt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a3a3a3]">
          {t(locale, "results.action.eyebrow")}
        </p>
        <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-[#0c0c0c] md:text-[2rem]">{t(locale, "results.action.title")}</h1>
        <p className="mt-2 max-w-[560px] text-[0.9375rem] leading-[1.65] text-[#737373]">
          {t(locale, "results.action.p")}
        </p>
        {dashSummary?.kpis?.tests_to_action != null && (
          <p className="mt-2 text-[0.875rem] text-[#737373]">
            {dashSummary.kpis.tests_to_action} tests to action
          </p>
        )}
      </div>

      {/* Priority note */}
      <div className="mb-6 flex items-start gap-3 rounded-[14px] border border-black/[0.07] bg-[#fafaf9] px-4 py-3.5">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="mt-0.5 shrink-0 text-[#737373]">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" />
          <path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <p className="text-[0.875rem] leading-snug text-[#737373]">
          {t(locale, "results.action.tip")}
        </p>
      </div>

      {topBundles.length > 0 && (
        <div className="mb-6 rounded-[20px] border border-black/[0.08] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.03)] md:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
            Engine A preview
          </p>
          <p className="mt-2 text-[0.9375rem] text-[#737373]">
            Top bundle affinities from your profile
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {topBundles.map(([k, v]) => (
              <span key={k} className="rounded-full border border-black/[0.08] bg-[#fafaf9] px-3 py-1.5 text-[0.875rem] text-[#404040]">
                <span className="font-medium text-[#0c0c0c]">{k}</span>
                <span className="ml-2 text-[#737373] tabular-nums">{v}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <ActionPlanScoreSummary
          score={dashSummary?.score_widget?.value ?? null}
          topGapCount={healthScoreData ? healthScoreData.top_gaps.length : null}
          subtitle={healthScoreData?.widget?.subtitle ?? "Your score reflects how complete your current preventive checks are."}
          isLoading={healthScoreLoading}
          error={healthScoreError?.message ?? null}
        />
      </div>

      {/* Recommendation cards */}
      <div className="space-y-5">
        {(dashLoading || !hasSummaryPriorities) && (
          <div className="rounded-[20px] border border-black/[0.08] bg-white p-6 text-[0.9375rem] text-[#737373]">
            Loading your action plan…
          </div>
        )}

        {statusLoading && (
          <div className="rounded-[20px] border border-black/[0.08] bg-white p-6 text-[0.9375rem] text-[#737373]">
            Loading your latest status…
          </div>
        )}
        {statusError && (
          <div className="rounded-[20px] border border-black/[0.08] bg-white p-6 text-[0.9375rem] text-[#737373]">
            We couldn’t load your latest health status.{" "}
            <button type="button" className="underline underline-offset-2 text-[#0c0c0c]" onClick={reload}>
              Retry
            </button>
          </div>
        )}
        {hasSummaryPriorities &&
          (dashSummary?.top_priorities ?? []).map((p: any) => {
          const bundleKey = p.bundle_key as string;
          const status = bundleKey ? (statusData?.by_bundle?.[bundleKey] as any) : null;
          const badge = status ? mapBundleStatusToBadge(status) : null;
          const progress = progressById.get(bundleKey) ?? null;
          const scoreMeta = healthScoreData?.bundle_breakdown?.find((x) => x.bundle_key === bundleKey) ?? null;
          const whyBits = (scoreMeta?.rationale ?? []).slice(0, 3);
          const whyBody =
            whyBits.length > 0
              ? `Relevance signals: ${whyBits.join(", ")}.`
              : "This check is prioritized based on your current status and profile signals.";
          const isTopGap = Boolean(healthScoreData?.top_gaps?.includes(bundleKey));

          const applyAndRefresh = async (req: Parameters<typeof apply>[0]) => {
            await apply(req);
            // Ready for score-driven UI updates after progress events.
            await reloadHealthScore();
          };

          return (
            <RecommendationCard
              key={bundleKey}
              card={{
                id: bundleKey,
                bundleKey,
                country: (profileSnapshot as any)?.country ?? "DE",
                testName: p.display_name ?? bundleKey,
                statusBadge: (badge?.label as any) ?? statusBadgeFromEngineH(p.badge_label ?? ""),
                priority: p.rank ?? 1,
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
                  ? {
                      progress_state: progress.progress_state,
                      selected_route: progress.selected_route,
                    }
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
              onMarkPlanned={() =>
                applyAndRefresh({
                  recommendation_instance_id: bundleKey,
                  event_type: "mark_planned",
                })
              }
              onMarkDone={() =>
                applyAndRefresh({
                  recommendation_instance_id: bundleKey,
                  event_type: "mark_completed",
                })
              }
            />
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="mt-10 rounded-[20px] border border-black/[0.08] bg-white p-6 text-center shadow-[0_1px_0_rgba(0,0,0,0.03)] md:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a3a3a3]">
          Want to track your progress?
        </p>
        <h3 className="mt-3 text-[1.25rem] font-semibold tracking-tight text-[#0c0c0c]">
          Save your plan and get reminders
        </h3>
        <p className="mt-2 text-[0.9375rem] text-[#737373]">
          Create a free account to keep your results and revisit your action plan any time.
        </p>
        <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/auth/register"
            className="rounded-[12px] bg-[#0c0c0c] px-5 py-3 text-[0.9375rem] font-medium text-white transition-[filter] hover:brightness-[0.88]"
          >
            Create free account
          </Link>
          <Link
            href="/app/dashboard"
            className="rounded-[12px] border border-black/[0.12] bg-white px-5 py-3 text-[0.9375rem] font-medium text-[#404040] transition-colors hover:bg-[#f5f5f4]"
          >
            Go to dashboard
          </Link>
        </div>
      </div>

    </div>
    </ProtectedRouteGate>
  );
}
