"use client";

import Link from "next/link";
import { HealthScoreCard } from "@/components/app/HealthScoreCard";
import { SummaryStatCard } from "@/components/app/SummaryStatCard";
import { TimelineWidget } from "@/components/app/TimelineWidget";
import { useDashboardSummary } from "@/lib/dashboard-summary/useDashboardSummary";
import { ProtectedRouteGate } from "@/components/navigation/ProtectedRouteGate";
import { useLocale } from "@/lib/i18n/useLocale";

function badgeToneFromLabel(label: string): "primary" | "secondary" | "neutral" {
  const x = (label || "").toUpperCase();
  if (x === "MISSING") return "primary";
  if (x === "OUTDATED") return "secondary";
  return "neutral";
}

function badgeClassNameFromTone(tone: "primary" | "secondary" | "neutral") {
  if (tone === "primary") return "bg-[#0c0c0c] text-white";
  if (tone === "secondary") return "bg-[#525252] text-white";
  return "bg-white text-[#404040] border border-black/[0.12]";
}

export default function DashboardPage() {
  const { data: summary, isLoading: summaryLoading, error: summaryError, reload: reloadSummary } = useDashboardSummary();
  const locale = useLocale();

  const open = summary ? summary.kpis.tests_to_action : "—";
  const planned = summary ? summary.kpis.planned : "—";
  const done = summary ? summary.kpis.completed : "—";

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
          <p className="text-[#404040]">{locale === "de" ? "Du hast noch kein Assessment." : "You don’t have an assessment yet."}</p>
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
          value={summary?.kpis.health_score ?? "—"}
          sub={summaryLoading ? (locale === "de" ? "Lädt…" : "Loading…") : summaryError ? (locale === "de" ? "Score nicht verfügbar" : "Score unavailable") : (locale === "de" ? "Vollständigkeits-Score" : "completeness score")}
        />
      </div>

      {summaryError && (
        <div className="mb-5 rounded-[16px] border border-black/[0.08] bg-white p-4 text-[0.875rem] text-[#737373]">
          We couldn’t load your dashboard summary.{" "}
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
              {(summary?.top_priorities ?? []).map((p) => {
                const tone = badgeToneFromLabel(p.badge_label);
                return (
                  <div
                    key={p.bundle_key}
                    className="flex items-center justify-between gap-3 rounded-[12px] border border-black/[0.06] bg-[#fafaf9] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0c0c0c]/[0.06] text-[0.6875rem] font-semibold tabular-nums text-[#0c0c0c]">
                        {p.rank}
                      </span>
                      <span className="text-[0.9375rem] font-medium text-[#0c0c0c]">{p.display_name}</span>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] ${badgeClassNameFromTone(
                        tone,
                      )}`}
                    >
                      {p.badge_label}
                    </span>
                  </div>
                );
              })}
              {!summaryLoading && (summary?.top_priorities?.length ?? 0) === 0 && (
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
                <p className="mt-0.5 text-[#0c0c0c]">{summary?.profile_summary.age_group ?? "—"}</p>
              </div>
              <div>
                <p className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-[#a3a3a3]">Life stage</p>
                <p className="mt-0.5 text-[#0c0c0c]">{summary?.profile_summary.life_stage ?? "—"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-[#a3a3a3]">Goals</p>
                <p className="mt-0.5 text-[#0c0c0c]">{summary?.profile_summary.goals ?? "—"}</p>
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
            score={summary?.score_widget.value ?? 0}
            label={summary?.score_widget.label ?? "Health completeness score"}
            subtitle={summary?.score_widget.caption ?? "Based on your current health data"}
          />
          <TimelineWidget
            isLoading={summaryLoading}
            errorText={summaryError ? "Upcoming checks unavailable right now." : null}
            nextCheckTitle={summary?.upcoming_checks?.find((x) => (x.event_type ?? "check") === "check")?.title ?? null}
            entries={(summary?.upcoming_checks ?? []).map((x) => ({ month: x.time_label, item: x.title }))}
          />
        </div>

      </div>
    </div>
    </ProtectedRouteGate>
  );
}
