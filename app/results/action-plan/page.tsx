"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { ProtectedRouteGate } from "@/components/navigation/ProtectedRouteGate";
import { useLocale } from "@/lib/i18n/useLocale";
import { t } from "@/content/i18n/appCopy";
import { useRecommendations } from "@/lib/recommendations/useRecommendations";
import { getOrCreateAnonId } from "@/lib/profile-engine-a/frontendClient";
import dynamic from "next/dynamic";
import { CollapsibleCheckCard } from "@/components/app/CollapsibleCheckCard";

const ScreeningActionRow = dynamic(
  () => import("@/components/app/ScreeningActionRow").then((m) => ({ default: m.ScreeningActionRow })),
  { loading: () => <div className="h-10 rounded-[18px] bg-[#f0f0ef] animate-pulse" /> },
);
import { deduplicateScreenings } from "@/components/app/ScreeningActionRow";
import type {
  CheckRecommendation,
  CheckStatus,
  FinalRecommendation,
} from "@/lib/recommendations-engine/types";

const STATUS_BADGE_CLASS: Record<CheckStatus, string> = {
  missing: "bg-[#0c0c0c] text-white",
  reminder_set: "bg-[#404040] text-white",
  planned: "bg-[#525252] text-white",
  completed: "bg-white text-[#404040] border border-black/[0.12]",
  result_uploaded: "bg-white text-[#404040] border border-black/[0.12]",
};

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
  // profile reserved for future UI surface (kept in payload)

  const [heroWhyOpen, setHeroWhyOpen] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState<string>("");

  const checkByKey = new Map<string, CheckRecommendation>();
  if (pathway) {
    for (const list of Object.values(pathway)) {
      for (const c of list) checkByKey.set(c.checkKey, c);
    }
  }

  const finalByKey = new Map<string, FinalRecommendation>();
  for (const r of finalRecs) finalByKey.set(r.checkKey, r);

  const allChecks = Array.from(checkByKey.values()).sort((a, b) => a.priorityRank - b.priorityRank);
  const screeningChecks = allChecks.filter((c) => c.isScreening);
  const totalChecks = allChecks.length;

  const checksThisMonth = (recs?.pathwayTimeline?.find((x) => x.timeframe === "current_month")?.checks ?? [])
    .map((x) => checkByKey.get(x.checkKey))
    .filter((c): c is CheckRecommendation => !!c && !c.isScreening);

  const checks6Months = [
    ...(recs?.pathwayTimeline?.find((x) => x.timeframe === "next_3_months")?.checks ?? []),
    ...(recs?.pathwayTimeline?.find((x) => x.timeframe === "next_6_months")?.checks ?? []),
  ]
    .map((x) => checkByKey.get(x.checkKey))
    .filter((c): c is CheckRecommendation => !!c && !c.isScreening);

  const checks12Months = [
    ...(recs?.pathwayTimeline?.find((x) => x.timeframe === "next_year")?.checks ?? []),
    ...(recs?.pathwayTimeline?.find((x) => x.timeframe === "optional_later")?.checks ?? []),
  ]
    .map((x) => checkByKey.get(x.checkKey))
    .filter((c): c is CheckRecommendation => !!c && !c.isScreening);

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

  const nextBestKey =
    summary?.nextBestAction?.checkKey ??
    highPriorityNow[0]?.checkKey ??
    checksThisMonth[0]?.checkKey ??
    allChecks[0]?.checkKey ??
    null;

  const nextBestCheck = nextBestKey ? checkByKey.get(nextBestKey) ?? null : null;

  const nextBestRef = useRef<HTMLDivElement | null>(null);
  const scrollToNextBest = () => {
    nextBestRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Default: first check expanded (initialize once when data becomes available).
  useEffect(() => {
    if (expandedKey || !nextBestKey) return;
    const id = window.setTimeout(() => setExpandedKey(nextBestKey), 0);
    return () => window.clearTimeout(id);
  }, [expandedKey, nextBestKey]);

  const onUpdateStatusWithReward = async (key: string, status: CheckStatus) => {
    const prev = checkByKey.get(key)?.status ?? "missing";
    await updateStatus(key, status);
    if (prev !== status) {
      if (status === "planned") setLiveMessage("Good start. This check is now in your plan.");
      if (status === "completed" || status === "result_uploaded") setLiveMessage("Completed. Your health progress has been updated.");
      window.setTimeout(() => setLiveMessage(""), 2200);
    }
  };

  const journeyStep =
    (summary?.completedCount ?? 0) > 0 ? 3 : (summary?.plannedCount ?? 0) > 0 ? 2 : 1;

  const categoryGroups = [
    { label: "Preventive baseline", keys: new Set(["preventive_baseline"]) },
    { label: "Heart and metabolic health", keys: new Set(["cardiometabolic_risk"]) },
    { label: "Iron and blood health", keys: new Set(["iron_ferritin", "fatigue_low_energy_panel"]) },
  ] as const;

  const categoryProgress = categoryGroups.map((g) => {
    const items = allChecks.filter((c) => g.keys.has(c.checkKey));
    const total = items.length;
    const done = items.filter((c) => c.status === "completed" || c.status === "result_uploaded").length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    return { label: g.label, done, total, pct };
  });

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

        {/* Screen-reader live region for status updates */}
        <div className="sr-only" aria-live="polite">
          {liveMessage}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_20rem]">
          {/* Main */}
          <div className="min-w-0">
            {/* 1) Next Best Action hero */}
            <div className="mb-6 rounded-[20px] border border-black/[0.08] bg-white p-5 md:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                Your next best action
              </p>
              <p className="mt-2 text-[1.125rem] font-semibold tracking-tight text-[#0c0c0c] md:text-[1.25rem]">
                {nextBestCheck?.checkName ?? "Book your preventive health baseline blood test"}
              </p>
              <p className="mt-2 text-[0.9375rem] leading-[1.65] text-[#737373]">
                Takes about 5 minutes to plan. This unlocks your first health baseline.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={scrollToNextBest}
                  className="rounded-[12px] bg-[#0c0c0c] px-4 py-2.5 text-[0.875rem] font-medium text-white transition-[filter] hover:brightness-[0.88]"
                >
                  Start planning
                </button>
                <button
                  type="button"
                  onClick={() => setHeroWhyOpen((v) => !v)}
                  aria-expanded={heroWhyOpen}
                  className="rounded-[12px] border border-black/[0.1] px-4 py-2.5 text-[0.875rem] font-medium text-[#404040] transition-colors hover:text-[#0c0c0c]"
                >
                  View why this matters
                </button>
              </div>

              {heroWhyOpen && (
                <div className="mt-4 rounded-[14px] border border-black/[0.06] bg-[#fafaf9] px-4 py-3">
                  <p className="text-[0.9375rem] leading-[1.65] text-[#404040]">
                    {finalByKey.get(nextBestKey ?? "")?.whyRecommendedForYou ?? nextBestCheck?.whyForYou ?? "Recommended based on your health profile."}
                  </p>
                </div>
              )}
            </div>

            {/* 2) Progress summary (replaces health completeness score) */}
            {summary && (
              <div className="mb-6 rounded-[20px] border border-black/[0.08] bg-white p-5 md:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a3a3a3]">
                      Your health progress
                    </p>
                    <p className="mt-1 text-[1.5rem] font-semibold tabular-nums tracking-tight text-[#0c0c0c] md:text-[1.75rem]">
                      {summary.completedCount} of {totalChecks} checks completed
                    </p>
                  </div>
                  <div className="text-right text-[0.875rem] text-[#737373]">
                    <p>
                      {summary.plannedCount} planned
                    </p>
                  </div>
                </div>

                <div
                  className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#f0f0ef]"
                  role="progressbar"
                  aria-label="Overall health progress"
                  aria-valuenow={totalChecks ? summary.completedCount : 0}
                  aria-valuemin={0}
                  aria-valuemax={Math.max(1, totalChecks)}
                >
                  <div
                    className="h-full rounded-full bg-[#0c0c0c] transition-all"
                    style={{ width: `${totalChecks ? Math.round((summary.completedCount / totalChecks) * 100) : 0}%` }}
                  />
                </div>

                <div className="mt-5 space-y-3">
                  {categoryProgress.map((c) => (
                    <div key={c.label} className="rounded-[14px] border border-black/[0.06] bg-[#fafaf9] px-4 py-3">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-[0.875rem] font-medium text-[#0c0c0c]">{c.label}</p>
                        <p className="text-[0.8125rem] tabular-nums text-[#737373]">
                          {c.done}/{c.total}
                        </p>
                      </div>
                      <div
                        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white"
                        role="progressbar"
                        aria-label={`${c.label} progress`}
                        aria-valuenow={c.done}
                        aria-valuemin={0}
                        aria-valuemax={Math.max(1, c.total)}
                      >
                        <div
                          className="h-full rounded-full bg-[#525252] transition-all"
                          style={{ width: `${c.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3) Journey steps */}
            <div className="mb-6 rounded-[20px] border border-black/[0.08] bg-white p-5 md:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                Journey
              </p>
              <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-3">
                {[
                  { label: "Plan your first check", step: 1 },
                  { label: "Complete your blood test", step: 2 },
                  { label: "Review your results", step: 3 },
                ].map((s) => {
                  const active = journeyStep === s.step;
                  const unlocked = journeyStep >= s.step;
                  return (
                    <div
                      key={s.label}
                      className={`rounded-[16px] border border-black/[0.06] px-4 py-3 ${active ? "bg-[#0c0c0c] text-white" : unlocked ? "bg-[#fafaf9] text-[#0c0c0c]" : "bg-[#fafaf9] text-[#a3a3a3]"}`}
                      aria-label={`${s.label}${active ? ", active" : unlocked ? "" : ", locked"}`}
                    >
                      <p className="text-[0.875rem] font-medium">{s.label}</p>
                      <p className={`mt-1 text-[0.8125rem] ${active ? "text-white/70" : unlocked ? "text-[#737373]" : "text-[#a3a3a3]"}`}>
                        {active ? "Current step" : unlocked ? "Unlocked" : "Locked"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 9) Save progress prompt (softened + repositioned) */}
            {isAnonymous && (
              <div className="mb-6 rounded-[20px] border border-black/[0.08] bg-white p-5 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[0.9375rem] font-semibold text-[#0c0c0c]">Save your progress</p>
                    <p className="mt-1 text-[0.875rem] leading-[1.6] text-[#737373]">
                      Create a free account to keep your plan, track completed checks, and return to your progress later.
                    </p>
                  </div>
                  <Link
                    href="/auth/register"
                    className="shrink-0 rounded-[12px] bg-[#0c0c0c] px-4 py-2.5 text-[0.875rem] font-medium text-white transition-[filter] hover:brightness-[0.88]"
                  >
                    Create free account
                  </Link>
                </div>
              </div>
            )}

            {/* Checks */}
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

          {highPriorityNow.length ? (
            <div className="space-y-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                Do now
              </p>
              {highPriorityNow.slice(0, 3).map((check) => (
                <CollapsibleCheckCard
                  key={check.checkKey}
                  check={check}
                  finalRec={finalByKey.get(check.checkKey) ?? null}
                  expanded={expandedKey === check.checkKey}
                  onToggle={() => setExpandedKey((k) => (k === check.checkKey ? null : check.checkKey))}
                  onUpdateStatus={onUpdateStatusWithReward}
                  cardRef={check.checkKey === nextBestKey ? nextBestRef : undefined}
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

          {/* Preventive screenings — live section */}
          {screeningChecks.length > 0 && screeningChecks.map((sc) => {
            const isDone = sc.status === "completed" || sc.status === "result_uploaded";
            const nextStatus: CheckStatus = sc.status === "missing" ? "planned" : sc.status === "planned" ? "completed" : sc.status;
            const ctaLabel = sc.status === "missing"
              ? (locale === "de" ? "Als geplant markieren" : "Mark as planned")
              : sc.status === "planned"
                ? (locale === "de" ? "Als erledigt markieren" : "Mark as completed")
                : (locale === "de" ? "Erledigt" : "Completed");
            const statusLabel = sc.status === "planned"
              ? (locale === "de" ? "Geplant" : "Planned")
              : isDone
                ? (locale === "de" ? "Erledigt" : "Done")
                : (locale === "de" ? "Offen" : "Not started");

            const allTests = (sc.includedTestsByCategory ?? []).flatMap((cat) => cat.tests);
            const uniqueTests = deduplicateScreenings(allTests);

            return (
              <div key={sc.checkKey} className="mt-8 rounded-[20px] border border-black/[0.08] bg-white p-5 md:p-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                      {locale === "de" ? "Vorsorgeuntersuchungen" : "Preventive screenings"}
                    </p>
                    <h2 className="mt-1 text-[1.0625rem] font-semibold leading-snug text-[#0c0c0c]">
                      {sc.checkName}
                    </h2>
                    {sc.shortSummary && (
                      <p className="mt-1 text-[0.9375rem] leading-[1.6] text-[#737373]">
                        {sc.shortSummary}
                      </p>
                    )}
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] ${STATUS_BADGE_CLASS[sc.status]}`}>
                    {statusLabel}
                  </span>
                </div>

                {/* Why this matters for you */}
                {sc.whyForYou && (
                  <div className="mt-4 rounded-[14px] border border-black/[0.06] bg-[#fafaf9] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                      {locale === "de" ? "Warum für Sie?" : "Why this matters for you"}
                    </p>
                    <p className="mt-2 text-[0.9375rem] leading-[1.65] text-[#404040]">
                      {sc.whyForYou}
                    </p>
                  </div>
                )}

                {/* Individual screening tests */}
                {uniqueTests.length > 0 && (
                  <div className="mt-5 space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                      {locale === "de" ? "Ihre Vorsorge-Untersuchungen" : "Your recommended screenings"}
                    </p>
                    {uniqueTests.map((testName) => (
                      <ScreeningActionRow key={testName} screeningName={testName} />
                    ))}
                  </div>
                )}

                {/* CTA */}
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateStatusWithReward(sc.checkKey, nextStatus)}
                    disabled={isDone}
                    className="rounded-[12px] bg-[#0c0c0c] px-4 py-2.5 text-[0.875rem] font-medium text-white transition-[filter] hover:brightness-[0.88] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {ctaLabel}
                  </button>
                  {sc.status !== "missing" && !isDone && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatusWithReward(sc.checkKey, "missing")}
                      className="rounded-[12px] border border-black/[0.1] px-4 py-2.5 text-[0.875rem] font-medium text-[#737373] transition-colors hover:text-[#0c0c0c]"
                    >
                      {locale === "de" ? "Zurücksetzen" : "Reset"}
                    </button>
                  )}
                  <span className="rounded-full border border-black/[0.08] bg-white px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[#737373]">
                    {locale === "de" ? "GKV übernommen" : "GKV covered"}
                  </span>
                </div>
              </div>
            );
          })}
            </div>
          </div>

          {/* 10) Sticky progress summary (desktop only) */}
          <aside className="hidden md:block">
            <div className="sticky top-6 rounded-[20px] border border-black/[0.08] bg-white p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                Current progress
              </p>
              <div className="mt-3 space-y-1 text-[0.9375rem] text-[#404040]">
                <p><span className="font-medium">{summary?.completedCount ?? 0}</span> completed</p>
                <p><span className="font-medium">{summary?.plannedCount ?? 0}</span> planned</p>
              </div>
              <div className="mt-4 rounded-[14px] border border-black/[0.06] bg-[#fafaf9] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#737373]">
                  Next action
                </p>
                <p className="mt-2 text-[0.875rem] leading-[1.55] text-[#404040]">
                  {nextBestCheck?.checkName ?? "Continue your plan"}
                </p>
              </div>
              <button
                type="button"
                onClick={scrollToNextBest}
                className="mt-4 w-full rounded-[12px] bg-[#0c0c0c] px-4 py-2.5 text-[0.875rem] font-medium text-white transition-[filter] hover:brightness-[0.88]"
              >
                Continue
              </button>
            </div>
          </aside>
        </div>
      </div>
    </ProtectedRouteGate>
  );
}
