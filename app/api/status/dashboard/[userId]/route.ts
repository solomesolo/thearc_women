import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  const session = await getServerSession(authOptions);
  const anonHeader = request.headers.get("x-arc-anon-id")?.trim() || null;
  const caller = session?.user?.email ?? (anonHeader ? `anon:${anonHeader}` : null);
  if (!caller) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  const { userId } = await context.params;
  const requested = decodeURIComponent(userId).trim().toLowerCase();
  if (!requested || requested !== caller) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  const rows = await prisma.statusSnapshot.findMany({
    where: { userEmail: requested },
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

