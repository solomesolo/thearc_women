"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ProtectedRouteGate } from "@/components/navigation/ProtectedRouteGate";
import { useLocale } from "@/lib/i18n/useLocale";
import { t } from "@/content/i18n/appCopy";
import { useRecommendations } from "@/lib/recommendations/useRecommendations";
import { getOrCreateAnonId } from "@/lib/profile-engine-a/frontendClient";
import type {
  CheckRecommendation,
  CheckStatus,
  ImpactLevel,
} from "@/lib/recommendations-engine/types";

// ── Badge helpers ─────────────────────────────────────────────────────────────

const STATUS_BADGE_CLASS: Record<CheckStatus, string> = {
  MISSING: "bg-[#0c0c0c] text-white",
  PLANNED: "bg-[#525252] text-white",
  DONE: "bg-white text-[#404040] border border-black/[0.12]",
};

function impactBadgeClass(impact: ImpactLevel): string {
  if (impact === "HIGH IMPACT") return "bg-[#0c0c0c] text-white";
  if (impact === "MEDIUM IMPACT") return "bg-[#525252] text-white";
  return "bg-[#f5f5f4] text-[#737373] border border-black/[0.1]";
}

// ── CheckCard ─────────────────────────────────────────────────────────────────

function CheckCard({
  check,
  onUpdateStatus,
}: {
  check: CheckRecommendation;
  onUpdateStatus: (key: string, status: CheckStatus) => void;
}) {
  const forwardStatus: CheckStatus =
    check.status === "MISSING" ? "PLANNED" : check.status === "PLANNED" ? "DONE" : "MISSING";
  const forwardLabel =
    check.status === "MISSING"
      ? "Mark as planned"
      : check.status === "PLANNED"
        ? "Mark as done"
        : "Reset";

  // Show at most 4 categories, 5 items each
  const displayedTests = check.includedTests.slice(0, 4).map((cat) => ({
    category: cat.category,
    items: cat.items.slice(0, 5),
  }));

  return (
    <div className="rounded-[20px] border border-black/[0.08] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.03)] md:p-6">
      {/* Header row — impact + status badges */}
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] ${impactBadgeClass(check.impact)}`}
          >
            {check.impact}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] ${STATUS_BADGE_CLASS[check.status]}`}
          >
            {check.status}
          </span>
        </div>
        <span className="text-[0.75rem] text-[#a3a3a3]">#{check.priorityRank}</span>
      </div>

      {/* Title + summary */}
      <h3 className="text-[1.0625rem] font-semibold tracking-tight text-[#0c0c0c]">
        {check.checkName}
      </h3>
      {check.shortSummary && (
        <p className="mt-1 text-[0.875rem] leading-[1.55] text-[#737373]">{check.shortSummary}</p>
      )}

      {/* Why recommended for you */}
      {check.whyRecommendedForYou && (
        <div className="mt-4 rounded-[12px] border border-black/[0.06] bg-[#fafaf9] px-4 py-3">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#a3a3a3]">
            Why this is recommended for you
          </p>
          <p className="text-[0.875rem] leading-[1.6] text-[#404040]">
            {check.whyRecommendedForYou}
          </p>
        </div>
      )}

      {/* What this includes */}
      {displayedTests.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#a3a3a3]">
            What this includes
          </p>
          <div className="space-y-1.5">
            {displayedTests.map((cat) => (
              <div key={cat.category} className="text-[0.875rem] leading-snug text-[#404040]">
                <span className="font-medium text-[#0c0c0c]">{cat.category}:</span>{" "}
                <span className="text-[#737373]">{cat.items.join(", ")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Why now */}
      {check.priorityRationale && (
        <div className="mt-4">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#a3a3a3]">
            Why now
          </p>
          <p className="text-[0.875rem] leading-[1.55] text-[#737373]">
            {check.priorityRationale}
          </p>
        </div>
      )}

      {/* Can wait */}
      {check.whatCanWait && (
        <div className="mt-3">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#a3a3a3]">
            Can wait
          </p>
          <p className="text-[0.875rem] leading-[1.55] text-[#737373]">{check.whatCanWait}</p>
        </div>
      )}

      {/* Relevant answers */}
      {check.relevanceSignals.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#a3a3a3]">
            Relevant answers
          </p>
          <p className="text-[0.8125rem] text-[#737373]">
            {check.relevanceSignals
              .slice(0, 6)
              .map((s) => s.label)
              .join(" · ")}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onUpdateStatus(check.checkKey, forwardStatus)}
          className="rounded-[12px] bg-[#0c0c0c] px-4 py-2.5 text-[0.875rem] font-medium text-white transition-[filter] hover:brightness-[0.88]"
        >
          {forwardLabel}
        </button>
        {check.status !== "MISSING" && (
          <button
            type="button"
            onClick={() => onUpdateStatus(check.checkKey, "MISSING")}
            className="rounded-[12px] border border-black/[0.1] px-4 py-2.5 text-[0.875rem] font-medium text-[#737373] transition-colors hover:text-[#0c0c0c]"
          >
            Reset
          </button>
        )}
        {check.plannedAt && (
          <p className="text-[0.8125rem] text-[#a3a3a3]">
            Planned {new Date(check.plannedAt).toLocaleDateString()}
          </p>
        )}
        {check.completedAt && (
          <p className="text-[0.8125rem] text-[#a3a3a3]">
            Done {new Date(check.completedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ActionPlanPage() {
  const { data: session } = useSession();
  const locale = useLocale();
  const isAnonymous = !session?.user?.email;
  const userId =
    session?.user?.email ??
    (typeof window !== "undefined" ? `anon:${getOrCreateAnonId()}` : null);

  const { data: recs, isLoading, error, reload, updateStatus } = useRecommendations(userId);

  const checks = recs?.recommendations ?? [];
  const summary = recs?.summary;
  const profile = recs?.profile;

  const missingCount = summary ? summary.recommendedCount - summary.completedCount : 0;

  return (
    <ProtectedRouteGate
      requestedRoute="/results/action-plan"
      allowStates={[
        "AUTH_PROFILE_READY_RESULTS_UNSEEN",
        "AUTH_ACTIVE_DASHBOARD_READY",
        "ANON_COMPLETED_SURVEY_UNREGISTERED",
        "AUTH_PROFILE_READY_NO_RECOMMENDATIONS",
      ]}
      loadingText={locale === "de" ? "Dein Plan wird geladen…" : "Loading your health plan…"}
    >
      <div className="mx-auto max-w-[72rem] px-5 py-10 md:px-8">

        {/* Save your results — anonymous users */}
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
              <path
                d="M9 2L4 7l5 5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {locale === "de" ? "Zur Übersicht" : "Back to overview"}
          </Link>
        </div>

        <div className="mb-8 mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a3a3a3]">
            {t(locale, "results.action.eyebrow")}
          </p>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-[#0c0c0c] md:text-[2rem]">
            {t(locale, "results.action.title")}
          </h1>
          <p className="mt-2 max-w-[560px] text-[0.9375rem] leading-[1.65] text-[#737373]">
            {t(locale, "results.action.p")}
          </p>
          {summary && (
            <p className="mt-2 text-[0.875rem] text-[#737373]">
              {missingCount} checks to action · {summary.plannedCount} planned · {summary.completedCount} done
            </p>
          )}
        </div>

        {/* Score bar */}
        {summary && (
          <div className="mb-6 rounded-[20px] border border-black/[0.08] bg-white p-5 md:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a3a3a3]">
                  Health completeness score
                </p>
                <p className="mt-1 text-[2rem] font-semibold tabular-nums tracking-tight text-[#0c0c0c]">
                  {summary.healthScore}
                  <span className="ml-1 text-[1rem] font-normal text-[#a3a3a3]">/ 100</span>
                </p>
              </div>
              <div className="text-right text-[0.875rem] text-[#737373]">
                <p>{summary.recommendedCount} total checks</p>
                <p className="mt-0.5">
                  {summary.completedCount} done · {summary.plannedCount} planned
                </p>
              </div>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#f0f0ef]">
              <div
                className="h-full rounded-full bg-[#0c0c0c] transition-all"
                style={{ width: `${summary.healthScore}%` }}
              />
            </div>
          </div>
        )}

        {/* Profile summary */}
        {profile && (
          <div className="mb-6 flex items-center gap-3 rounded-[14px] border border-black/[0.07] bg-[#fafaf9] px-4 py-3.5">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden
              className="mt-0.5 shrink-0 text-[#737373]"
            >
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" />
              <path
                d="M8 5v4M8 11v.5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
            <p className="text-[0.875rem] leading-snug text-[#737373]">
              {[
                profile.lifeStage,
                profile.ageGroup,
                Array.isArray(profile.goals) ? profile.goals.slice(0, 2).join(", ") : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        )}

        {/* Priority note */}
        <div className="mb-6 flex items-start gap-3 rounded-[14px] border border-black/[0.07] bg-[#fafaf9] px-4 py-3.5">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
            className="mt-0.5 shrink-0 text-[#737373]"
          >
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" />
            <path
              d="M8 5v4M8 11v.5"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
          <p className="text-[0.875rem] leading-snug text-[#737373]">
            {t(locale, "results.action.tip")}
          </p>
        </div>

        {/* Recommendation cards */}
        <div className="space-y-5">
          {isLoading && (
            <div className="rounded-[20px] border border-black/[0.08] bg-white p-6 text-[0.9375rem] text-[#737373]">
              {locale === "de" ? "Lädt…" : "Loading your action plan…"}
            </div>
          )}

          {error && !isLoading && (
            <div className="rounded-[20px] border border-black/[0.08] bg-white p-6 text-[0.9375rem] text-[#737373]">
              We couldn&apos;t load your action plan.{" "}
              <button
                type="button"
                className="underline underline-offset-2 text-[#0c0c0c]"
                onClick={reload}
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && checks.length === 0 && !error && (
            <div className="rounded-[20px] border border-black/[0.08] bg-white p-6 text-[0.9375rem] text-[#737373]">
              <p>No recommendations yet.</p>
              <Link
                href="/onboarding/start"
                className="mt-3 inline-flex rounded-[12px] bg-[#0c0c0c] px-4 py-2.5 text-[0.9375rem] font-medium text-white hover:brightness-[0.9]"
              >
                {locale === "de" ? "Assessment starten" : "Start assessment"}
              </Link>
            </div>
          )}

          {checks.map((check) => (
            <CheckCard key={check.checkKey} check={check} onUpdateStatus={updateStatus} />
          ))}
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
              className="rounded-[12px] border border-black/[0.1] px-5 py-3 text-[0.9375rem] font-medium text-[#404040] transition-colors hover:text-[#0c0c0c]"
            >
              Go to dashboard
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRouteGate>
  );
}
