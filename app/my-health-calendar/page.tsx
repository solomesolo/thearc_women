"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { ProtectedRouteGate } from "@/components/navigation/ProtectedRouteGate";
import { useLocale } from "@/lib/i18n/useLocale";
import { useRecommendations } from "@/lib/recommendations/useRecommendations";
import { getOrCreateAnonId } from "@/lib/profile-engine-a/frontendClient";
import type { CheckRecommendation, CheckStatus, FinalRecommendation } from "@/lib/recommendations-engine/types";

type CalendarStatus = "not_started" | "planned" | "done";
type CalendarPriority = "do_now" | "do_soon" | "lower_priority";

type CalendarItem = {
  checkKey: string;
  title: string;
  priority: CalendarPriority;
  status: CalendarStatus;
  scheduledMonthOffset: number; // 0..11
  whyThisMatters: string;
  biomarkers: string[];
  estimatedEffort?: string;
};

function addMonths(d: Date, n: number) {
  const copy = new Date(d);
  copy.setMonth(copy.getMonth() + n);
  return copy;
}

function monthLabel(d: Date) {
  return d.toLocaleString("en", { month: "long", year: "numeric" });
}

function priorityPill(p: CalendarPriority) {
  if (p === "do_now") return { text: "Do now", cls: "bg-[#0c0c0c] text-white" };
  if (p === "do_soon") return { text: "Do soon", cls: "bg-[#525252] text-white" };
  return { text: "Lower priority", cls: "bg-[#f5f5f4] text-[#404040] border border-black/[0.08]" };
}

function statusLabel(s: CalendarStatus) {
  if (s === "done") return "Done";
  if (s === "planned") return "Planned";
  return "Not started";
}

function monthStateLabel(isCurrent: boolean, items: CalendarItem[]) {
  if (isCurrent) return "This month";
  if (!items.length) return "No checks planned";
  const done = items.filter((i) => i.status === "done").length;
  const planned = items.filter((i) => i.status === "planned").length;
  if (done === items.length) return "Completed";
  if (planned > 0) return "In progress";
  return "Upcoming";
}

export default function MyHealthCalendarPage() {
  const { data: session } = useSession();
  const locale = useLocale();
  const isAnonymous = !session?.user?.email;
  const userId =
    session?.user?.email ??
    (typeof window !== "undefined" ? `anon:${getOrCreateAnonId()}` : null);

  const { data: recs, isLoading, error, reload, updateStatus } = useRecommendations(userId);

  const pathway = recs?.pathway;
  const finalRecs = useMemo(() => recs?.recommendations ?? [], [recs?.recommendations]);

  const checkByKey = useMemo(() => {
    const map = new Map<string, CheckRecommendation>();
    if (!pathway) return map;
    for (const list of Object.values(pathway)) {
      for (const c of list) map.set(c.checkKey, c);
    }
    return map;
  }, [pathway]);

  const finalByKey = useMemo(() => {
    const map = new Map<string, FinalRecommendation>();
    for (const r of finalRecs) map.set(r.checkKey, r);
    return map;
  }, [finalRecs]);

  const allChecks = useMemo(
    () => Array.from(checkByKey.values()).sort((a, b) => a.priorityRank - b.priorityRank),
    [checkByKey],
  );

  const [liveMessage, setLiveMessage] = useState("");

  const onChange = async (checkKey: string, next: CalendarStatus) => {
    const prev = checkByKey.get(checkKey)?.status ?? "missing";
    const mapped: CheckStatus =
      next === "planned" ? "planned" : next === "done" ? "completed" : "missing";
    await updateStatus(checkKey, mapped);
    if (prev !== mapped) {
      if (mapped === "planned") setLiveMessage("Good start. This check is now in your plan.");
      if (mapped === "completed") setLiveMessage("Completed. Your health progress has been updated.");
      window.setTimeout(() => setLiveMessage(""), 2200);
    }
  };

  const calendarItems: CalendarItem[] = useMemo(() => {
    const toStatus = (s: CheckStatus): CalendarStatus =>
      s === "planned" ? "planned" : s === "completed" || s === "result_uploaded" ? "done" : "not_started";

    const toPriority = (r: FinalRecommendation | null, c: CheckRecommendation): CalendarPriority => {
      const tf = r?.timeframe ?? (c.timeframe === "next_month"
        ? "current_month"
        : c.timeframe === "next_3_months"
          ? "next_3_months"
          : c.timeframe === "next_6_months"
            ? "next_6_months"
            : c.timeframe === "next_year"
              ? "next_year"
              : "optional_later");
      if (tf === "current_month") return "do_now";
      if (tf === "next_3_months" || tf === "next_6_months") return "do_soon";
      return "lower_priority";
    };

    const pickOffsets = (count: number, choices: number[]) => {
      const out: number[] = [];
      for (let i = 0; i < count; i++) out.push(choices[i % choices.length]);
      return out;
    };

    const nowItems: Array<{ c: CheckRecommendation; r: FinalRecommendation | null }> = [];
    const soonItems: Array<{ c: CheckRecommendation; r: FinalRecommendation | null }> = [];
    const lowItems: Array<{ c: CheckRecommendation; r: FinalRecommendation | null }> = [];

    for (const c of allChecks) {
      const r = finalByKey.get(c.checkKey) ?? null;
      const p = toPriority(r, c);
      if (p === "do_now") nowItems.push({ c, r });
      else if (p === "do_soon") soonItems.push({ c, r });
      else lowItems.push({ c, r });
    }

    const nowOffsets = pickOffsets(nowItems.length, [0]);
    const soonOffsets = pickOffsets(soonItems.length, [1, 2, 3]);
    const lowOffsets = pickOffsets(lowItems.length, [4, 5, 6, 7, 8, 9, 10, 11]);

    const withOffset = [
      ...nowItems.map((x, i) => ({ ...x, off: nowOffsets[i] })),
      ...soonItems.map((x, i) => ({ ...x, off: soonOffsets[i] })),
      ...lowItems.map((x, i) => ({ ...x, off: lowOffsets[i] })),
    ];

    return withOffset.map(({ c, r, off }) => ({
      checkKey: c.checkKey,
      title: c.checkName,
      priority: toPriority(r, c),
      status: toStatus(c.status),
      scheduledMonthOffset: off,
      whyThisMatters: r?.whyRecommendedForYou ?? c.whyForYou,
      biomarkers: (r?.coreTestsNow?.length ? r.coreTestsNow : c.includedTestsPreview ?? []).slice(0, 6),
      estimatedEffort: c.status === "missing" ? "5 min to plan" : undefined,
    }));
  }, [allChecks, finalByKey]);

  const months = useMemo(() => {
    const start = new Date();
    const first = new Date(start.getFullYear(), start.getMonth(), 1);
    const buckets: Array<{ offset: number; label: string; items: CalendarItem[] }> = [];
    for (let i = 0; i < 12; i++) {
      buckets.push({ offset: i, label: monthLabel(addMonths(first, i)), items: [] });
    }
    for (const it of calendarItems) {
      const idx = Math.max(0, Math.min(11, it.scheduledMonthOffset));
      buckets[idx].items.push(it);
    }
    for (const b of buckets) {
      b.items.sort((a, z) => (a.priority === "do_now" ? 0 : a.priority === "do_soon" ? 1 : 2) - (z.priority === "do_now" ? 0 : z.priority === "do_soon" ? 1 : 2));
    }
    return buckets;
  }, [calendarItems]);

  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  return (
    <ProtectedRouteGate
      requestedRoute="/my-health-calendar"
      allowStates={[
        "AUTH_PROFILE_READY_RESULTS_UNSEEN",
        "AUTH_ACTIVE_DASHBOARD_READY",
        "ANON_COMPLETED_SURVEY_UNREGISTERED",
        "AUTH_PROFILE_READY_NO_RECOMMENDATIONS",
      ]}
      loadingText={locale === "de" ? "Kalender wird geladen…" : "Loading your calendar…"}
    >
      <div className="mx-auto max-w-[72rem] px-5 py-10 md:px-8">
        <div className="mb-2">
          <Link
            href="/results/action-plan"
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
            {locale === "de" ? "Zum Action Plan" : "Back to Action Plan"}
          </Link>
        </div>

        <div className="mb-8 mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a3a3a3]">
            My Health Calendar
          </p>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-[#0c0c0c] md:text-[2rem]">
            My Health Calendar
          </h1>
          <p className="mt-2 max-w-[56rem] text-[0.9375rem] leading-[1.65] text-[#737373]">
            A month-by-month view of your recommended tests, screenings, and follow-ups.
          </p>
        </div>

        <div className="sr-only" aria-live="polite">
          {liveMessage}
        </div>

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

        {isLoading && (
          <div className="rounded-[20px] border border-black/[0.08] bg-white p-6 text-[0.9375rem] text-[#737373]">
            {locale === "de" ? "Lädt…" : "Loading…"}
          </div>
        )}

        {error && !isLoading && (
          <div className="rounded-[20px] border border-black/[0.08] bg-white p-6 text-[0.9375rem] text-[#737373]">
            We couldn&apos;t load your calendar.{" "}
            <button
              type="button"
              className="underline underline-offset-2 text-[#0c0c0c]"
              onClick={reload}
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {months.map((m) => {
              const isCurrent = m.offset === 0;
              const done = m.items.filter((i) => i.status === "done").length;
              const state = monthStateLabel(isCurrent, m.items);
              const empty = m.items.length === 0;

              return (
                <div
                  key={m.offset}
                  className={`rounded-[20px] border border-black/[0.08] p-5 shadow-[0_1px_0_rgba(0,0,0,0.03)] transition-colors ${
                    isCurrent ? "bg-[#0c0c0c] text-white" : empty ? "bg-[#fafaf9]" : "bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${isCurrent ? "text-white/70" : "text-[#737373]"}`}>
                        {m.label}
                      </p>
                      <p className={`mt-1 text-[0.875rem] ${isCurrent ? "text-white" : "text-[#404040]"}`}>{state}</p>
                    </div>
                    {m.items.length > 0 && (
                      <span className={`rounded-full px-2 py-0.5 text-[0.75rem] tabular-nums ${
                        isCurrent ? "bg-white/10 text-white" : "bg-[#fafaf9] text-[#737373] border border-black/[0.06]"
                      }`}>
                        {done} of {m.items.length}
                      </span>
                    )}
                  </div>

                  {empty ? (
                    <p className={`mt-4 text-[0.875rem] ${isCurrent ? "text-white/70" : "text-[#a3a3a3]"}`}>
                      No checks planned
                    </p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {m.items.map((it) => {
                        const pill = priorityPill(it.priority);
                        const isOpen = expandedItem === it.checkKey;
                        const ctaLabel = it.status === "not_started" ? "Start planning" : it.status === "planned" ? "Mark completed" : "Completed";
                        const next = it.status === "not_started" ? "planned" : it.status === "planned" ? "done" : "done";

                        return (
                          <div key={it.checkKey} className={`rounded-[16px] border border-black/[0.06] p-4 ${isCurrent ? "bg-white/10 border-white/10" : "bg-[#fafaf9]"}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className={`truncate text-[0.9375rem] font-medium ${isCurrent ? "text-white" : "text-[#0c0c0c]"}`}>
                                  {it.title}
                                </p>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  <span className={`rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] ${pill.cls}`}>
                                    {pill.text}
                                  </span>
                                  <span className={`text-[0.8125rem] ${isCurrent ? "text-white/70" : "text-[#737373]"}`}>
                                    {statusLabel(it.status)}
                                  </span>
                                  {it.estimatedEffort && (
                                    <span className={`rounded-full px-2.5 py-0.5 text-[0.75rem] ${isCurrent ? "bg-white/10 text-white" : "border border-black/[0.08] bg-white text-[#525252]"}`}>
                                      {it.estimatedEffort}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setExpandedItem((k) => (k === it.checkKey ? null : it.checkKey))}
                                  aria-expanded={isOpen}
                                  className={`rounded-[12px] px-3 py-2 text-[0.8125rem] font-medium ${
                                    isCurrent ? "border border-white/20 text-white hover:bg-white/10" : "border border-black/[0.08] bg-white text-[#404040] hover:text-[#0c0c0c]"
                                  }`}
                                >
                                  {isOpen ? "Hide" : "Details"}
                                </button>
                                <button
                                  type="button"
                                  disabled={it.status === "done"}
                                  onClick={() => onChange(it.checkKey, next)}
                                  className={`rounded-[12px] px-3.5 py-2 text-[0.8125rem] font-medium ${
                                    isCurrent ? "bg-white text-[#0c0c0c]" : "bg-[#0c0c0c] text-white hover:brightness-[0.88]"
                                  } disabled:cursor-not-allowed disabled:opacity-50`}
                                >
                                  {ctaLabel}
                                </button>
                              </div>
                            </div>

                            {isOpen && (
                              <div className={`mt-3 rounded-[14px] px-3.5 py-3 ${isCurrent ? "bg-white/10" : "bg-white"}`}>
                                <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${isCurrent ? "text-white/70" : "text-[#737373]"}`}>
                                  Why this matters
                                </p>
                                <p className={`mt-2 text-[0.875rem] leading-[1.6] ${isCurrent ? "text-white" : "text-[#404040]"}`}>
                                  {it.whyThisMatters}
                                </p>
                                {!!it.biomarkers.length && (
                                  <>
                                    <div className={`mt-3 border-t ${isCurrent ? "border-white/10" : "border-black/[0.06]"} pt-3`} />
                                    <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${isCurrent ? "text-white/70" : "text-[#737373]"}`}>
                                      Biomarkers included
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {it.biomarkers.slice(0, 6).map((b) => (
                                        <span
                                          key={b}
                                          className={`rounded-full px-2.5 py-1 text-[0.75rem] ${isCurrent ? "bg-white/10 text-white" : "border border-black/[0.08] bg-[#fafaf9] text-[#525252]"}`}
                                        >
                                          {b}
                                        </span>
                                      ))}
                                    </div>
                                  </>
                                )}
                                <div className="mt-3">
                                  <Link
                                    href={`/results/action-plan#check-${encodeURIComponent(it.checkKey)}`}
                                    className={`text-[0.8125rem] underline underline-offset-2 ${isCurrent ? "text-white/80 hover:text-white" : "text-[#404040] hover:text-[#0c0c0c]"}`}
                                  >
                                    View in Action Plan
                                  </Link>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ProtectedRouteGate>
  );
}

