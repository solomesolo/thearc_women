import { prisma } from "@/lib/db";
import { resolveChecks } from "./checkResolver";
import type {
  CheckRecommendation,
  CheckStatus,
  ProfileSummary,
  RecommendationsPayload,
  RecommendationSummary,
  PathwayPayload,
  PathwayTimeframe,
  FixedTimeframe,
  FinalImpact,
  FinalRecommendation,
  FinalStatus,
  PathwayTimelineEntry,
} from "./types";

// Life-stage display labels (internal key → display string)
const LIFE_STAGE_LABELS: Record<string, string> = {
  reproductive: "Menstruating / reproductive years",
  trying_to_conceive: "Trying to conceive",
  pregnant: "Pregnant",
  postpartum: "Postpartum (last 12 months)",
  perimenopause: "Perimenopause",
  postmenopause: "Postmenopause",
  prefer_not_to_say: "Prefer not to say",
};

const GOALS_LABELS: Record<string, string> = {
  general_preventive_health: "General preventive health",
  more_energy_and_vitality: "More energy / less fatigue",
  hormones_and_cycle_balance: "Hormones / cycle balance",
  fertility_and_reproductive_planning: "Fertility / reproductive planning",
  weight_and_metabolism: "Weight / metabolism",
  mood_stress_sleep: "Mood / stress / sleep",
  gut_health_and_digestion: "Gut health / digestion",
  cardiovascular_long_term_health: "Cardiovascular / long-term health",
  thyroid_health: "Thyroid health",
  just_exploring: "I'm not sure",
};

function buildLifeStageLabel(answersMap: Map<string, unknown>): string | null {
  const lifeStageRaw = String(answersMap.get("life_stage") ?? "");
  const cyclePatternRaw = String(answersMap.get("cycle_pattern") ?? "");

  if (lifeStageRaw === "reproductive") {
    return cyclePatternRaw === "regular" ? "Regular menstrual cycle" : "Menstrual cycle";
  }
  return LIFE_STAGE_LABELS[lifeStageRaw] ?? null;
}

function buildProfileSummary(
  answersMap: Map<string, unknown>,
  snap: unknown,
): ProfileSummary {
  const s = (snap ?? null) as {
    ageGroupLabel?: string | null;
    ageGroup?: string | null;
    lifeStageLabel?: string | null;
    lifeStage?: string | null;
    goalLabels?: string[] | null;
  } | null;
  // Age group — prefer snapshot, fall back to survey answer
  const ageGroup: string | null =
    s?.ageGroupLabel ??
    s?.ageGroup ??
    (answersMap.has("age_range") ? String(answersMap.get("age_range")) : null);

  // Life stage — built from raw answers
  const lifeStage = buildLifeStageLabel(answersMap) ??
    s?.lifeStageLabel ??
    s?.lifeStage ??
    null;

  // Goals — map from internal keys to display labels
  const rawGoals = answersMap.get("goals");
  const goals: string[] = Array.isArray(rawGoals)
    ? (rawGoals as string[]).map((g) => GOALS_LABELS[g] ?? g).filter(Boolean)
    : rawGoals
      ? [GOALS_LABELS[String(rawGoals)] ?? String(rawGoals)]
      : (Array.isArray(s?.goalLabels) ? (s.goalLabels as string[]) : []);

  return { ageGroup, lifeStage, goals };
}

function computeHealthScoreSimple(checks: CheckRecommendation[]): number {
  const total = checks.length;
  if (total === 0) return 0;
  const completed = checks.filter((c) => c.status === "completed" || c.status === "result_uploaded").length;
  return Math.round((completed / total) * 100);
}

function normalizePersistedStatus(raw: string | null | undefined): CheckStatus {
  if (!raw) return "missing";
  const v = String(raw).trim();
  // Back-compat: older uppercase statuses
  if (v === "MISSING") return "missing";
  if (v === "PLANNED") return "planned";
  if (v === "DONE") return "completed";
  // New statuses
  if (v === "missing") return "missing";
  if (v === "reminder_set") return "reminder_set";
  if (v === "planned") return "planned";
  if (v === "completed") return "completed";
  if (v === "result_uploaded") return "result_uploaded";
  return "missing";
}

function assignTimeframes(checksSorted: CheckRecommendation[]): PathwayPayload {
  const buckets: PathwayPayload = {
    next_month: [],
    next_3_months: [],
    next_6_months: [],
    next_year: [],
    optional_later: [],
  };

  for (const c of checksSorted) {
    let tf: PathwayTimeframe;

    // preventive_baseline is always the first step — keep it in next_month unless done.
    if (c.checkKey === "preventive_baseline") {
      const isDone = c.status === "completed" || c.status === "result_uploaded" || c.status === "planned";
      tf = isDone ? (c.score >= 8 ? "next_month" : c.score >= 5 ? "next_3_months" : "next_6_months") : "next_month";
    } else if (c.score >= 8) {
      tf = "next_month";
    } else if (c.score >= 5) {
      tf = "next_3_months";
    } else if (c.score >= 3) {
      tf = "next_6_months";
    } else {
      tf = "optional_later";
    }

    (c as CheckRecommendation).timeframe = tf;
    buckets[tf].push(c);
  }

  // Enforce caps by moving overflow downward while keeping order.
  const capAndOverflow = (from: PathwayTimeframe, cap: number, to: PathwayTimeframe) => {
    if (buckets[from].length <= cap) return;
    const overflow = buckets[from].splice(cap);
    for (const c of overflow) {
      (c as CheckRecommendation).timeframe = to;
      buckets[to].push(c);
    }
  };

  capAndOverflow("next_month", 3, "next_3_months");
  capAndOverflow("next_3_months", 4, "next_6_months");
  capAndOverflow("next_6_months", 4, "next_year");
  capAndOverflow("next_year", 4, "optional_later");
  // optional_later is unbounded but UI can collapse.

  // Guarantee preventive_baseline is always first in next_month when not done.
  const bIdx = buckets.next_month.findIndex((c) => c.checkKey === "preventive_baseline");
  if (bIdx > 0) {
    const [baseline] = buckets.next_month.splice(bIdx, 1);
    buckets.next_month.unshift(baseline);
  }

  return buckets;
}

function startOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function addMonths(d: Date, n: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
}

function endOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
}

type FinalTier = "core_now" | "high_later" | "mid" | "optional" | "context_only";

function timeframeToFixed(tf: PathwayTimeframe): "current_month" | "next_3_months" | "next_6_months" | "next_year" | "optional_later" {
  if (tf === "next_month") return "current_month";
  if (tf === "next_3_months") return "next_3_months";
  if (tf === "next_6_months") return "next_6_months";
  if (tf === "next_year") return "next_year";
  return "optional_later";
}

function mapImpactToFinal(impact: CheckRecommendation["impact"]): FinalImpact {
  if (impact === "HIGH IMPACT") return "HIGH";
  if (impact === "MEDIUM IMPACT") return "MEDIUM";
  return "LOW";
}

function mapStatusToFinal(status: CheckStatus): FinalStatus {
  if (status === "planned") return "PLANNED";
  if (status === "completed" || status === "result_uploaded") return "DONE";
  return "MISSING";
}

async function persistFixedSpecPathway(params: {
  userEmail: string;
  anchorDate: Date;
  checksSorted: CheckRecommendation[];
}) {
  const { userEmail, anchorDate, checksSorted } = params;

  // Build per-check biomarker selections:
  // - take includedTestsByCategory in order, flatten tests
  // - keep max 4 per check as core_now candidate
  // - apply global max 10 core_now across current_month checks
  const selections: Array<{
    checkKey: string;
    biomarkerId: string;
    biomarkerName: string;
    score: number;
    tier: FinalTier;
    timeframe: ReturnType<typeof timeframeToFixed>;
    reason: string;
  }> = [];

  for (const c of checksSorted) {
    const tf = timeframeToFixed(c.timeframe);
    const flat: string[] = [];
    for (const cat of c.includedTestsByCategory ?? []) {
      for (const t of cat.tests ?? []) {
        if (!flat.includes(t)) flat.push(t);
      }
    }

    // Per-check cap 4 (fixed spec: 3–4)
    const perCheckCore = flat.slice(0, 4);
    const remaining = flat.slice(4);

    const baseReason = c.whyForYou || "Selected based on your survey profile.";
    for (const name of perCheckCore) {
      selections.push({
        checkKey: c.checkKey,
        biomarkerId: name, // MVP: use name as id (until we map biomarker_id reliably)
        biomarkerName: name,
        score: Math.max(1, Math.round(c.score / 2)),
        tier: "core_now",
        timeframe: tf,
        reason: baseReason,
      });
    }
    for (const name of remaining) {
      selections.push({
        checkKey: c.checkKey,
        biomarkerId: name,
        biomarkerName: name,
        score: 1,
        tier: "high_later",
        timeframe: tf === "current_month" ? "next_3_months" : tf,
        reason: "Useful supporting marker to consider after core tests.",
      });
    }
  }

  // Global cap: max 10 core_now blood biomarkers in current_month
  const currentCore = selections.filter((s) => s.timeframe === "current_month" && s.tier === "core_now");
  if (currentCore.length > 10) {
    const overflow = currentCore.slice(10);
    for (const s of overflow) {
      s.tier = "high_later";
      s.timeframe = "next_3_months";
      s.reason = "Moved out of this month to keep the plan focused (max 10 core blood tests now).";
    }
  }

  // Persist: replace for user (simple MVP)
  // NOTE: some environments may not have this Prisma model generated (older schema),
  // so we feature-detect to avoid runtime crashes that break the app router.
  const biomarkerSelectionModel = (prisma as unknown as {
    userPathwayBiomarkerSelection?: {
      deleteMany: (args: unknown) => Promise<unknown>;
      createMany: (args: unknown) => Promise<unknown>;
    };
  }).userPathwayBiomarkerSelection;

  if (!biomarkerSelectionModel) {
    console.warn(
      "[recommendations] userPathwayBiomarkerSelection model missing; skipping biomarker persistence",
    );
  } else {
    await biomarkerSelectionModel.deleteMany({ where: { userEmail } });

    // Deterministic ranking
    const byGlobal = [...selections].sort((a, b) => b.score - a.score || a.biomarkerName.localeCompare(b.biomarkerName));
    const globalRank = new Map<string, number>();
    byGlobal.forEach((s, i) => globalRank.set(`${s.checkKey}::${s.biomarkerId}`, i + 1));

    const byCheck = new Map<string, string[]>();
    for (const s of selections) {
      if (!byCheck.has(s.checkKey)) byCheck.set(s.checkKey, []);
      byCheck.get(s.checkKey)!.push(s.biomarkerId);
    }
    const withinRank = new Map<string, number>();
    for (const [ck, ids] of byCheck) {
      const uniq = Array.from(new Set(ids));
      uniq.forEach((id, idx) => withinRank.set(`${ck}::${id}`, idx + 1));
    }

    if (selections.length) {
      await biomarkerSelectionModel.createMany({
        data: selections.map((s) => ({
          userEmail,
          checkKey: s.checkKey,
          biomarkerId: s.biomarkerId,
          biomarkerName: s.biomarkerName,
          priorityTier: s.tier,
          timeframe: s.timeframe,
          score: s.score,
          rankWithinCheck: withinRank.get(`${s.checkKey}::${s.biomarkerId}`) ?? 1,
          rankGlobal: globalRank.get(`${s.checkKey}::${s.biomarkerId}`) ?? 1,
          reason: s.reason,
        })),
      });
    }
  }

  // Persist schedule rows for checks
  await prisma.userPathwaySchedule.deleteMany({ where: { userEmail } });
  const month0 = startOfMonth(anchorDate);
  const ranges = {
    current_month: { start: month0, end: endOfMonth(month0) },
    next_3_months: { start: addMonths(month0, 1), end: endOfMonth(addMonths(month0, 2)) },
    next_6_months: { start: addMonths(month0, 3), end: endOfMonth(addMonths(month0, 5)) },
    next_year: { start: addMonths(month0, 6), end: endOfMonth(addMonths(month0, 11)) },
    optional_later: { start: addMonths(month0, 12), end: endOfMonth(addMonths(month0, 17)) },
  } as const;

  const scheduleRows = checksSorted.map((c) => {
    const tf = timeframeToFixed(c.timeframe);
    const r = ranges[tf];
    return {
      userEmail,
      checkKey: c.checkKey,
      timeframe: tf,
      calendarStart: r.start,
      calendarEnd: r.end,
      priorityRank: c.priorityRank,
      status: "MISSING",
      timingReason: c.whyNow || "Scheduled based on your current profile.",
    };
  });

  if (scheduleRows.length) {
    await prisma.userPathwaySchedule.createMany({ data: scheduleRows });
  }
}

async function buildFixedSpecResponse(params: {
  userEmail: string;
  anchorDate: Date;
  checksSorted: CheckRecommendation[];
}): Promise<{ pathwayTimeline: PathwayTimelineEntry[]; recommendations: FinalRecommendation[] }> {
  const { userEmail, anchorDate, checksSorted } = params;

  const [scheduleRows, selectionRows] = await Promise.all([
    prisma.userPathwaySchedule.findMany({
      where: { userEmail },
      orderBy: [{ timeframe: "asc" }, { priorityRank: "asc" }],
      select: {
        checkKey: true,
        timeframe: true,
        calendarStart: true,
        calendarEnd: true,
        priorityRank: true,
        status: true,
        timingReason: true,
      },
      take: 500,
    }),
    prisma.userPathwayBiomarkerSelection.findMany({
      where: { userEmail },
      orderBy: [{ rankGlobal: "asc" }],
      select: {
        checkKey: true,
        biomarkerName: true,
        priorityTier: true,
        timeframe: true,
        rankWithinCheck: true,
      },
      take: 5000,
    }),
  ]);

  // Build pathwayTimeline grouped by timeframe.
  const month0 = startOfMonth(anchorDate);
  const ranges: Record<FixedTimeframe, { label: string; start: Date; end: Date }> = {
    current_month: { label: `This month: ${month0.toLocaleString("en", { month: "long" })}`, start: month0, end: endOfMonth(month0) },
    next_3_months: { label: "Next 3 months", start: addMonths(month0, 1), end: endOfMonth(addMonths(month0, 2)) },
    next_6_months: { label: "Next 6 months", start: addMonths(month0, 3), end: endOfMonth(addMonths(month0, 5)) },
    next_year: { label: "Later this year", start: addMonths(month0, 6), end: endOfMonth(addMonths(month0, 11)) },
    optional_later: { label: "Optional / later", start: addMonths(month0, 12), end: endOfMonth(addMonths(month0, 17)) },
  };

  const checksByKey = new Map(checksSorted.map((c) => [c.checkKey, c]));

  const timelineByTf = new Map<FixedTimeframe, PathwayTimelineEntry>();
  for (const tf of Object.keys(ranges) as FixedTimeframe[]) {
    const r = ranges[tf];
    timelineByTf.set(tf, {
      timeframe: tf,
      label: r.label,
      calendarStart: r.start.toISOString().slice(0, 10),
      calendarEnd: r.end.toISOString().slice(0, 10),
      checks: [],
    });
  }

  for (const row of scheduleRows) {
    const tf = (row.timeframe as FixedTimeframe) ?? "optional_later";
    const c = checksByKey.get(row.checkKey);
    timelineByTf.get(tf)?.checks.push({
      checkKey: row.checkKey,
      checkName: c?.checkName ?? row.checkKey,
      priorityRank: row.priorityRank,
      status: mapStatusToFinal(normalizePersistedStatus(row.status)),
    });
  }

  const pathwayTimeline = Array.from(timelineByTf.values()).filter((x) => x.checks.length > 0);

  // Build per-check biomarker lists from persisted selections.
  const byCheck = new Map<string, typeof selectionRows>();
  for (const s of selectionRows) {
    if (!byCheck.has(s.checkKey)) byCheck.set(s.checkKey, []);
    byCheck.get(s.checkKey)!.push(s);
  }

  // Global biomarker de-dupe across the whole pathway (product requirement: show each biomarker once).
  // We keep the first appearance in the earliest timeframe / highest priority check.
  const tfOrder: Record<FixedTimeframe, number> = {
    current_month: 0,
    next_3_months: 1,
    next_6_months: 2,
    next_year: 3,
    optional_later: 4,
  };
  const checksForOrdering = [...checksSorted].sort((a, b) => {
    const ta = timeframeToFixed(a.timeframe) as FixedTimeframe;
    const tb = timeframeToFixed(b.timeframe) as FixedTimeframe;
    return (tfOrder[ta] ?? 9) - (tfOrder[tb] ?? 9) || a.priorityRank - b.priorityRank;
  });
  const globalSeenBiomarkers = new Set<string>();
  const EXCLUDED_BIOMARKERS = new Set(["hcg", "pregnancy test", "β-hcg", "beta-hcg", "human chorionic gonadotropin"]);
  const isExcludedBiomarker = (name: string) => {
    const l = name.trim().toLowerCase();
    return EXCLUDED_BIOMARKERS.has(l) || l.includes("hcg") || l.includes("pregnancy test");
  };

  const uniq = (names: string[]): string[] => {
    const out: string[] = [];
    for (const n of names) {
      const key = n.trim().toLowerCase();
      if (!key) continue;
      if (isExcludedBiomarker(n)) continue;
      if (globalSeenBiomarkers.has(key)) continue;
      globalSeenBiomarkers.add(key);
      out.push(n);
    }
    return out;
  };

  const recommendations: FinalRecommendation[] = [];
  for (const c of checksForOrdering) {
    const sels = byCheck.get(c.checkKey) ?? [];
    const core = sels
      .filter((s) => s.priorityTier === "core_now" && s.timeframe === "current_month")
      .sort((a, b) => a.rankWithinCheck - b.rankWithinCheck)
      .map((s) => s.biomarkerName)
      .slice(0, 4);

    const supporting = sels
      .filter((s) => s.priorityTier !== "core_now")
      .sort((a, b) => a.rankWithinCheck - b.rankWithinCheck)
      .map((s) => s.biomarkerName)
      .slice(0, 8);

    const later = sels
      .filter((s) => s.timeframe === "next_year" || s.timeframe === "optional_later")
      .sort((a, b) => a.rankWithinCheck - b.rankWithinCheck)
      .map((s) => s.biomarkerName)
      .slice(0, 10);

    const coreUnique = uniq(core).slice(0, 4);
    const supportingUnique = uniq(supporting.filter((x) => !core.includes(x))).slice(0, 8);
    const laterUnique = uniq(later.filter((x) => !core.includes(x) && !supporting.includes(x))).slice(0, 10);

    recommendations.push({
      checkKey: c.checkKey,
      checkName: c.checkName,
      shortSummary: c.shortSummary,
      whyRecommendedForYou: c.whyForYou,
      priorityExplanation: {
        whyNow: c.whyNow,
        timingReason: c.whyNow,
      },
      coreTestsNow: coreUnique,
      supportingTests: supportingUnique,
      laterTests: laterUnique,
      whatCanWait: c.canWait,
      timeframe: timeframeToFixed(c.timeframe),
      impact: mapImpactToFinal(c.impact),
      status: mapStatusToFinal(c.status),
    });
  }

  return { pathwayTimeline, recommendations };
}

export async function getRecommendations(params: {
  userEmail: string;
}): Promise<RecommendationsPayload> {
  const userEmail = params.userEmail.trim().toLowerCase();

  // Load profile snapshot + questionnaire answers in parallel
  const [snap, session] = await Promise.all([
    prisma.profileSnapshot.findFirst({
      where: { userEmail, isActive: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.questionnaireSession.findFirst({
      where: { userEmail },
      orderBy: { updatedAt: "desc" },
      select: { id: true, answers: { select: { questionKey: true, answerValue: true } } },
    }),
  ]);

  const rawAnswers = session?.answers ?? [];

  // Build a quick lookup map (questionKey → answerValue) for profile building
  const answersMap = new Map<string, unknown>(
    rawAnswers.map((a) => [a.questionKey, a.answerValue]),
  );

  // Resolve checks from enriched SQLite rules engine
  const resolved = resolveChecks(
    rawAnswers.map((a) => ({ questionKey: a.questionKey, answerValue: a.answerValue })),
  );

  // Load check statuses for all resolved check keys
  const checkKeys = resolved.map((c) => c.checkKey);
  const [statusRows, reminderRows, resultRows] = await Promise.all([
    checkKeys.length
      ? prisma.userCheckStatus.findMany({
          where: { userEmail, checkKey: { in: checkKeys } },
          select: {
            checkKey: true,
            status: true,
            plannedAt: true,
            completedAt: true,
          },
        })
      : Promise.resolve([]),
    checkKeys.length
      ? prisma.userCheckReminder.findMany({
          where: { userEmail, checkKey: { in: checkKeys }, status: "active" },
          orderBy: { remindAt: "asc" },
          take: 200,
          select: {
            id: true,
            checkKey: true,
            remindAt: true,
            timeframe: true,
            channel: true,
            status: true,
          },
        })
      : Promise.resolve([]),
    checkKeys.length
      ? prisma.userCheckResult.findMany({
          where: { userEmail, checkKey: { in: checkKeys } },
          orderBy: { uploadedAt: "desc" },
          take: 500,
          select: {
            id: true,
            checkKey: true,
            documentId: true,
            fileName: true,
            fileType: true,
            source: true,
            testDate: true,
            uploadedAt: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const statusByKey = new Map(statusRows.map((r) => [r.checkKey, r]));
  const reminderByKey = new Map<string, (typeof reminderRows)[number]>();
  for (const r of reminderRows) {
    if (!reminderByKey.has(r.checkKey)) reminderByKey.set(r.checkKey, r);
  }
  const resultsByKey = new Map<string, Array<(typeof resultRows)[number]>>();
  for (const r of resultRows) {
    if (!resultsByKey.has(r.checkKey)) resultsByKey.set(r.checkKey, []);
    resultsByKey.get(r.checkKey)!.push(r);
  }

  // Merge status into checks
  const checks: CheckRecommendation[] = resolved.map((c) => {
    const row = statusByKey.get(c.checkKey);
    const status = normalizePersistedStatus(row?.status);
    const reminder = reminderByKey.get(c.checkKey) ?? null;
    const uploaded = resultsByKey.get(c.checkKey) ?? [];

    return {
      ...c,
      timeframe: "optional_later",
      status,
      plannedAt: row?.plannedAt ? row.plannedAt.toISOString() : null,
      completedAt: row?.completedAt ? row.completedAt.toISOString() : null,
      actions: {
        canBookLab: !c.isScreening,
        canOrderHomeTest: !c.isScreening,
        canAskDoctor: true,
        canAddReminder: true,
        canUploadResult: !c.isScreening,
      },
      reminder: reminder
        ? {
            id: reminder.id,
            remindAt: reminder.remindAt.toISOString(),
            timeframe: (reminder.timeframe as PathwayTimeframe) ?? null,
            channel: reminder.channel,
            status: reminder.status,
          }
        : null,
      uploadedResults: uploaded.map((u) => ({
        id: u.id,
        documentId: u.documentId ?? null,
        fileName: u.fileName ?? null,
        fileType: u.fileType ?? null,
        source: u.source ?? null,
        testDate: u.testDate ? u.testDate.toISOString().slice(0, 10) : null,
        uploadedAt: u.uploadedAt.toISOString(),
      })),
    };
  });

  // Sort by priorityRank (already score-sorted), then assign timeframes with caps.
  const sorted = [...checks].sort((a, b) => a.priorityRank - b.priorityRank);
  const pathway = assignTimeframes(sorted);

  // Anchor date for calendar-based schedule: prefer questionnaire session updatedAt, then snapshot, else now.
  const snapCreatedAt =
    snap && typeof (snap as { createdAt?: unknown }).createdAt === "object"
      ? ((snap as unknown as { createdAt?: Date | null }).createdAt ?? null)
      : null;
  const anchorDate =
    (session as unknown as { updatedAt?: Date | null })?.updatedAt ??
    snapCreatedAt ??
    new Date();

  // Persist fixed-spec pathway artifacts (biomarker selection + schedule).
  // MVP: recompute on read; later can move to background job + caching.
  try {
    await persistFixedSpecPathway({ userEmail, anchorDate, checksSorted: sorted });
  } catch (e) {
    console.error("[recommendations] persistFixedSpecPathway failed", e);
  }

  // Build fixed-spec response fields
  let fixedSpec: { pathwayTimeline: PathwayTimelineEntry[]; recommendations: FinalRecommendation[] } | null = null;
  try {
    fixedSpec = await buildFixedSpecResponse({ userEmail, anchorDate, checksSorted: sorted });
  } catch (e) {
    console.error("[recommendations] buildFixedSpecResponse failed", e);
  }

  const plannedCount = sorted.filter((c) => c.status === "planned").length;
  const completedCount = sorted.filter((c) => c.status === "completed" || c.status === "result_uploaded").length;
  const uploadedResultsCount = sorted.reduce((acc, c) => acc + (c.uploadedResults?.length ?? 0), 0);
  const healthScore = computeHealthScoreSimple(sorted);
  const nextMonthCount = pathway.next_month.length;

  const nextBestActionCandidate =
    pathway.next_month.find((c) => c.status === "missing") ??
    pathway.next_month.find((c) => c.status === "reminder_set") ??
    pathway.next_month.find((c) => c.status === "planned") ??
    pathway.next_month[0] ??
    sorted[0] ??
    null;

  const summary: RecommendationSummary = {
    nextBestAction: nextBestActionCandidate
      ? {
          checkKey: nextBestActionCandidate.checkKey,
          checkName: nextBestActionCandidate.checkName,
          why: nextBestActionCandidate.whyForYou,
        }
      : null,
    nextMonthCount,
    plannedCount,
    completedCount,
    uploadedResultsCount,
    healthScore,
  };

  return {
    summary,
    profile: rawAnswers.length ? buildProfileSummary(answersMap, snap) : null,
    pathway,
    ...(fixedSpec ? fixedSpec : {}),
  };
}

export async function updateCheckStatus(params: {
  userEmail: string;
  checkKey: string;
  status: CheckStatus;
}): Promise<{ status: CheckStatus }> {
  const userEmail = params.userEmail.trim().toLowerCase();
  const { checkKey, status } = params;

  const now = new Date();
  await prisma.userCheckStatus.upsert({
    where: { user_check_status_unique: { userEmail, checkKey } },
    create: {
      userEmail,
      checkKey,
      status,
      plannedAt: status === "planned" ? now : null,
      completedAt: status === "completed" || status === "result_uploaded" ? now : null,
    },
    update: {
      status,
      plannedAt:
        status === "planned"
          ? now
          : status === "missing"
            ? null
            : undefined,
      completedAt:
        status === "completed" || status === "result_uploaded"
          ? now
          : status === "missing"
            ? null
            : undefined,
      updatedAt: now,
    },
  });

  return { status };
}
