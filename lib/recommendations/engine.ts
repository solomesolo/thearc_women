import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { BundleKey, BundleStatus, EngineAProfileSnapshotLike, RecommendationRunVM, RecommendationResultVM, ScoreState } from "@/lib/recommendations/types";
import { BUNDLES, ENGINE_B_VERSION, bundleMeta } from "@/lib/recommendations/config";
import { evaluateRules, ruleContextFromSnapshot } from "@/lib/recommendations/rules";
import { resolveStatusAndRecencyAdjustment } from "@/lib/recommendations/recency";
import { matchProductsForBundle } from "@/lib/recommendations/productMatcher";

function initScoreStates(): Record<BundleKey, ScoreState> {
  const out = {} as Record<BundleKey, ScoreState>;
  for (const b of BUNDLES) {
    out[b.key] = { bundle_key: b.key, score: 0, reasons: new Set<string>(), events: [] };
  }
  return out;
}

function arr(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => String(x)) : [];
}

function lastTestsMap(snapshot: any): Record<string, any> {
  const lt = snapshot?.lastTests;
  if (lt && typeof lt === "object") return lt as Record<string, any>;
  return {};
}

export function runEngineBOnSnapshot(snapshot: EngineAProfileSnapshotLike): Array<{
  bundle_key: BundleKey;
  display_name: string;
  category: string;
  priority_score: number;
  status: BundleStatus;
  reasons: string[];
  events: Array<{ rule_key: string; bundle_key: BundleKey; score_delta: number; reason_code: string }>;
}> {
  const states = initScoreStates();
  const ctx = ruleContextFromSnapshot(snapshot);

  // Apply weighted rules → events per bundle
  for (const e of evaluateRules(ctx)) {
    const st = states[e.bundle_key];
    st.score += e.score_delta;
    st.reasons.add(e.reason_code);
    st.events.push(e);
  }

  // Recency adjustment + status
  const lt = lastTestsMap(snapshot);
  const recencyCtx = {
    risk_flags: ctx.risk_flags,
    condition_flags: ctx.condition_flags,
    medication_flags: ctx.medication_flags,
    family_history_flags: ctx.family_history_flags,
  };

  const results = (Object.values(states) as ScoreState[]).map((st) => {
    const last = (lt[st.bundle_key] ?? null) as any;
    const { status, score_delta, reason_code } = resolveStatusAndRecencyAdjustment({
      bundle: st.bundle_key,
      last_test: last,
      ctx: recencyCtx,
    });
    st.score += score_delta;
    st.reasons.add(reason_code);
    st.events.push({
      rule_key: `recency:${st.bundle_key}`,
      bundle_key: st.bundle_key,
      score_delta,
      reason_code,
    });

    // If score never got strong, and status is current, treat as optional (so it doesn't dominate UI)
    const meta = bundleMeta(st.bundle_key);
    const priority_score = Math.round(st.score);
    const finalStatus: BundleStatus =
      priority_score < meta.threshold && status === "current" ? "optional" : status;

    return {
      bundle_key: st.bundle_key,
      display_name: meta.display_name,
      category: meta.category,
      priority_score,
      status: finalStatus,
      reasons: Array.from(st.reasons),
      events: st.events,
    };
  });

  // Suppress low-value bundles
  const baselineKeep = new Set<BundleKey>(["vitamin_d", "iron_status", "thyroid_basic"]);
  const keepIfPrevention = ctx.goal_flags.includes("goal_prevention");

  const filtered = results.filter((r) => {
    const meta = bundleMeta(r.bundle_key);
    if (r.priority_score >= meta.threshold) return true;
    if (baselineKeep.has(r.bundle_key) && keepIfPrevention) return true;
    return false;
  });

  // Ranking: score desc, then missing/outdated/current/optional
  const statusRank: Record<BundleStatus, number> = { missing: 0, outdated: 1, current: 2, optional: 3 };
  filtered.sort((a, b) => {
    if (b.priority_score !== a.priority_score) return b.priority_score - a.priority_score;
    return statusRank[a.status] - statusRank[b.status];
  });

  return filtered;
}

export async function runAndPersistRecommendations(profileSnapshotId: string): Promise<RecommendationRunVM> {
  const snapshot = await prisma.profileSnapshot.findUnique({
    where: { id: profileSnapshotId },
  });
  if (!snapshot) throw new Error("profile_snapshot_not_found");

  const rawResults = runEngineBOnSnapshot(snapshot as any);

  // Attach product matches (deterministic using bundle_product_mapping)
  const withProducts: Array<RecommendationResultVM & { events: any[] }> = [];
  for (let i = 0; i < rawResults.length; i++) {
    const r = rawResults[i]!;
    const matched = await matchProductsForBundle(r.bundle_key, 3);
    withProducts.push({
      bundle_key: r.bundle_key,
      display_name: r.display_name,
      category: r.category,
      priority_rank: i + 1,
      priority_score: r.priority_score,
      status: r.status,
      reasons: r.reasons,
      matched_products: matched,
      events: r.events,
    });
  }

  const tests_to_action = withProducts.filter((r) => r.status === "missing" || r.status === "outdated").length;
  const overview_summary = {
    total_recommended: withProducts.length,
    missing_count: withProducts.filter((r) => r.status === "missing").length,
    outdated_count: withProducts.filter((r) => r.status === "outdated").length,
    current_count: withProducts.filter((r) => r.status === "current").length,
    optional_count: withProducts.filter((r) => r.status === "optional").length,
  };

  const payload: RecommendationRunVM = {
    engine_version: ENGINE_B_VERSION,
    profile_snapshot_id: profileSnapshotId,
    tests_to_action,
    top_priorities: withProducts.slice(0, 3),
    recommendations: withProducts,
    overview_summary,
  };

  // Persist run/results/events
  await prisma.$transaction(async (tx) => {
    const run = await tx.recommendationRun.create({
      data: {
        userEmail: snapshot.userEmail,
        profileSnapshotId: snapshot.id,
        engineVersion: ENGINE_B_VERSION,
      },
      select: { id: true },
    });

    for (const r of withProducts) {
      const rr = await tx.recommendationResult.create({
        data: {
          runId: run.id,
          userEmail: snapshot.userEmail,
          profileSnapshotId: snapshot.id,
          bundleKey: r.bundle_key,
          displayName: r.display_name,
          category: r.category,
          status: r.status,
          priorityScore: r.priority_score,
          priorityRank: r.priority_rank,
          reasonsJson: r.reasons as unknown as Prisma.InputJsonValue,
          matchedProductIds: r.matched_products.map((p) => p.product_id) as unknown as Prisma.InputJsonValue,
          explanationSeedJson: {} as Prisma.InputJsonValue,
        },
        select: { id: true },
      });

      for (const e of r.events) {
        await tx.recommendationScoreEvent.create({
          data: {
            recommendationResultId: rr.id,
            ruleKey: e.rule_key,
            bundleKey: e.bundle_key,
            scoreDelta: e.score_delta,
            reasonCode: e.reason_code,
            reasonPayload: (e.reason_payload ?? {}) as Prisma.InputJsonValue,
          },
        });
      }
    }
  });

  return payload;
}

