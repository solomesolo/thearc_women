import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

type Body = {
  // New contract (preferred)
  answers?: Array<{ question_key: string; answer_value: unknown }>;
  last_step_number?: number;
  // Back-compat (single answer)
  question_key?: string;
  answer_value?: unknown;
};

export async function POST(request: NextRequest, context: { params: Promise<{ sessionId: string }> }) {
  const session = await getServerSession(authOptions);
  const anonHeader = request.headers.get("x-arc-anon-id")?.trim() || null;
  const caller = session?.user?.email ?? (anonHeader ? `anon:${anonHeader}` : null);

  const { sessionId } = await context.params;
  const body = (await request.json().catch(() => null)) as Body | null;
  const answers =
    Array.isArray(body?.answers) && body?.answers?.length
      ? body.answers
      : body?.question_key
        ? [{ question_key: body.question_key, answer_value: body.answer_value }]
        : [];
  if (answers.length === 0) {
    return new Response(JSON.stringify({ error: "Missing question_key" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const sess = await prisma.questionnaireSession.findUnique({
    where: { id: sessionId },
    select: { id: true, userEmail: true, status: true, lastStepNumber: true },
  });
  if (!sess || !caller || sess.userEmail !== caller) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (sess.status !== "in_progress") {
    return new Response(JSON.stringify({ error: "Session not in progress" }), {
      status: 409,
      headers: { "Content-Type": "application/json" },
    });
  }

  const updated: Array<{ question_key: string }> = [];
  for (const a of answers) {
    if (!a?.question_key) continue;
    const existing = await prisma.questionnaireAnswer.findFirst({
      where: { sessionId, questionKey: a.question_key },
      select: { id: true },
    });
    if (existing) {
      await prisma.questionnaireAnswer.update({
        where: { id: existing.id },
        data: { answerValue: a.answer_value as Prisma.InputJsonValue },
      });
    } else {
      await prisma.questionnaireAnswer.create({
        data: {
          sessionId,
          questionKey: a.question_key,
          answerValue: a.answer_value as Prisma.InputJsonValue,
        },
      });
    }
    updated.push({ question_key: a.question_key });
  }

  const lastStep = typeof body?.last_step_number === "number" ? body.last_step_number : null;
  await prisma.questionnaireSession.update({
    where: { id: sessionId },
    data: {
      updatedAt: new Date(),
      lastStepNumber: lastStep != null ? lastStep : sess.lastStepNumber ?? 0,
    },
  });

  return Response.json({ ok: true, updated, last_step_number: lastStep ?? sess.lastStepNumber ?? 0 });
}

