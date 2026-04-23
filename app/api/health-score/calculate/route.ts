import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureHealthScoreSeed, HEALTH_SCORE_POLICY_KEY } from "@/lib/health-score-engine/seed";
import { calculateHealthScore } from "@/lib/health-score-engine/healthScoreEngine";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const anonHeader = request.headers.get("x-arc-anon-id")?.trim() || null;
  const caller = session?.user?.email ?? (anonHeader ? `anon:${anonHeader}` : null);
  if (!caller) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  const body = (await request.json().catch(() => null)) as any;
  const policy_key = typeof body?.policy_key === "string" ? body.policy_key : HEALTH_SCORE_POLICY_KEY;

  try {
    await ensureHealthScoreSeed();
    const output = await calculateHealthScore({ userEmail: caller, policyKey: policy_key });

    const policy = await prisma.healthScorePolicy.findUnique({
      where: { policyKey: policy_key },
      select: { id: true, policyKey: true },
    });
    if (!policy) throw new Error("Policy not found");

    const saved = await prisma.userHealthScore.create({
      data: {
        userEmail: caller,
        profileSnapshotId: output.profileSnapshotId,
        policyId: policy.id,
        score: output.score,
        denominatorTotal: output.denominator_total,
        numeratorTotal: output.numerator_total,
        bundleCount: output.bundle_count,
        scoreBand: output.band,
        payload: output as any,
      },
      select: { id: true },
    });

    for (const b of output.bundle_breakdown) {
      await prisma.userBundleScoreInstance.create({
        data: {
          userEmail: caller,
          profileSnapshotId: output.profileSnapshotId,
          healthScoreId: saved.id,
          bundleKey: b.bundle_key,
          status: b.status,
          baseWeight: b.base_weight,
          relevanceWeight: b.relevance_weight,
          statusMultiplier: b.status_multiplier,
          coverageRatio: b.coverage_ratio,
          denominatorWeight: b.denominator_weight,
          numeratorValue: b.numerator_value,
          rationale: { factors: b.rationale } as any,
        },
      });
    }

    return Response.json({
      score: output.score,
      method: output.method,
      band: output.band,
      kpi_label: `${output.score}% completeness`,
      widget: {
        score: output.score,
        subtitle: "Based on your current health data",
      },
      summary: {
        denominator_total: output.denominator_total,
        numerator_total: output.numerator_total,
        bundle_count: output.bundle_count,
      },
      top_gaps: output.top_gaps,
      bundle_breakdown: output.bundle_breakdown,
    });
  } catch (err: any) {
    const message = err?.message ?? "Failed to calculate health score";
    if (String(message).includes("No active profile snapshot")) {
      return Response.json({
        score: 0,
        method: HEALTH_SCORE_POLICY_KEY,
        band: "low",
        kpi_label: "0% completeness",
        widget: { score: 0, subtitle: "Complete your assessment to see your score" },
        summary: { denominator_total: 0, numerator_total: 0, bundle_count: 0 },
        top_gaps: [],
        bundle_breakdown: [],
      });
    }
    return new Response(JSON.stringify({ error: err?.message ?? "Failed to calculate health score" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

