import "dotenv/config";
import { prisma } from "@/lib/db";
import { ensureHealthScoreSeed, HEALTH_SCORE_POLICY_KEY } from "@/lib/health-score-engine/seed";
import { calculateHealthScore } from "@/lib/health-score-engine/healthScoreEngine";

async function main() {
  const userEmail = (process.argv[2] ?? "annasolohere@gmail.com").trim().toLowerCase();
  const policyKey = (process.argv[3] ?? HEALTH_SCORE_POLICY_KEY).trim();

  await ensureHealthScoreSeed();
  const output = await calculateHealthScore({ userEmail, policyKey });

  const policy = await prisma.healthScorePolicy.findUnique({
    where: { policyKey },
    select: { id: true },
  });
  if (!policy) throw new Error("Policy not found");

  const saved = await prisma.userHealthScore.create({
    data: {
      userEmail,
      profileSnapshotId: output.profileSnapshotId,
      policyId: policy.id,
      score: output.score,
      denominatorTotal: output.denominator_total,
      numeratorTotal: output.numerator_total,
      bundleCount: output.bundle_count,
      scoreBand: output.band,
      payload: output as any,
    },
    select: { id: true, score: true },
  });

  console.log(JSON.stringify({ userEmail, policyKey, score: saved.score, healthScoreId: saved.id }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
  });

