import "dotenv/config";
import { prisma } from "@/lib/db";

async function main() {
  const userEmail = (process.argv[2] ?? "annasolohere@gmail.com").trim().toLowerCase();

  const nav = await prisma.navigationEvent.findMany({
    where: { userEmail },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: { createdAt: true, requestedRoute: true, resolvedState: true, targetRoute: true, reason: true, isBlocking: true },
  });

  const rec = await prisma.recommendationInstance.findMany({
    where: { userEmail, active: true },
    take: 20,
    select: { id: true, bundleKey: true, profileSnapshotId: true, active: true, recommendedAt: true },
    orderBy: { recommendedAt: "desc" },
  });

  const profile = await prisma.profileSnapshot.findMany({
    where: { userEmail, isActive: true },
    take: 5,
    select: { id: true, sessionId: true },
    orderBy: { id: "desc" },
  });

  const resState = await prisma.userResultState.findUnique({
    where: { userEmail },
    select: { resultsSeenAt: true, dashboardReady: true, updatedAt: true },
  });

  const hs = await prisma.userHealthScore.findFirst({
    where: { userEmail },
    orderBy: { createdAt: "desc" },
    select: { score: true, createdAt: true },
  });

  const dash = await prisma.dashboardSummary.findFirst({
    where: { userEmail },
    orderBy: { generatedAt: "desc" },
    select: { version: true, generatedAt: true, payload: true },
  });

  console.log(
    JSON.stringify(
      {
        userEmail,
        profileActive: profile,
        recCount: rec.length,
        recSample: rec.slice(0, 5),
        resultState: resState,
        latestHealthScore: hs,
        dashboardSummary: dash ? { version: dash.version, generatedAt: dash.generatedAt, top_priorities: (dash.payload as any)?.top_priorities, kpis: (dash.payload as any)?.kpis } : null,
        latestNav: nav,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
  });

