import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { BundleKey, Evidence, EvidenceSource, StatusEngineOutput, UserAction } from "@/lib/status-engine/statusTypes";
import { effectiveIntervalMonths, type ProfileSignals } from "@/lib/status-engine/intervalPolicies";
import { pickLatestTrustedEvidence } from "@/lib/status-engine/evidenceResolver";
import { classifyRecency } from "@/lib/status-engine/recencyClassifier";
import { resolveExecutionStatus } from "@/lib/status-engine/executionStateResolver";
import { resolveFinalStatus } from "@/lib/status-engine/finalStatusResolver";

export const ENGINE_C_VERSION = "engine_c_v1";

function arr(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => String(x)) : [];
}

function toBundleKey(k: string): BundleKey {
  return k as BundleKey;
}

function dateFromRecencyCode(code: string | null | undefined, now = new Date()): Date | null {
  if (!code) return null;
  const months =
    code === "lt_3m" ? 2 :
    code === "3_6m" ? 4.5 :
    code === "6_12m" ? 9 :
    code === "gt_12m" ? 18 :
    18;
  const d = new Date(now);
  d.setMonth(d.getMonth() - Math.round(months));
  return d;
}

function evidencePriorityRank(src: EvidenceSource): number {
  const order: EvidenceSource[] = [
    "lab_result_verified",
    "ocr_parsed_result",
    "manual_result_entry",
    "questionnaire_last_test",
    "self_reported_completion",
    "user_marked_planned",
  ];
  return order.indexOf(src);
}

export async function recalculateStatusesForUser(params: { userEmail: string; profileSnapshotId?: string }) : Promise<StatusEngineOutput> {
  const { userEmail } = params;
  const profileSnapshot =
    params.profileSnapshotId
      ? await prisma.profileSnapshot.findUnique({ where: { id: params.profileSnapshotId } })
      : await prisma.profileSnapshot.findFirst({ where: { userEmail, isActive: true }, orderBy: { createdAt: "desc" } });
  if (!profileSnapshot) throw new Error("profile_snapshot_not_found");

  // Ensure we have recommendations to status-ify: take latest recommendation run for this snapshot.
  const latestRun = await prisma.recommendationRun.findFirst({
    where: { userEmail, profileSnapshotId: profileSnapshot.id },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (!latestRun) {
    // Engine C doesn't generate recommendations; return empty payload.
    return { by_bundle: {}, dashboard_counts: { tests_to_action: 0, planned: 0, completed: 0, current: 0 } };
  }

  const recs = await prisma.recommendationResult.findMany({
    where: { runId: latestRun.id },
    select: { id: true, bundleKey: true, priorityScore: true },
  });

  // Create/update recommendation instances (1 per bundle per profile snapshot).
  const instances = await prisma.$transaction(async (tx) => {
    const out: Array<{ id: string; bundleKey: string }> = [];
    for (const r of recs) {
      const existing = await tx.recommendationInstance.findFirst({
        where: { userEmail, profileSnapshotId: profileSnapshot.id, bundleKey: r.bundleKey },
        select: { id: true },
      });
      const row = existing
        ? await tx.recommendationInstance.update({
            where: { id: existing.id },
            data: {
              sourceRecommendationResultId: r.id,
              priorityScore: r.priorityScore,
              active: true,
            },
            select: { id: true, bundleKey: true },
          })
        : await tx.recommendationInstance.create({
            data: {
              userEmail,
              profileSnapshotId: profileSnapshot.id,
              bundleKey: r.bundleKey,
              sourceRecommendationResultId: r.id,
              priorityScore: r.priorityScore,
              active: true,
            },
            select: { id: true, bundleKey: true },
          });
      out.push(row);
    }
    return out;
  });

  // Build evidence list:
  // - existing evidence rows
  // - questionnaire last_tests from profile snapshot (as weak evidence)
  const evidenceRows = await prisma.userTestEvidence.findMany({
    where: { userEmail },
    select: { bundleKey: true, evidenceSource: true, evidenceDate: true, rawRecencyCode: true, confidenceScore: true },
  });
  const evidence: Evidence[] = evidenceRows.map((e) => ({
    bundle_key: toBundleKey(e.bundleKey),
    evidence_source: e.evidenceSource as EvidenceSource,
    evidence_date: e.evidenceDate,
    raw_recency_code: e.rawRecencyCode,
    confidence_score: Number(e.confidenceScore),
  }));

  const lastTests = (profileSnapshot.lastTests ?? {}) as Record<string, string | null>;
  for (const [bundleKey, code] of Object.entries(lastTests)) {
    const dt = dateFromRecencyCode(code, new Date());
    if (!dt) continue;
    evidence.push({
      bundle_key: toBundleKey(bundleKey),
      evidence_source: "questionnaire_last_test",
      evidence_date: dt,
      raw_recency_code: code,
      confidence_score: 0.6,
    });
  }

  // Actions
  const actionRows = await prisma.userRecommendationAction.findMany({
    where: { userEmail },
    orderBy: { actionAt: "desc" },
    select: { bundleKey: true, actionType: true, actionAt: true },
  });
  const actions: UserAction[] = actionRows.map((a) => ({
    bundle_key: toBundleKey(a.bundleKey),
    action_type: a.actionType as any,
    action_at: a.actionAt,
  }));

  const profileSignals: ProfileSignals = {
    age_group: profileSnapshot.ageGroup ?? null,
    life_stage: profileSnapshot.lifeStage ?? null,
    goal_flags: arr(profileSnapshot.goalFlags),
    risk_flags: arr(profileSnapshot.riskFlags),
    condition_flags: arr(profileSnapshot.conditionFlags),
    medication_flags: arr(profileSnapshot.medicationFlags),
    family_history_flags: arr(profileSnapshot.familyHistoryFlags),
    lifestyle_flags: arr(profileSnapshot.lifestyleFlags),
  };

  const by_bundle: StatusEngineOutput["by_bundle"] = {};
  const now = new Date();

  // Persist snapshots per instance.
  await prisma.$transaction(async (tx) => {
    for (const inst of instances) {
      const bundle = toBundleKey(inst.bundleKey);
      const interval = effectiveIntervalMonths(bundle, profileSignals);
      const latestEvidence = pickLatestTrustedEvidence(bundle, evidence);
      const recency = classifyRecency(latestEvidence?.evidence_date ?? null, interval, now);
      const execution = resolveExecutionStatus(bundle, actions, now);
      const { final_status, state_group } = resolveFinalStatus(recency, execution);

      const evidence_source_used = latestEvidence?.evidence_source ?? null;
      const evidence_date_used = latestEvidence?.evidence_date ?? null;

      const payload = {
        evidence_priority_rank: evidence_source_used ? evidencePriorityRank(evidence_source_used as EvidenceSource) : null,
        raw_recency_code: latestEvidence?.raw_recency_code ?? null,
      };

      await tx.statusSnapshot.create({
        data: {
          userEmail,
          recommendationInstanceId: inst.id,
          bundleKey: bundle,
          recencyStatus: recency,
          executionStatus: execution,
          finalStatus: final_status,
          stateGroup: state_group,
          effectiveIntervalMonths: interval,
          evidenceSourceUsed: evidence_source_used,
          evidenceDateUsed: evidence_date_used,
          engineVersion: ENGINE_C_VERSION,
          statusPayload: payload as unknown as Prisma.InputJsonValue,
        },
      });

      by_bundle[bundle] = {
        recency_status: recency,
        execution_status: execution,
        final_status,
        state_group,
        effective_interval_months: interval,
        evidence_source_used: (evidence_source_used as EvidenceSource) ?? undefined,
        evidence_date_used: evidence_date_used ? evidence_date_used.toISOString().slice(0, 10) : undefined,
      };
    }
  });

  const vals = Object.values(by_bundle);
  const dashboard_counts = {
    tests_to_action: vals.filter((s) => s.final_status === "missing" || s.final_status === "outdated").length,
    planned: vals.filter((s) => s.final_status === "planned").length,
    completed: vals.filter((s) => s.final_status === "completed").length,
    current: vals.filter((s) => s.final_status === "current").length,
  };

  return { by_bundle, dashboard_counts };
}

