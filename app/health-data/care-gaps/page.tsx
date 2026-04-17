"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";

// ── Types ─────────────────────────────────────────────────────────────────────

type CareGap = {
  canonicalMetricName:  string;
  category:             string;
  label:                string;
  gapStatus:            "overdue" | "never_recorded" | "due_soon" | "current";
  priority:             "urgent" | "surveillance" | "routine";
  lastObservedDate:     string | null;
  expectedIntervalDays: number;
  nextExpectedDate:     string | null;
  daysOverdue:          number | null;
  daysUntilDue:         number | null;
  suggestedAction:      string;
  guidelineSource:      string;
};

type Data = {
  care_gap_flags:             CareGap[];
  suggested_followups:        CareGap[];
  next_expected_intervention: CareGap | null;
  summary:                    { overdue: number; due_soon: number; never_recorded: number; current: number; total: number };
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusBadge(status: CareGap["gapStatus"]) {
  switch (status) {
    case "overdue":
      return "bg-red-50 text-red-700 border-red-100";
    case "never_recorded":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "due_soon":
      return "bg-blue-50 text-blue-700 border-blue-100";
    default:
      return "bg-black/[0.04] text-black/50 border-black/[0.06]";
  }
}

function statusLabel(status: CareGap["gapStatus"]) {
  switch (status) {
    case "overdue":       return "Overdue";
    case "never_recorded": return "Not on record";
    case "due_soon":      return "Due soon";
    default:              return "Current";
  }
}

function priorityDot(priority: CareGap["priority"]) {
  switch (priority) {
    case "urgent":       return "bg-red-500";
    case "surveillance": return "bg-amber-400";
    default:             return "bg-black/20";
  }
}

// ── Gap card ───────────────────────────────────────────────────────────────────

function GapCard({ gap }: { gap: CareGap }) {
  const overdueDays = gap.daysOverdue;
  const dueDays     = gap.daysUntilDue;
  const lastDate    = gap.lastObservedDate
    ? new Date(gap.lastObservedDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : null;
  const nextDate = gap.nextExpectedDate
    ? new Date(gap.nextExpectedDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="rounded-[18px] border border-black/[0.07] bg-white overflow-hidden">
      <div className="px-5 pt-5 pb-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <span className={["mt-1.5 h-2 w-2 shrink-0 rounded-full", priorityDot(gap.priority)].join(" ")} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[14px] font-semibold text-[var(--text-primary)] leading-snug">
                {gap.label}
              </p>
              <span className={[
                "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                statusBadge(gap.gapStatus),
              ].join(" ")}>
                {statusLabel(gap.gapStatus)}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-black/35">{fmt(gap.category)}</p>
          </div>
        </div>

        {/* Meta row */}
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-black/40">
          {lastDate && (
            <span>Last recorded: {lastDate}</span>
          )}
          {overdueDays != null && (
            <span className="text-red-500 font-medium">{overdueDays} day{overdueDays !== 1 ? "s" : ""} overdue</span>
          )}
          {dueDays != null && (
            <span className="text-blue-600">Due in {dueDays} day{dueDays !== 1 ? "s" : ""}</span>
          )}
          {nextDate && gap.gapStatus !== "never_recorded" && (
            <span>Expected by: {nextDate}</span>
          )}
          {gap.gapStatus === "never_recorded" && (
            <span className="text-amber-600">No record found</span>
          )}
          <span>Every {Math.round(gap.expectedIntervalDays / 30)} months</span>
        </div>

        {/* Suggested action */}
        <p className="mt-3 text-[13px] leading-[1.55] text-[var(--text-secondary)]">
          {gap.suggestedAction}
        </p>

        {/* Guideline */}
        {gap.guidelineSource && (
          <p className="mt-2 text-[11px] text-black/30">
            Source: {gap.guidelineSource}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Summary bar ────────────────────────────────────────────────────────────────

function SummaryBar({ summary }: { summary: Data["summary"] }) {
  const items = [
    { label: "Overdue",       value: summary.overdue,        color: "text-red-600" },
    { label: "Due soon",      value: summary.due_soon,       color: "text-blue-600" },
    { label: "Not on record", value: summary.never_recorded, color: "text-amber-600" },
    { label: "Current",       value: summary.current,        color: "text-black/40" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-[14px] border border-black/[0.07] bg-white px-4 py-4">
          <p className={["text-[22px] font-semibold tracking-tight", item.color].join(" ")}>
            {item.value}
          </p>
          <p className="mt-0.5 text-[11px] text-black/40">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CareGapsPage() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [recomputing, setRecomputing] = useState(false);
  const [tab, setTab] = useState<"gaps" | "followups">("gaps");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/health-data/care-gaps");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleRecompute() {
    setRecomputing(true);
    try {
      await fetch("/api/health-data/care-gaps", { method: "POST" });
      await fetchData();
    } finally {
      setRecomputing(false);
    }
  }

  const gaps     = data?.care_gap_flags ?? [];
  const followups = data?.suggested_followups ?? [];
  const nextItem  = data?.next_expected_intervention;
  const activeList = tab === "gaps" ? gaps : followups;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Container className="py-12 md:py-16">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/40">
              Health Data
            </p>
            <h1 className="mt-2 text-[1.75rem] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
              Care Plan
            </h1>
            <p className="mt-1.5 text-[14px] text-[var(--text-secondary)]">
              Missing tests and upcoming follow-ups based on your health records.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRecompute}
            disabled={recomputing || loading}
            className="shrink-0 rounded-[12px] border border-black/[0.1] bg-white px-4 py-2 text-[13px] font-medium text-[var(--text-primary)] hover:bg-black/[0.03] transition-colors disabled:opacity-40"
          >
            {recomputing ? "Updating…" : "Refresh plan"}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/10 border-t-black/60" />
            <span className="text-[14px] text-[var(--text-secondary)]">Loading care plan…</span>
          </div>
        ) : !data || (gaps.length === 0 && followups.length === 0) ? (
          <div className="mt-16 flex flex-col items-center justify-center text-center">
            <span className="text-3xl">🗓</span>
            <p className="mt-4 text-[15px] font-medium text-[var(--text-primary)]">
              No care gaps found
            </p>
            <p className="mt-2 text-[13px] leading-[1.6] text-[var(--text-secondary)] max-w-xs">
              Upload health documents so The Arc can identify what tests may be missing or overdue.
            </p>
            <Link
              href="/upload"
              className="mt-6 inline-flex h-10 items-center rounded-[12px] bg-[var(--foreground)] px-5 text-[13px] font-medium text-[var(--background)] hover:opacity-90 transition-opacity no-underline"
            >
              Upload health data
            </Link>
          </div>
        ) : (
          <>
            {/* Summary */}
            {data.summary && (
              <div className="mt-8">
                <SummaryBar summary={data.summary} />
              </div>
            )}

            {/* Next action banner */}
            {nextItem && (
              <div className="mt-6 rounded-[18px] border border-black/[0.08] bg-[var(--color-surface)] px-5 py-5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-black/40">
                  Most urgent action
                </p>
                <p className="mt-1.5 text-[15px] font-semibold text-[var(--text-primary)]">
                  {nextItem.label}
                </p>
                <p className="mt-1 text-[13px] leading-[1.55] text-[var(--text-secondary)]">
                  {nextItem.suggestedAction}
                </p>
                {nextItem.daysOverdue != null && (
                  <p className="mt-2 text-[12px] font-medium text-red-600">
                    {nextItem.daysOverdue} day{nextItem.daysOverdue !== 1 ? "s" : ""} overdue
                  </p>
                )}
              </div>
            )}

            {/* Tabs */}
            <div className="mt-8 flex gap-1 rounded-[12px] border border-black/[0.07] bg-white p-1 w-fit">
              {([["gaps", `Gaps & missing (${gaps.length})`], ["followups", `Due soon (${followups.length})`]] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={[
                    "rounded-[10px] px-4 py-2 text-[13px] font-medium transition-colors",
                    tab === key
                      ? "bg-[var(--foreground)] text-[var(--background)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Gap list */}
            <div className="mt-5">
              {activeList.length === 0 ? (
                <p className="py-10 text-center text-[14px] text-[var(--text-secondary)]">
                  {tab === "gaps" ? "No overdue or missing tests." : "No upcoming follow-ups."}
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {activeList.map((gap) => (
                    <GapCard key={gap.canonicalMetricName} gap={gap} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </Container>
    </div>
  );
}
