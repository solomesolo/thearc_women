import { prisma } from "@/lib/db";
import type { DashboardSummaryResponse, HeaderVM } from "./dashboardSummaryTypes";
import { resolveDashboardState } from "./emptyStateResolver";
import { buildProfileSummary } from "./profileSummaryBuilder";
import { buildKpis } from "./kpiBuilder";
import { buildOverviewCard } from "./overviewCardBuilder";
import { buildActionPlanCard } from "./actionPlanCardBuilder";
import { buildTopPriorities } from "./topPrioritiesBuilder";
import { buildUpcomingChecks } from "./upcomingChecksBuilder";
import { generateTimeline } from "@/lib/timeline-engine/timelineEngine";
import { getProgressDashboardCounts } from "@/lib/progress-engine/progressService";

const ENGINE_VERSION = "dashboard_summary_v1";

function headerFromUser(userEmail: string): HeaderVM {
  const short = userEmail.includes("@") ? userEmail.split("@")[0] : userEmail;
  return { title: `Hello, ${short}`, subtitle: "Your personalized health dashboard" };
}

function displayNameForBundle(bundleKey: string): string {
  const m: Record<string, string> = {
    vitamin_d: "Vitamin D",
    iron_status: "Iron / Ferritin",
    thyroid_basic: "Thyroid (TSH)",
    glucose_metabolic: "Blood sugar / HbA1c",
    lipid_panel: "Lipids",
    b12_folate: "Vitamin B12 / Folate",
    stress_cortisol: "Stress / Cortisol",
    female_hormone_balance: "Hormone balance",
    fertility_reserve: "Fertility markers",
    androgen_balance: "Androgen balance",
    gut_health_basic: "Gut health",
    comprehensive_preventive: "Comprehensive preventive",
  };
  return m[bundleKey] ?? bundleKey;
}

export async function getDashboardSummary(params: { userEmail: string }): Promise<DashboardSummaryResponse> {
  const userEmail = params.userEmail.trim().toLowerCase();

  const profile = await prisma.profileSnapshot.findFirst({
    where: { userEmail, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  // Instances depend on profile; everything else is independent — run in parallel.
  const [instances, timeline, progressCounts, latestHealthScore] = await Promise.all([
    prisma.recommendationInstance.findMany({
      where: { userEmail, active: true, ...(profile?.id ? { profileSnapshotId: profile.id } : {}) },
      select: { id: true, bundleKey: true, priorityScore: true },
      take: 500,
    }),
    generateTimeline({ userEmail }).catch(() => null),
    getProgressDashboardCounts({ userEmail }).catch(() => null),
    prisma.userHealthScore.findFirst({
      where: { userEmail },
      orderBy: { createdAt: "desc" },
      select: { score: true },
    }),
  ]);

  const state = resolveDashboardState({ hasProfile: Boolean(profile), recommendationCount: instances.length });
  const healthScoreValue = latestHealthScore ? Math.round(Number(latestHealthScore.score)) : null;

  // Status + progress per bundle — both depend on bundleKeys from instances, run in parallel.
  const bundleKeys = instances.map((i) => i.bundleKey);
  const [statusRows, progressRows] = await Promise.all([
    bundleKeys.length
      ? prisma.statusSnapshot.findMany({
          where: { userEmail, bundleKey: { in: bundleKeys } },
          orderBy: [{ calculatedAt: "desc" }],
          take: 2000,
          select: { bundleKey: true, finalStatus: true, stateGroup: true, calculatedAt: true },
        })
      : Promise.resolve([]),
    instances.length
      ? prisma.recommendationProgress.findMany({
          where: { userEmail, bundleKey: { in: bundleKeys } },
          select: { bundleKey: true, progressState: true },
          take: 2000,
        })
      : Promise.resolve([]),
  ]);

  const statusByBundle = new Map<string, string>();
  const stateGroupByBundle = new Map<string, string>();
  for (const r of statusRows) {
    if (statusByBundle.has(r.bundleKey)) continue;
    statusByBundle.set(r.bundleKey, r.finalStatus);
    stateGroupByBundle.set(r.bundleKey, r.stateGroup ?? "");
  }

  const progressByBundle = new Map(progressRows.map((p) => [p.bundleKey, p.progressState]));

  // Badge count heuristic (signals + action-needed)
  const badgeCount = Array.isArray(profile?.riskFlags) ? (profile?.riskFlags as any[]).length : 0;

  const topPriorityCandidates = instances.map((i) => {
    const status = statusByBundle.get(i.bundleKey) ?? "missing";
    return {
      bundle_key: i.bundleKey,
      display_name: displayNameForBundle(i.bundleKey),
      status,
      priority_score: i.priorityScore ?? 50,
      progress_state: progressByBundle.get(i.bundleKey) ?? "not_started",
      urgency_label: null,
      state_group: stateGroupByBundle.get(i.bundleKey) ?? "",
    };
  });

  const res: DashboardSummaryResponse = {
    version: ENGINE_VERSION,
    dashboard_state: state,
    header: headerFromUser(userEmail),
    kpis: buildKpis({
      progressCounts: progressCounts
        ? { action_needed: progressCounts.dashboard_counts.action_needed, planned: progressCounts.dashboard_counts.planned, completed: progressCounts.dashboard_counts.completed }
        : null,
      healthScore: healthScoreValue,
    }),
    overview_card: buildOverviewCard({ badgeCount }),
    action_plan_card: buildActionPlanCard({ testsToAction: progressCounts?.dashboard_counts.action_needed ?? 0 }),
    top_priorities: buildTopPriorities({ candidates: topPriorityCandidates }),
    score_widget: {
      label: "Health Completeness Score",
      value: healthScoreValue,
      caption: "Based on your current health data",
    },
    upcoming_checks: buildUpcomingChecks({ timeline, maxItems: 4 }),
    profile_summary: buildProfileSummary(profile),
  };

  // Optional materialized cache (keep light; best-effort)
  await prisma.dashboardSummary
    .upsert({
      where: { userEmail_version: { userEmail, version: ENGINE_VERSION } } as any,
      create: { userEmail, profileSnapshotId: profile?.id ?? null, version: ENGINE_VERSION, payload: res as any },
      update: { profileSnapshotId: profile?.id ?? null, payload: res as any },
    })
    .catch(() => {});

  return res;
}

