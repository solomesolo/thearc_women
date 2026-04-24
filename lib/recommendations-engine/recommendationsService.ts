import { prisma } from "@/lib/db";
import { resolveChecks } from "./checkResolver";
import type {
  CheckRecommendation,
  CheckStatus,
  ImpactLevel,
  ProfileSummary,
  RecommendationsPayload,
  RecommendationSummary,
  TopPriority,
  UpcomingCheck,
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
  snap: any,
): ProfileSummary {
  // Age group — prefer snapshot, fall back to survey answer
  const ageGroup: string | null =
    snap?.ageGroupLabel ??
    snap?.ageGroup ??
    (answersMap.has("age_range") ? String(answersMap.get("age_range")) : null);

  // Life stage — built from raw answers
  const lifeStage = buildLifeStageLabel(answersMap) ??
    snap?.lifeStageLabel ??
    snap?.lifeStage ??
    null;

  // Goals — map from internal keys to display labels
  const rawGoals = answersMap.get("goals");
  const goals: string[] = Array.isArray(rawGoals)
    ? (rawGoals as string[]).map((g) => GOALS_LABELS[g] ?? g).filter(Boolean)
    : rawGoals
      ? [GOALS_LABELS[String(rawGoals)] ?? String(rawGoals)]
      : (Array.isArray(snap?.goalLabels) ? snap.goalLabels : []);

  return { ageGroup, lifeStage, goals };
}

function computeHealthScore(checks: CheckRecommendation[]): number {
  let numerator = 0;
  let denominator = 0;
  for (const c of checks) {
    // Use score as weight proxy — normalized to reasonable range
    const w = Math.min(Math.max(c.score, 1), 10);
    denominator += w;
    if (c.status === "DONE") numerator += w;
    else if (c.status === "PLANNED") numerator += w * 0.4;
  }
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
}

function impactOrder(impact: ImpactLevel): number {
  if (impact === "HIGH IMPACT") return 0;
  if (impact === "MEDIUM IMPACT") return 1;
  return 2;
}

function buildTopPriorities(checks: CheckRecommendation[]): TopPriority[] {
  return checks
    .filter((c) => c.status !== "DONE")
    .sort((a, b) => {
      const impactDiff = impactOrder(a.impact) - impactOrder(b.impact);
      if (impactDiff !== 0) return impactDiff;
      return a.priorityRank - b.priorityRank;
    })
    .slice(0, 5)
    .map((c, i) => {
      const firstSignal = c.relevanceSignals[0];
      const shortReason = firstSignal
        ? `${firstSignal.label}: ${firstSignal.explanation}`.slice(0, 80)
        : c.whyRecommendedForYou.slice(0, 80);
      return {
        checkKey: c.checkKey,
        checkName: c.checkName,
        status: c.status,
        impact: c.impact,
        priorityRank: i + 1,
        shortReason,
      };
    });
}

function buildUpcomingChecks(checks: CheckRecommendation[]): UpcomingCheck[] {
  const planned = checks.filter((c) => c.status === "PLANNED").slice(0, 3);
  const missingNeeded = 3 - planned.length;
  const missing = checks
    .filter((c) => c.status === "MISSING")
    .slice(0, missingNeeded);

  const items: UpcomingCheck[] = [];
  for (const c of planned) {
    items.push({
      checkKey: c.checkKey,
      checkName: c.checkName,
      timeLabel: c.plannedAt ? "Scheduled" : "Planned",
    });
  }
  for (const c of missing) {
    items.push({
      checkKey: c.checkKey,
      checkName: c.checkName,
      timeLabel: c.recommendedTiming || "Recommended",
    });
  }
  return items;
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
  const statusRows = checkKeys.length
    ? await prisma.userCheckStatus.findMany({
        where: { userEmail, checkKey: { in: checkKeys } },
        select: { checkKey: true, status: true, plannedAt: true, completedAt: true },
      })
    : [];

  const statusByKey = new Map(statusRows.map((r) => [r.checkKey, r]));

  // Merge status into checks
  const checks: CheckRecommendation[] = resolved.map((c) => {
    const row = statusByKey.get(c.checkKey);
    const status = (row?.status ?? "MISSING") as CheckStatus;
    return {
      ...c,
      status,
      progressLabel: status,
      plannedAt: row?.plannedAt ? row.plannedAt.toISOString() : null,
      completedAt: row?.completedAt ? row.completedAt.toISOString() : null,
    };
  });

  const missingCount = checks.filter((c) => c.status === "MISSING").length;
  const plannedCount = checks.filter((c) => c.status === "PLANNED").length;
  const completedCount = checks.filter((c) => c.status === "DONE").length;
  const healthScore = computeHealthScore(checks);

  const topPriorities = buildTopPriorities(checks);
  const nextRecommendedCheck = topPriorities[0]?.checkName ?? null;

  const summary: RecommendationSummary = {
    recommendedCount: checks.length,
    plannedCount,
    completedCount,
    healthScore,
    topGaps: missingCount,
    nextRecommendedCheck,
  };

  return {
    summary,
    profile: buildProfileSummary(answersMap, snap),
    topPriorities,
    upcomingChecks: buildUpcomingChecks(checks),
    recommendations: checks,
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
      plannedAt: status === "PLANNED" ? now : null,
      completedAt: status === "DONE" ? now : null,
    },
    update: {
      status,
      plannedAt: status === "PLANNED" ? now : status === "MISSING" ? null : undefined,
      completedAt: status === "DONE" ? now : status === "MISSING" ? null : undefined,
      updatedAt: now,
    },
  });

  return { status };
}
