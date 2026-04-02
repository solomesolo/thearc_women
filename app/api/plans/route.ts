import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPlans, createPlan } from "@/lib/plan/queries";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const plans = await getPlans(session.user.email);
    return NextResponse.json({ plans });
  } catch (err) {
    console.error("[GET /api/plans]", err);
    return NextResponse.json({ plans: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const name = (body?.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

    const plan = await createPlan(session.user.email, { name, sourceType: body?.sourceType });
    return NextResponse.json(plan, { status: 201 });
  } catch (err) {
    console.error("[POST /api/plans]", err);
    return NextResponse.json({ error: "Could not create plan" }, { status: 500 });
  }
}
