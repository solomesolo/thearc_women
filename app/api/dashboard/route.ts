/**
 * GET /api/dashboard — returns either dummy payload or engine output for the current user.
 * If the user has saved survey responses, runs the engine and returns survey-driven results.
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDummyPayloadByTimeRange } from "@/data/dashboardDummy";
import { spawnSync } from "child_process";
import path from "path";

const TIME_WINDOW = "7d";

function buildEngineInputPayload(
  email: string,
  surveyResponses: Record<string, unknown>
): Record<string, unknown> {
  return {
    user_id: email,
    timestamp: new Date().toISOString(),
    time_window: TIME_WINDOW,
    survey: surveyResponses,
    labs: [],
    history: {},
  };
}

function runEngineSync(payload: Record<string, unknown>): unknown {
  const scriptPath = path.join(process.cwd(), "scripts", "run_engine_stdin.py");
  const env = { ...process.env, PYTHONPATH: process.cwd() };
  const run = (pythonCmd: string) =>
    spawnSync(pythonCmd, [scriptPath], {
      input: JSON.stringify(payload),
      encoding: "utf-8",
      env,
      timeout: 30000,
    });
  let result = run("python3");
  if (result.error?.message?.includes("ENOENT") || result.status === 127) {
    result = run("python");
  }
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    const stderr = result.stderr?.trim() || "Unknown error";
    throw new Error(`Engine failed: ${stderr}`);
  }
  try {
    return JSON.parse(result.stdout || "{}");
  } catch {
    throw new Error("Invalid JSON from engine");
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { searchParams } = new URL(request.url);
  const timeRange = (searchParams.get("timeRange") as "today" | "7d" | "30d") || "7d";

  const profile = await prisma.userProfile.findUnique({
    where: { email: session.user.email },
  });

  const surveyResponses = profile?.surveyResponses as Record<string, unknown> | null | undefined;
  const hasSurveyData =
    surveyResponses && typeof surveyResponses === "object" && Object.keys(surveyResponses).length > 0;

  if (!hasSurveyData) {
    return Response.json({
      _source: "dummy",
      timeRange,
      payload: getDummyPayloadByTimeRange(timeRange),
      _surveyDataPresent: false,
    });
  }

  try {
    const payload = buildEngineInputPayload(session.user.email, surveyResponses);
    const output = runEngineSync(payload);
    return Response.json({
      _source: "survey",
      timeRange,
      output,
      _surveyDataPresent: true,
    });
  } catch (e) {
    console.error("Dashboard engine run failed:", e);
    const errMsg = e instanceof Error ? e.message : "Engine failed";
    return Response.json({
      _source: "dummy",
      timeRange,
      payload: getDummyPayloadByTimeRange(timeRange),
      _surveyDataPresent: true,
      _engineError: errMsg,
    });
  }
}
