/**
 * GET /api/health-data/care-gaps
 *
 * Care gap flags and intervention recommendations for the authenticated user.
 *
 * Filters:
 *   ?status=overdue,due_soon,never_recorded,current
 *   ?priority=urgent,surveillance,routine
 *   ?category=hormones,thyroid
 *   ?recompute=true  — trigger fresh computation before reading
 *
 * POST /api/health-data/care-gaps
 *   Trigger a fresh computation of the care gap plan.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { spawn } from "child_process";
import path from "path";

const PYTHON =
  "/opt/homebrew/opt/python@3.10/Frameworks/Python.framework/Versions/3.10/bin/python3.10";

async function runPlanner(userEmail: string): Promise<{ ok: boolean; error?: string }> {
  const projectRoot = path.resolve(process.cwd());
  const script = path.join(projectRoot, "workers", "intervention_planner.py");

  return new Promise((resolve) => {
    const child = spawn(PYTHON, [script, userEmail], {
      cwd: projectRoot,
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stderr = "";
    child.stderr.on("data", (c: Buffer) => { stderr += c.toString(); });
    child.on("close", (code) => {
      resolve(code === 0 ? { ok: true } : { ok: false, error: stderr.trim() });
    });
    child.on("error", (err) => resolve({ ok: false, error: err.message }));
    setTimeout(() => { child.kill(); resolve({ ok: false, error: "Planner timed out" }); }, 60_000);
  });
}

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, surveillance: 1, routine: 2 };
const STATUS_ORDER:   Record<string, number> = { overdue: 0, never_recorded: 1, due_soon: 2, current: 3 };

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userEmail = session.user.email;
  const url = new URL(req.url);

  if (url.searchParams.get("recompute") === "true") {
    await runPlanner(userEmail);
  }

  const rawStatus   = url.searchParams.get("status");
  const rawPriority = url.searchParams.get("priority");
  const rawCategory = url.searchParams.get("category");

  const prisma = getPrisma();

  const where: Record<string, unknown> = { userEmail };
  if (rawStatus)   where.gapStatus = { in: rawStatus.split(",").map((s) => s.trim()) };
  if (rawPriority) where.priority  = { in: rawPriority.split(",").map((s) => s.trim()) };
  if (rawCategory) where.category  = { in: rawCategory.split(",").map((s) => s.trim()) };

  const rows = await prisma.careGapFlag.findMany({
    where,
    select: {
      canonicalMetricName:  true,
      category:             true,
      label:                true,
      gapStatus:            true,
      priority:             true,
      lastObservedDate:     true,
      expectedIntervalDays: true,
      nextExpectedDate:     true,
      daysOverdue:          true,
      daysUntilDue:         true,
      suggestedAction:      true,
      guidelineSource:      true,
      computedAt:           true,
    },
  });

  rows.sort((a, b) => {
    const p = (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
    if (p !== 0) return p;
    const s = (STATUS_ORDER[a.gapStatus] ?? 9) - (STATUS_ORDER[b.gapStatus] ?? 9);
    if (s !== 0) return s;
    return (b.daysOverdue ?? 0) - (a.daysOverdue ?? 0);
  });

  const careGaps     = rows.filter((r) => ["overdue", "never_recorded"].includes(r.gapStatus));
  const followups    = rows.filter((r) => r.gapStatus === "due_soon");
  const nextItem     = rows.find((r) => ["overdue", "due_soon"].includes(r.gapStatus)) ?? null;

  return NextResponse.json({
    care_gap_flags:             careGaps,
    suggested_followups:        followups,
    next_expected_intervention: nextItem,
    summary: {
      overdue:       rows.filter((r) => r.gapStatus === "overdue").length,
      due_soon:      rows.filter((r) => r.gapStatus === "due_soon").length,
      never_recorded: rows.filter((r) => r.gapStatus === "never_recorded").length,
      current:       rows.filter((r) => r.gapStatus === "current").length,
      total:         rows.length,
    },
  });
}

export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userEmail = session.user.email;
  const prisma = getPrisma();

  const obsCount = await prisma.healthObservation.count({ where: { userEmail } });
  if (obsCount === 0)
    return NextResponse.json(
      { error: "No health observations found — upload and process a document first" },
      { status: 409 },
    );

  const result = await runPlanner(userEmail);
  if (!result.ok)
    return NextResponse.json({ error: "Computation failed", detail: result.error }, { status: 500 });

  return NextResponse.json({ ok: true, message: "Care gap plan updated" });
}
