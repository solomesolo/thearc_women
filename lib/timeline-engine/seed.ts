import { prisma as defaultPrisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

type PolicySeed = {
  bundleKey: string;
  timelineCategory: string;
  defaultLeadDays: number;
  outdatedLeadDays: number;
  followUpDays?: number;
  scheduleMode: string;
  titleCheck: string;
  titleFollowUp?: string;
};

const POLICIES: PolicySeed[] = [
  {
    bundleKey: "vitamin_d",
    timelineCategory: "nutrient",
    defaultLeadDays: 21,
    outdatedLeadDays: 35,
    followUpDays: 90,
    scheduleMode: "urgent_if_missing",
    titleCheck: "Vitamin D blood test",
    titleFollowUp: "Follow-up — review Vitamin D result",
  },
  {
    bundleKey: "iron_status",
    timelineCategory: "nutrient",
    defaultLeadDays: 21,
    outdatedLeadDays: 35,
    followUpDays: 42,
    scheduleMode: "urgent_if_missing",
    titleCheck: "Iron / Ferritin check",
    titleFollowUp: "Follow-up — review iron status",
  },
  {
    bundleKey: "thyroid_basic",
    timelineCategory: "thyroid",
    defaultLeadDays: 21,
    outdatedLeadDays: 42,
    followUpDays: 90,
    scheduleMode: "urgent_if_missing",
    titleCheck: "Thyroid (TSH) check",
    titleFollowUp: "Follow-up — review thyroid results",
  },
  {
    bundleKey: "glucose_metabolic",
    timelineCategory: "metabolic",
    defaultLeadDays: 21,
    outdatedLeadDays: 35,
    followUpDays: 90,
    scheduleMode: "urgent_if_missing",
    titleCheck: "Blood sugar / HbA1c check",
    titleFollowUp: "Follow-up — review blood sugar markers",
  },
  {
    bundleKey: "female_hormone_balance",
    timelineCategory: "hormones",
    defaultLeadDays: 21,
    outdatedLeadDays: 35,
    followUpDays: 42,
    scheduleMode: "urgent_if_missing",
    titleCheck: "Female hormone balance check",
    titleFollowUp: "Follow-up — review hormone results",
  },
  {
    bundleKey: "fertility_reserve",
    timelineCategory: "fertility",
    defaultLeadDays: 21,
    outdatedLeadDays: 35,
    followUpDays: 42,
    scheduleMode: "urgent_if_missing",
    titleCheck: "Fertility reserve check",
    titleFollowUp: "Follow-up — review fertility markers",
  },
  {
    bundleKey: "androgen_balance",
    timelineCategory: "hormones",
    defaultLeadDays: 21,
    outdatedLeadDays: 35,
    followUpDays: 42,
    scheduleMode: "urgent_if_missing",
    titleCheck: "Androgen balance check",
    titleFollowUp: "Follow-up — review androgen markers",
  },
  {
    bundleKey: "lipid_panel",
    timelineCategory: "cardiometabolic",
    defaultLeadDays: 35,
    outdatedLeadDays: 42,
    followUpDays: 90,
    scheduleMode: "standard_preventive",
    titleCheck: "Cholesterol / lipids check",
    titleFollowUp: "Follow-up — review lipid profile",
  },
  {
    bundleKey: "gut_health_basic",
    timelineCategory: "gut",
    defaultLeadDays: 35,
    outdatedLeadDays: 42,
    followUpDays: 42,
    scheduleMode: "urgent_if_missing",
    titleCheck: "Gut health check",
    titleFollowUp: "Follow-up — review gut health markers",
  },
];

type OverrideSeed = {
  bundleKey: string;
  triggerType: string;
  triggerValue: string;
  urgencyBoost: number;
  maxBucket?: string;
  followUpDaysOverride?: number;
};

const OVERRIDES: OverrideSeed[] = [
  { bundleKey: "vitamin_d", triggerType: "risk_flag", triggerValue: "low_sun_exposure", urgencyBoost: 12, maxBucket: "this_month" },
  { bundleKey: "iron_status", triggerType: "risk_flag", triggerValue: "heavy_periods", urgencyBoost: 15, maxBucket: "this_month" },
  { bundleKey: "thyroid_basic", triggerType: "risk_flag", triggerValue: "fatigue", urgencyBoost: 12 },
  { bundleKey: "thyroid_basic", triggerType: "family_history_flag", triggerValue: "fh_thyroid", urgencyBoost: 10, maxBucket: "this_month" },
  { bundleKey: "glucose_metabolic", triggerType: "condition_flag", triggerValue: "prediabetes_or_ir", urgencyBoost: 20, maxBucket: "this_month" },
];

function asJson(v: unknown): Prisma.InputJsonValue {
  return v as Prisma.InputJsonValue;
}

export async function ensureTimelineSeed(client = defaultPrisma) {
  for (const p of POLICIES) {
    await client.timelinePolicy.upsert({
      where: { bundleKey: p.bundleKey },
      create: {
        bundleKey: p.bundleKey,
        timelineCategory: p.timelineCategory,
        defaultLeadDays: p.defaultLeadDays,
        outdatedLeadDays: p.outdatedLeadDays,
        followUpDays: p.followUpDays ?? null,
        maxFollowUps: 1,
        scheduleMode: p.scheduleMode,
        titleCheck: p.titleCheck,
        titleFollowUp: p.titleFollowUp ?? null,
        metadata: asJson({}),
      },
      update: {
        timelineCategory: p.timelineCategory,
        defaultLeadDays: p.defaultLeadDays,
        outdatedLeadDays: p.outdatedLeadDays,
        followUpDays: p.followUpDays ?? null,
        scheduleMode: p.scheduleMode,
        titleCheck: p.titleCheck,
        titleFollowUp: p.titleFollowUp ?? null,
        metadata: asJson({}),
      },
    });
  }

  for (const o of OVERRIDES) {
    const existing = await client.timelineRuleOverride.findFirst({
      where: { bundleKey: o.bundleKey, triggerType: o.triggerType, triggerValue: o.triggerValue },
      select: { id: true },
    });
    if (existing) {
      await client.timelineRuleOverride.update({
        where: { id: existing.id },
        data: {
          urgencyBoost: o.urgencyBoost,
          maxBucket: o.maxBucket ?? null,
          followUpDaysOverride: o.followUpDaysOverride ?? null,
          active: true,
        },
      });
    } else {
      await client.timelineRuleOverride.create({
        data: {
          bundleKey: o.bundleKey,
          triggerType: o.triggerType,
          triggerValue: o.triggerValue,
          urgencyBoost: o.urgencyBoost,
          maxBucket: o.maxBucket ?? null,
          followUpDaysOverride: o.followUpDaysOverride ?? null,
          active: true,
        },
      });
    }
  }
}

