"use client";

import dynamic from "next/dynamic";
import type {
  CheckRecommendation,
  CheckStatus,
  FinalRecommendation,
} from "@/lib/recommendations-engine/types";

const BiomarkerActionRow = dynamic(
  () => import("./BiomarkerActionRow").then((m) => ({ default: m.BiomarkerActionRow })),
  { loading: () => <div className="h-10 rounded-[14px] bg-[#f0f0ef] animate-pulse" /> },
);
const ScreeningActionRow = dynamic(
  () => import("./ScreeningActionRow").then((m) => ({ default: m.ScreeningActionRow })),
  { loading: () => <div className="h-10 rounded-[18px] bg-[#f0f0ef] animate-pulse" /> },
);
import { deduplicateScreenings } from "./ScreeningActionRow";

const STATUS_BADGE_CLASS: Record<CheckStatus, string> = {
  missing: "bg-[#0c0c0c] text-white",
  reminder_set: "bg-[#404040] text-white",
  planned: "bg-[#525252] text-white",
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

function priorityPill(label: PriorityLabel): { text: string; className: string } {
  if (label === "do_now") return { text: "Do now", className: "bg-[#0c0c0c] text-white" };
  if (label === "do_soon") return { text: "Do soon", className: "bg-[#525252] text-white" };
  return { text: "Optional", className: "bg-[#f5f5f4] text-[#404040] border border-black/[0.08]" };
}

function normalizeBiomarkerKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "_")
    .replaceAll(/^_+|_+$/g, "");
}

export function CollapsibleCheckCard({
  check,
  finalRec,
  expanded,
  onToggle,
  onUpdateStatus,
  cardRef,
}: {
  check: CheckRecommendation;
  finalRec: FinalRecommendation | null;
  expanded: boolean;
  onToggle: () => void;
  onUpdateStatus: (key: string, status: CheckStatus) => void;
  cardRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const priority = priorityFromFinal(finalRec, check);
  const pill = priorityPill(priority);

  const statusLabel =
    check.status === "planned"
      ? "Planned"
      : check.status === "completed" || check.status === "result_uploaded"
        ? "Done"
        : "Not started";

  const isDone = check.status === "completed" || check.status === "result_uploaded";
  const primaryCtaLabel =
    check.status === "missing"
      ? "Start planning"
      : check.status === "planned"
        ? "Mark completed"
        : "Completed";
  const primaryNextStatus: CheckStatus =
    check.status === "missing" ? "planned" : check.status === "planned" ? "completed" : check.status;

  return (
    <div
      ref={cardRef as never}
      id={`check-${check.checkKey}`}
      className={`rounded-[20px] border border-black/[0.08] bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)] transition-colors ${isDone ? "bg-[#fafaf9]" : ""}`}
    >
      <div className="p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] ${pill.className}`}>
                {pill.text}
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] ${STATUS_BADGE_CLASS[check.status]}`}>
                {statusLabel}
              </span>
              <span className="rounded-full border border-black/[0.08] bg-white px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[#737373]">
                {check.isScreening
                  ? check.status === "missing"
                    ? "GKV covered"
                    : check.status === "planned"
                      ? "Appointment set"
                      : "Done"
                  : check.status === "missing"
                    ? "~5 min to plan"
                    : check.status === "planned"
                      ? "Ready to complete"
                      : "Done"}
              </span>
            </div>

            <h3 className="mt-3 text-[1.0625rem] font-semibold leading-snug tracking-tight text-[#0c0c0c] md:text-[1.125rem]">
              {check.checkName}
            </h3>
            <p className="mt-1 text-[0.9375rem] leading-[1.6] text-[#737373]">
              {check.shortSummary || "A focused check to build your health baseline and next steps."}
            </p>
          </div>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            className="shrink-0 rounded-[12px] border border-black/[0.08] bg-white px-3 py-2 text-[0.8125rem] font-medium text-[#404040] transition-colors hover:text-[#0c0c0c]"
          >
            {expanded ? "Hide details" : "View details"}
          </button>
        </div>

        {!!(finalRec?.coreTestsNow?.length || check.includedTestsPreview?.length) && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {(finalRec?.coreTestsNow?.length ? finalRec.coreTestsNow : check.includedTestsPreview ?? [])
              .slice(0, 3)
              .map((x) => (
                <span key={x} className="rounded-full border border-black/[0.08] bg-[#fafaf9] px-2.5 py-1 text-[0.75rem] text-[#525252]">
                  {x}
                </span>
              ))}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onUpdateStatus(check.checkKey, primaryNextStatus)}
            disabled={isDone}
            className="rounded-[12px] bg-[#0c0c0c] px-4 py-2.5 text-[0.875rem] font-medium text-white transition-[filter] hover:brightness-[0.88] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {primaryCtaLabel}
          </button>
          {check.status !== "missing" && !isDone && (
            <button
              type="button"
              onClick={() => onUpdateStatus(check.checkKey, "missing")}
              className="rounded-[12px] border border-black/[0.1] px-4 py-2.5 text-[0.875rem] font-medium text-[#737373] transition-colors hover:text-[#0c0c0c]"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-black/[0.06] p-5 md:p-6">
          <div className="rounded-[14px] border border-black/[0.06] bg-[#fafaf9] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
              Why this matters
            </p>
            <p className="mt-2 text-[0.9375rem] leading-[1.65] text-[#404040]">
              {finalRec?.whyRecommendedForYou ?? check.whyForYou}
            </p>
          </div>

          {check.isScreening ? (
            <div className="mt-5 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                Screenings for your profile
              </p>
              <div className="space-y-2">
                {deduplicateScreenings(
                  (check.includedTestsByCategory ?? []).flatMap((cat) => cat.tests)
                ).map((t) => <ScreeningActionRow key={t} screeningName={t} />)}
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                Blood tests included
              </p>
              <div className="rounded-[20px] border border-black/[0.08] bg-white p-4 md:p-5">
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
                        country="DE"
                      />
                    ))}
                </div>

                {!!finalRec?.supportingTests?.length && (
                  <>
                    <div className="mt-6 border-t border-black/[0.06] pt-5" />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                      Lower priority
                    </p>
                    <div className="mt-4 space-y-3">
                      {finalRec.supportingTests.slice(0, 6).map((testName) => (
                        <BiomarkerActionRow
                          key={`support:${testName}`}
                          biomarkerName={testName}
                          biomarkerKey={normalizeBiomarkerKey(testName)}
                          country="DE"
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
                          country="DE"
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
