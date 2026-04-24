"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { HealthScoreCard } from "@/components/app/HealthScoreCard";
import { SummaryStatCard } from "@/components/app/SummaryStatCard";
import { TimelineWidget } from "@/components/app/TimelineWidget";
import { useDashboardSummary } from "@/lib/dashboard-summary/useDashboardSummary";
import { useRecommendations } from "@/lib/recommendations/useRecommendations";
import { getOrCreateAnonId } from "@/lib/profile-engine-a/frontendClient";
import { ProtectedRouteGate } from "@/components/navigation/ProtectedRouteGate";
import { useLocale } from "@/lib/i18n/useLocale";
import type { CheckStatus, ImpactLevel } from "@/lib/recommendations-engine/types";

function statusBadgeClass(status: CheckStatus): string {
  if (status === "MISSING") return "bg-[#0c0c0c] text-white";
  if (status === "PLANNED") return "bg-[#525252] text-white";
  return "bg-white text-[#404040] border border-black/[0.12]";
}

function impactBadgeClass(impact: ImpactLevel): string {
  if (impact === "HIGH IMPACT") return "bg-[#0c0c0c] text-white";
  if (impact === "MEDIUM IMPACT") return "bg-[#525252] text-white";
  return "bg-[#f5f5f4] text-[#737373] border border-black/[0.1]";
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data: summary, isLoading: summaryLoading, error: summaryError, reload: reloadSummary } = useDashboardSummary();
  const locale = useLocale();

  // Live recommendations from SQLite rules engine — supplements legacy summary data.
  const userId = session?.user?.email ?? (typeof window !== "undefined" ? `anon:${getOrCreateAnonId()}` : null);
  const { data: recs, isLoading: recsLoading } = useRecommendations(userId);

  // KPIs: prefer live recommendations data, fall back to legacy summary.
  const open = recs
    ? recs.summary.recommendedCount - recs.summary.completedCount
    : (summary ? summary.kpis.tests_to_action : "—");
  const planned = recs ? recs.summary.plannedCount : (summary ? summary.kpis.planned : "—");
  const done = recs ? recs.summary.completedCount : (summary ? summary.kpis.completed : "—");
  const healthScore = recs ? recs.summary.healthScore : (summary?.kpis.health_score ?? 0);

  // Profile from recommendations engine; fall back to legacy summary.
  // Use explicit typed variable to avoid union type conflicts.
  const recsProfile = recs?.profile ?? null;
  const legacyProfile = summary?.profile_summary ?? null;

  return (
    <ProtectedRouteGate
      requestedRoute="/app/dashboard"
      allowStates={["AUTH_ACTIVE_DASHBOARD_READY", "AUTH_PROFILE_READY_RESULTS_UNSEEN", "AUTH_PROFILE_READY_NO_RECOMMENDATIONS"]}
      loadingText={locale === "de" ? "Dashboard wird geladen…" : "Loading your dashboard…"}
    >
    <div className="mx-auto max-w-[72rem] px-5 py-8 md:px-8">

      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-[1.5rem] font-semibold tracking-tight text-[#0c0c0c] md:text-[1.75rem]">
          {summary?.header?.title ?? "Hello"}
        </h1>
        <p className="mt-1 text-[0.9375rem] text-[#737373]">
          {summaryLoading ? "Loading…" : (summary?.header?.subtitle ?? "Your personalized health dashboard")}
        </p>
      </div>

      {summary?.dashboard_state === "needs_assessment" && (
        <div className="mb-6 rounded-[20px] border border-black/[0.08] bg-white p-6 text-[0.9375rem] text-[#737373]">
          <p className="text-[#404040]">{locale === "de" ? "Du hast noch kein Assessment." : "You don't have an assessment yet."}</p>
          <Link href="/onboarding/start" className="mt-3 inline-flex rounded-[12px] bg-[#0c0c0c] px-4 py-2.5 text-[0.9375rem] font-medium text-white hover:brightness-[0.9]">
            {locale === "de" ? "Assessment starten" : "Start assessment"}
          </Link>
        </div>
      )}

      {/* Stats row */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryStatCard
          label={locale === "de" ? "Tests offen" : "Tests to action"}
          value={open}
          sub={summaryLoading ? (locale === "de" ? "Lädt…" : "Loading…") : summaryError ? (locale === "de" ? "Nicht verfügbar" : "Unavailable") : (locale === "de" ? "basierend auf deinem Fortschritt" : "based on your progress")}
        />
        <SummaryStatCard
          label={locale === "de" ? "Geplant" : "Planned"}
          value={planned}
          sub={summaryLoading ? (locale === "de" ? "Lädt…" : "Loading…") : summaryError ? (locale === "de" ? "Nicht verfügbar" : "Unavailable") : (locale === "de" ? "von dir markiert" : "marked by you")}
        />
        <SummaryStatCard
          label={locale === "de" ? "Erledigt" : "Completed"}
          value={done}
          sub={summaryLoading ? (locale === "de" ? "Lädt…" : "Loading…") : summaryError ? (locale === "de" ? "Nicht verfügbar" : "Unavailable") : (locale === "de" ? "von dir markiert" : "marked by you")}
        />
        <SummaryStatCard
          label={locale === "de" ? "Health Score" : "Health score"}
          value={recsLoading ? "—" : healthScore}
          sub={recsLoading ? (locale === "de" ? "Lädt…" : "Loading…") : (locale === "de" ? "Vollständigkeits-Score" : "completeness score")}
        />
      </div>

      {summaryError && (
        <div className="mb-5 rounded-[16px] border border-black/[0.08] bg-white p-4 text-[0.875rem] text-[#737373]">
          We couldn't load your dashboard summary.{" "}
          <button type="button" className="underline underline-offset-2 text-[#0c0c0c]" onClick={reloadSummary}>
            Retry
          </button>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">

        {/* Left — quick links + summary */}
        <div className="space-y-5">

          {/* Navigation cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href={summary?.overview_card.cta_route ?? "/results/overview"}
              className="group flex items-center justify-between rounded-[20px] border border-black/[0.08] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.03)] transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a3a3a3]">Results</p>
                <p className="mt-1 text-[0.9375rem] font-semibold text-[#0c0c0c]">My Overview</p>
                <p className="mt-0.5 text-[0.8125rem] text-[#737373]">{summary?.overview_card.subtitle ?? "Health score and flagged signals"}</p>
              </div>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden className="shrink-0 text-[#c4c4c4] transition-colors group-hover:text-[#0c0c0c]">
                <path d="M3 9h12M10 3l6 6-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>

            <Link
              href={summary?.action_plan_card.cta_route ?? "/results/action-plan"}
              className="group flex items-center justify-between rounded-[20px] border border-black/[0.08] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.03)] transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a3a3a3]">Next steps</p>
                <p className="mt-1 text-[0.9375rem] font-semibold text-[#0c0c0c]">Action Plan</p>
                <p className="mt-0.5 text-[0.8125rem] text-[#737373]">{summary?.action_plan_card.subtitle ?? `${open} tests with lab and home options`}</p>
              </div>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden className="shrink-0 text-[#c4c4c4] transition-colors group-hover:text-[#0c0c0c]">
                <path d="M3 9h12M10 3l6 6-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          {/* Priority test preview */}
          <div className="rounded-[20px] border border-black/[0.08] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.03)] md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                Top priorities
              </p>
              <Link
                href="/results/action-plan"
                className="text-[0.8125rem] text-[#737373] transition-colors hover:text-[#0c0c0c]"
              >
                See all
              </Link>
            </div>
            <div className="space-y-3">
              {recsLoading && (recs?.topPriorities ?? []).length === 0 && (
                <p className="text-[0.875rem] text-[#737373]">{locale === "de" ? "Lädt…" : "Loading…"}</p>
              )}
              {(recs?.topPriorities ?? []).map((p) => (
                <div
                  key={p.checkKey}
                  className="flex items-start justify-between gap-3 rounded-[12px] border border-black/[0.06] bg-[#fafaf9] px-4 py-3"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0c0c0c]/[0.06] text-[0.6875rem] font-semibold tabular-nums text-[#0c0c0c]">
                      {p.priorityRank}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[0.9375rem] font-medium text-[#0c0c0c]">{p.checkName}</p>
                      {p.shortReason && (
                        <p className="mt-0.5 line-clamp-1 text-[0.8125rem] text-[#737373]">
                          {p.shortReason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] ${statusBadgeClass(p.status)}`}
                    >
                      {p.status}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.06em] ${impactBadgeClass(p.impact)}`}
                    >
                      {p.impact}
                    </span>
                  </div>
                </div>
              ))}
              {!recsLoading && (recs?.topPriorities ?? []).length === 0 && (
                <p className="text-[0.875rem] text-[#737373]">No priorities yet.</p>
              )}
            </div>
          </div>

          {/* Profile summary */}
          <div className="rounded-[20px] border border-black/[0.08] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.03)] md:p-6">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
              Your profile
            </p>
            <div className="grid grid-cols-2 gap-3 text-[0.875rem]">
              <div>
                <p className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-[#a3a3a3]">Age group</p>
                <p className="mt-0.5 text-[#0c0c0c]">
                  {recsProfile?.ageGroup ?? legacyProfile?.age_group ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-[#a3a3a3]">Life stage</p>
                <p className="mt-0.5 text-[#0c0c0c]">
                  {recsProfile?.lifeStage ?? legacyProfile?.life_stage ?? "—"}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-[#a3a3a3]">Goals</p>
                <p className="mt-0.5 text-[#0c0c0c]">
                  {recsProfile
                    ? (recsProfile.goals.join(", ") || "—")
                    : (legacyProfile?.goals ?? "—")}
                </p>
              </div>
            </div>
            <div className="mt-4 border-t border-black/[0.06] pt-3">
              <Link
                href={summary?.profile_summary.retake_assessment_route ?? "/onboarding/start"}
                className="text-[0.8125rem] text-[#737373] transition-colors hover:text-[#0c0c0c]"
              >
                Retake assessment
              </Link>
            </div>
          </div>

        </div>

        {/* Right column */}
        <div className="space-y-5">
          <HealthScoreCard
            score={recsLoading ? (summary?.score_widget.value ?? 0) : healthScore}
            label={summary?.score_widget.label ?? "Health completeness score"}
            subtitle={summary?.score_widget.caption ?? "Based on your current health data"}
          />
          <TimelineWidget
            isLoading={recsLoading && summaryLoading}
            errorText={summaryError && !recs ? "Upcoming checks unavailable right now." : null}
            nextCheckTitle={
              recs?.upcomingChecks?.find(() => true)?.checkName ??
              summary?.upcoming_checks?.find((x) => (x.event_type ?? "check") === "check")?.title ?? null
            }
            entries={
              recs?.upcomingChecks?.map((x) => ({ month: x.timeLabel, item: x.checkName })) ??
              (summary?.upcoming_checks ?? []).map((x) => ({ month: x.time_label, item: x.title }))
            }
          />
        </div>

      </div>
    </div>
    </ProtectedRouteGate>
  );
}
