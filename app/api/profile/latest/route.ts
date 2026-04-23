import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const anonHeader = request.headers.get("x-arc-anon-id")?.trim() || null;
  const authEmail = session?.user?.email ?? null;
  const anonEmail = anonHeader ? `anon:${anonHeader}` : null;
  const caller = authEmail ?? anonEmail;
  if (!caller) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  // Prefer logged-in snapshot; fall back to browser anon snapshot and claim it.
  const snap =
    (authEmail
      ? await prisma.profileSnapshot.findFirst({
          where: { userEmail: authEmail, isActive: true },
          orderBy: { createdAt: "desc" },
        })
      : null) ??
    (anonEmail
      ? await prisma.profileSnapshot.findFirst({
          where: { userEmail: anonEmail, isActive: true },
          orderBy: { createdAt: "desc" },
        })
      : null);

  if (snap && authEmail && snap.userEmail.startsWith("anon:") && snap.userEmail !== authEmail) {
    await prisma.profileSnapshot.update({ where: { id: snap.id }, data: { userEmail: authEmail } });
  }
  if (!snap) return Response.json({ profile_snapshot_id: null, profile: null });

  // Return aligned response shape (profile_summary labels preferred by UI).
  const summary = (snap.profileSummary ?? {}) as any;
  return Response.json({
    profile_snapshot_id: snap.id,
    profile: {
      user_name: snap.userName ?? authEmail ?? caller,
      country: snap.country ?? "DE",
      age_group: snap.ageGroup,
      life_stage: snap.lifeStage,
      profile_completeness_percent: snap.profileCompletenessPercent ?? 0,
      retake_state: snap.retakeState ?? null,
      goal_flags: (snap.goalFlags ?? []) as any,
      risk_flags: (snap.riskFlags ?? []) as any,
      condition_flags: (snap.conditionFlags ?? []) as any,
      medication_flags: (snap.medicationFlags ?? []) as any,
      family_history_flags: (snap.familyHistoryFlags ?? []) as any,
      lifestyle_flags: (snap.lifestyleFlags ?? []) as any,
      last_tests: (snap.lastTests ?? {}) as any,
      profile_summary: {
        age_group_label: summary.age_group_label ?? snap.ageGroupLabel ?? null,
        life_stage_label: summary.life_stage_label ?? snap.lifeStageLabel ?? null,
        goals_label: summary.goals_label ?? null,
      },
    },
  });
}

