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
import { RemindMeButton } from "@/components/app/RemindMeButton";
import { ZipPromptBanner } from "@/components/app/ZipPromptBanner";
import { NominationModule } from "@/components/app/NominationModule";
import { loadUserZip } from "@/lib/providers-de/useProviderSuggestions";
import { computeAllSuggestions, prefetchProviderData } from "@/lib/providers-de/clientMatcher";
import type { ProviderSuggestions } from "@/lib/providers-de/types";
import type {
  CheckRecommendation,
  CheckStatus,
  FinalRecommendation,
} from "@/lib/recommendations-engine/types";

const UploadResultsModal = dynamic(
  () => import("@/components/app/UploadResultsModal").then((m) => ({ default: m.UploadResultsModal })),
  { ssr: false },
);

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ActionPlanPage() {
  const { data: session } = useSession();
  const locale = useLocale();
  const isDE = locale === "de";
  const isAnonymous = !session?.user?.email;
  const userId =
    session?.user?.email ??
    (typeof window !== "undefined" ? `anon:${getOrCreateAnonId()}` : null);

  const { data: recs, isLoading, error, reload, updateStatus } = useRecommendations(userId);

  const pathway = recs?.pathway;
  const finalRecs = recs?.recommendations ?? [];
  const summary = recs?.summary;

  const [heroWhyOpen, setHeroWhyOpen] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState<string>("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [userZip, setUserZip] = useState<string | null>(() =>
    typeof window !== "undefined" ? loadUserZip() : null,
  );
  const [providerSuggestions, setProviderSuggestions] = useState<Map<string, ProviderSuggestions>>(new Map());

  // Prefetch provider data as soon as the page mounts — before any card opens
  useEffect(() => { prefetchProviderData(); }, []);

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

  const checksThisMonth = (pathway?.next_month ?? []).filter((c) => !c.isScreening);

  const isHighPriority = (check: CheckRecommendation) => {
    if (check.checkKey === "preventive_baseline") {
      return check.status !== "completed" && check.status !== "result_uploaded";
    }
    const r = finalByKey.get(check.checkKey);
    return (r?.coreTestsNow?.length ?? 0) > 0 || r?.impact === "HIGH";
  };

  const highPriorityNow = checksThisMonth.filter(isHighPriority);
  const highPriorityKeys = new Set(highPriorityNow.map((c) => c.checkKey));

  const baselineCheck = allChecks.find(
    (c) => c.checkKey === "preventive_baseline" && c.status !== "completed" && c.status !== "result_uploaded"
  );
  const nextBestKey =
    baselineCheck?.checkKey ??
    highPriorityNow[0]?.checkKey ??
    checksThisMonth[0]?.checkKey ??
    allChecks[0]?.checkKey ??
    null;

  const nextBestCheck = nextBestKey ? checkByKey.get(nextBestKey) ?? null : null;

  // Do soon: next_3_months, excluding checks already shown in highPriorityNow or screenings
  const doSoonChecks = (pathway?.next_3_months ?? []).filter(
    (c) => !c.isScreening && !highPriorityKeys.has(c.checkKey)
  );

  const nextBestRef = useRef<HTMLDivElement | null>(null);
  const scrollToNextBest = () => {
    nextBestRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    if (expandedKey || !nextBestKey) return;
    const id = window.setTimeout(() => setExpandedKey(nextBestKey), 0);
    return () => window.clearTimeout(id);
  }, [expandedKey, nextBestKey]);

  // Pre-compute provider suggestions for all checks in one pass whenever
  // checks or ZIP change. Runs client-side; data is cached after first load.
  useEffect(() => {
    if (!allChecks.length) return;
    const inputs = allChecks.map((c) => ({
      checkKey: c.checkKey,
      isScreening: c.isScreening,
      biomarkers: finalByKey.get(c.checkKey)?.coreTestsNow ?? c.includedTestsPreview ?? [],
    }));
    computeAllSuggestions(inputs, userZip).then(setProviderSuggestions);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allChecks.length, userZip]);

  const onUpdateStatusWithReward = async (key: string, status: CheckStatus) => {
    const prev = checkByKey.get(key)?.status ?? "missing";
    await updateStatus(key, status);
    if (prev !== status) {
      if (status === "planned") setLiveMessage(isDE ? "Gut gestartet. Dieser Check ist jetzt in Ihrem Plan." : "Good start. This check is now in your plan.");
      if (status === "completed" || status === "result_uploaded") setLiveMessage(isDE ? "Abgeschlossen. Ihr Fortschritt wurde aktualisiert." : "Completed. Your health progress has been updated.");
      window.setTimeout(() => setLiveMessage(""), 2200);
    }
  };

  const categoryGroups = [
    { label: isDE ? "Praventionstests Baseline" : "Preventive baseline", keys: new Set(["preventive_baseline"]) },
    { label: isDE ? "Herz- und Stoffwechselgesundheit" : "Heart and metabolic health", keys: new Set(["cardiometabolic_risk"]) },
    { label: isDE ? "Eisen und Blutgesundheit" : "Iron and blood health", keys: new Set(["iron_ferritin", "fatigue_low_energy_panel"]) },
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
      loadingText={isDE ? "Dein Plan wird geladen…" : "Loading your health plan…"}
    >
      <div className="mx-auto max-w-[72rem] px-5 pb-20 pt-10 md:pb-0 md:px-8">

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
            {isDE ? "Zur Ubersicht" : "Back to overview"}
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
              {isDE
                ? `${summary.nextMonthCount} diese Woche · ${summary.plannedCount} geplant · ${summary.completedCount} abgeschlossen`
                : `${summary.nextMonthCount} this month · ${summary.plannedCount} planned · ${summary.completedCount} done`}
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
            {/* Next Best Action hero */}
            <div className="mb-6 rounded-[20px] border border-black/[0.08] bg-white p-5 md:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                {isDE ? "Ihre nachste Manahme" : "Your next best action"}
              </p>
              <p className="mt-2 text-[1.125rem] font-semibold tracking-tight text-[#0c0c0c] md:text-[1.25rem]">
                {nextBestCheck?.checkName ?? (isDE ? "Praventiven Bluttest planen" : "Book your preventive health baseline blood test")}
              </p>
              <p className="mt-2 text-[0.9375rem] leading-[1.65] text-[#737373]">
                {isDE
                  ? "Etwa 5 Minuten zum Planen. Damit starten Sie Ihre erste Gesundheits-Baseline."
                  : "Takes about 5 minutes to plan. This unlocks your first health baseline."}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={scrollToNextBest}
                  className="rounded-[12px] bg-[#0c0c0c] px-4 py-2.5 text-[0.875rem] font-medium text-white transition-[filter] hover:brightness-[0.88]"
                >
                  {isDE ? "Jetzt planen" : "Start planning"}
                </button>
                <button
                  type="button"
                  onClick={() => setHeroWhyOpen((v) => !v)}
                  aria-expanded={heroWhyOpen}
                  className="rounded-[12px] border border-black/[0.1] px-4 py-2.5 text-[0.875rem] font-medium text-[#404040] transition-colors hover:text-[#0c0c0c]"
                >
                  {isDE ? "Warum das wichtig ist" : "View why this matters"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="rounded-[12px] border border-black/[0.1] px-4 py-2.5 text-[0.875rem] font-medium text-[#404040] transition-colors hover:text-[#0c0c0c]"
                >
                  {isDE ? "Ergebnis hochladen" : "Upload result"}
                </button>
                {nextBestCheck && (
                  <RemindMeButton
                    checkKey={nextBestCheck.checkKey}
                    checkName={nextBestCheck.checkName}
                    isDE={isDE}
                  />
                )}
              </div>

              {heroWhyOpen && (
                <div className="mt-4 rounded-[14px] border border-black/[0.06] bg-[#fafaf9] px-4 py-3">
                  <p className="text-[0.9375rem] leading-[1.65] text-[#404040]">
                    {finalByKey.get(nextBestKey ?? "")?.whyRecommendedForYou ?? nextBestCheck?.whyForYou ?? (isDE ? "Empfohlen auf Basis Ihres Gesundheitsprofils." : "Recommended based on your health profile.")}
                  </p>
                </div>
              )}
            </div>

            {/* Progress summary */}
            {summary && (
              <div className="mb-6 rounded-[20px] border border-black/[0.08] bg-white p-5 md:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a3a3a3]">
                      {isDE ? "Ihr Fortschritt" : "Your health progress"}
                    </p>
                    <p className="mt-1 text-[1.5rem] font-semibold tabular-nums tracking-tight text-[#0c0c0c] md:text-[1.75rem]">
                      {isDE
                        ? `${summary.completedCount} von ${totalChecks} abgeschlossen`
                        : `${summary.completedCount} of ${totalChecks} checks completed`}
                    </p>
                  </div>
                  <div className="text-right text-[0.875rem] text-[#737373]">
                    <p>
                      {summary.plannedCount} {isDE ? "geplant" : "planned"}
                    </p>
                  </div>
                </div>

                <div
                  className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#f0f0ef]"
                  role="progressbar"
                  aria-label={isDE ? "Gesamtfortschritt" : "Overall health progress"}
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
                        aria-label={`${c.label} ${isDE ? "Fortschritt" : "progress"}`}
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

            {/* Save progress prompt for anonymous users */}
            {isAnonymous && (
              <div className="mb-6 rounded-[20px] border border-black/[0.08] bg-white p-5 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[0.9375rem] font-semibold text-[#0c0c0c]">
                      {isDE ? "Fortschritt speichern" : "Save your progress"}
                    </p>
                    <p className="mt-1 text-[0.875rem] leading-[1.6] text-[#737373]">
                      {isDE
                        ? "Erstellen Sie ein kostenloses Konto, um Ihren Plan zu behalten und Ihren Fortschritt zu verfolgen."
                        : "Create a free account to keep your plan, track completed checks, and return to your progress later."}
                    </p>
                  </div>
                  <Link
                    href="/auth/register"
                    className="shrink-0 rounded-[12px] bg-[#0c0c0c] px-4 py-2.5 text-[0.875rem] font-medium text-white transition-[filter] hover:brightness-[0.88]"
                  >
                    {isDE ? "Kostenloses Konto erstellen" : "Create free account"}
                  </Link>
                </div>
              </div>
            )}

            {/* ZIP prompt */}
            <ZipPromptBanner
              isDE={isDE}
              onZipSaved={(z) => setUserZip(z)}
            />

            {/* Check list */}
            <div className="space-y-5">
              {isLoading && (
                <div className="rounded-[20px] border border-black/[0.08] bg-white p-6 text-[0.9375rem] text-[#737373]">
                  {isDE ? "Ladt…" : "Loading your action plan…"}
                </div>
              )}

              {error && !isLoading && (
                <div className="rounded-[20px] border border-black/[0.08] bg-white p-6 text-[0.9375rem] text-[#737373]">
                  {isDE ? "Ihr Aktionsplan konnte nicht geladen werden." : "We couldn't load your action plan."}{" "}
                  <button
                    type="button"
                    className="underline underline-offset-2 text-[#0c0c0c]"
                    onClick={reload}
                  >
                    {isDE ? "Erneut versuchen" : "Retry"}
                  </button>
                </div>
              )}

              {!isLoading &&
                ((!pathway || Object.values(pathway).every((x) => x.length === 0)) &&
                  (!finalRecs || finalRecs.length === 0)) &&
                !error && (
                  <div className="rounded-[20px] border border-black/[0.08] bg-white p-6 text-[0.9375rem] text-[#737373]">
                    <p>{isDE ? "Noch keine Empfehlungen." : "No recommendations yet."}</p>
                    <Link
                      href="/health-journey"
                      className="mt-3 inline-flex rounded-[12px] bg-[#0c0c0c] px-4 py-2.5 text-[0.9375rem] font-medium text-white hover:brightness-[0.9]"
                    >
                      {isDE ? "Assessment starten" : "Start assessment"}
                    </Link>
                  </div>
                )}

              {/* Section: Do now */}
              {highPriorityNow.length > 0 && (
                <div className="space-y-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                    {isDE ? "Jetzt erledigen" : "Do now"}
                  </p>
                  {highPriorityNow.slice(0, 3).map((check) => (
                    <CollapsibleCheckCard
                      key={check.checkKey}
                      check={check}
                      finalRec={finalByKey.get(check.checkKey) ?? null}
                      expanded={expandedKey === check.checkKey}
                      onToggle={() => setExpandedKey((k) => (k === check.checkKey ? null : check.checkKey))}
                      onUpdateStatus={onUpdateStatusWithReward}
                      onUploadResult={() => setShowUploadModal(true)}
                      cardRef={check.checkKey === nextBestKey ? nextBestRef : undefined}
                      isDE={isDE}
                      providerSuggestions={providerSuggestions.get(check.checkKey) ?? null}
                    />
                  ))}
                </div>
              )}

              {/* Section: Screenings */}
              {screeningChecks.length > 0 && (
                <div className="space-y-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                    {isDE ? "Vorsorgeuntersuchungen" : "Screenings"}
                  </p>
                  {screeningChecks.map((check) => (
                    <CollapsibleCheckCard
                      key={check.checkKey}
                      check={check}
                      finalRec={finalByKey.get(check.checkKey) ?? null}
                      expanded={expandedKey === check.checkKey}
                      onToggle={() => setExpandedKey((k) => (k === check.checkKey ? null : check.checkKey))}
                      onUpdateStatus={onUpdateStatusWithReward}
                      onUploadResult={() => setShowUploadModal(true)}
                      cardRef={check.checkKey === nextBestKey ? nextBestRef : undefined}
                      isDE={isDE}
                      providerSuggestions={providerSuggestions.get(check.checkKey) ?? null}
                    />
                  ))}
                </div>
              )}

              {/* Section: Do soon */}
              {doSoonChecks.length > 0 && (
                <div className="space-y-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                    {isDE ? "Bald erledigen" : "Do soon"}
                  </p>
                  {doSoonChecks.map((check) => (
                    <CollapsibleCheckCard
                      key={check.checkKey}
                      check={check}
                      finalRec={finalByKey.get(check.checkKey) ?? null}
                      expanded={expandedKey === check.checkKey}
                      onToggle={() => setExpandedKey((k) => (k === check.checkKey ? null : check.checkKey))}
                      onUpdateStatus={onUpdateStatusWithReward}
                      onUploadResult={() => setShowUploadModal(true)}
                      cardRef={check.checkKey === nextBestKey ? nextBestRef : undefined}
                      isDE={isDE}
                      providerSuggestions={providerSuggestions.get(check.checkKey) ?? null}
                    />
                  ))}
                </div>
              )}

              <NominationModule />
            </div>
          </div>

          {/* Sticky right column (desktop) */}
          <aside className="hidden md:block">
            <div className="sticky top-6 space-y-4">

              {/* Progress card */}
              <div className="rounded-[20px] border border-black/[0.08] bg-white p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                  {isDE ? "Ihr Fortschritt" : "Your progress"}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-[14px] border border-black/[0.06] bg-[#fafaf9] px-3 py-2.5">
                    <p className="text-[1.25rem] font-semibold tabular-nums text-[#0c0c0c]">{summary?.completedCount ?? 0}</p>
                    <p className="text-[0.75rem] text-[#737373]">{isDE ? "Abgeschlossen" : "Completed"}</p>
                  </div>
                  <div className="rounded-[14px] border border-black/[0.06] bg-[#fafaf9] px-3 py-2.5">
                    <p className="text-[1.25rem] font-semibold tabular-nums text-[#0c0c0c]">{summary?.plannedCount ?? 0}</p>
                    <p className="text-[0.75rem] text-[#737373]">{isDE ? "Geplant" : "Planned"}</p>
                  </div>
                </div>
                {totalChecks > 0 && (
                  <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[#f0f0ef]">
                    <div
                      className="h-full rounded-full bg-[#0c0c0c] transition-all"
                      style={{ width: `${Math.round(((summary?.completedCount ?? 0) / totalChecks) * 100)}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Next action card */}
              <div className="rounded-[20px] border border-black/[0.08] bg-white p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                  {isDE ? "Nachste empfohlene Manahme" : "Next recommended"}
                </p>
                <p className="mt-2 text-[0.9375rem] font-medium leading-snug text-[#0c0c0c]">
                  {nextBestCheck?.checkName ?? (isDE ? "Plan wird geladen…" : "Loading your plan…")}
                </p>
                {nextBestCheck?.shortSummary && (
                  <p className="mt-1 text-[0.8125rem] text-[#737373] line-clamp-2">{nextBestCheck.shortSummary}</p>
                )}
                <button
                  type="button"
                  onClick={scrollToNextBest}
                  className="mt-4 w-full rounded-[12px] bg-[#0c0c0c] px-4 py-2.5 text-[0.875rem] font-medium text-white transition-[filter] hover:brightness-[0.88]"
                >
                  {isDE ? "Weiter" : "Continue"}
                </button>
              </div>

              {/* Quick upload */}
              <div className="rounded-[20px] border border-black/[0.08] bg-white p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                  {isDE ? "Ergebnisse hochladen" : "Upload results"}
                </p>
                <p className="mt-2 text-[0.8125rem] text-[#737373]">
                  {isDE
                    ? "Haben Sie bereits Ergebnisse? Hochladen und wir speichern die passenden Werte."
                    : "Already have results? Upload and we'll save the matching values."}
                </p>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="mt-3 w-full rounded-[12px] border border-black/[0.1] px-4 py-2.5 text-[0.875rem] font-medium text-[#0c0c0c] transition-colors hover:bg-[#fafaf9]"
                >
                  {isDE ? "Ergebnis hochladen" : "Upload result"}
                </button>
              </div>

            </div>
          </aside>
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden border-t border-black/[0.08] bg-white/95 backdrop-blur-sm px-5 py-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-[0.75rem] text-[#737373]">
            {summary?.completedCount ?? 0} {isDE ? "abgeschlossen" : "completed"} · {summary?.plannedCount ?? 0} {isDE ? "geplant" : "planned"}
          </p>
          <p className="text-[0.8125rem] font-medium text-[#0c0c0c] truncate max-w-[200px]">
            {nextBestCheck?.checkName ?? (isDE ? "Weiter" : "Continue")}
          </p>
        </div>
        <button
          type="button"
          onClick={scrollToNextBest}
          className="shrink-0 rounded-[12px] bg-[#0c0c0c] px-4 py-2.5 text-[0.875rem] font-medium text-white"
        >
          {isDE ? "Weiter" : "Continue"}
        </button>
      </div>

      <UploadResultsModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        locale={isDE ? "de" : "en"}
      />
    </ProtectedRouteGate>
  );
}
