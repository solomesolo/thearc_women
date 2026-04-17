/**
 * GET  /api/health/interventions
 *   Returns the pre-computed care gap flags and intervention plan for the
 *   authenticated user.  Reads from the care_gap_flags table — fast, no
 *   Python subprocess required.
 *
 *   Query params:
 *     ?status=overdue,never_recorded,due_soon,current  (comma-separated, default: all)
 *     ?priority=urgent,surveillance,routine            (comma-separated, default: all)
 *     ?category=hormones,thyroid,lipids               (comma-separated, default: all)
 *     ?recompute=true                                  (re-runs planner, then reads)
 *
 * POST /api/health/interventions
 *   Triggers a fresh computation of the intervention plan (runs
 *   intervention_planner.py for the authenticated user).
 *   Returns the full PlannerResult.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { spawn } from "child_process";
import path from "path";

const PYTHON =
  "/opt/homebrew/opt/python@3.10/Frameworks/Python.framework/Versions/3.10/bin/python3.10";

// ── Shared: spawn intervention_planner.py ────────────────────────────────────

async function runPlanner(userEmail: string): Promise<{
  ok: boolean;
  data?: Record<string, unknown>;
  error?: string;
}> {
  const projectRoot = path.resolve(process.cwd());
  const script = path.join(projectRoot, "workers", "intervention_planner.py");

  return new Promise((resolve) => {
    const child = spawn(PYTHON, [script, userEmail], {
      cwd: projectRoot,
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });

    child.on("close", (code) => {
      if (code !== 0) {
        resolve({ ok: false, error: stderr.trim() || "Planner exited non-zero" });
        return;
      }
      try {
        resolve({ ok: true, data: JSON.parse(stdout.trim()) });
      } catch {
        resolve({ ok: false, error: "Failed to parse planner output" });
      }
    });

    child.on("error", (err) => resolve({ ok: false, error: err.message }));

    setTimeout(() => {
      child.kill();
      resolve({ ok: false, error: "Intervention planner timed out" });
    }, 60_000);
  });
}

// ── GET — read stored care gaps ───────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userEmail = session.user.email;
  const url = new URL(req.url);

  // Optional: trigger recompute before reading
  const recompute = url.searchParams.get("recompute") === "true";
  if (recompute) {
    const plannerResult = await runPlanner(userEmail);
    if (!plannerResult.ok) {
      console.error("[interventions] Recompute error:", plannerResult.error);
      return NextResponse.json(
        { error: "Recompute failed", detail: plannerResult.error },
        { status: 500 },
      );
    }
  }

  // Parse filters
  const rawStatus   = url.searchParams.get("status");
  const rawPriority = url.searchParams.get("priority");
  const rawCategory = url.searchParams.get("category");

  const statusFilter   = rawStatus   ? new Set(rawStatus.split(",").map((s) => s.trim()))   : null;
  const priorityFilter = rawPriority ? new Set(rawPriority.split(",").map((p) => p.trim())) : null;
  const categoryFilter = rawCategory ? new Set(rawCategory.split(",").map((c) => c.trim())) : null;

  const prisma = getPrisma();

  // Build Prisma where clause
  const where: Record<string, unknown> = { userEmail };
  if (statusFilter)   where.gapStatus = { in: Array.from(statusFilter) };
  if (priorityFilter) where.priority  = { in: Array.from(priorityFilter) };
  if (categoryFilter) where.category  = { in: Array.from(categoryFilter) };

  const rows = await prisma.careGapFlag.findMany({
    where,
    orderBy: [
      // urgent first, then surveillance, then routine
      // (Prisma doesn't support CASE in orderBy — sort in JS)
      { computedAt: "desc" },
    ],
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

  // Sort: priority asc, then status severity, then most overdue first
  const PRIORITY_ORDER: Record<string, number> = { urgent: 0, surveillance: 1, routine: 2 };
  const STATUS_ORDER: Record<string, number>   = { overdue: 0, never_recorded: 1, due_soon: 2, current: 3 };

  rows.sort((a, b) => {
    const p = (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
    if (p !== 0) return p;
    const s = (STATUS_ORDER[a.gapStatus] ?? 9) - (STATUS_ORDER[b.gapStatus] ?? 9);
    if (s !== 0) return s;
    return (b.daysOverdue ?? 0) - (a.daysOverdue ?? 0);
  });

  const careGapFlags    = rows.filter((r) => ["overdue", "never_recorded"].includes(r.gapStatus));
  const suggestedFollowups = rows.filter((r) => r.gapStatus === "due_soon");
  const nextExpectedIntervention = rows.find((r) =>
    ["overdue", "due_soon"].includes(r.gapStatus)
  ) ?? null;

  return NextResponse.json({
    userEmail,
    care_gap_flags:              careGapFlags,
    suggested_followups:         suggestedFollowups,
    next_expected_intervention:  nextExpectedIntervention,
    total:                       rows.length,
    overdue_count:               rows.filter((r) => r.gapStatus === "overdue").length,
    due_soon_count:              rows.filter((r) => r.gapStatus === "due_soon").length,
    never_recorded_count:        rows.filter((r) => r.gapStatus === "never_recorded").length,
    current_count:               rows.filter((r) => r.gapStatus === "current").length,
  });
}

// ── POST — trigger fresh computation ─────────────────────────────────────────

export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userEmail = session.user.email;

  // Check the user has at least some observations to plan against
  const prisma = getPrisma();
  const obsCount = await prisma.healthObservation.count({ where: { userEmail } });

  if (obsCount === 0) {
    return NextResponse.json(
      {
        error: "No health observations found — upload and process at least one document first",
        care_gap_flags:             [],
        suggested_followups:        [],
        next_expected_intervention: null,
      },
      { status: 409 },
    );
  }

  const result = await runPlanner(userEmail);

  if (!result.ok) {
    console.error("[interventions] Planner error:", result.error);
    return NextResponse.json(
      { error: "Intervention planning failed", detail: result.error },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, userEmail, ...result.data });
}
