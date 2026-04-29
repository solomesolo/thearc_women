"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { ProtectedRouteGate } from "@/components/navigation/ProtectedRouteGate";
import { useLocale } from "@/lib/i18n/useLocale";
import { useRecommendations } from "@/lib/recommendations/useRecommendations";
import { getOrCreateAnonId } from "@/lib/profile-engine-a/frontendClient";
import type { CheckRecommendation, CheckStatus, FinalRecommendation } from "@/lib/recommendations-engine/types";
import {
  loadCalendarMeta,
  loadScreeningEvents,
} from "@/lib/calendar/localHealthCalendarStore";

type CalendarStatus = "not_started" | "planned" | "done";
type CalendarPriority = "do_now" | "do_soon" | "lower_priority";
type CalendarCategory = "tests" | "appointments" | "results_review" | "reminders";
type CalendarView = "month" | "week" | "timeline";

type CalendarItem = {
  checkKey: string;
  title: string;
  priority: CalendarPriority;
  status: CalendarStatus;
  scheduledMonthOffset: number; // 0..11
  scheduledDateISO: string; // yyyy-mm-dd (local)
  category: CalendarCategory;
  timeLabel?: string;
  whyThisMatters: string;
  biomarkers: string[];
  estimatedEffort?: string;
  doctorName?: string;
  address?: string;
};

function addMonths(d: Date, n: number) {
  const copy = new Date(d);
  copy.setMonth(copy.getMonth() + n);
  return copy;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toLocalISODate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function fromLocalISODate(iso: string) {
  const [y, m, day] = iso.split("-").map((x) => Number(x));
  return new Date(y, (m ?? 1) - 1, day ?? 1);
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfWeek(d: Date) {
  const copy = startOfDay(d);
  const day = copy.getDay(); // 0 Sun
  const mondayOffset = (day + 6) % 7; // Mon=0
  copy.setDate(copy.getDate() - mondayOffset);
  return copy;
}

function addDays(d: Date, n: number) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function monthLabel(d: Date, locale: string) {
  return d.toLocaleString(locale === "de" ? "de" : "en", { month: "long", year: "numeric" });
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

function categoryDot(category: CalendarCategory) {
  // Matches existing neutral design, with subtle color coding.
  if (category === "tests") return "bg-[#2563eb]"; // blue
  if (category === "appointments") return "bg-[#dc2626]"; // red
  if (category === "results_review") return "bg-[#f59e0b]"; // orange
  return "bg-[#0c0c0c]"; // reminders
}

function categoryLabel(category: CalendarCategory) {
  if (category === "tests") return "Tests";
  if (category === "appointments") return "Appointments";
  if (category === "results_review") return "Results review";
  return "Reminders";
}

function inferCategory(title: string): CalendarCategory {
  const t = title.toLowerCase();
  if (t.includes("appointment") || t.includes("doctor") || t.includes("consult") || t.includes("visit")) return "appointments";
  if (t.includes("review") || t.includes("results") || t.includes("follow-up") || t.includes("follow up")) return "results_review";
  return "tests";
}

function inferPrep(title: string, biomarkers: string[]) {
  const t = title.toLowerCase();
  const joined = biomarkers.join(" ").toLowerCase();
  const isBloodLike =
    t.includes("blood") ||
    joined.includes("glucose") ||
    joined.includes("hba1c") ||
    joined.includes("cholesterol") ||
    joined.includes("lipid") ||
    joined.includes("triglycer");

  const prep: string[] = [];
  if (isBloodLike) prep.push("Fast 8 hours (water is fine)");
  prep.push("Bring your ID and insurance card (if applicable)");
  return prep;
}

function computeOnTrackState(overdueCount: number, upcomingCount: number) {
  if (overdueCount === 0) return { label: "On track", tone: "bg-[#ecfdf5] text-[#065f46] border border-[#065f46]/[0.12]" };
  if (overdueCount <= Math.max(1, Math.floor(upcomingCount / 4)))
    return { label: "Slightly delayed", tone: "bg-[#fffbeb] text-[#92400e] border border-[#92400e]/[0.12]" };
  return { label: "Behind", tone: "bg-[#fef2f2] text-[#991b1b] border border-[#991b1b]/[0.12]" };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function pickDateInMonth(year: number, monthIndex: number, preferredDay: number) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const day = clamp(preferredDay, 1, daysInMonth);
  return new Date(year, monthIndex, day);
}

function getFirstAvailableDateISO(options: {
  baseMonth: Date;
  usedISO: Set<string>;
  priority: CalendarPriority;
  indexWithinPriority: number;
}) {
  const { baseMonth, usedISO, priority, indexWithinPriority } = options;
  const y = baseMonth.getFullYear();
  const m = baseMonth.getMonth();

  // Heuristic spacing: earlier for "do_now", mid for "do_soon", later for "lower_priority".
  const anchor =
    priority === "do_now" ? 3 : priority === "do_soon" ? 10 : 18;
  const stride = priority === "do_now" ? 4 : priority === "do_soon" ? 6 : 7;
  const candidateDay = anchor + indexWithinPriority * stride;

  // Try a handful of nearby days to avoid collisions.
  const tries = [0, 1, -1, 2, -2, 3, -3, 4, -4];
  for (const delta of tries) {
    const d = pickDateInMonth(y, m, candidateDay + delta);
    const iso = toLocalISODate(d);
    if (!usedISO.has(iso)) return iso;
  }
  // Fallback: last day of month.
  const last = new Date(y, m + 1, 0);
  return toLocalISODate(last);
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

  const [scheduledOverrides, setScheduledOverrides] = useState<Record<string, string>>({});
  const [notesByEventId, setNotesByEventId] = useState<Record<string, string>>({});
  const [metaByKey, setMetaByKey] = useState<Record<string, { plannedDateISO: string; doctorName?: string; address?: string; notes?: string }>>({});
  const [screeningEvents, setScreeningEvents] = useState<Record<string, { screeningName: string; meta: { plannedDateISO: string; doctorName?: string; address?: string; notes?: string } }>>({});

  useEffect(() => {
    try {
      const rawOverrides = window.localStorage.getItem("arc.calendar.overrides.v1");
      if (rawOverrides) setScheduledOverrides(JSON.parse(rawOverrides));
      const rawNotes = window.localStorage.getItem("arc.calendar.notes.v1");
      if (rawNotes) setNotesByEventId(JSON.parse(rawNotes));
      setMetaByKey(loadCalendarMeta());
      setScreeningEvents(loadScreeningEvents());
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("arc.calendar.overrides.v1", JSON.stringify(scheduledOverrides));
    } catch {
      // ignore
    }
  }, [scheduledOverrides]);

  useEffect(() => {
    try {
      window.localStorage.setItem("arc.calendar.notes.v1", JSON.stringify(notesByEventId));
    } catch {
      // ignore
    }
  }, [notesByEventId]);

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

    const nowOffsets = nowItems.map(() => 0);
    const soonOffsets = soonItems.map((_, i) => [1, 2, 3][i % 3]);
    const lowOffsets = lowItems.map((_, i) => [4, 5, 6, 7, 8, 9, 10, 11][i % 8]);

    const withOffset = [
      ...nowItems.map((x, i) => ({ ...x, off: nowOffsets[i] })),
      ...soonItems.map((x, i) => ({ ...x, off: soonOffsets[i] })),
      ...lowItems.map((x, i) => ({ ...x, off: lowOffsets[i] })),
    ];

    const usedByMonth = new Map<number, Set<string>>();
    const base = new Date();
    const firstOfThisMonth = new Date(base.getFullYear(), base.getMonth(), 1);

    const indexWithinPriority = { do_now: 0, do_soon: 0, lower_priority: 0 } as Record<CalendarPriority, number>;

    const meta = metaByKey;
    const checkItems = withOffset.map(({ c, r, off }) => {
      const priority = toPriority(r, c);
      const status = toStatus(c.status);

      const monthDate = addMonths(firstOfThisMonth, off);
      const used = usedByMonth.get(off) ?? new Set<string>();
      usedByMonth.set(off, used);

      const overrideKey = `${c.checkKey}`;
      const overridden = scheduledOverrides[overrideKey];
      const metaPlanned = meta?.[c.checkKey]?.plannedDateISO;
      const iso =
        metaPlanned ??
        overridden ??
        getFirstAvailableDateISO({
          baseMonth: monthDate,
          usedISO: used,
          priority,
          indexWithinPriority: indexWithinPriority[priority]++,
        });

      used.add(iso);

      const biomarkers = (r?.coreTestsNow?.length ? r.coreTestsNow : c.includedTestsPreview ?? []).slice(0, 6);
      const title = c.checkName;
      const category = inferCategory(title);

      // Lightweight time slot hint to make week view feel schedulable.
      const timeLabel = category === "tests" ? "09:00" : category === "appointments" ? "14:00" : undefined;

      return {
        checkKey: c.checkKey,
        title,
        priority,
        status,
        scheduledMonthOffset: off,
        scheduledDateISO: iso,
        category,
        timeLabel,
        whyThisMatters: r?.whyRecommendedForYou ?? c.whyForYou,
        biomarkers,
        estimatedEffort: c.status === "missing" ? "5 min to plan" : undefined,
        doctorName: meta?.[c.checkKey]?.doctorName,
        address: meta?.[c.checkKey]?.address,
      };
    });

    const screenings = Object.values(screeningEvents ?? {}).map((ev) => {
      const iso = ev.meta.plannedDateISO;
      const d = fromLocalISODate(iso);
      const base = new Date();
      const monthOffset = (d.getFullYear() - base.getFullYear()) * 12 + (d.getMonth() - base.getMonth());
      return {
        checkKey: `screening:${ev.screeningName}`,
        title: ev.screeningName,
        priority: "do_soon" as const,
        status: "planned" as const,
        scheduledMonthOffset: Math.max(0, Math.min(11, monthOffset)),
        scheduledDateISO: iso,
        category: "appointments" as const,
        timeLabel: undefined,
        whyThisMatters: "",
        biomarkers: [],
        estimatedEffort: undefined,
        doctorName: ev.meta.doctorName,
        address: ev.meta.address,
      } satisfies CalendarItem;
    });

    return [...checkItems, ...screenings];
  }, [allChecks, finalByKey, scheduledOverrides, metaByKey, screeningEvents]);

  const itemsByDay = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const it of calendarItems) {
      const key = it.scheduledDateISO;
      const list = map.get(key) ?? [];
      list.push(it);
      map.set(key, list);
    }
    for (const [k, list] of map) {
      list.sort((a, z) => {
        const pr = (x: CalendarPriority) => (x === "do_now" ? 0 : x === "do_soon" ? 1 : 2);
        return pr(a.priority) - pr(z.priority);
      });
      map.set(k, list);
    }
    return map;
  }, [calendarItems]);

  const today = useMemo(() => startOfDay(new Date()), []);
  const todayISO = useMemo(() => toLocalISODate(today), [today]);

  const [view, setView] = useState<CalendarView>("month");
  const [activeMonth, setActiveMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDayISO, setSelectedDayISO] = useState<string>(() => toLocalISODate(new Date()));
  const [selectedEventKey, setSelectedEventKey] = useState<string | null>(null);
  const [showReschedule, setShowReschedule] = useState(false);
  const [detailsOpenMobile, setDetailsOpenMobile] = useState(false);

  const selectedDayItems = useMemo(() => itemsByDay.get(selectedDayISO) ?? [], [itemsByDay, selectedDayISO]);

  useEffect(() => {
    if (selectedDayItems.length === 0) setSelectedEventKey(null);
    else if (selectedEventKey && selectedDayItems.some((i) => i.checkKey === selectedEventKey)) {
      // keep
    } else {
      setSelectedEventKey(selectedDayItems[0]?.checkKey ?? null);
    }
  }, [selectedDayItems, selectedEventKey]);

  const selectedItem = useMemo(
    () => selectedDayItems.find((i) => i.checkKey === selectedEventKey) ?? null,
    [selectedDayItems, selectedEventKey]
  );

  const progress = useMemo(() => {
    const total = calendarItems.length;
    const done = calendarItems.filter((i) => i.status === "done").length;
    const planned = calendarItems.filter((i) => i.status === "planned").length;
    return { total, done, planned };
  }, [calendarItems]);

  const overdueItems = useMemo(() => {
    return calendarItems
      .filter((i) => i.status !== "done" && fromLocalISODate(i.scheduledDateISO).getTime() < today.getTime())
      .sort((a, z) => fromLocalISODate(a.scheduledDateISO).getTime() - fromLocalISODate(z.scheduledDateISO).getTime());
  }, [calendarItems, today]);

  const nextUpcoming = useMemo(() => {
    const upcoming = calendarItems
      .filter((i) => i.status !== "done" && fromLocalISODate(i.scheduledDateISO).getTime() >= today.getTime())
      .sort((a, z) => fromLocalISODate(a.scheduledDateISO).getTime() - fromLocalISODate(z.scheduledDateISO).getTime());
    return upcoming[0] ?? null;
  }, [calendarItems, today]);

  const onTrack = useMemo(() => computeOnTrackState(overdueItems.length, calendarItems.length), [overdueItems.length, calendarItems.length]);

  const monthGrid = useMemo(() => {
    const first = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), 1);
    const last = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 0);
    const firstGrid = startOfWeek(first);
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) days.push(addDays(firstGrid, i));
    return { first, last, days };
  }, [activeMonth]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(fromLocalISODate(selectedDayISO));
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDayISO]);

  const timelineItems = useMemo(() => {
    const list = [...calendarItems].sort((a, z) => fromLocalISODate(a.scheduledDateISO).getTime() - fromLocalISODate(z.scheduledDateISO).getTime());
    // Focus on a premium-feeling near-term timeline.
    const cutoff = addMonths(today, 3).getTime();
    return list.filter((i) => fromLocalISODate(i.scheduledDateISO).getTime() <= cutoff);
  }, [calendarItems, today]);

  const rescheduleSuggestions = useMemo(() => {
    if (!selectedItem) return [];
    const base = fromLocalISODate(selectedItem.scheduledDateISO);
    const used = new Set<string>(calendarItems.map((i) => i.scheduledDateISO));
    const suggestions: string[] = [];

    // Suggestions: spread, avoid clustering within 2 days, favor mornings for tests.
    const preferMorning = selectedItem.category === "tests";
    const candidateOffsets = [3, 7, 10, 14, 21, 28];
    for (const off of candidateOffsets) {
      const d = addDays(base, off);
      const iso = toLocalISODate(d);
      if (used.has(iso)) continue;
      const near = [-2, -1, 0, 1, 2].some((delta) => used.has(toLocalISODate(addDays(d, delta))));
      if (near) continue;
      suggestions.push(iso);
      if (suggestions.length >= 5) break;
    }

    // Fallback: next available days.
    if (suggestions.length < 3) {
      for (let i = 1; i <= 30; i++) {
        const d = addDays(base, i);
        const iso = toLocalISODate(d);
        if (used.has(iso)) continue;
        suggestions.push(iso);
        if (suggestions.length >= 5) break;
      }
    }

    return suggestions.map((iso) => ({
      iso,
      label: `${fromLocalISODate(iso).toLocaleDateString(locale === "de" ? "de" : "en", { weekday: "short", month: "short", day: "numeric" })}${preferMorning ? " • morning" : ""}`,
    }));
  }, [calendarItems, locale, selectedItem]);

  const handleSelectDay = (iso: string) => {
    setSelectedDayISO(iso);
    setDetailsOpenMobile(true);
  };

  const detailsTitleId = "calendar-details-title";
  const detailsPanelRef = useRef<HTMLDivElement | null>(null);

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

        <div className="mb-6 mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a3a3a3]">
            My Health Calendar
          </p>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-[#0c0c0c] md:text-[2rem]">
            My Health Calendar
          </h1>
          <p className="mt-2 max-w-[56rem] text-[0.9375rem] leading-[1.65] text-[#737373]">
            Your health roadmap, mapped in time. Plan, book, reschedule, and track progress from one place.
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
          <div className="space-y-4">
            <div className="sticky top-16 z-30 rounded-[20px] border border-black/[0.08] bg-white/[0.92] p-4 shadow-[0_1px_0_rgba(0,0,0,0.03)] backdrop-blur-sm md:p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a3a3a3]">
                    Smart overview
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.75rem] font-medium ${onTrack.tone}`}>
                      {onTrack.label}
                    </span>
                    <span className="text-[0.875rem] text-[#737373]">
                      {progress.done}/{progress.total} completed
                    </span>
                    {overdueItems.length > 0 && (
                      <span className="text-[0.875rem] text-[#991b1b]">
                        {overdueItems.length} overdue
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="rounded-[14px] border border-black/[0.08] bg-white px-3.5 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a3a3a3]">
                      Next
                    </p>
                    <p className="mt-0.5 truncate text-[0.875rem] font-medium text-[#0c0c0c]">
                      {nextUpcoming
                        ? `${nextUpcoming.title} • ${fromLocalISODate(nextUpcoming.scheduledDateISO).toLocaleDateString(
                            locale === "de" ? "de" : "en",
                            { month: "short", day: "numeric" }
                          )}`
                        : "No upcoming items"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-[12px] border border-black/[0.08] bg-white px-3 py-2 text-[0.8125rem] font-medium text-[#404040] hover:text-[#0c0c0c]"
                      onClick={() => {
                        if (!nextUpcoming) return;
                        setSelectedDayISO(nextUpcoming.scheduledDateISO);
                        setSelectedEventKey(nextUpcoming.checkKey);
                        setDetailsOpenMobile(true);
                        detailsPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                      }}
                    >
                      Book now
                    </button>
                    <button
                      type="button"
                      className="rounded-[12px] border border-black/[0.08] bg-white px-3 py-2 text-[0.8125rem] font-medium text-[#404040] hover:text-[#0c0c0c]"
                      onClick={() => {
                        if (!nextUpcoming) return;
                        setSelectedDayISO(nextUpcoming.scheduledDateISO);
                        setSelectedEventKey(nextUpcoming.checkKey);
                        setShowReschedule(true);
                        setDetailsOpenMobile(true);
                      }}
                    >
                      Reschedule
                    </button>
                    <button
                      type="button"
                      className="rounded-[12px] bg-[#0c0c0c] px-3.5 py-2 text-[0.8125rem] font-medium text-white hover:brightness-[0.9]"
                      onClick={() => {
                        if (!nextUpcoming) return;
                        onChange(nextUpcoming.checkKey, "done");
                      }}
                      disabled={!nextUpcoming || nextUpcoming.status === "done"}
                    >
                      Mark done
                    </button>
                  </div>
                </div>
              </div>

              {overdueItems.length > 0 && (
                <div className="mt-3 rounded-[14px] border border-black/[0.06] bg-[#fafaf9] px-3.5 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a3a3a3]">
                    Overdue
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {overdueItems.slice(0, 3).map((it) => (
                      <button
                        key={it.checkKey}
                        type="button"
                        className="rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-[0.8125rem] text-[#404040] hover:text-[#0c0c0c]"
                        onClick={() => {
                          setSelectedDayISO(it.scheduledDateISO);
                          setSelectedEventKey(it.checkKey);
                          setDetailsOpenMobile(true);
                        }}
                      >
                        {it.title}
                      </button>
                    ))}
                    {overdueItems.length > 3 && (
                      <span className="self-center text-[0.8125rem] text-[#737373]">
                        and {overdueItems.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <div className="rounded-[20px] border border-black/[0.08] bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.03)] md:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a3a3a3]">
                        Calendar
                      </p>
                      <p className="mt-1 text-[0.9375rem] font-medium text-[#0c0c0c]">
                        {view === "timeline"
                          ? "Your next three months"
                          : monthLabel(activeMonth, locale)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {view !== "timeline" && (
                        <div className="flex items-center gap-1 rounded-[12px] border border-black/[0.08] bg-[#fafaf9] p-1">
                          <button
                            type="button"
                            className={`rounded-[10px] px-3 py-1.5 text-[0.8125rem] font-medium ${
                              view === "month" ? "bg-white text-[#0c0c0c] shadow-[0_1px_0_rgba(0,0,0,0.03)]" : "text-[#737373] hover:text-[#0c0c0c]"
                            }`}
                            onClick={() => setView("month")}
                          >
                            Month
                          </button>
                          <button
                            type="button"
                            className={`rounded-[10px] px-3 py-1.5 text-[0.8125rem] font-medium ${
                              view === "week" ? "bg-white text-[#0c0c0c] shadow-[0_1px_0_rgba(0,0,0,0.03)]" : "text-[#737373] hover:text-[#0c0c0c]"
                            }`}
                            onClick={() => setView("week")}
                          >
                            Week
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        className={`rounded-[12px] border px-3 py-2 text-[0.8125rem] font-medium ${
                          view === "timeline"
                            ? "border-[#0c0c0c] bg-[#0c0c0c] text-white"
                            : "border-black/[0.08] bg-white text-[#404040] hover:text-[#0c0c0c]"
                        }`}
                        onClick={() => setView((v) => (v === "timeline" ? "month" : "timeline"))}
                      >
                        Timeline
                      </button>

                      {view !== "timeline" && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="rounded-[12px] border border-black/[0.08] bg-white px-3 py-2 text-[0.8125rem] font-medium text-[#404040] hover:text-[#0c0c0c]"
                            onClick={() => setActiveMonth((m) => addMonths(m, -1))}
                            aria-label="Previous month"
                          >
                            Prev
                          </button>
                          <button
                            type="button"
                            className="rounded-[12px] border border-black/[0.08] bg-white px-3 py-2 text-[0.8125rem] font-medium text-[#404040] hover:text-[#0c0c0c]"
                            onClick={() => setActiveMonth((m) => addMonths(m, 1))}
                            aria-label="Next month"
                          >
                            Next
                          </button>
                          <button
                            type="button"
                            className="rounded-[12px] bg-[#fafaf9] px-3 py-2 text-[0.8125rem] font-medium text-[#404040] hover:text-[#0c0c0c] border border-black/[0.08]"
                            onClick={() => {
                              const now = new Date();
                              setActiveMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                              setSelectedDayISO(toLocalISODate(now));
                            }}
                          >
                            Today
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {(["tests", "appointments", "results_review", "reminders"] as CalendarCategory[]).map((c) => (
                        <div key={c} className="flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-3 py-1.5">
                          <span className={`h-2 w-2 rounded-full ${categoryDot(c)}`} aria-hidden />
                          <span className="text-[0.8125rem] text-[#404040]">{categoryLabel(c)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {view === "month" && (
                    <div className="mt-4">
                      <div className="grid grid-cols-7 gap-2">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                          <div key={d} className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a3a3a3]">
                            {d}
                          </div>
                        ))}
                        {monthGrid.days.map((d) => {
                          const iso = toLocalISODate(d);
                          const inMonth = d.getMonth() === monthGrid.first.getMonth();
                          const isToday = iso === todayISO;
                          const isSelected = iso === selectedDayISO;
                          const items = itemsByDay.get(iso) ?? [];
                          const dots = new Map<CalendarCategory, number>();
                          for (const it of items) dots.set(it.category, (dots.get(it.category) ?? 0) + 1);

                          return (
                            <button
                              key={iso}
                              type="button"
                              onClick={() => handleSelectDay(iso)}
                              className={`group rounded-[14px] border p-2 text-left transition-colors ${
                                isSelected
                                  ? "border-[#0c0c0c] bg-[#0c0c0c]/[0.03]"
                                  : "border-black/[0.08] bg-white hover:bg-[#fafaf9]"
                              } ${!inMonth ? "opacity-55" : ""}`}
                              aria-current={isToday ? "date" : undefined}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className={`text-[0.875rem] font-medium ${isSelected ? "text-[#0c0c0c]" : "text-[#404040]"}`}>
                                  {d.getDate()}
                                </span>
                                {isToday && (
                                  <span className="rounded-full border border-black/[0.08] bg-white px-2 py-0.5 text-[0.75rem] text-[#404040]">
                                    Today
                                  </span>
                                )}
                              </div>
                              {items.length > 0 ? (
                                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                  {Array.from(dots.entries()).map(([cat]) => (
                                    <span key={cat} className={`h-2 w-2 rounded-full ${categoryDot(cat)}`} aria-hidden />
                                  ))}
                                  <span className="ml-1 text-[0.75rem] text-[#737373] tabular-nums">
                                    {items.length}
                                  </span>
                                </div>
                              ) : (
                                <div className="mt-2 h-[14px]" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {view === "week" && (
                    <div className="mt-4">
                      <div className="grid grid-cols-1 gap-2">
                        {weekDays.map((d) => {
                          const iso = toLocalISODate(d);
                          const items = itemsByDay.get(iso) ?? [];
                          const isSelected = iso === selectedDayISO;
                          return (
                            <button
                              key={iso}
                              type="button"
                              className={`rounded-[16px] border p-4 text-left transition-colors ${
                                isSelected ? "border-[#0c0c0c] bg-[#0c0c0c]/[0.03]" : "border-black/[0.08] bg-white hover:bg-[#fafaf9]"
                              }`}
                              onClick={() => handleSelectDay(iso)}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a3a3a3]">
                                    {d.toLocaleDateString(locale === "de" ? "de" : "en", { weekday: "long" })}
                                  </p>
                                  <p className="mt-1 text-[0.9375rem] font-medium text-[#0c0c0c]">
                                    {d.toLocaleDateString(locale === "de" ? "de" : "en", { month: "short", day: "numeric" })}
                                  </p>
                                </div>
                                <span className="text-[0.875rem] text-[#737373] tabular-nums">
                                  {items.length ? `${items.length} item${items.length === 1 ? "" : "s"}` : "No items"}
                                </span>
                              </div>

                              {items.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  {items.slice(0, 3).map((it) => {
                                    const pill = priorityPill(it.priority);
                                    return (
                                      <div key={it.checkKey} className="flex items-center justify-between gap-3 rounded-[14px] border border-black/[0.06] bg-white px-3.5 py-2.5">
                                        <div className="min-w-0">
                                          <p className="truncate text-[0.875rem] font-medium text-[#0c0c0c]">
                                            {it.title}
                                          </p>
                                          <div className="mt-1 flex flex-wrap items-center gap-2">
                                            <span className={`rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] ${pill.cls}`}>
                                              {pill.text}
                                            </span>
                                            <span className="text-[0.8125rem] text-[#737373]">{statusLabel(it.status)}</span>
                                            {it.timeLabel && (
                                              <span className="text-[0.8125rem] text-[#737373]">{it.timeLabel}</span>
                                            )}
                                          </div>
                                        </div>
                                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${categoryDot(it.category)}`} aria-hidden />
                                      </div>
                                    );
                                  })}
                                  {items.length > 3 && (
                                    <p className="text-[0.8125rem] text-[#737373]">
                                      + {items.length - 3} more
                                    </p>
                                  )}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {view === "timeline" && (
                    <div className="mt-4">
                      <div className="space-y-3">
                        {timelineItems.length === 0 ? (
                          <div className="rounded-[16px] border border-black/[0.08] bg-[#fafaf9] p-4 text-[0.9375rem] text-[#737373]">
                            No items in the next three months.
                          </div>
                        ) : (
                          timelineItems.map((it) => {
                            const pill = priorityPill(it.priority);
                            const isOverdue = it.status !== "done" && fromLocalISODate(it.scheduledDateISO).getTime() < today.getTime();
                            const isSelected = it.scheduledDateISO === selectedDayISO && it.checkKey === selectedEventKey;
                            return (
                              <button
                                key={`${it.scheduledDateISO}:${it.checkKey}`}
                                type="button"
                                onClick={() => {
                                  setSelectedDayISO(it.scheduledDateISO);
                                  setSelectedEventKey(it.checkKey);
                                  setDetailsOpenMobile(true);
                                }}
                                className={`w-full rounded-[18px] border p-4 text-left transition-colors ${
                                  isSelected ? "border-[#0c0c0c] bg-[#0c0c0c]/[0.03]" : "border-black/[0.08] bg-white hover:bg-[#fafaf9]"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a3a3a3]">
                                      {fromLocalISODate(it.scheduledDateISO).toLocaleDateString(locale === "de" ? "de" : "en", {
                                        month: "short",
                                        day: "numeric",
                                        weekday: "short",
                                      })}
                                      {isOverdue ? " • Overdue" : ""}
                                    </p>
                                    <p className="mt-1 truncate text-[0.9375rem] font-medium text-[#0c0c0c]">
                                      {it.title}
                                    </p>
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                      <span className={`rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] ${pill.cls}`}>
                                        {pill.text}
                                      </span>
                                      <span className="text-[0.8125rem] text-[#737373]">{statusLabel(it.status)}</span>
                                    </div>
                                  </div>
                                  <div className="flex shrink-0 flex-col items-end gap-2">
                                    <span className={`h-2.5 w-2.5 rounded-full ${categoryDot(it.category)}`} aria-hidden />
                                    <span className="text-[0.8125rem] text-[#737373]">{categoryLabel(it.category)}</span>
                                  </div>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-4">
                <div
                  ref={detailsPanelRef}
                  className="hidden lg:block rounded-[20px] border border-black/[0.08] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.03)]"
                  aria-labelledby={detailsTitleId}
                >
                  <p id={detailsTitleId} className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a3a3a3]">
                    Selected day
                  </p>
                  <p className="mt-1 text-[0.9375rem] font-medium text-[#0c0c0c]">
                    {fromLocalISODate(selectedDayISO).toLocaleDateString(locale === "de" ? "de" : "en", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>

                  <div className="mt-4 space-y-3">
                    {selectedDayItems.length === 0 ? (
                      <div className="rounded-[16px] border border-black/[0.08] bg-[#fafaf9] p-4 text-[0.9375rem] text-[#737373]">
                        No items on this day.
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-2">
                          {selectedDayItems.map((it) => (
                            <button
                              key={it.checkKey}
                              type="button"
                              onClick={() => setSelectedEventKey(it.checkKey)}
                              className={`rounded-full border px-3 py-1.5 text-[0.8125rem] ${
                                it.checkKey === selectedEventKey
                                  ? "border-[#0c0c0c] bg-[#0c0c0c] text-white"
                                  : "border-black/[0.08] bg-white text-[#404040] hover:text-[#0c0c0c]"
                              }`}
                            >
                              {it.title}
                            </button>
                          ))}
                        </div>

                        {selectedItem && (
                          <div className="rounded-[18px] border border-black/[0.08] bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-[0.9375rem] font-semibold text-[#0c0c0c]">
                                  {selectedItem.title}
                                </p>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  <span className={`h-2 w-2 rounded-full ${categoryDot(selectedItem.category)}`} aria-hidden />
                                  <span className="text-[0.8125rem] text-[#737373]">{categoryLabel(selectedItem.category)}</span>
                                  <span className="text-[0.8125rem] text-[#737373]">{statusLabel(selectedItem.status)}</span>
                                </div>
                              </div>
                              <span className={`rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] ${priorityPill(selectedItem.priority).cls}`}>
                                {priorityPill(selectedItem.priority).text}
                              </span>
                            </div>

                            <div className="mt-3 rounded-[14px] border border-black/[0.06] bg-[#fafaf9] p-3.5">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a3a3a3]">
                                Preparation
                              </p>
                              <ul className="mt-2 space-y-1 text-[0.875rem] text-[#404040]">
                                {inferPrep(selectedItem.title, selectedItem.biomarkers).map((x) => (
                                  <li key={x} className="flex items-start gap-2">
                                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#0c0c0c]/[0.35]" aria-hidden />
                                    <span>{x}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {(selectedItem.doctorName || selectedItem.address) && (
                              <div className="mt-3 rounded-[14px] border border-black/[0.06] bg-[#fafaf9] p-3.5">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a3a3a3]">
                                  Location
                                </p>
                                {selectedItem.doctorName && (
                                  <p className="mt-2 text-[0.875rem] font-medium text-[#0c0c0c]">
                                    {selectedItem.doctorName}
                                  </p>
                                )}
                                {selectedItem.address && (
                                  <p className="mt-1 text-[0.875rem] text-[#404040]">
                                    {selectedItem.address}
                                  </p>
                                )}
                              </div>
                            )}

                            <div className="mt-3">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a3a3a3]">
                                Notes
                              </p>
                              <textarea
                                className="mt-2 w-full resize-none rounded-[14px] border border-black/[0.08] bg-white px-3.5 py-3 text-[0.875rem] text-[#0c0c0c] outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c0c0c]"
                                rows={4}
                                value={notesByEventId[`${selectedItem.checkKey}:${selectedItem.scheduledDateISO}`] ?? ""}
                                onChange={(e) =>
                                  setNotesByEventId((prev) => ({
                                    ...prev,
                                    [`${selectedItem.checkKey}:${selectedItem.scheduledDateISO}`]: e.target.value,
                                  }))
                                }
                                placeholder="Add symptoms, questions, or context for your next visit."
                              />
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <Link
                                href={`/results/action-plan#check-${encodeURIComponent(selectedItem.checkKey)}`}
                                className="inline-flex items-center justify-center rounded-[12px] border border-black/[0.08] bg-white px-3 py-2 text-[0.8125rem] font-medium text-[#404040] hover:text-[#0c0c0c]"
                              >
                                Book
                              </Link>
                              <button
                                type="button"
                                className="rounded-[12px] border border-black/[0.08] bg-white px-3 py-2 text-[0.8125rem] font-medium text-[#404040] hover:text-[#0c0c0c]"
                                onClick={() => setShowReschedule(true)}
                              >
                                Reschedule
                              </button>
                              <button
                                type="button"
                                className="rounded-[12px] bg-[#0c0c0c] px-3.5 py-2 text-[0.8125rem] font-medium text-white hover:brightness-[0.9] disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={selectedItem.status === "done"}
                                onClick={() => onChange(selectedItem.checkKey, "done")}
                              >
                                Mark complete
                              </button>
                              <button
                                type="button"
                                className="rounded-[12px] border border-black/[0.08] bg-[#fafaf9] px-3 py-2 text-[0.8125rem] font-medium text-[#404040] hover:text-[#0c0c0c]"
                                onClick={() => onChange(selectedItem.checkKey, "planned")}
                                disabled={selectedItem.status === "done"}
                              >
                                Start planning
                              </button>
                            </div>

                            <div className="mt-4">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a3a3a3]">
                                Why this matters
                              </p>
                              <p className="mt-2 text-[0.875rem] leading-[1.6] text-[#404040]">
                                {selectedItem.whyThisMatters}
                              </p>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {showReschedule && selectedItem && (
              <div
                className="fixed inset-0 z-[60] flex items-end justify-center bg-black/[0.35] p-4 sm:items-center"
                role="dialog"
                aria-modal="true"
                aria-label="Reschedule"
                onClick={(e) => {
                  if (e.target === e.currentTarget) setShowReschedule(false);
                }}
              >
                <div className="w-full max-w-[34rem] rounded-[20px] border border-black/[0.10] bg-white p-5 shadow-[0_18px_60px_rgba(0,0,0,0.25)]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a3a3a3]">
                        Reschedule
                      </p>
                      <p className="mt-1 truncate text-[0.9375rem] font-semibold text-[#0c0c0c]">
                        {selectedItem.title}
                      </p>
                      <p className="mt-1 text-[0.875rem] text-[#737373]">
                        Current date:{" "}
                        {fromLocalISODate(selectedItem.scheduledDateISO).toLocaleDateString(locale === "de" ? "de" : "en", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-[12px] border border-black/[0.08] bg-white px-3 py-2 text-[0.8125rem] font-medium text-[#404040] hover:text-[#0c0c0c]"
                      onClick={() => setShowReschedule(false)}
                    >
                      Close
                    </button>
                  </div>

                  <div className="mt-4 rounded-[16px] border border-black/[0.06] bg-[#fafaf9] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a3a3a3]">
                      Suggested windows
                    </p>
                    <div className="mt-3 flex flex-col gap-2">
                      {rescheduleSuggestions.map((sug) => (
                        <button
                          key={sug.iso}
                          type="button"
                          className="flex items-center justify-between rounded-[14px] border border-black/[0.08] bg-white px-4 py-3 text-left hover:bg-[#fafaf9]"
                          onClick={() => {
                            setScheduledOverrides((prev) => ({ ...prev, [selectedItem.checkKey]: sug.iso }));
                            setSelectedDayISO(sug.iso);
                            setShowReschedule(false);
                          }}
                        >
                          <span className="text-[0.875rem] font-medium text-[#0c0c0c]">{sug.label}</span>
                          <span className="text-[0.8125rem] text-[#737373]">Select</span>
                        </button>
                      ))}
                      {rescheduleSuggestions.length === 0 && (
                        <p className="text-[0.875rem] text-[#737373]">
                          No suggestions available.
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="mt-3 text-[0.8125rem] text-[#737373]">
                    Tip: rescheduling updates your calendar view and keeps progress synced with the Action Plan.
                  </p>
                </div>
              </div>
            )}

            <div
              className={`fixed inset-x-0 bottom-0 z-[55] rounded-t-[22px] border-t border-black/[0.10] bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.12)] transition-transform lg:hidden ${
                detailsOpenMobile ? "translate-y-0" : "translate-y-[92%]"
              }`}
              role="dialog"
              aria-modal="false"
              aria-label="Selected day details"
            >
              <div className="mx-auto max-w-[72rem] px-5 pb-5 pt-3 md:px-8">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setDetailsOpenMobile((v) => !v)}
                    aria-expanded={detailsOpenMobile}
                  >
                    <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-black/[0.12]" aria-hidden />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a3a3a3]">
                      Selected day
                    </p>
                    <p className="mt-1 text-[0.9375rem] font-medium text-[#0c0c0c]">
                      {fromLocalISODate(selectedDayISO).toLocaleDateString(locale === "de" ? "de" : "en", {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </button>
                  <button
                    type="button"
                    className="shrink-0 rounded-[12px] border border-black/[0.08] bg-white px-3 py-2 text-[0.8125rem] font-medium text-[#404040]"
                    onClick={() => setDetailsOpenMobile(false)}
                  >
                    Close
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {selectedDayItems.length === 0 ? (
                    <div className="rounded-[16px] border border-black/[0.08] bg-[#fafaf9] p-4 text-[0.9375rem] text-[#737373]">
                      No items on this day.
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {selectedDayItems.map((it) => (
                          <button
                            key={it.checkKey}
                            type="button"
                            onClick={() => setSelectedEventKey(it.checkKey)}
                            className={`rounded-full border px-3 py-1.5 text-[0.8125rem] ${
                              it.checkKey === selectedEventKey
                                ? "border-[#0c0c0c] bg-[#0c0c0c] text-white"
                                : "border-black/[0.08] bg-white text-[#404040]"
                            }`}
                          >
                            {it.title}
                          </button>
                        ))}
                      </div>

                      {selectedItem && (
                        <div className="rounded-[18px] border border-black/[0.08] bg-white p-4">
                          <p className="text-[0.9375rem] font-semibold text-[#0c0c0c]">{selectedItem.title}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${categoryDot(selectedItem.category)}`} aria-hidden />
                            <span className="text-[0.8125rem] text-[#737373]">{categoryLabel(selectedItem.category)}</span>
                            <span className="text-[0.8125rem] text-[#737373]">{statusLabel(selectedItem.status)}</span>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <Link
                              href={`/results/action-plan#check-${encodeURIComponent(selectedItem.checkKey)}`}
                              className="inline-flex items-center justify-center rounded-[12px] border border-black/[0.08] bg-white px-3 py-2 text-[0.8125rem] font-medium text-[#404040]"
                            >
                              Book
                            </Link>
                            <button
                              type="button"
                              className="rounded-[12px] border border-black/[0.08] bg-white px-3 py-2 text-[0.8125rem] font-medium text-[#404040]"
                              onClick={() => setShowReschedule(true)}
                            >
                              Reschedule
                            </button>
                            <button
                              type="button"
                              className="rounded-[12px] bg-[#0c0c0c] px-3.5 py-2 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                              disabled={selectedItem.status === "done"}
                              onClick={() => onChange(selectedItem.checkKey, "done")}
                            >
                              Mark complete
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRouteGate>
  );
}

