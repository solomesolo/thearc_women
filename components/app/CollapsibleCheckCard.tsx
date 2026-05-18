"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type {
  CheckRecommendation,
  CheckStatus,
  FinalRecommendation,
} from "@/lib/recommendations-engine/types";
import { AddToHealthCalendarModal } from "@/components/app/AddToHealthCalendarModal";
import { RemindMeButton } from "@/components/app/RemindMeButton";
import {
  loadCalendarMeta,
  loadCalendarOverrides,
  loadCalendarNotes,
  saveCalendarMeta,
  saveCalendarNotes,
  saveCalendarOverrides,
} from "@/lib/calendar/localHealthCalendarStore";
import type { ProviderSuggestions } from "@/lib/providers-de/types";
import { loadUserZip, saveUserZip } from "@/lib/providers-de/useProviderSuggestions";

const BiomarkerActionRow = dynamic(
  () => import("./BiomarkerActionRow").then((m) => ({ default: m.BiomarkerActionRow })),
  { loading: () => <div className="h-10 rounded-[14px] bg-[#f0f0ef] animate-pulse" /> },
);
const ScreeningActionRow = dynamic(
  () => import("./ScreeningActionRow").then((m) => ({ default: m.ScreeningActionRow })),
  { loading: () => <div className="h-10 rounded-[18px] bg-[#f0f0ef] animate-pulse" /> },
);
import { deduplicateScreenings } from "@/lib/screenings/screeningUtils";

const STATUS_BADGE_CLASS: Record<CheckStatus, string> = {
  missing: "bg-[#0c0c0c] text-white",
  reminder_set: "bg-[#e8e4df] text-[#525252]",
  planned: "bg-[#e8e4df] text-[#525252]",
  completed: "bg-white text-[#404040] border border-black/[0.12]",
  result_uploaded: "bg-white text-[#404040] border border-black/[0.12]",
};

type PriorityLabel = "do_now" | "do_soon" | "optional";

function priorityFromFinal(finalRec: FinalRecommendation | null, check: CheckRecommendation): PriorityLabel {
  const tf =
    finalRec?.timeframe ??
    (check.timeframe === "next_month"
      ? "current_month"
      : check.timeframe === "next_3_months"
        ? "next_3_months"
        : check.timeframe === "next_6_months"
          ? "next_6_months"
          : check.timeframe === "next_year"
            ? "next_year"
            : "optional_later");
  if (tf === "current_month") return "do_now";
  if (tf === "next_3_months" || tf === "next_6_months") return "do_soon";
  return "optional";
}

function priorityPill(label: PriorityLabel, isDE: boolean): { text: string; className: string } {
  if (label === "do_now") return { text: isDE ? "Jetzt erledigen" : "Do now", className: "bg-[#0c0c0c] text-white" };
  if (label === "do_soon") return { text: isDE ? "Bald erledigen" : "Do soon", className: "bg-[#525252] text-white" };
  return { text: isDE ? "Optional" : "Optional", className: "bg-[#f5f5f4] text-[#404040] border border-black/[0.08]" };
}

function normalizeBiomarkerKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "_")
    .replaceAll(/^_+|_+$/g, "");
}

// ── Insurance preference ──────────────────────────────────────────────────────

function loadInsuranceType(): "GKV" | "PKV" | null {
  try {
    const v = localStorage.getItem("arc_insurance_type");
    if (v === "GKV" || v === "PKV") return v;
  } catch { /* ignore */ }
  return null;
}

function saveInsuranceType(type: "GKV" | "PKV") {
  try { localStorage.setItem("arc_insurance_type", type); } catch { /* ignore */ }
}

function getCoverageText(isScreening: boolean, type: "GKV" | "PKV", isDE: boolean): string {
  if (type === "GKV") {
    if (isScreening) {
      return isDE
        ? "Im Rahmen der gesetzlichen Vorsorge von der GKV übernommen. In der Regel keine Eigenkosten für Sie."
        : "Covered by statutory health insurance (GKV) as part of routine preventive care. Usually no cost to you.";
    }
    return isDE
      ? "Die GKV übernimmt dies bei medizinischer Indikation. Als reine Vorsorge ohne Überweisung ist meist ein Selbstanteil fällig (ca. 15–80 €). Sprechen Sie mit Ihrem Arzt über eine Indikation."
      : "GKV covers this if medically indicated. As a preventive check without a referral, it may be self-pay (typically €15–€80). Ask your doctor for an indication.";
  }
  if (isScreening) {
    return isDE
      ? "Die PKV übernimmt Vorsorgeuntersuchungen in der Regel vollständig. Bitte prüfen Sie Ihren Tarif oder fragen Sie Ihre Versicherung."
      : "Private insurance (PKV) typically covers preventive screenings in full. Confirm with your insurer or review your tariff.";
  }
  return isDE
    ? "Die PKV erstattet die meisten Labortests nach GOÄ-Abrechnung. Prüfen Sie Ihren Versicherungsvertrag für Details zur genauen Übernahmequote."
    : "Private insurance (PKV) reimburses most lab tests under GOÄ billing. Check your policy for the exact coverage level.";
}

function buildDoctorRequestText(check: CheckRecommendation, finalRec: FinalRecommendation | null, isDE: boolean): string {
  const topTests = (finalRec?.coreTestsNow?.length ? finalRec.coreTestsNow : check.includedTestsPreview ?? []).slice(0, 3).join(", ");

  if (check.checkKey === "preventive_baseline") {
    if (isDE) {
      return `Ich möchte mein präventives Gesundheits-Baseline vervollständigen. Können wir die folgenden Tests durchführen: ${topTests}?`;
    }
    return `I'd like to complete my preventive health baseline. Could we check the included tests: ${topTests}?`;
  }

  if (check.isScreening) {
    if (isDE) {
      return `Ich möchte besprechen, ob ich laut meiner Vorsorgehistorie für ${check.checkName} fällig bin.`;
    }
    return `I'd like to discuss whether I'm due for ${check.checkName} based on my age and screening history.`;
  }

  if (isDE) {
    return `Ich möchte ${check.checkName} im Rahmen meiner Vorsorge besprechen.`;
  }
  return `I'd like to discuss ${check.checkName} as part of my preventive health routine.`;
}

export function CollapsibleCheckCard({
  check,
  finalRec,
  expanded,
  onToggle,
  onUpdateStatus,
  onUploadResult,
  cardRef,
  isDE = false,
  providerSuggestions = null,
}: {
  check: CheckRecommendation;
  finalRec: FinalRecommendation | null;
  expanded: boolean;
  onToggle: () => void;
  onUpdateStatus: (key: string, status: CheckStatus) => void;
  onUploadResult?: () => void;
  cardRef?: React.RefObject<HTMLDivElement | null>;
  isDE?: boolean;
  providerSuggestions?: ProviderSuggestions | null;
}) {
  const priority = priorityFromFinal(finalRec, check);
  const pill = priorityPill(priority, isDE);

  const statusLabel =
    check.status === "planned"
      ? isDE ? "Geplant" : "Planned"
      : check.status === "completed" || check.status === "result_uploaded"
        ? isDE ? "Erledigt" : "Done"
        : check.status === "reminder_set"
          ? isDE ? "Erinnerung gesetzt" : "Reminder set"
          : isDE ? "Nicht geplant" : "Not planned";

  const isDone = check.status === "completed" || check.status === "result_uploaded";

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [initialMeta, setInitialMeta] = useState<{ plannedDateISO?: string; doctorName?: string; address?: string; notes?: string } | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const [insuranceType, setInsuranceType] = useState<"GKV" | "PKV" | null>(() =>
    typeof window !== "undefined" ? loadInsuranceType() : null,
  );
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [showZipInput, setShowZipInput] = useState(false);
  const [zipDraft, setZipDraft] = useState("");
  const [zip, setZip] = useState<string | null>(() =>
    typeof window !== "undefined" ? loadUserZip() : null,
  );

  const updateZip = (val: string) => {
    saveUserZip(val);
    setZip(val);
  };

  const suggestions = providerSuggestions;

  const doctorText = buildDoctorRequestText(check, finalRec, isDE);

  const handleCopyText = () => {
    navigator.clipboard.writeText(doctorText).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  };

  const previewTests = (finalRec?.coreTestsNow?.length ? finalRec.coreTestsNow : check.includedTestsPreview ?? []).slice(0, 3);

  return (
    <div
      ref={cardRef as never}
      id={`check-${check.checkKey}`}
      className={`rounded-[20px] border border-black/[0.08] bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)] transition-colors ${isDone ? "bg-[#fafaf9]" : ""}`}
    >
      {/* Collapsed header */}
      <div className="p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] ${pill.className}`}>
                {pill.text}
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] ${STATUS_BADGE_CLASS[check.status]}`}>
                {statusLabel}
              </span>
            </div>

            <h3 className="mt-3 text-[1.0625rem] font-semibold leading-snug tracking-tight text-[#0c0c0c] md:text-[1.125rem]">
              {check.checkName}
            </h3>
            <p className="mt-1 text-[0.9375rem] leading-[1.6] text-[#737373]">
              {check.shortSummary}
            </p>
          </div>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            className="shrink-0 rounded-[12px] border border-black/[0.08] bg-white px-3 py-2 text-[0.8125rem] font-medium text-[#404040] transition-colors hover:text-[#0c0c0c]"
          >
            {expanded ? (isDE ? "Schliessen" : "Hide details") : (isDE ? "Details" : "View details")}
          </button>
        </div>

        {previewTests.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {previewTests.map((x) => (
              <span key={x} className="rounded-full border border-black/[0.08] bg-[#fafaf9] px-2.5 py-1 text-[0.75rem] text-[#525252]">
                {x}
              </span>
            ))}
          </div>
        )}

        {/* Action row — bottom of collapsed state */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onUpdateStatus(check.checkKey, "planned")}
            disabled={isDone || check.status === "planned"}
            className="rounded-[12px] bg-[#0c0c0c] px-4 py-2.5 text-[0.875rem] font-medium text-white transition-[filter] hover:brightness-[0.88] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {check.status === "planned"
              ? (isDE ? "Geplant" : "Planned")
              : (isDE ? "Als geplant markieren" : "Mark as planned")}
          </button>

          <button
            type="button"
            onClick={() => {
              const overrides = loadCalendarOverrides();
              const meta = loadCalendarMeta();
              const notes = loadCalendarNotes();
              const planned = meta[check.checkKey]?.plannedDateISO ?? overrides[check.checkKey];
              setInitialMeta({
                plannedDateISO: planned,
                doctorName: meta[check.checkKey]?.doctorName,
                address: meta[check.checkKey]?.address,
                notes: meta[check.checkKey]?.notes ?? notes[`${check.checkKey}:${planned ?? ""}`],
              });
              setCalendarOpen(true);
            }}
            className="rounded-[12px] border border-black/[0.1] bg-white px-4 py-2.5 text-[0.875rem] font-medium text-[#404040] transition-colors hover:text-[#0c0c0c]"
          >
            {isDE ? "Zum Kalender" : "Add to calendar"}
          </button>

          {!isDone && (
            <RemindMeButton
              checkKey={check.checkKey}
              checkName={check.checkName}
              isDE={isDE}
            />
          )}

          {onUploadResult && !isDone && (
            <button
              type="button"
              onClick={onUploadResult}
              className="rounded-[12px] border border-black/[0.1] bg-white px-4 py-2.5 text-[0.875rem] font-medium text-[#404040] transition-colors hover:text-[#0c0c0c]"
            >
              {isDE ? "Ergebnis hochladen" : "Upload result"}
            </button>
          )}

          {!isDone && (
            <button
              type="button"
              onClick={() => onUpdateStatus(check.checkKey, "completed")}
              className="rounded-[12px] border border-black/[0.1] bg-white px-4 py-2.5 text-[0.875rem] font-medium text-[#404040] transition-colors hover:text-[#0c0c0c]"
            >
              {isDE ? "Erledigt" : "Done"}
            </button>
          )}
        </div>
      </div>

      {/* Expanded state */}
      {expanded && (
        <div className="border-t border-black/[0.06]">

          {/* Section 1: Why this matters */}
          <div className="px-5 py-5 md:px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
              {isDE ? "Warum das wichtig ist" : "Why this matters"}
            </p>
            <p className="mt-2 text-[0.9375rem] leading-[1.65] text-[#404040]">
              {finalRec?.whyRecommendedForYou ?? check.whyForYou}
            </p>
            {check.whyNow && check.whyNow !== check.whyForYou && (
              <p className="mt-3 text-[0.9375rem] leading-[1.65] text-[#404040]">
                {check.whyNow}
              </p>
            )}
          </div>

          {/* Section 2: Included tests */}
          <div className="border-t border-black/[0.06] px-5 py-5 md:px-6">
            {check.isScreening ? (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                  {isDE ? "Enthaltene Untersuchungen" : "Included screenings"}
                </p>
                <div className="mt-3 space-y-2">
                  {deduplicateScreenings(
                    (check.includedTestsByCategory ?? []).flatMap((cat) => cat.tests)
                  ).map((t) => (
                    <ScreeningActionRow key={t} screeningName={t} />
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                  {isDE ? "Enthaltene Bluttests" : "Blood tests included"}
                </p>

                <div className="mt-3 rounded-[14px] border border-black/[0.06] bg-[#fafaf9] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                    {isDE ? "Kerntests" : "Core tests"}
                  </p>
                  <div className="mt-3 space-y-3">
                    {(finalRec?.coreTestsNow?.length ? finalRec.coreTestsNow : check.includedTestsPreview ?? [])
                      .slice(0, 6)
                      .map((testName) => (
                        <BiomarkerActionRow
                          key={`core:${testName}`}
                          biomarkerName={testName}
                          biomarkerKey={normalizeBiomarkerKey(testName)}
                          country="DE"
                        />
                      ))}
                  </div>
                </div>

                {!!finalRec?.supportingTests?.length && (
                  <div className="mt-3 rounded-[14px] border border-black/[0.06] bg-[#fafaf9] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                      {isDE ? "Erganzende Tests" : "Supporting tests"}
                    </p>
                    <div className="mt-3 space-y-3">
                      {finalRec.supportingTests.slice(0, 6).map((testName) => (
                        <BiomarkerActionRow
                          key={`support:${testName}`}
                          biomarkerName={testName}
                          biomarkerKey={normalizeBiomarkerKey(testName)}
                          country="DE"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {!!finalRec?.laterTests?.length && (
                  <div className="mt-3 rounded-[14px] border border-black/[0.06] bg-[#fafaf9] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                      {isDE ? "Optional / spater" : "Optional / later"}
                    </p>
                    <div className="mt-3 space-y-3">
                      {finalRec.laterTests.slice(0, 6).map((testName) => (
                        <BiomarkerActionRow
                          key={`later:${testName}`}
                          biomarkerName={testName}
                          biomarkerKey={normalizeBiomarkerKey(testName)}
                          country="DE"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Section 3: How to complete this — real provider suggestions */}
          <div className="border-t border-black/[0.06] px-5 py-5 md:px-6">

            {/* Section header + ZIP control */}
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                {isDE ? "Wie Sie das erledigen" : "How to complete this"}
              </p>
              {!showZipInput && (
                <button
                  type="button"
                  onClick={() => { setZipDraft(zip ?? ""); setShowZipInput(true); }}
                  className="text-[0.75rem] text-[#737373] underline underline-offset-2 transition-colors hover:text-[#0c0c0c]"
                >
                  {zip
                    ? (isDE ? `PLZ: ${zip} ändern` : `ZIP: ${zip} · change`)
                    : (isDE ? "PLZ eingeben" : "Enter ZIP for local options")}
                </button>
              )}
            </div>

            {/* ZIP input */}
            {showZipInput && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  value={zipDraft}
                  onChange={(e) => setZipDraft(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && zipDraft.length === 5) {
                      updateZip(zipDraft);
                      setShowZipInput(false);
                    }
                  }}
                  placeholder={isDE ? "PLZ" : "ZIP"}
                  autoComplete="postal-code"
                  className="w-24 rounded-[10px] border border-black/[0.1] bg-white px-3 py-2 text-[0.875rem] text-[#0c0c0c] placeholder:text-[#a3a3a3] focus:border-black/[0.3] focus:outline-none"
                />
                <button
                  type="button"
                  disabled={zipDraft.length !== 5}
                  onClick={() => {
                    updateZip(zipDraft);
                    setShowZipInput(false);
                  }}
                  className="rounded-[10px] bg-[#0c0c0c] px-3.5 py-2 text-[0.8125rem] font-medium text-white transition-[filter] hover:brightness-[0.88] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isDE ? "Speichern" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowZipInput(false)}
                  className="text-[0.8125rem] text-[#a3a3a3] hover:text-[#737373]"
                >
                  {isDE ? "Abbrechen" : "Cancel"}
                </button>
              </div>
            )}

            {suggestions && (
              <div className="mt-3 space-y-3">

                {/* ── Online home tests ── */}
                {suggestions.onlineProducts.length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a3a3a3]">
                      {isDE ? "Online-Heimtest" : "Home test (online)"}
                    </p>
                    <div className="rounded-[14px] border border-black/[0.06] bg-[#fafaf9] divide-y divide-black/[0.05]">
                      {suggestions.onlineProducts.map(({ product, provider }) => (
                        <div key={`${provider.id}-${product.id}`} className="flex items-center justify-between gap-4 px-4 py-3">
                          <div className="min-w-0">
                            <p className="text-[0.875rem] font-medium text-[#0c0c0c]">
                              {provider.name}
                            </p>
                            <p className="mt-0.5 truncate text-[0.8125rem] text-[#737373]">
                              {product.name}
                              {product.price != null && (
                                <span className="ml-1.5 text-[#525252]">
                                  · €{product.price.toFixed(0)}
                                </span>
                              )}
                            </p>
                          </div>
                          <a
                            href={provider.url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 rounded-[12px] border border-black/[0.1] px-4 py-2.5 text-[0.875rem] font-medium text-[#404040] transition-colors hover:text-[#0c0c0c]"
                          >
                            {isDE ? "Bestellen" : "Order"}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Local labs ── */}
                {suggestions.localLabs.length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a3a3a3]">
                      {isDE ? "Labor in Ihrer Nähe" : "Lab near you"}
                    </p>
                    <div className="rounded-[14px] border border-black/[0.06] bg-[#fafaf9] divide-y divide-black/[0.05]">
                      {suggestions.localLabs.map(({ lab }) => (
                        <div key={lab.id} className="flex items-center justify-between gap-4 px-4 py-3">
                          <div className="min-w-0">
                            <p className="text-[0.875rem] font-medium text-[#0c0c0c]">{lab.name}</p>
                            <p className="mt-0.5 text-[0.8125rem] text-[#737373]">{lab.location}</p>
                          </div>
                          <a
                            href={lab.url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 rounded-[12px] border border-black/[0.1] px-4 py-2.5 text-[0.875rem] font-medium text-[#404040] transition-colors hover:text-[#0c0c0c]"
                          >
                            {isDE ? "Website" : "Website"}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── IGeL doctors ── */}
                {suggestions.igelDoctors.length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a3a3a3]">
                      {isDE ? "Arztpraxis in Ihrer Nähe" : "Doctor near you"}
                    </p>
                    <div className="rounded-[14px] border border-black/[0.06] bg-[#fafaf9] divide-y divide-black/[0.05]">
                      {suggestions.igelDoctors.map(({ doctor }) => (
                        <div key={doctor.id} className="flex items-center justify-between gap-4 px-4 py-3">
                          <div className="min-w-0">
                            <p className="text-[0.875rem] font-medium text-[#0c0c0c]">{doctor.name}</p>
                            <p className="mt-0.5 text-[0.8125rem] text-[#737373]">
                              {doctor.address ? `${doctor.address}, ` : ""}{doctor.city}
                              {doctor.specialty ? ` · ${doctor.specialty}` : ""}
                            </p>
                          </div>
                          <a
                            href={doctor.url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 rounded-[12px] border border-black/[0.1] px-4 py-2.5 text-[0.875rem] font-medium text-[#404040] transition-colors hover:text-[#0c0c0c]"
                          >
                            {isDE ? "Website" : "Website"}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── No local results — nudge ZIP ── */}
                {!suggestions.hasLocalResults && !zip && (
                  <button
                    type="button"
                    onClick={() => { setZipDraft(""); setShowZipInput(true); }}
                    className="mt-1 text-[0.8125rem] text-[#737373] underline underline-offset-2 hover:text-[#0c0c0c]"
                  >
                    {isDE
                      ? "PLZ eingeben für lokale Labors und Praxen"
                      : "Enter your ZIP to see local labs and clinics"}
                  </button>
                )}

                {/* ── Through your doctor (always) ── */}
                <div className="rounded-[14px] border border-black/[0.06] bg-[#fafaf9] px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[0.875rem] font-medium text-[#0c0c0c]">
                        {isDE ? "Über Ihren Arzt" : "Through your doctor"}
                      </p>
                      <p className="mt-0.5 text-[0.8125rem] text-[#737373]">
                        {isDE
                          ? "Empfohlen für Versicherungsdeckung oder medizinischen Kontext."
                          : "Recommended for insurance coverage or medical context."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById(`doctor-request-${check.checkKey}`);
                        el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                      }}
                      className="shrink-0 rounded-[12px] border border-black/[0.1] px-4 py-2.5 text-[0.875rem] font-medium text-[#404040] transition-colors hover:text-[#0c0c0c]"
                    >
                      {isDE ? "Arzt fragen" : "Ask your doctor"}
                    </button>
                  </div>
                </div>

                {/* ── Upload existing result ── */}
                {onUploadResult && (
                  <div className="rounded-[14px] border border-black/[0.06] bg-[#fafaf9] px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[0.875rem] font-medium text-[#0c0c0c]">
                          {isDE ? "Ergebnis hochladen" : "Upload existing result"}
                        </p>
                        <p className="mt-0.5 text-[0.8125rem] text-[#737373]">
                          {isDE
                            ? "Bereits Ergebnisse? PDF oder Foto hochladen."
                            : "Already have results? Upload a PDF or photo."}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={onUploadResult}
                        className="shrink-0 rounded-[12px] border border-black/[0.1] px-4 py-2.5 text-[0.875rem] font-medium text-[#404040] transition-colors hover:text-[#0c0c0c]"
                      >
                        {isDE ? "Hochladen" : "Upload"}
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Section 4: Coverage and doctor support */}
          <div className="border-t border-black/[0.06] px-5 py-5 md:px-6 space-y-4">

            {/* Coverage card */}
            <div className="rounded-[14px] border border-black/[0.06] bg-[#fafaf9] px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                  {isDE ? "Versicherung" : "Coverage"}
                </p>
                {insuranceType && (
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#0c0c0c] px-2.5 py-0.5 text-[0.6875rem] font-semibold text-white">
                      {insuranceType}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowInsuranceModal(true)}
                      className="text-[0.75rem] text-[#737373] transition-colors hover:text-[#0c0c0c]"
                    >
                      {isDE ? "Ändern" : "Change"}
                    </button>
                  </div>
                )}
              </div>

              {insuranceType ? (
                <p className="mt-2 text-[0.9375rem] leading-[1.65] text-[#404040]">
                  {getCoverageText(check.isScreening, insuranceType, isDE)}
                </p>
              ) : (
                <>
                  <p className="mt-2 text-[0.9375rem] leading-[1.65] text-[#404040]">
                    {check.isScreening
                      ? isDE
                        ? "Oft von der GKV übernommen, wenn Bestandteil der Regelvorsorge. Bitte bei Arzt oder Kasse bestätigen."
                        : "Often covered by public insurance (GKV) when part of guideline-based screening. Confirm with your doctor or insurer."
                      : isDE
                        ? "Die Übernahme hängt von Ihrem Versicherungsplan und der medizinischen Indikation ab."
                        : "Coverage depends on your insurance plan and whether the test is medically indicated."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-4">
                    <button
                      type="button"
                      onClick={() => setShowInsuranceModal(true)}
                      className="text-[0.8125rem] font-medium text-[#0c0c0c] underline underline-offset-2 transition-colors hover:text-[#525252]"
                    >
                      {isDE ? "Plan prüfen" : "Check your plan"}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Insurance type modal */}
            {showInsuranceModal && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                onClick={() => setShowInsuranceModal(false)}
              >
                <div
                  className="w-full max-w-sm rounded-[24px] bg-white p-6 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-[#a3a3a3]">
                    {isDE ? "Einmalige Einstellung" : "One-time setting"}
                  </p>
                  <p className="mt-2 text-[1.125rem] font-semibold tracking-tight text-[#0c0c0c]">
                    {isDE ? "Wie sind Sie versichert?" : "How are you insured?"}
                  </p>
                  <p className="mt-1.5 text-[0.875rem] leading-[1.6] text-[#737373]">
                    {isDE
                      ? "Wir speichern Ihre Antwort und zeigen Ihnen passende Kostenübernahmeinformationen für alle Empfehlungen."
                      : "We'll save your answer and show you relevant coverage information across all your recommendations."}
                  </p>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        saveInsuranceType("GKV");
                        setInsuranceType("GKV");
                        setShowInsuranceModal(false);
                      }}
                      className="rounded-[16px] border-2 border-black/[0.08] bg-[#fafaf9] px-4 py-4 text-left transition-colors hover:border-[#0c0c0c]"
                    >
                      <p className="text-[1.0625rem] font-semibold text-[#0c0c0c]">GKV</p>
                      <p className="mt-0.5 text-[0.8125rem] text-[#737373]">
                        {isDE ? "Gesetzliche Krankenversicherung" : "Public health insurance"}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        saveInsuranceType("PKV");
                        setInsuranceType("PKV");
                        setShowInsuranceModal(false);
                      }}
                      className="rounded-[16px] border-2 border-black/[0.08] bg-[#fafaf9] px-4 py-4 text-left transition-colors hover:border-[#0c0c0c]"
                    >
                      <p className="text-[1.0625rem] font-semibold text-[#0c0c0c]">PKV</p>
                      <p className="mt-0.5 text-[0.8125rem] text-[#737373]">
                        {isDE ? "Private Krankenversicherung" : "Private health insurance"}
                      </p>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowInsuranceModal(false)}
                    className="mt-4 w-full text-center text-[0.8125rem] text-[#a3a3a3] transition-colors hover:text-[#737373]"
                  >
                    {isDE ? "Abbrechen" : "Cancel"}
                  </button>
                </div>
              </div>
            )}

            {/* Doctor request card */}
            <div
              id={`doctor-request-${check.checkKey}`}
              className="rounded-[14px] border border-black/[0.06] bg-[#fafaf9] px-4 py-3"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                {isDE ? "Arzt ansprechen" : "How to ask your doctor"}
              </p>
              <blockquote className="mt-3 border-l-2 border-black/[0.15] pl-3 italic text-[0.9375rem] leading-[1.65] text-[#404040]">
                {doctorText}
              </blockquote>
              <button
                type="button"
                onClick={handleCopyText}
                className="mt-3 rounded-[12px] border border-black/[0.1] px-4 py-2 text-[0.8125rem] font-medium text-[#404040] transition-colors hover:text-[#0c0c0c]"
              >
                {copied ? (isDE ? "Kopiert" : "Copied") : (isDE ? "Text kopieren" : "Copy text")}
              </button>
            </div>
          </div>

          {/* Section 5: Assistant entry points */}
          <div className="border-t border-black/[0.06] px-5 pb-5 pt-4 md:px-6">
            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                disabled
                className="text-[0.8125rem] font-medium text-[#a3a3a3] underline underline-offset-2 cursor-not-allowed"
                title={isDE ? "Demnachst verfugbar" : "Coming soon"}
              >
                {isDE ? "Assistent fragen" : "Ask assistant"}
              </button>
              <button
                type="button"
                disabled
                className="text-[0.8125rem] font-medium text-[#a3a3a3] underline underline-offset-2 cursor-not-allowed"
                title={isDE ? "Demnachst verfugbar" : "Coming soon"}
              >
                {isDE ? "Versicherung prufen" : "Check coverage"}
              </button>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById(`doctor-request-${check.checkKey}`);
                  el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }}
                className="text-[0.8125rem] font-medium text-[#525252] underline underline-offset-2 hover:text-[#0c0c0c] transition-colors cursor-pointer"
              >
                {isDE ? "Arztgesprach vorbereiten" : "Prepare doctor request"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AddToHealthCalendarModal
        open={calendarOpen}
        title={check.checkName}
        initial={initialMeta}
        onClose={() => setCalendarOpen(false)}
        onSave={(meta) => {
          const overrides = loadCalendarOverrides();
          overrides[check.checkKey] = meta.plannedDateISO;
          saveCalendarOverrides(overrides);

          const allMeta = loadCalendarMeta();
          allMeta[check.checkKey] = meta;
          saveCalendarMeta(allMeta);

          if (meta.notes) {
            const allNotes = loadCalendarNotes();
            allNotes[`${check.checkKey}:${meta.plannedDateISO}`] = meta.notes;
            saveCalendarNotes(allNotes);
          }

          onUpdateStatus(check.checkKey, "planned");
          setCalendarOpen(false);
        }}
      />
    </div>
  );
}
