import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

function resumeStepFromLastStepNumber(lastStepNumber: number | null | undefined) {
  const n = typeof lastStepNumber === "number" ? lastStepNumber : 0;
  // last_step_number is the last completed step (1..4).
  if (n <= 0) return "basics";
  if (n === 1) return "lifestyle";
  if (n === 2) return "health-context";
  if (n === 3) return "test-history";
  return "test-history"; // step 4 = all steps done, resume at last step before bootstrap
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  const email = session.user.email;
  const active = await prisma.profileSnapshot.findFirst({
    where: { userEmail: email, isActive: true },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  const latestSession = await prisma.questionnaireSession.findFirst({
    where: { userEmail: email, status: "in_progress" },
    orderBy: { updatedAt: "desc" },
    select: { id: true, lastStepNumber: true },
  });

  return Response.json({
    has_completed_profile: Boolean(active),
    has_incomplete_session: Boolean(latestSession),
    resume_step: latestSession ? resumeStepFromLastStepNumber(latestSession.lastStepNumber) : null,
    session_id: latestSession?.id ?? null,
  });
}

