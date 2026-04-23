import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const anonHeader = request.headers.get("x-arc-anon-id")?.trim() || null;
  const caller = session?.user?.email ?? (anonHeader ? `anon:${anonHeader}` : null);
  if (!caller) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  const latest = await prisma.questionnaireSession.findFirst({
    where: { userEmail: caller },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      status: true,
      lastStepNumber: true,
      questionnaireDefinition: { select: { version: true } },
      _count: { select: { answers: true } },
    },
  });

  return Response.json({
    session: latest
      ? {
          session_id: latest.id,
          status: latest.status,
          // Self-heal: some older sessions were created with last_step_number=1 even before any answers were saved.
          last_step_number: latest._count.answers === 0 ? 0 : latest.lastStepNumber ?? 0,
          version: latest.questionnaireDefinition.version,
        }
      : null,
  });
}

