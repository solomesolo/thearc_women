import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { generateTagsFromProfile } from "@/lib/generatedTags";

type Body = {
  lifeStage?: string | null;
  cyclePattern?: string | null;
  goals?: string[];
  symptoms?: string[];
  riskFactors?: string[];
  trainingVolume?: string | number | null;
  stressLevel?: string | number | null;
  /** Full Arc intake responses (variable_id -> value); used when present to populate profile + store raw */
  surveyResponses?: Record<string, unknown>;
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const email = session.user.email;
  const raw = body.surveyResponses as Record<string, unknown> | undefined;
  const goals = Array.isArray(body.goals) ? body.goals : [];
  const symptoms = Array.isArray(body.symptoms) ? body.symptoms : [];
  const riskFactors = Array.isArray(body.riskFactors) ? body.riskFactors : [];
  const profile = {
    lifeStage: body.lifeStage ?? (raw?.life_stage != null ? String(raw.life_stage) : null),
    cyclePattern: body.cyclePattern ?? (raw?.cycle_regular != null ? String(raw.cycle_regular) : null),
    goals,
    symptoms,
    riskFactors,
    trainingVolume: body.trainingVolume != null ? String(body.trainingVolume) : (raw?.exercise_days != null ? String(raw.exercise_days) : null),
    stressLevel: body.stressLevel != null ? String(body.stressLevel) : (raw?.stress_level != null ? String(raw.stress_level) : null),
    surveyResponses: raw ?? null,
  };
  const generatedTags = generateTagsFromProfile(profile);

  await prisma.userProfile.upsert({
    where: { email },
    create: {
      email,
      lifeStage: profile.lifeStage,
      cyclePattern: profile.cyclePattern,
      goals: profile.goals,
      symptoms: profile.symptoms,
      riskFactors: profile.riskFactors,
      trainingVolume: profile.trainingVolume,
      stressLevel: profile.stressLevel,
      generatedTags,
      surveyResponses: profile.surveyResponses != null ? (profile.surveyResponses as Prisma.InputJsonValue) : undefined,
      updatedAt: new Date(),
    },
    update: {
      lifeStage: profile.lifeStage,
      cyclePattern: profile.cyclePattern,
      goals: profile.goals,
      symptoms: profile.symptoms,
      riskFactors: profile.riskFactors,
      trainingVolume: profile.trainingVolume,
      stressLevel: profile.stressLevel,
      generatedTags,
      surveyResponses: profile.surveyResponses != null ? (profile.surveyResponses as Prisma.InputJsonValue) : undefined,
      updatedAt: new Date(),
    },
  });

  return Response.json({ ok: true, generatedTags });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const profile = await prisma.userProfile.findUnique({
    where: { email: session.user.email },
  });
  if (!profile) return Response.json({ profile: null });
  return Response.json({
    profile: {
      lifeStage: profile.lifeStage,
      cyclePattern: profile.cyclePattern,
      goals: profile.goals,
      symptoms: profile.symptoms,
      riskFactors: profile.riskFactors,
      trainingVolume: profile.trainingVolume,
      stressLevel: profile.stressLevel,
      generatedTags: profile.generatedTags,
    },
  });
}
