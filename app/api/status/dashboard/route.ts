import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }
  const userEmail = session.user.email;

  // Read latest status snapshot per bundle for this user.
  const rows = await prisma.statusSnapshot.findMany({
    where: { userEmail },
    orderBy: [{ calculatedAt: "desc" }],
    take: 500,
    select: {
      bundleKey: true,
      recencyStatus: true,
      executionStatus: true,
      finalStatus: true,
      stateGroup: true,
      effectiveIntervalMonths: true,
      evidenceSourceUsed: true,
      evidenceDateUsed: true,
      calculatedAt: true,
    },
  });

  const byBundle: Record<string, any> = {};
  for (const r of rows) {
    if (byBundle[r.bundleKey]) continue;
    byBundle[r.bundleKey] = {
      recency_status: r.recencyStatus,
      execution_status: r.executionStatus,
      final_status: r.finalStatus,
      state_group: r.stateGroup,
      effective_interval_months: r.effectiveIntervalMonths,
      evidence_source_used: r.evidenceSourceUsed ?? undefined,
      evidence_date_used: r.evidenceDateUsed ? r.evidenceDateUsed.toISOString().slice(0, 10) : undefined,
      calculated_at: r.calculatedAt.toISOString(),
    };
  }

  const vals = Object.values(byBundle) as Array<{ final_status: string }>;
  const dashboard_counts = {
    tests_to_action: vals.filter((s) => s.final_status === "missing" || s.final_status === "outdated").length,
    planned: vals.filter((s) => s.final_status === "planned").length,
    completed: vals.filter((s) => s.final_status === "completed").length,
    current: vals.filter((s) => s.final_status === "current").length,
  };

  return Response.json({ by_bundle: byBundle, dashboard_counts });
}

