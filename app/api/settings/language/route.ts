import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const email = session.user.email;

  const body = await req.json();
  const language = body.language === "de" ? "de" : "en";
  const prisma = getPrisma();

  await prisma.userSettings.upsert({
    where: { userEmail: email },
    update: { language },
    create: { userEmail: email, language },
  });

  return NextResponse.json({ language });
}
