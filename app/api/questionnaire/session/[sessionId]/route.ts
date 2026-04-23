import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest, context: { params: Promise<{ sessionId: string }> }) {
  const session = await getServerSession(authOptions);
  const anonHeader = request.headers.get("x-arc-anon-id")?.trim() || null;
  const caller = session?.user?.email ?? (anonHeader ? `anon:${anonHeader}` : null);

  const { sessionId } = await context.params;
  const sess = await prisma.questionnaireSession.findUnique({
    where: { id: sessionId },
    select: { id: true, userEmail: true, status: true, lastStepNumber: true, questionnaireDefinition: { select: { version: true } } },
  });
  if (!sess || !caller || sess.userEmail !== caller) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  }

  const answers = await prisma.questionnaireAnswer.findMany({
    where: { sessionId },
    select: { questionKey: true, answerValue: true },
  });
  const answerMap = Object.fromEntries(answers.map((a) => [a.questionKey, a.answerValue]));

  return Response.json({
    session: {
      session_id: sess.id,
      status: sess.status,
      // Self-heal: if no answers exist yet, treat session as starting at step 0.
      last_step_number: answers.length === 0 ? 0 : sess.lastStepNumber ?? 0,
      version: sess.questionnaireDefinition.version,
      answers: answerMap,
    },
  });
}

