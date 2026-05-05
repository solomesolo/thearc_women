import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const email = session.user.email;
  const prisma = getPrisma();

  const [user, profile, snapshot, settings, consent] = await Promise.all([
    prisma.appUser.findUnique({ where: { email }, select: { email: true, name: true, createdAt: true } }),
    prisma.userProfile.findUnique({ where: { email }, select: { lifeStage: true, goals: true } }),
    prisma.profileSnapshot.findFirst({ where: { userEmail: email, isActive: true }, select: { ageGroup: true, ageGroupLabel: true, lifeStage: true, lifeStageLabel: true, goalLabels: true }, orderBy: { createdAt: "desc" } }),
    prisma.userSettings.findUnique({ where: { userEmail: email } }),
    prisma.userConsent.findUnique({ where: { userEmail: email } }),
  ]);

  return NextResponse.json({
    user: user ?? { email, name: null, createdAt: null },
    profile: {
      lifeStage: snapshot?.lifeStageLabel ?? profile?.lifeStage ?? null,
      ageGroup: snapshot?.ageGroupLabel ?? snapshot?.ageGroup ?? null,
      goals: (snapshot?.goalLabels as string[] | null) ?? profile?.goals ?? [],
    },
    settings: settings ?? {
      language: "en",
      emailReminders: true,
      calendarReminders: false,
      weeklySummary: true,
      defaultReminderTiming: "next_week",
    },
    consent: consent ?? null,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const email = session.user.email;
  const prisma = getPrisma();

  const body = await req.json();
  const name: string | undefined = typeof body.name === "string" ? body.name.trim() : undefined;
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const updated = await prisma.appUser.update({ where: { email }, data: { name }, select: { name: true } });
  return NextResponse.json({ name: updated.name });
}
