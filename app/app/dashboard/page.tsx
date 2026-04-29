"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const UploadResultsModal = dynamic(
  () => import("@/components/app/UploadResultsModal").then((m) => ({ default: m.UploadResultsModal })),
  { ssr: false },
);
import { useSession } from "next-auth/react";
import { useDashboardSummary } from "@/lib/dashboard-summary/useDashboardSummary";
import { useRecommendations } from "@/lib/recommendations/useRecommendations";
import { getOrCreateAnonId } from "@/lib/profile-engine-a/frontendClient";
import { ProtectedRouteGate } from "@/components/navigation/ProtectedRouteGate";
import { useLocale } from "@/lib/i18n/useLocale";
import { deduplicateScreenings } from "@/lib/screenings/screeningUtils";
import {
  loadWalletHistory,
  type BiomarkerWalletEntry,
} from "@/components/app/BiomarkerActionRow";
import type { CheckRecommendation } from "@/lib/recommendations-engine/types";
import { RemindMeButton } from "@/components/app/RemindMeButton";

// ── Phase logic (same classifier as HealthWalletHeader) ───────────────────────

type Phase = "baseline" | "core_risk" | "screenings";
type PhaseStatusKey = "not_started" | "in_progress" | "complete" | "planned";
type JourneyState = "empty" | "baseline_partial" | "out_of_order" | "baseline_complete" | "all_done";

interface PhaseStats {
  phase: Phase;
  total: number;
  completed: number;
  planned: number;
  missing: number;
  missingItems: string[];
}

interface WalletBiomarker {
  name: string;
  entries: BiomarkerWalletEntry[];
}

interface WalletScreening {
  name: string;
  status: "missing" | "planned" | "done";
}

function normBmKey(name: string) {
  return name.trim().toLowerCase().replaceAll(/[^a-z0-9]+/g, "_").replaceAll(/^_+|_+$/g, "");
}

function readScStatus(name: string): "missing" | "planned" | "done" {
  try {
    const v = localStorage.getItem(`arc_sc_status_${name.replace(/\s+/g, "_")}`);
    if (v === "planned" || v === "done") return v;
  } catch { /* ignore */ }
  return "missing";
}

function assignPhase(name: string): Phase {
  const n = name.toLowerCase();
  if (/hba1c|hemoglobin\s*a1c|glycated|glycosylated hemoglobin/.test(n)) return "baseline";
  if (/hs[-\s]?crp|high[\s-]sensitivity[\s-]c[\s-]?reactive|hscrp/.test(n)) return "baseline";
  if (/\bferritin\b/.test(n)) return "baseline";
  if (/\b(hemoglobin|haemoglobin|hgb)\b/.test(n)) return "baseline";
  if (/\bapob\b|apolipoprotein\s*b/.test(n)) return "core_risk";
  if (/\bldl\b|\bhdl\b/.test(n)) return "core_risk";
  if (/lipoprotein|\bcholesterol\b|triglyceride/.test(n)) return "core_risk";
  if (/\bglucose\b|\binsulin\b|c[-\s]?peptide/.test(n)) return "core_risk";
  return "core_risk";
}

function computePhases(
  biomarkers: WalletBiomarker[],
  screenings: WalletScreening[],
): Record<Phase, PhaseStats> {
  const p: Record<Phase, PhaseStats> = {
    baseline: { phase: "baseline", total: 0, completed: 0, planned: 0, missing: 0, missingItems: [] },
    core_risk: { phase: "core_risk", total: 0, completed: 0, planned: 0, missing: 0, missingItems: [] },
    screenings: { phase: "screenings", total: 0, completed: 0, planned: 0, missing: 0, missingItems: [] },
  };
  for (const bm of biomarkers) {
    const ph = assignPhase(bm.name);
    p[ph].total++;
    if (bm.entries.length > 0) p[ph].completed++;
    else { p[ph].missing++; p[ph].missingItems.push(bm.name); }
  }
  for (const sc of screenings) {
    p.screenings.total++;
    if (sc.status === "done") p.screenings.completed++;
    else if (sc.status === "planned") p.screenings.planned++;
    else { p.screenings.missing++; p.screenings.missingItems.push(sc.name); }
  }
  return p;
}

function getJourneyState(phases: Record<Phase, PhaseStats>): JourneyState {
  const total = phases.baseline.total + phases.core_risk.total + phases.screenings.total;
  const completed = phases.baseline.completed + phases.core_risk.completed + phases.screenings.completed;
  const missing = phases.baseline.missing + phases.core_risk.missing + phases.screenings.missing;
  if (total === 0 || completed === 0) return "empty";
  if (missing === 0) return "all_done";
  const baselineIncomplete = phases.baseline.total > 0 && phases.baseline.missing > 0;
  if (baselineIncomplete) {
    return (phases.core_risk.completed > 0 || phases.screenings.completed > 0)
      ? "out_of_order" : "baseline_partial";
  }
  return "baseline_complete";
}

function getPhaseStatus(stats: PhaseStats): PhaseStatusKey {
  if (stats.total === 0) return "not_started";
  if (stats.completed === stats.total) return "complete";
  if (stats.missing === 0 && stats.planned > 0) return "planned";
  if (stats.completed > 0) return "in_progress";
  return "not_started";
}

// ── Progress ring ─────────────────────────────────────────────────────────────

function PhaseRing({
  stats,
  label,
  isDE,
}: {
  stats: PhaseStats;
  label: string;
  isDE: boolean;
}) {
  const r = 28;
  const sw = 5;
  const circumference = 2 * Math.PI * r;
  const pct = stats.total > 0 ? stats.completed / stats.total : 0;
  const offset = circumference * (1 - pct);
  const pStatus = getPhaseStatus(stats);

  const statusLabels: Record<PhaseStatusKey, string> = {
    not_started: isDE ? "Nicht begonnen" : "Not started",
    in_progress: isDE ? "In Bearbeitung" : "In progress",
    complete: isDE ? "Fertig" : "Complete",
    planned: isDE ? "Geplant" : "Planned",
  };

  const statusColor: Record<PhaseStatusKey, string> = {
    not_started: "text-[#a3a3a3]",
    in_progress: "text-[#525252]",
    complete: "text-[#16a34a]",
    planned: "text-[#d97706]",
  };

  const strokeColor = pStatus === "complete" ? "#16a34a" : "#0c0c0c";

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="relative h-[64px] w-[64px]">
        <svg viewBox="0 0 64 64" className="h-full w-full">
          <circle cx="32" cy="32" r={r} fill="none" stroke="black" strokeOpacity="0.07" strokeWidth={sw} />
          <circle
            cx="32" cy="32" r={r}
            fill="none"
            stroke={strokeColor}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 32 32)"
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span className="font-mono text-[0.8125rem] font-semibold tabular-nums text-[#0c0c0c]">
            {stats.completed}
          </span>
          <span className="text-[0.5625rem] text-[#a3a3a3]">/{stats.total}</span>
        </div>
      </div>
      <div>
        <p className="text-[0.75rem] font-semibold text-[#0c0c0c]">{label}</p>
        <p className={`text-[0.625rem] font-medium ${statusColor[pStatus]}`}>
          {statusLabels[pStatus]}
        </p>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data: summary, error: summaryError, reload: reloadSummary } = useDashboardSummary();
  const locale = useLocale();
  const isDE = locale === "de";

  const userId = session?.user?.email ?? (typeof window !== "undefined" ? `anon:${getOrCreateAnonId()}` : null);
  const { data: recs, isLoading: recsLoading } = useRecommendations(userId);

  // ── Recommended checks from live engine ───────────────────────────────────

  const allChecks: CheckRecommendation[] = recs
    ? [
        ...(recs.pathway.next_month ?? []),
        ...(recs.pathway.next_3_months ?? []),
        ...(recs.pathway.next_6_months ?? []),
        ...(recs.pathway.next_year ?? []),
        ...(recs.pathway.optional_later ?? []),
      ]
    : [];

  // preventive_baseline is always the first step — prefer it over any other check when not done.
  const allPathwayChecks = recs
    ? [
        ...(recs.pathway.next_month ?? []),
        ...(recs.pathway.next_3_months ?? []),
      ]
    : [];
  const nextBestCheck: CheckRecommendation | null =
    allPathwayChecks.find(
      (c) => c.checkKey === "preventive_baseline" && c.status !== "completed" && c.status !== "result_uploaded"
    ) ??
    recs?.pathway.next_month?.[0] ??
    recs?.pathway.next_3_months?.[0] ??
    null;

  const [showUploadModal, setShowUploadModal] = useState(false);

  // ── Wallet data from localStorage ─────────────────────────────────────────

  const [wallet, setWallet] = useState<{
    biomarkers: WalletBiomarker[];
    screenings: WalletScreening[];
  }>({ biomarkers: [], screenings: [] });

  useEffect(() => {
    if (!recs?.pathway) return;
    const seenBmKeys = new Set<string>();
    const seenScNames = new Set<string>();
    const biomarkers: WalletBiomarker[] = [];
    const screenings: WalletScreening[] = [];

    for (const check of allChecks) {
      const rawNames = (check.includedTestsByCategory ?? []).flatMap((cat) => cat.tests);
      if (check.isScreening) {
        for (const name of deduplicateScreenings(rawNames)) {
          if (seenScNames.has(name)) continue;
          seenScNames.add(name);
          screenings.push({ name, status: readScStatus(name) });
        }
      } else {
        for (const name of Array.from(new Set(rawNames))) {
          const key = normBmKey(name);
          if (seenBmKeys.has(key)) continue;
          seenBmKeys.add(key);
          biomarkers.push({ name, entries: loadWalletHistory(key) });
        }
      }
    }
    setWallet({ biomarkers, screenings });
  }, [recs]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Phase stats ───────────────────────────────────────────────────────────

  const phases = computePhases(wallet.biomarkers, wallet.screenings);
  const journeyState = getJourneyState(phases);

  const totalAdded =
    wallet.biomarkers.filter((b) => b.entries.length > 0).length +
    wallet.screenings.filter((s) => s.status === "done").length;
  const totalPlanned = wallet.screenings.filter((s) => s.status === "planned").length;

  // ── Profile ───────────────────────────────────────────────────────────────

  const recsProfile = recs?.profile ?? null;
  const legacyProfile = summary?.profile_summary ?? null;

  // ── Bilingual copy ────────────────────────────────────────────────────────

  const greeting = (() => {
    const name = session?.user?.name?.split(" ")[0] ?? session?.user?.email?.split("@")[0] ?? null;
    return name ? (isDE ? `Hallo, ${name}` : `Hello, ${name}`) : (isDE ? "Hallo" : "Hello");
  })();

  const journeyHeadline = (() => {
    if (journeyState === "empty") return isDE ? "Ihr Gesundheitsweg beginnt" : "You're getting started";
    if (journeyState === "baseline_partial") return isDE ? "Ihre Basis nimmt Form an" : "Your baseline is taking shape";
    if (journeyState === "out_of_order") return isDE ? "Guter Start — nützliche Daten gefunden" : "Good start — useful data found";
    if (journeyState === "baseline_complete") return isDE ? "Basis abgeschlossen ✓" : "Baseline complete ✓";
    return isDE ? "Gesundheitsdaten vollständig ✓" : "Health data in great shape ✓";
  })();

  const journeySubtitle = (() => {
    if (journeyState === "empty") return isDE
      ? "Beginnen Sie mit Ihrem Basis-Bluttest, um Ihre nächsten Schritte zu personalisieren."
      : "Start with your baseline blood test to personalize your next steps.";
    if (journeyState === "baseline_partial") {
      const c = phases.baseline.completed, t = phases.baseline.total;
      return isDE
        ? `${c} von ${t} Basis-Markern hinzugefügt.`
        : `${c} of ${t} baseline markers added.`;
    }
    if (journeyState === "out_of_order") {
      const parts: string[] = [];
      if (phases.core_risk.completed > 0) parts.push(isDE
        ? `${phases.core_risk.completed} Herz- & Stoffwechselwerte`
        : `${phases.core_risk.completed} heart & metabolic markers`);
      if (phases.screenings.completed > 0) parts.push(isDE
        ? `${phases.screenings.completed} Vorsorge-Ergebnisse`
        : `${phases.screenings.completed} screening results`);
      const added = parts.join(isDE ? " und " : " and ");
      return isDE
        ? `Sie haben bereits ${added} hinzugefügt. Schließen Sie Ihre Basis ab, um alles zu verbinden.`
        : `You've already added ${added}. Finish your baseline to connect everything.`;
    }
    if (journeyState === "baseline_complete") {
      if (phases.core_risk.missing > 0) return isDE
        ? "Weiter: Stärken Sie Ihr Herz- und Stoffwechselprofil."
        : "Next: strengthen your heart & metabolic profile.";
      return isDE
        ? "Weiter: Planen Sie Ihre Vorsorgeuntersuchungen."
        : "Next: book your preventive screenings.";
    }
    return isDE
      ? "Alle empfohlenen Elemente sind erfasst oder geplant."
      : "All recommended items are tracked or planned.";
  })();

  const needsAssessment = summary?.dashboard_state === "needs_assessment" && !recs;

  const phaseNames: Record<Phase, string> = {
    baseline: "Baseline",
    core_risk: isDE ? "Kernrisiken" : "Core risks",
    screenings: isDE ? "Vorsorge" : "Screenings",
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <ProtectedRouteGate
      requestedRoute="/app/dashboard"
      allowStates={["AUTH_ACTIVE_DASHBOARD_READY", "AUTH_PROFILE_READY_RESULTS_UNSEEN", "AUTH_PROFILE_READY_NO_RECOMMENDATIONS"]}
      loadingText={isDE ? "Dashboard wird geladen…" : "Loading your dashboard…"}
    >
      <div className="mx-auto max-w-[72rem] px-5 py-8 md:px-8">

        {/* ── Greeting ── */}
        <div className="mb-6">
          <h1 className="text-[1.5rem] font-semibold tracking-tight text-[#0c0c0c] md:text-[1.75rem]">
            {greeting}
          </h1>
          <p className="mt-0.5 text-[0.9375rem] text-[#737373]">
            {isDE ? "Ihr persönlicher Gesundheitsbegleiter" : "Your personal health command center"}
          </p>
        </div>

        {/* ── Assessment prompt ── */}
        {needsAssessment && (
          <div className="mb-6 rounded-[20px] border border-black/[0.08] bg-white p-6">
            <p className="text-[#404040]">
              {isDE ? "Sie haben noch kein Assessment." : "You don't have an assessment yet."}
            </p>
            <Link href="/health-journey" className="mt-3 inline-flex rounded-[12px] bg-[#0c0c0c] px-4 py-2.5 text-[0.9375rem] font-medium text-white hover:brightness-[0.9]">
              {isDE ? "Assessment starten" : "Start assessment"}
            </Link>
          </div>
        )}

        {/* ── TOP ROW: Hero + Rings ── */}
        <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_240px]">

          {/* Hero journey card */}
          <div className="rounded-[20px] border border-black/[0.08] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.03)] md:p-6">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a3a3a3]">
              {isDE ? "Ihr Gesundheitsweg" : "Your health journey"}
            </p>
            <h2 className="text-[1.375rem] font-semibold tracking-tight text-[#0c0c0c] md:text-[1.5rem]">
              {recsLoading ? (isDE ? "Wird geladen…" : "Loading…") : journeyHeadline}
            </h2>
            <p className="mt-1.5 max-w-[48rem] text-[0.9375rem] text-[#737373]">
              {recsLoading ? "" : journeySubtitle}
            </p>

            {/* Out-of-order recognition inside hero */}
            {!recsLoading && journeyState === "out_of_order" && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1">
                <span className="text-[#16a34a]">✓</span>
                <span className="text-[0.8125rem] text-[#16a34a] font-medium">
                  {isDE ? "Bereits hinzugefügte Daten zählen" : "Data added out of order still counts"}
                </span>
              </div>
            )}

            {/* Divider */}
            {!recsLoading && nextBestCheck && <div className="my-4 h-px bg-black/[0.06]" />}

            {/* Next best action */}
            {!recsLoading && nextBestCheck && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#737373]">
                  {isDE ? "Nächster empfohlener Schritt" : "Next best action"}
                </p>
                <div className="rounded-[14px] border border-black/[0.06] bg-[#fafaf9] px-4 py-3">
                  <p className="text-[0.9375rem] font-semibold text-[#0c0c0c]">
                    {nextBestCheck.checkName}
                  </p>
                  {nextBestCheck.whyForYou && (
                    <p className="mt-1 text-[0.8125rem] leading-relaxed text-[#737373] line-clamp-2">
                      {nextBestCheck.whyForYou}
                    </p>
                  )}
                  {nextBestCheck.includedTestsPreview.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {nextBestCheck.includedTestsPreview.slice(0, 5).map((t) => (
                        <span key={t} className="rounded-full border border-black/[0.08] bg-white px-2.5 py-0.5 text-[0.75rem] text-[#525252]">
                          {t}
                        </span>
                      ))}
                      {nextBestCheck.includedTestsPreview.length > 5 && (
                        <span className="rounded-full border border-black/[0.08] bg-white px-2.5 py-0.5 text-[0.75rem] text-[#a3a3a3]">
                          +{nextBestCheck.includedTestsPreview.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href="/results/action-plan"
                    className="rounded-[12px] bg-[#0c0c0c] px-4 py-2.5 text-[0.875rem] font-medium text-white transition-[filter] hover:brightness-[0.88]"
                  >
                    {isDE ? "Jetzt planen" : "Plan now"}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(true)}
                    className="rounded-[12px] border border-black/[0.1] px-4 py-2.5 text-[0.875rem] font-medium text-[#404040] transition-colors hover:text-[#0c0c0c]"
                  >
                    {isDE ? "Ergebnis hochladen" : "Upload existing result"}
                  </button>
                  <RemindMeButton
                    checkKey={nextBestCheck.checkKey}
                    checkName={nextBestCheck.checkName}
                    isDE={isDE}
                  />
                </div>
              </div>
            )}

            {/* No recommendations state */}
            {!recsLoading && !nextBestCheck && !needsAssessment && (
              <div className="mt-4">
                <p className="text-[0.875rem] text-[#737373]">
                  {isDE
                    ? "Keine Empfehlungen gefunden. Beginnen Sie das Assessment, um personalisierte Empfehlungen zu erhalten."
                    : "No recommendations yet. Complete your assessment to receive personalized recommendations."}
                </p>
                <Link href="/health-journey" className="mt-3 inline-flex rounded-[12px] bg-[#0c0c0c] px-4 py-2.5 text-[0.875rem] font-medium text-white hover:brightness-[0.9]">
                  {isDE ? "Assessment starten" : "Start assessment"}
                </Link>
              </div>
            )}

            {recsLoading && (
              <div className="mt-4 space-y-2">
                <div className="h-4 w-2/3 animate-pulse rounded bg-[#f0f0ef]" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-[#f0f0ef]" />
              </div>
            )}
          </div>

          {/* Phase progress rings */}
          <div className="rounded-[20px] border border-black/[0.08] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
              {isDE ? "Fortschritt" : "Progress"}
            </p>
            <div className="flex flex-row justify-around gap-4 lg:flex-col lg:items-center lg:gap-6">
              {(["baseline", "core_risk", "screenings"] as Phase[]).map((ph) => (
                <PhaseRing
                  key={ph}
                  stats={phases[ph]}
                  label={phaseNames[ph]}
                  isDE={isDE}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── SECOND ROW: Already added + Upcoming ── */}
        <div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-2">

          {/* Already added / recognition */}
          <div className="rounded-[20px] border border-black/[0.08] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
              {isDE ? "Bereits hinzugefügt" : "Already in your wallet"}
            </p>

            {totalAdded === 0 ? (
              <div>
                <p className="text-[0.875rem] text-[#a3a3a3]">
                  {isDE
                    ? "Noch keine Gesundheitsdaten hinzugefügt."
                    : "No health data added yet."}
                </p>
                <p className="mt-1 text-[0.8125rem] text-[#a3a3a3]">
                  {isDE
                    ? "Laden Sie vorhandene Ergebnisse hoch oder planen Sie Ihren Basis-Test."
                    : "Upload existing results or start planning your baseline."}
                </p>
                <Link href="/results/action-plan" className="mt-3 inline-flex text-[0.8125rem] font-medium text-[#0c0c0c] underline underline-offset-2">
                  {isDE ? "Action Plan öffnen" : "Open action plan"}
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {phases.baseline.completed > 0 && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[0.875rem] font-medium text-[#0c0c0c]">Baseline</p>
                      <p className="text-[0.75rem] text-[#737373]">
                        {phases.baseline.completed} {isDE ? "Marker" : "markers"} {isDE ? "hinzugefügt" : "added"}
                      </p>
                    </div>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0c0c0c] text-white">
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none" aria-hidden>
                        <path d="M1 3l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                )}
                {phases.core_risk.completed > 0 && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[0.875rem] font-medium text-[#0c0c0c]">
                        {isDE ? "Herz & Stoffwechsel" : "Heart & metabolic"}
                      </p>
                      <p className="text-[0.75rem] text-[#737373]">
                        {phases.core_risk.completed} {isDE ? "Marker" : "markers"} {isDE ? "hinzugefügt" : "added"}
                      </p>
                    </div>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0c0c0c] text-white">
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none" aria-hidden>
                        <path d="M1 3l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                )}
                {phases.screenings.completed > 0 && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[0.875rem] font-medium text-[#0c0c0c]">
                        {isDE ? "Vorsorgeuntersuchungen" : "Screenings"}
                      </p>
                      <p className="text-[0.75rem] text-[#737373]">
                        {phases.screenings.completed} {isDE ? "abgeschlossen" : "completed"}
                      </p>
                    </div>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0c0c0c] text-white">
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none" aria-hidden>
                        <path d="M1 3l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                )}
                {(journeyState === "out_of_order") && (
                  <p className="pt-1 text-[0.75rem] text-[#737373] border-t border-black/[0.05]">
                    {isDE
                      ? "Diese Daten fließen in Ihre nächste Phase ein."
                      : "We'll use these when reviewing your next phase."}
                  </p>
                )}
                <Link href="/results/overview" className="mt-1 inline-flex text-[0.8125rem] font-medium text-[#0c0c0c] underline underline-offset-2">
                  {isDE ? "Wallet öffnen" : "View wallet"}
                </Link>
              </div>
            )}
          </div>

          {/* Upcoming */}
          <div className="rounded-[20px] border border-black/[0.08] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
              {isDE ? "Geplant & Empfohlen" : "Upcoming"}
            </p>

            {totalPlanned === 0 && !nextBestCheck ? (
              <div>
                <p className="text-[0.875rem] text-[#a3a3a3]">
                  {isDE ? "Noch nichts geplant." : "Nothing scheduled yet."}
                </p>
                <Link href="/my-health-calendar" className="mt-3 inline-flex text-[0.8125rem] font-medium text-[#0c0c0c] underline underline-offset-2">
                  {isDE ? "Kalender öffnen" : "Open calendar"}
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {totalPlanned > 0 && (
                  <div>
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-[#a3a3a3]">
                      {isDE ? "Geplant" : "Planned"}
                    </p>
                    <p className="mt-0.5 text-[0.875rem] font-medium text-[#0c0c0c]">
                      {totalPlanned} {isDE ? "Untersuchung(en)" : `item${totalPlanned > 1 ? "s" : ""}`}
                    </p>
                    <Link href="/my-health-calendar" className="text-[0.75rem] text-[#737373] underline underline-offset-1">
                      {isDE ? "Im Kalender anzeigen" : "View in calendar"}
                    </Link>
                  </div>
                )}
                {nextBestCheck && (
                  <div>
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-[#a3a3a3]">
                      {isDE ? "Nächste Empfehlung" : "Recommended next"}
                    </p>
                    <p className="mt-0.5 text-[0.875rem] font-medium text-[#0c0c0c]">
                      {nextBestCheck.checkName}
                    </p>
                  </div>
                )}
                {recs && recs.pathway.next_month.length > 0 && (
                  <div>
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-[#a3a3a3]">
                      {isDE ? "Diesen Monat" : "This month"}
                    </p>
                    <p className="mt-0.5 text-[0.875rem] font-medium text-[#0c0c0c]">
                      {recs.pathway.next_month.length} {isDE ? "Checks empfohlen" : `check${recs.pathway.next_month.length > 1 ? "s" : ""} recommended`}
                    </p>
                  </div>
                )}
                <Link href="/results/action-plan" className="inline-flex text-[0.8125rem] font-medium text-[#0c0c0c] underline underline-offset-2">
                  {isDE ? "Action Plan öffnen" : "Open action plan"}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── THIRD ROW: Wallet preview + Action Plan nav ── */}
        <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2">

          {/* Health Wallet preview */}
          <Link
            href="/results/overview"
            className="group flex items-center justify-between rounded-[20px] border border-black/[0.08] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.03)] transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
          >
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a3a3a3]">
                {isDE ? "Gesundheitsdaten" : "Health data"}
              </p>
              <p className="mt-1 text-[0.9375rem] font-semibold text-[#0c0c0c]">
                {isDE ? "Health Wallet" : "Health Wallet"}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[0.8125rem] text-[#737373]">
                <span>Baseline {phases.baseline.completed}/{phases.baseline.total}</span>
                <span>{isDE ? "Risiken" : "Core risks"} {phases.core_risk.completed}/{phases.core_risk.total}</span>
                <span>{isDE ? "Vorsorge" : "Screenings"} {phases.screenings.completed}/{phases.screenings.total}</span>
              </div>
            </div>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden className="shrink-0 text-[#c4c4c4] transition-colors group-hover:text-[#0c0c0c]">
              <path d="M3 9h12M10 3l6 6-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          {/* Action Plan nav */}
          <Link
            href="/results/action-plan"
            className="group flex items-center justify-between rounded-[20px] border border-black/[0.08] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.03)] transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
          >
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a3a3a3]">
                {isDE ? "Nächste Schritte" : "Next steps"}
              </p>
              <p className="mt-1 text-[0.9375rem] font-semibold text-[#0c0c0c]">
                {isDE ? "Action Plan" : "Action Plan"}
              </p>
              <p className="mt-0.5 text-[0.8125rem] text-[#737373]">
                {recsLoading
                  ? (isDE ? "Lädt…" : "Loading…")
                  : allChecks.length > 0
                    ? `${allChecks.length} ${isDE ? "empfohlene Checks" : "recommended checks"}`
                    : (isDE ? "Labs, Heimtests, Arztbesuche" : "Labs, home tests, doctor visits")}
              </p>
            </div>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden className="shrink-0 text-[#c4c4c4] transition-colors group-hover:text-[#0c0c0c]">
              <path d="M3 9h12M10 3l6 6-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        {/* ── BOTTOM: Profile ── */}
        <div className="rounded-[20px] border border-black/[0.08] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.03)] md:p-6">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
            {isDE ? "Ihr Profil" : "Your profile"}
          </p>
          <div className="grid grid-cols-2 gap-3 text-[0.875rem] sm:grid-cols-4">
            <div>
              <p className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-[#a3a3a3]">
                {isDE ? "Altersgruppe" : "Age group"}
              </p>
              <p className="mt-0.5 text-[#0c0c0c]">
                {recsProfile?.ageGroup ?? legacyProfile?.age_group ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-[#a3a3a3]">
                {isDE ? "Lebensphase" : "Life stage"}
              </p>
              <p className="mt-0.5 text-[#0c0c0c]">
                {recsProfile?.lifeStage ?? legacyProfile?.life_stage ?? "—"}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-[#a3a3a3]">
                {isDE ? "Ziele" : "Goals"}
              </p>
              <p className="mt-0.5 text-[#0c0c0c]">
                {recsProfile
                  ? (recsProfile.goals.join(", ") || "—")
                  : (legacyProfile?.goals ?? "—")}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-black/[0.06] pt-3">
            <Link
              href={summary?.profile_summary?.retake_assessment_route ?? "/health-journey"}
              className="text-[0.8125rem] text-[#737373] transition-colors hover:text-[#0c0c0c]"
            >
              {isDE ? "Assessment wiederholen" : "Retake assessment"}
            </Link>
            {summaryError && (
              <button type="button" className="text-[0.8125rem] text-[#737373] underline underline-offset-1 hover:text-[#0c0c0c]" onClick={reloadSummary}>
                {isDE ? "Daten neu laden" : "Reload data"}
              </button>
            )}
          </div>
        </div>

      </div>

      <UploadResultsModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSynced={() => {
          // Refresh wallet state — modal stays open so user sees the done/summary step
          setWallet({ biomarkers: [], screenings: [] });
        }}
      />
    </ProtectedRouteGate>
  );
}
