"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ProtectedRouteGate } from "@/components/navigation/ProtectedRouteGate";
import { useLocale } from "@/lib/i18n/useLocale";
import { t } from "@/content/i18n/appCopy";
import { useRecommendations } from "@/lib/recommendations/useRecommendations";
import { getOrCreateAnonId } from "@/lib/profile-engine-a/frontendClient";
import { BiomarkerActionRow } from "@/components/app/BiomarkerActionRow";
import type {
  CheckRecommendation,
  CheckStatus,
  ImpactLevel,
  FinalRecommendation,
} from "@/lib/recommendations-engine/types";

// ── Badge helpers ─────────────────────────────────────────────────────────────

const STATUS_BADGE_CLASS: Record<CheckStatus, string> = {
  missing: "bg-[#0c0c0c] text-white",
  reminder_set: "bg-[#404040] text-white",
  planned: "bg-[#525252] text-white",
  completed: "bg-white text-[#404040] border border-black/[0.12]",
  result_uploaded: "bg-white text-[#404040] border border-black/[0.12]",
};

function impactBadgeClass(impact: ImpactLevel): string {
  if (impact === "HIGH IMPACT") return "bg-[#0c0c0c] text-white";
  if (impact === "MEDIUM IMPACT") return "bg-[#525252] text-white";
  return "bg-[#f5f5f4] text-[#737373] border border-black/[0.1]";
}

function normalizeBiomarkerKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "_")
    .replaceAll(/^_+|_+$/g, "");
}

function BloodTestCard({
  check,
  finalRec,
  onUpdateStatus,
}: {
  check: CheckRecommendation;
  finalRec: FinalRecommendation | null;
  onUpdateStatus: (key: string, status: CheckStatus) => void;
}) {
  const forwardStatus: CheckStatus =
    check.status === "missing" ? "planned" : check.status === "planned" ? "completed" : "missing";
  const forwardLabel =
    check.status === "missing"
      ? "Mark as planned"
      : check.status === "planned"
        ? "Mark as done"
        : "Reset";

  return (
    <div className="space-y-3">
      {/* Compact header chips (impact + status + timing + preview tests) */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] ${impactBadgeClass(check.impact)}`}
        >
          {check.impact}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] ${STATUS_BADGE_CLASS[check.status]}`}
        >
          {check.status.replaceAll("_", " ")}
        </span>
        <span className="rounded-full border border-black/[0.08] bg-white px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[#737373]">
          {check.recommendedTiming || "Recommended"}
        </span>
        {check.includedTestsPreview?.slice(0, 3).map((x) => (
          <span
            key={x}
            className="rounded-full border border-black/[0.08] bg-[#fafaf9] px-2.5 py-1 text-[0.75rem] text-[#525252]"
          >
            {x}
          </span>
        ))}
      </div>

      {/* Check header + importance */}
      <div className="rounded-[20px] border border-black/[0.08] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.03)] md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-[1.125rem] font-semibold leading-snug tracking-tight text-[#0c0c0c] md:text-[1.25rem]">
              {check.checkName}
            </h3>
            {check.shortSummary && (
              <p className="mt-1 text-[0.9375rem] text-[#737373]">{check.shortSummary}</p>
            )}
          </div>
          <span className="shrink-0 text-[0.8125rem] text-[#a3a3a3]">#{check.priorityRank}</span>
        </div>

        <div className="mt-4 rounded-[14px] border border-black/[0.06] bg-[#fafaf9] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
            Why this matters
          </p>
          <p className="mt-2 text-[0.9375rem] leading-[1.65] text-[#404040]">
            {finalRec?.whyRecommendedForYou ?? check.whyForYou}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onUpdateStatus(check.checkKey, "planned")}
            className="rounded-[12px] bg-[#0c0c0c] px-4 py-2.5 text-[0.875rem] font-medium text-white transition-[filter] hover:brightness-[0.88]"
          >
            Mark as planned
          </button>
          <button
            type="button"
            onClick={() => onUpdateStatus(check.checkKey, "completed")}
            className="rounded-[12px] border border-black/[0.1] px-4 py-2.5 text-[0.875rem] font-medium text-[#404040] transition-colors hover:text-[#0c0c0c]"
          >
            Mark as done
          </button>
        </div>
      </div>

      {/* Biomarkers for this check (each has booking + coverage) */}
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
          Biomarkers in this check
        </p>
        <div className="rounded-[20px] border border-black/[0.08] bg-white p-5 md:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
            Core tests now
          </p>
          <div className="mt-4 space-y-3">
            {(finalRec?.coreTestsNow?.length ? finalRec.coreTestsNow : check.includedTestsPreview ?? [])
              .slice(0, 6)
              .map((testName) => (
                <BiomarkerActionRow
                  key={`core:${testName}`}
                  biomarkerName={testName}
                  biomarkerKey={normalizeBiomarkerKey(testName)}
                  country={"DE"}
                />
              ))}
          </div>

          {!!finalRec?.supportingTests?.length && (
            <>
              <div className="mt-6 border-t border-black/[0.06] pt-5" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                Supporting (if relevant)
              </p>
              <div className="mt-4 space-y-3">
                {finalRec.supportingTests.slice(0, 6).map((testName) => (
                  <BiomarkerActionRow
                    key={`support:${testName}`}
                    biomarkerName={testName}
                    biomarkerKey={normalizeBiomarkerKey(testName)}
                    country={"DE"}
                  />
                ))}
              </div>
            </>
          )}

          {!!finalRec?.laterTests?.length && (
            <>
              <div className="mt-6 border-t border-black/[0.06] pt-5" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                Later / optional
              </p>
              <div className="mt-4 space-y-3">
                {finalRec.laterTests.slice(0, 6).map((testName) => (
                  <BiomarkerActionRow
                    key={`later:${testName}`}
                    biomarkerName={testName}
                    biomarkerKey={normalizeBiomarkerKey(testName)}
                    country={"DE"}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onUpdateStatus(check.checkKey, forwardStatus)}
          className="rounded-[12px] bg-[#0c0c0c] px-4 py-2.5 text-[0.875rem] font-medium text-white transition-[filter] hover:brightness-[0.88]"
        >
          {forwardLabel}
        </button>
        {check.status !== "missing" && (
          <button
            type="button"
            onClick={() => onUpdateStatus(check.checkKey, "missing")}
            className="rounded-[12px] border border-black/[0.1] px-4 py-2.5 text-[0.875rem] font-medium text-[#737373] transition-colors hover:text-[#0c0c0c]"
          >
            Reset
          </button>
        )}
        {check.plannedAt && (
          <p className="text-[0.8125rem] text-[#a3a3a3]">Planned {new Date(check.plannedAt).toLocaleDateString()}</p>
        )}
        {check.completedAt && (
          <p className="text-[0.8125rem] text-[#a3a3a3]">Done {new Date(check.completedAt).toLocaleDateString()}</p>
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

  const pathway = recs?.pathway;
  const finalRecs = recs?.recommendations ?? [];
  const summary = recs?.summary;
  const profile = recs?.profile;

  const checkByKey = new Map<string, CheckRecommendation>();
  if (pathway) {
    for (const list of Object.values(pathway)) {
      for (const c of list) checkByKey.set(c.checkKey, c);
    }
  }

  const finalByKey = new Map<string, FinalRecommendation>();
  for (const r of finalRecs) finalByKey.set(r.checkKey, r);

  const checksThisMonth = (recs?.pathwayTimeline?.find((x) => x.timeframe === "current_month")?.checks ?? [])
    .map((x) => checkByKey.get(x.checkKey))
    .filter(Boolean) as CheckRecommendation[];

  const checks6Months = [
    ...(recs?.pathwayTimeline?.find((x) => x.timeframe === "next_3_months")?.checks ?? []),
    ...(recs?.pathwayTimeline?.find((x) => x.timeframe === "next_6_months")?.checks ?? []),
  ]
    .map((x) => checkByKey.get(x.checkKey))
    .filter(Boolean) as CheckRecommendation[];

  const checks12Months = [
    ...(recs?.pathwayTimeline?.find((x) => x.timeframe === "next_year")?.checks ?? []),
    ...(recs?.pathwayTimeline?.find((x) => x.timeframe === "optional_later")?.checks ?? []),
  ]
    .map((x) => checkByKey.get(x.checkKey))
    .filter(Boolean) as CheckRecommendation[];

  const isHighPriority = (check: CheckRecommendation) => {
    const r = finalByKey.get(check.checkKey);
    // "High priority" for first view = has core tests scheduled for now (or explicitly marked high).
    // We prefer this over impact because impact may be downgraded for UX caps.
    return (r?.coreTestsNow?.length ?? 0) > 0 || r?.impact === "HIGH";
  };

  const highPriorityNow = checksThisMonth.filter(isHighPriority);
  const nonHighThisMonth = checksThisMonth.filter((c) => !isHighPriority(c));
  const nonHigh6Months = checks6Months.filter((c) => !isHighPriority(c));
  const nonHigh12Months = checks12Months.filter((c) => !isHighPriority(c));

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
              {summary.nextMonthCount} next month · {summary.plannedCount} planned · {summary.completedCount} done
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

        {/* Pathway */}
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

          {!isLoading &&
            ((!pathway || Object.values(pathway).every((x) => x.length === 0)) &&
              (!finalRecs || finalRecs.length === 0)) &&
            !error && (
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

          {/* Blood tests pathway (no biomarker lists) */}
          <div className="rounded-[20px] border border-black/[0.08] bg-white p-5 md:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
              Blood tests pathway
            </p>
            <p className="mt-2 max-w-[52rem] text-[0.9375rem] leading-[1.65] text-[#737373]">
              A simple plan for what to test now vs later. Each card shows how to book, plus doctor guidance (GKV/PKV).
            </p>
          </div>

          {highPriorityNow.length ? (
            <div className="space-y-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                High priority blood tests to do now
              </p>
              {highPriorityNow.slice(0, 3).map((check) => (
                <BloodTestCard
                  key={check.checkKey}
                  check={check}
                  finalRec={finalByKey.get(check.checkKey) ?? null}
                  onUpdateStatus={updateStatus}
                />
              ))}
            </div>
          ) : null}

          {/* Mid/low priority moved into timeline planning (3/6/12 months) */}
          {(nonHighThisMonth.length + nonHigh6Months.length + nonHigh12Months.length) > 0 ? (
            <div className="mt-8 rounded-[20px] border border-black/[0.08] bg-white p-5 md:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                Plan ahead (mid / low priority)
              </p>
              <p className="mt-2 text-[0.9375rem] leading-[1.65] text-[#737373]">
                These items are still recommended, but can be scheduled into 3, 6, and 12 month windows.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                {[
                  { label: "Plan in 3 months", items: nonHighThisMonth.slice(0, 6) },
                  { label: "Plan in 6 months", items: nonHigh6Months.slice(0, 6) },
                  { label: "Plan in 12 months", items: nonHigh12Months.slice(0, 6) },
                ].map((b) => (
                  <div key={b.label} className="rounded-[16px] border border-black/[0.06] bg-[#fafaf9] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#737373]">
                      {b.label}
                    </p>
                    {b.items.length ? (
                      <ul className="mt-2 space-y-2 text-[0.875rem] text-[#404040]">
                        {b.items.map((c) => (
                          <li key={c.checkKey} className="flex items-center justify-between gap-3">
                            <span className="min-w-0 truncate">{c.checkName}</span>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] ${STATUS_BADGE_CLASS[c.status]}`}
                            >
                              {c.status.replaceAll("_", " ")}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-[0.875rem] text-[#737373]">—</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Screenings placeholders (rules later) */}
          <div className="mt-8 rounded-[20px] border border-black/[0.08] bg-white p-5 md:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
              Screenings (coming next)
            </p>
            <p className="mt-2 text-[0.9375rem] text-[#737373]">
              We’ll add rules for screenings soon. For now, here is the structure.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              {[
                { label: "Plan in 3 months", items: ["Pap smear / HPV (placeholder)", "Skin check (placeholder)"] },
                { label: "Plan in 6 months", items: ["Dental check-up (placeholder)", "Eye exam (placeholder)"] },
                { label: "Plan in 12 months", items: ["Annual preventive screening (placeholder)"] },
              ].map((b) => (
                <div key={b.label} className="rounded-[16px] border border-black/[0.06] bg-[#fafaf9] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#737373]">{b.label}</p>
                  <ul className="mt-2 space-y-1 text-[0.875rem] text-[#404040]">
                    {b.items.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
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
