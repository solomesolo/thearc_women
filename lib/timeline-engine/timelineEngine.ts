import { prisma } from "@/lib/db";
import type { TimelineItem, TimelineLabelKey, TimelineOutput, TimelineUrgency } from "./timelineTypes";
import { ensureTimelineSeed } from "./seed";

const ENGINE_VERSION = "timeline_v1";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(anchor: Date, days: number): Date {
  const d = new Date(anchor);
  d.setDate(d.getDate() + days);
  return d;
}

function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function resolveLabel(daysDiff: number): TimelineLabelKey {
  if (daysDiff <= 30) return "this_month";
  if (daysDiff <= 45) return "next_month";
  if (daysDiff <= 63) return "in_6_weeks";
  if (daysDiff <= 120) return "in_3_months";
  return "later";
}

function labelOrder(label: TimelineLabelKey): number {
  return { this_month: 0, next_month: 1, in_6_weeks: 2, in_3_months: 3, later: 4, completed: 99 }[label] ?? 99;
}

function urgencyFromScore(score: number): TimelineUrgency {
  if (score >= 90) return "high";
  if (score >= 60) return "medium";
  return "low";
}

function statusWeight(status: string): number {
  if (status === "missing") return 30;
  if (status === "outdated") return 20;
  if (status === "planned") return 10;
  if (status === "current") return -20;
  if (status === "completed") return -50;
  return 0;
}

function minLabel(a: TimelineLabelKey, b: TimelineLabelKey): TimelineLabelKey {
  return labelOrder(a) <= labelOrder(b) ? a : b;
}

export async function generateTimeline(params: { userEmail: string; anchorDate?: Date }): Promise<TimelineOutput> {
  const anchor = params.anchorDate ?? new Date();
  await ensureTimelineSeed();

  const snap = await prisma.profileSnapshot.findFirst({
    where: { userEmail: params.userEmail, isActive: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      userEmail: true,
      lifeStage: true,
      riskFlags: true,
      conditionFlags: true,
      familyHistoryFlags: true,
    },
  });

  const riskFlags = new Set<string>((snap?.riskFlags as any) ?? []);
  const conditionFlags = new Set<string>((snap?.conditionFlags as any) ?? []);
  const familyFlags = new Set<string>((snap?.familyHistoryFlags as any) ?? []);
  const lifeStage = (snap?.lifeStage as string | null) ?? null;

  const instances = await prisma.recommendationInstance.findMany({
    where: { userEmail: params.userEmail, active: true, ...(snap?.id ? { profileSnapshotId: snap.id } : {}) },
    select: { bundleKey: true, priorityScore: true },
    take: 200,
  });
  const candidateBundles = Array.from(new Set(instances.map((i) => i.bundleKey)));
  const bundles = candidateBundles.length ? candidateBundles : ["vitamin_d", "iron_status", "thyroid_basic"];

  // All four reads depend only on `bundles` — run in parallel.
  const [policies, overrides, statuses, userPlans] = await Promise.all([
    prisma.timelinePolicy.findMany({
      where: { bundleKey: { in: bundles } },
      select: {
        bundleKey: true,
        defaultLeadDays: true,
        outdatedLeadDays: true,
        followUpDays: true,
        titleCheck: true,
        titleFollowUp: true,
        scheduleMode: true,
      },
    }),
    prisma.timelineRuleOverride.findMany({
      where: { active: true, bundleKey: { in: bundles } },
      select: { bundleKey: true, triggerType: true, triggerValue: true, urgencyBoost: true, maxBucket: true, followUpDaysOverride: true },
      take: 500,
    }),
    prisma.statusSnapshot.findMany({
      where: { userEmail: params.userEmail, bundleKey: { in: bundles } },
      orderBy: [{ calculatedAt: "desc" }],
      take: 500,
      select: { bundleKey: true, finalStatus: true, calculatedAt: true },
    }),
    prisma.userPlanItem.findMany({
      where: { userEmail: params.userEmail, bundleKey: { in: bundles } },
      orderBy: [{ updatedAt: "desc" }],
      take: 200,
      select: { bundleKey: true, plannedDate: true, completedDate: true, userState: true },
    }),
  ]);

  const policyByBundle = new Map(policies.map((p) => [p.bundleKey, p]));

  const overridesByBundle = new Map<string, typeof overrides>();
  for (const o of overrides) {
    const arr = overridesByBundle.get(o.bundleKey) ?? [];
    arr.push(o);
    overridesByBundle.set(o.bundleKey, arr);
  }

  const statusByBundle = new Map<string, string>();
  for (const s of statuses) {
    if (statusByBundle.has(s.bundleKey)) continue;
    statusByBundle.set(s.bundleKey, s.finalStatus);
  }

  const planByBundle = new Map<string, (typeof userPlans)[number]>();
  for (const p of userPlans) {
    if (planByBundle.has(p.bundleKey)) continue;
    planByBundle.set(p.bundleKey, p);
  }

  const priorityByBundle = new Map<string, number>(instances.map((i) => [i.bundleKey, i.priorityScore ?? 50]));

  const items: TimelineItem[] = [];

  for (const bundleKey of bundles) {
    const policy = policyByBundle.get(bundleKey);
    if (!policy) continue;

    const plan = planByBundle.get(bundleKey);
    const status = plan?.userState === "completed" || plan?.completedDate ? "completed" : plan?.plannedDate ? "planned" : (statusByBundle.get(bundleKey) ?? "missing");

    // Exclude current/completed from "upcoming checks" (follow-ups may still exist).
    if (status === "current" || status === "completed") {
      continue;
    }

    let urgencyScore = (priorityByBundle.get(bundleKey) ?? 50) + statusWeight(status);

    let maxBucket: TimelineLabelKey | null = null;
    let followUpDays = policy.followUpDays ?? null;

    const ovs = overridesByBundle.get(bundleKey) ?? [];
    for (const o of ovs) {
      const triggerType = o.triggerType;
      const triggerVal = o.triggerValue;
      let match = false;
      if (triggerType === "risk_flag") match = riskFlags.has(triggerVal);
      else if (triggerType === "condition_flag") match = conditionFlags.has(triggerVal);
      else if (triggerType === "family_history_flag") match = familyFlags.has(triggerVal);
      else if (triggerType === "life_stage") match = lifeStage === triggerVal;
      else if (triggerType === "status") match = status === triggerVal;
      if (!match) continue;

      urgencyScore += o.urgencyBoost ?? 0;
      if (o.maxBucket) maxBucket = (maxBucket ? minLabel(maxBucket, o.maxBucket as TimelineLabelKey) : (o.maxBucket as TimelineLabelKey));
      if (typeof o.followUpDaysOverride === "number") followUpDays = o.followUpDaysOverride;
    }

    const urgency = urgencyFromScore(urgencyScore);

    const scheduled = plan?.plannedDate
      ? new Date(plan.plannedDate)
      : status === "outdated"
        ? addDays(anchor, policy.outdatedLeadDays)
        : addDays(anchor, policy.defaultLeadDays);

    const daysDiff = daysBetween(anchor, scheduled);
    let label = resolveLabel(daysDiff);
    if (maxBucket) label = minLabel(label, maxBucket);

    const checkItem: TimelineItem = {
      bundle_key: bundleKey,
      event_type: "check",
      scheduled_date: isoDate(scheduled),
      source: plan?.plannedDate ? "user_plan" : "default_policy",
      urgency,
      label_key: label,
      title: policy.titleCheck,
      subtitle: "Recommended now based on your profile",
      status,
    };
    items.push(checkItem);

    if (followUpDays && followUpDays > 0 && (status === "missing" || status === "outdated" || status === "planned")) {
      const follow = addDays(scheduled, followUpDays);
      const followLabel = resolveLabel(daysBetween(anchor, follow));
      items.push({
        bundle_key: bundleKey,
        event_type: "follow_up",
        scheduled_date: isoDate(follow),
        source: "generated_follow_up",
        urgency: urgency === "high" ? "medium" : "low",
        label_key: followLabel,
        title: policy.titleFollowUp ?? `Follow-up — review ${policy.titleCheck.toLowerCase()}`,
        subtitle: "Discuss changes or next steps if needed",
        status: "future",
      });
    }
  }

  // Persist generation run + events
  const inputHash = JSON.stringify({
    bundles,
    status: Array.from(statusByBundle.entries()),
    risk: Array.from(riskFlags),
    cond: Array.from(conditionFlags),
    fam: Array.from(familyFlags),
    lifeStage,
  });

  const run = await prisma.timelineGenerationRun.create({
    data: {
      userEmail: params.userEmail,
      profileSnapshotId: snap?.id ?? null,
      engineVersion: ENGINE_VERSION,
      inputHash,
    },
    select: { id: true },
  });

  // Replace old events and insert new ones atomically — createMany eliminates N+1 writes.
  await prisma.timelineEvent.deleteMany({ where: { userEmail: params.userEmail } });

  if (items.length > 0) {
    await prisma.timelineEvent.createMany({
      data: items.map((it) => ({
        userEmail: params.userEmail,
        bundleKey: it.bundle_key,
        eventType: it.event_type,
        scheduledDate: new Date(it.scheduled_date),
        labelKey: it.label_key,
        title: it.title,
        subtitle: it.subtitle ?? null,
        status: it.status,
        source: it.source,
        parentEventId: null,
        generationRunId: run.id,
        metadata: { urgency: it.urgency } as any,
      })),
      skipDuplicates: true,
    });
  }

  // Group for display
  const groups = new Map<TimelineLabelKey, TimelineItem[]>();
  for (const it of items) {
    const arr = groups.get(it.label_key) ?? [];
    arr.push(it);
    groups.set(it.label_key, arr);
  }

  const timeline = Array.from(groups.entries())
    .sort((a, b) => labelOrder(a[0]) - labelOrder(b[0]))
    .map(([label, its]) => ({
      label,
      items: its
        .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))
        .map((x) => ({
          bundle_key: x.bundle_key,
          title: x.title,
          event_type: x.event_type,
          scheduled_date: x.scheduled_date,
          status: x.status,
          source: x.source,
        })),
    }));

  return { anchor_date: isoDate(anchor), timeline };
}

