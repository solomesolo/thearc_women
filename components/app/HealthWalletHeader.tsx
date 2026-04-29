"use client";

import Link from "next/link";
import type { BiomarkerWalletEntry } from "@/components/app/BiomarkerActionRow";

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = "baseline" | "core_risk" | "screenings";
type PhaseStatusKey = "not_started" | "in_progress" | "complete" | "planned";
type HeaderState = "empty" | "baseline_partial" | "out_of_order" | "baseline_complete" | "all_done";

interface PhaseStats {
  phase: Phase;
  total: number;
  completed: number;
  planned: number;
  missing: number;
  missingItems: string[];
}

export interface HWBiomarker {
  name: string;
  key: string;
  groupName: string;
  priority: string;
  entries: BiomarkerWalletEntry[];
}

export interface HWScreening {
  name: string;
  priority: string;
  status: "missing" | "planned" | "done";
}

interface Props {
  biomarkers: HWBiomarker[];
  screenings: HWScreening[];
  isDE: boolean;
  onViewBiomarkers: () => void;
  onViewScreenings: () => void;
}

// ── Phase keyword classifier ──────────────────────────────────────────────────
// Classifies a biomarker name into baseline, core_risk, or screenings phase.
// Order matters: HbA1c/hemoglobin-A1c checked before standalone hemoglobin.

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
  return "core_risk"; // default for unrecognized biomarkers
}

// ── Phase computation ─────────────────────────────────────────────────────────

function computePhases(
  biomarkers: HWBiomarker[],
  screenings: HWScreening[],
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

function getHeaderState(phases: Record<Phase, PhaseStats>): HeaderState {
  const total = phases.baseline.total + phases.core_risk.total + phases.screenings.total;
  const completed = phases.baseline.completed + phases.core_risk.completed + phases.screenings.completed;
  const missing = phases.baseline.missing + phases.core_risk.missing + phases.screenings.missing;

  if (total === 0 || completed === 0) return "empty";
  if (missing === 0) return "all_done";

  const baselineIncomplete = phases.baseline.total > 0 && phases.baseline.missing > 0;
  if (baselineIncomplete) {
    const hasLater = phases.core_risk.completed > 0 || phases.screenings.completed > 0;
    return hasLater ? "out_of_order" : "baseline_partial";
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

function currentPriority(state: HeaderState, phases: Record<Phase, PhaseStats>): Phase | null {
  if (state === "all_done") return null;
  if (state === "baseline_complete") {
    if (phases.core_risk.missing > 0) return "core_risk";
    if (phases.screenings.missing > 0) return "screenings";
    return null;
  }
  if (phases.baseline.total > 0) return "baseline";
  if (phases.core_risk.missing > 0) return "core_risk";
  return "screenings";
}

// ── Component ─────────────────────────────────────────────────────────────────

export function HealthWalletHeader({
  biomarkers,
  screenings,
  isDE,
  onViewBiomarkers,
  onViewScreenings,
}: Props) {
  const phases = computePhases(biomarkers, screenings);
  const state = getHeaderState(phases);
  const priority = currentPriority(state, phases);
  const priorityStats = priority ? phases[priority] : null;

  const showAlsoAdded =
    (state === "baseline_partial" || state === "out_of_order") &&
    (phases.core_risk.completed > 0 || phases.screenings.completed > 0);

  // ── Bilingual strings ──────────────────────────────────────────────────────

  const headline = (() => {
    if (state === "empty") return isDE ? "Lassen Sie uns Ihre Gesundheitsbasis aufbauen" : "Let's build your health baseline";
    if (state === "baseline_partial") return isDE ? "Ihre Basisdaten nehmen Form an" : "Your baseline is taking shape";
    if (state === "out_of_order") return isDE ? "Guter Start — wir haben nützliche Gesundheitsdaten" : "Good start — we found useful health data";
    if (state === "baseline_complete") return isDE ? "Basis abgeschlossen" : "Baseline complete";
    return isDE ? "Ihre Gesundheitsdaten sind vollständig" : "Your health data is in great shape";
  })();

  const subtitle = (() => {
    if (state === "empty") return isDE
      ? "Beginnen Sie mit einem einfachen Basis-Bluttest, damit wir Ihre nächsten Schritte personalisieren können."
      : "Start with a simple baseline blood test so we can personalize your next steps.";
    if (state === "baseline_partial") {
      const c = phases.baseline.completed, t = phases.baseline.total;
      return isDE
        ? `${c} von ${t} Basis-Markern hinzugefügt. Fügen Sie die restlichen Marker hinzu, wenn Sie bereit sind.`
        : `${c} of ${t} baseline markers added. Add the remaining markers when ready.`;
    }
    if (state === "out_of_order") {
      const parts: string[] = [];
      if (phases.core_risk.completed > 0) parts.push(isDE
        ? `${phases.core_risk.completed} Herz- & Stoffwechselwerte`
        : `${phases.core_risk.completed} heart & metabolic markers`);
      if (phases.screenings.completed > 0) parts.push(isDE
        ? `${phases.screenings.completed} Vorsorge-Ergebnis${phases.screenings.completed > 1 ? "se" : ""}`
        : `${phases.screenings.completed} screening result${phases.screenings.completed > 1 ? "s" : ""}`);
      const added = parts.join(isDE ? " und " : " and ");
      return isDE
        ? `Sie haben bereits ${added} hinzugefügt. Um Ihre Basis abzuschließen, fügen Sie die Marker unten hinzu.`
        : `You've already added ${added}. To complete your baseline, add the markers below.`;
    }
    if (state === "baseline_complete") {
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

  const alsoAddedNote = (() => {
    const parts: string[] = [];
    if (phases.core_risk.completed > 0) parts.push(isDE
      ? `${phases.core_risk.completed} Herz- & Stoffwechselwerte`
      : `${phases.core_risk.completed} heart & metabolic markers`);
    if (phases.screenings.completed > 0) parts.push(isDE
      ? `${phases.screenings.completed} Vorsorge-Ergebnis${phases.screenings.completed > 1 ? "se" : ""}`
      : `${phases.screenings.completed} screening result${phases.screenings.completed > 1 ? "s" : ""}`);
    const joined = parts.join(isDE ? " und " : " and ");
    return isDE
      ? `Sie haben bereits ${joined}. Wir verwenden diese Daten, wenn wir Ihre nächste Phase überprüfen.`
      : `You already have ${joined}. We'll use these when reviewing your next phase.`;
  })();

  const phaseNames: Record<Phase, string> = {
    baseline: "Baseline",
    core_risk: isDE ? "Kernrisikobereiche" : "Core risk areas",
    screenings: isDE ? "Vorsorge" : "Screenings",
  };

  const phaseStatusLabels: Record<PhaseStatusKey, string> = {
    not_started: isDE ? "Nicht begonnen" : "Not started",
    in_progress: isDE ? "In Bearbeitung" : "In progress",
    complete: isDE ? "Abgeschlossen" : "Complete",
    planned: isDE ? "Geplant" : "Planned",
  };

  const ctaTitle = (() => {
    if (state === "empty" || state === "baseline_partial" || state === "out_of_order")
      return isDE ? "Basis-Bluttest vervollständigen" : "Complete your baseline blood test";
    if (state === "baseline_complete") {
      if (phases.core_risk.missing > 0) return isDE ? "Herz- & Stoffwechselprofil ansehen" : "Review your heart & metabolic profile";
      return isDE ? "Vorsorgeuntersuchungen ansehen" : "View your preventive screenings";
    }
    return isDE ? "Alles auf Kurs" : "Everything on track";
  })();

  const ctaLabel = (() => {
    if (state === "baseline_complete" && phases.core_risk.missing > 0) return isDE ? "Biomarker anzeigen →" : "View biomarkers →";
    if (state === "baseline_complete" && phases.screenings.missing > 0) return isDE ? "Vorsorge anzeigen →" : "View screenings →";
    if (state === "all_done") return isDE ? "Biomarker anzeigen →" : "View biomarkers →";
    return isDE ? "Test planen →" : "Plan this test →";
  })();

  // ── Missing items for the current step ────────────────────────────────────

  const missingForStep = priorityStats?.missingItems ?? [];
  const visibleMissing = missingForStep.slice(0, 6);
  const hiddenCount = missingForStep.length - visibleMissing.length;

  const showMissingChips = visibleMissing.length > 0 &&
    (state === "empty" || state === "baseline_partial" || state === "out_of_order");

  // ── Phase card ─────────────────────────────────────────────────────────────

  function PhaseCard({ stats }: { stats: PhaseStats }) {
    const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    const pStatus = getPhaseStatus(stats);
    const isPriority = priority === stats.phase;

    const statusColor: Record<PhaseStatusKey, string> = {
      not_started: "text-[#a3a3a3]",
      in_progress: "text-[#525252]",
      complete: "text-[#16a34a]",
      planned: "text-[#d97706]",
    };

    const nextTwo = stats.missingItems.slice(0, 2);

    return (
      <div className={`flex-1 min-w-0 rounded-[16px] border p-4 transition-shadow ${
        isPriority
          ? "border-black/[0.12] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.09)]"
          : "border-black/[0.07] bg-[#fafaf9]"
      }`}>
        <div className="flex items-center justify-between gap-1 mb-2">
          <p className="text-[0.8125rem] font-semibold text-[#0c0c0c] truncate">{phaseNames[stats.phase]}</p>
          {isPriority && (
            <span className="shrink-0 rounded-full bg-[#0c0c0c] px-1.5 py-0.5 text-[0.5625rem] font-semibold uppercase tracking-[0.08em] text-white">
              {isDE ? "Aktuell" : "Current"}
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-1 mb-2">
          <span className="font-mono text-[1.125rem] font-semibold tabular-nums leading-none text-[#0c0c0c]">
            {stats.completed}
          </span>
          <span className="text-[0.75rem] text-[#a3a3a3]">/ {stats.total}</span>
        </div>

        <div className="h-1 w-full rounded-full bg-[#e5e5e5] mb-2">
          <div
            className={`h-1 rounded-full transition-all duration-700 ${pStatus === "complete" ? "bg-[#16a34a]" : "bg-[#0c0c0c]"}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <p className={`text-[0.6875rem] font-medium ${statusColor[pStatus]}`}>
          {phaseStatusLabels[pStatus]}
        </p>

        {nextTwo.length > 0 && (
          <p className="mt-1 text-[0.6875rem] text-[#a3a3a3] line-clamp-1">
            {isDE ? "Fehlt:" : "Needs:"} {nextTwo.join(", ")}{stats.missingItems.length > 2 ? "…" : ""}
          </p>
        )}
      </div>
    );
  }

  // ── CTA action ─────────────────────────────────────────────────────────────

  function CtaButton() {
    const cls = "inline-flex items-center gap-1.5 rounded-[10px] bg-white px-4 py-2 text-[0.875rem] font-semibold text-[#0c0c0c] transition-[filter] hover:brightness-[0.92]";

    if (state === "baseline_complete") {
      const handler = phases.core_risk.missing > 0 ? onViewBiomarkers : onViewScreenings;
      return <button type="button" onClick={handler} className={cls}>{ctaLabel}</button>;
    }
    if (state === "all_done") {
      return <button type="button" onClick={onViewBiomarkers} className={cls}>{ctaLabel}</button>;
    }
    return (
      <Link href="/results/action-plan" className={cls}>
        {ctaLabel}
      </Link>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="mb-8 space-y-3">

      {/* ── Main supportive status ── */}
      <div className="rounded-[20px] border border-black/[0.08] bg-white p-5 md:p-6 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a3a3a3]">
          {isDE ? "Ihr Gesundheitsweg" : "Your health journey"}
        </p>
        <h2 className="text-[1.5rem] font-semibold tracking-tight text-[#0c0c0c] md:text-[1.75rem]">
          {headline}
        </h2>
        <p className="mt-2 max-w-[52rem] text-[0.9375rem] text-[#737373]">
          {subtitle}
        </p>
      </div>

      {/* ── Journey phase strip ── */}
      <div className="flex gap-3 overflow-x-auto pb-0.5">
        {(["baseline", "core_risk", "screenings"] as Phase[]).map((ph) => (
          <PhaseCard key={ph} stats={phases[ph]} />
        ))}
      </div>

      {/* ── Next best action + Also added ── */}
      <div className="flex flex-col gap-3 md:flex-row">

        {/* CTA card (dark) */}
        <div className="flex-1 rounded-[20px] border border-black/[0.1] bg-[#0c0c0c] p-5 text-white">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
            {isDE ? "Nächster empfohlener Schritt" : "Next best step"}
          </p>
          <p className="mb-3 text-[1rem] font-semibold leading-snug">{ctaTitle}</p>

          {/* Missing items chips */}
          {showMissingChips && (
            <div className="mb-4">
              <p className="mb-1.5 text-[0.75rem] text-white/40">
                {isDE ? "Benötigt:" : "Needed:"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {visibleMissing.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/[0.18] bg-white/[0.08] px-2.5 py-0.5 text-[0.75rem] text-white/80"
                  >
                    {item}
                  </span>
                ))}
                {hiddenCount > 0 && (
                  <span className="rounded-full border border-white/[0.12] bg-white/[0.05] px-2.5 py-0.5 text-[0.75rem] text-white/40">
                    + {hiddenCount} {isDE ? "später" : "later"}
                  </span>
                )}
              </div>
            </div>
          )}

          <CtaButton />
        </div>

        {/* Also added — only shown when user added later-phase data before finishing baseline */}
        {showAlsoAdded && (
          <div className="md:w-[17rem] rounded-[20px] border border-[#bbf7d0] bg-[#f0fdf4] p-5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#16a34a]">
              {isDE ? "✓ Bereits hinzugefügt" : "✓ Also added"}
            </p>
            <p className="text-[0.875rem] leading-relaxed text-[#374151]">
              {alsoAddedNote}
            </p>
          </div>
        )}

        {/* All done celebration */}
        {state === "all_done" && (
          <div className="md:w-[17rem] rounded-[20px] border border-[#bbf7d0] bg-[#f0fdf4] p-5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#16a34a]">
              {isDE ? "✓ Vollständig" : "✓ Complete"}
            </p>
            <p className="text-[0.875rem] leading-relaxed text-[#374151]">
              {isDE
                ? "Alle empfohlenen Elemente sind erfasst. Überprüfen Sie Ihre Biomarker und Vorsorgeuntersuchungen."
                : "All recommended items are tracked. Review your biomarkers and screenings below."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
