import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type { NormalizedProfile, RawQuestionnaireAnswers } from "@/lib/profile-engine-a/types";
import { normalizeLastTests, normalizeRawAnswers, uniq } from "@/lib/profile-engine-a/normalizers";
import {
  AGE_GROUP_LABELS,
  AGE_GROUP_RULES,
  CYCLE_PATTERN_RULES,
  CONDITION_RULES,
  DIET_RULES,
  FAMILY_HISTORY_RULES,
  GOAL_FLAG_BY_OPTION,
  GOAL_LABEL_BY_FLAG,
  GOAL_RULES_BY_FLAG,
  LIFE_STAGE_LABELS,
  LIFE_STAGE_RULES,
  LIFESTYLE_CONTEXT_RULES,
  MEDICATION_RULES,
  SUN_EXPOSURE_RULES,
  SYMPTOM_RULES,
  type RuleOutputs,
} from "@/lib/profile-engine-a/mappings";

function addWeights(target: Record<string, number>, add: Record<string, number> | undefined) {
  if (!add) return;
  for (const [k, w] of Object.entries(add)) {
    if (!w) continue;
    target[k] = (target[k] ?? 0) + w;
  }
}

function applyRule(out: {
  risk_flags: string[];
  lifestyle_flags: string[];
  condition_flags: string[];
  medication_flags: string[];
  family_history_flags: string[];
  domain_affinities: Record<string, number>;
  bundle_affinities: Record<string, number>;
}, rule: RuleOutputs | undefined) {
  if (!rule) return;
  if (rule.addRiskFlags) out.risk_flags.push(...rule.addRiskFlags);
  if (rule.addLifestyleFlags) out.lifestyle_flags.push(...rule.addLifestyleFlags);
  if (rule.addConditionFlags) out.condition_flags.push(...rule.addConditionFlags);
  if (rule.addMedicationFlags) out.medication_flags.push(...rule.addMedicationFlags);
  if (rule.addFamilyHistoryFlags) out.family_history_flags.push(...rule.addFamilyHistoryFlags);
  addWeights(out.domain_affinities, rule.addDomainWeights as Record<string, number> | undefined);
  addWeights(out.bundle_affinities, rule.addBundleWeights as Record<string, number> | undefined);
}

export function buildProfileFromAnswers(userName: string, raw: RawQuestionnaireAnswers): NormalizedProfile {
  const normalized = normalizeRawAnswers(raw);

  const goal_flags = uniq((normalized.goals ?? []).map((g) => GOAL_FLAG_BY_OPTION[g]).filter(Boolean));
  const goal_labels = goal_flags.map((f) => GOAL_LABEL_BY_FLAG[f]).filter(Boolean);

  // "Germany" → "DE", "United Kingdom" → "GB", anything else kept as-is.
  const rawCountry = normalized.country ?? null;
  const country =
    rawCountry === "Germany" ? "DE"
    : rawCountry === "United Kingdom" ? "GB"
    : rawCountry;

  const age_group = normalized.age_range ?? null;
  const age_group_label = age_group ? (AGE_GROUP_LABELS[age_group] ?? null) : null;

  const life_stage = normalized.life_stage ?? null;
  const life_stage_label = life_stage ? (LIFE_STAGE_LABELS[life_stage] ?? null) : null;

  const state = {
    risk_flags: [] as string[],
    lifestyle_flags: [] as string[],
    condition_flags: [] as string[],
    medication_flags: [] as string[],
    family_history_flags: [] as string[],
    domain_affinities: {} as Record<string, number>,
    bundle_affinities: {} as Record<string, number>,
  };

  if (age_group) applyRule(state, AGE_GROUP_RULES[age_group]);
  if (life_stage) applyRule(state, LIFE_STAGE_RULES[life_stage]);
  if (normalized.cycle_pattern) applyRule(state, CYCLE_PATTERN_RULES[normalized.cycle_pattern]);
  if (normalized.sun_exposure) applyRule(state, SUN_EXPOSURE_RULES[normalized.sun_exposure]);

  for (const f of goal_flags) applyRule(state, GOAL_RULES_BY_FLAG[f]);
  for (const s of normalized.symptoms ?? []) {
    if (s === "none") continue;
    applyRule(state, SYMPTOM_RULES[s]);
  }
  for (const d of normalized.diet_pattern ?? []) {
    if (d === "none") continue;
    applyRule(state, DIET_RULES[d]);
  }
  for (const l of normalized.lifestyle_context ?? []) {
    if (l === "none") continue;
    applyRule(state, LIFESTYLE_CONTEXT_RULES[l]);
  }
  for (const c of normalized.known_conditions ?? []) {
    if (c === "none" || c === "prefer_not_to_say") continue;
    applyRule(state, CONDITION_RULES[c]);
  }
  for (const m of normalized.medications_or_hormones ?? []) {
    if (m === "none") continue;
    applyRule(state, MEDICATION_RULES[m]);
  }
  for (const fh of normalized.family_history ?? []) {
    if (fh === "none_known") continue;
    applyRule(state, FAMILY_HISTORY_RULES[fh]);
  }

  // Dedup and precedence rules
  const risk_flags = uniq(state.risk_flags);
  if (risk_flags.includes("very_low_sun_exposure") && risk_flags.includes("low_sun_exposure")) {
    // keep both in lifestyle_flags, but de-noise risk_flags
    // (very_low implies low; keep only the stronger one)
    const idx = risk_flags.indexOf("low_sun_exposure");
    if (idx >= 0) risk_flags.splice(idx, 1);
  }

  const lifestyle_flags = uniq(state.lifestyle_flags);
  const condition_flags = uniq(state.condition_flags);
  const medication_flags = uniq(state.medication_flags);
  const family_history_flags = uniq(state.family_history_flags);

  const { last_tests, recency_hints } = normalizeLastTests(normalized.last_tests);

  const requiredKeys: Array<keyof RawQuestionnaireAnswers> = [
    "age_range",
    "life_stage",
    "goals",
    "symptoms",
    "sun_exposure",
    "known_conditions",
    "family_history",
    "last_tests",
  ];
  const completed = requiredKeys.filter((k) => {
    const v = normalized[k];
    if (v == null) return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "object") return Object.keys(v as object).length > 0;
    return String(v).trim().length > 0;
  }).length;
  const profile_completeness_percent = Math.round((completed / requiredKeys.length) * 100);

  const profile_summary = {
    age_group_label,
    life_stage_label,
    goals_label: goal_labels.join(", "),
  };

  return {
    user_name: userName,
    country,
    age_group,
    age_group_label,
    life_stage,
    life_stage_label,
    goal_flags,
    goal_labels,
    risk_flags,
    condition_flags,
    medication_flags,
    family_history_flags,
    lifestyle_flags,
    domain_affinities: state.domain_affinities,
    bundle_affinities: state.bundle_affinities,
    last_tests,
    recency_hints,
    profile_completeness_percent,
    retake_state: "not_needed",
    profile_summary,
    raw_profile: normalized,
  };
}

export async function getDisplayNameForUser(email: string): Promise<string> {
  // Demo accounts (credentials) won't exist in app_users; fall back to email.
  try {
    const u = await prisma.appUser.findUnique({ where: { email } });
    return u?.name?.trim() ? u.name.trim() : email;
  } catch {
    return email;
  }
}

export async function computeRetakeStateForUser(userEmail: string) {
  const incomplete = await prisma.questionnaireSession.findFirst({
    where: { userEmail, status: "in_progress" },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  if (incomplete) return "incomplete_assessment_exists" as const;

  const active = await prisma.profileSnapshot.findFirst({
    where: { userEmail, isActive: true },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (!active?.createdAt) return "not_needed" as const;

  const ageDays = (Date.now() - active.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays > 90) return "recommended_after_90_days" as const;

  return "not_needed" as const;
}

function snapshotDiffFields(prev: any, curr: any): string[] {
  const changed: string[] = [];
  const keys = [
    "ageGroup",
    "lifeStage",
    "goalFlags",
    "riskFlags",
    "conditionFlags",
    "medicationFlags",
    "familyHistoryFlags",
    "lifestyleFlags",
    "domainAffinities",
    "bundleAffinities",
    "lastTests",
  ];
  for (const k of keys) {
    const a = JSON.stringify(prev?.[k] ?? null);
    const b = JSON.stringify(curr?.[k] ?? null);
    if (a !== b) changed.push(k);
  }
  return changed;
}

export async function buildAndPersistProfileSnapshot(params: { sessionId: string; userEmail: string; questionnaireVersion: string }) {
  const { sessionId, userEmail, questionnaireVersion } = params;
  const answers = await prisma.questionnaireAnswer.findMany({
    where: { sessionId },
    select: { questionKey: true, answerValue: true },
  });

  const raw: RawQuestionnaireAnswers = {};
  for (const a of answers) {
    (raw as any)[a.questionKey] = a.answerValue as any;
  }

  const userName = await getDisplayNameForUser(userEmail);
  const built = buildProfileFromAnswers(userName, raw);

  const retake_state = await computeRetakeStateForUser(userEmail);
  built.retake_state = retake_state;

  return await prisma.$transaction(async (tx) => {
    const prev = await tx.profileSnapshot.findFirst({
      where: { userEmail, isActive: true },
      orderBy: { createdAt: "desc" },
    });

    // Never overwrite; deactivate previous active snapshots.
    await tx.profileSnapshot.updateMany({
      where: { userEmail, isActive: true },
      data: { isActive: false },
    });

    const snapshot = await tx.profileSnapshot.create({
      data: {
        userEmail,
        sessionId,
        questionnaireVersion,
        isActive: true,
        country: built.country ?? "DE",
        userName: built.user_name,
        ageGroup: built.age_group,
        ageGroupLabel: built.age_group_label,
        lifeStage: built.life_stage,
        lifeStageLabel: built.life_stage_label,
        goalFlags: built.goal_flags,
        goalLabels: built.goal_labels,
        riskFlags: built.risk_flags,
        conditionFlags: built.condition_flags,
        medicationFlags: built.medication_flags,
        familyHistoryFlags: built.family_history_flags,
        lifestyleFlags: built.lifestyle_flags,
        domainAffinities: built.domain_affinities,
        bundleAffinities: built.bundle_affinities,
        lastTests: built.last_tests,
        recencyHints: built.recency_hints,
        profileCompletenessPercent: built.profile_completeness_percent,
        retakeState: built.retake_state,
        profileSummary: built.profile_summary as Prisma.InputJsonValue,
        rawProfile: built.raw_profile as Prisma.InputJsonValue,
      },
    });

    if (prev) {
      const changedFields = snapshotDiffFields(prev, snapshot);
      await tx.profileSnapshotDiff.create({
        data: {
          userEmail,
          previousSnapshotId: prev.id,
          currentSnapshotId: snapshot.id,
          changedFields,
        },
      });
    }

    // Mark session completed.
    await tx.questionnaireSession.update({
      where: { id: sessionId },
      data: { status: "completed", completedAt: new Date(), updatedAt: new Date() },
    });

    return { snapshot, profile: built };
  });
}

