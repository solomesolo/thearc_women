/**
 * GET /api/dashboard — returns either dummy payload or engine output for the current user.
 * If the user has saved survey responses, runs the engine and returns survey-driven results.
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDummyPayloadByTimeRange } from "@/data/dashboardDummy";
import { spawn } from "child_process";
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

function runEngine(payload: Record<string, unknown>): Promise<unknown> {
  const scriptPath = path.join(process.cwd(), "scripts", "run_engine_stdin.py");
  const env = { ...process.env, PYTHONPATH: process.cwd() };
  const runWithCmd = (pythonCmd: string) =>
    new Promise<unknown>((resolve, reject) => {
      const cp = spawn(pythonCmd, [scriptPath], { env, stdio: ["pipe", "pipe", "pipe"] });
      const timeout = setTimeout(() => {
        cp.kill("SIGKILL");
        reject(new Error("Engine timed out after 30000ms"));
      }, 30000);

      let stdout = "";
      let stderr = "";
      cp.stdout.setEncoding("utf8");
      cp.stderr.setEncoding("utf8");
      cp.stdout.on("data", (chunk) => {
        stdout += chunk;
      });
      cp.stderr.on("data", (chunk) => {
        stderr += chunk;
      });
      cp.on("error", (err: NodeJS.ErrnoException) => {
        clearTimeout(timeout);
        reject(err);
      });
      cp.on("close", (code) => {
        clearTimeout(timeout);
        if (code !== 0) {
          const msg = stderr.trim() || `Engine exited with code ${code}`;
          reject(new Error(`Engine failed: ${msg}`));
          return;
        }
        try {
          resolve(JSON.parse(stdout || "{}"));
        } catch {
          reject(new Error("Invalid JSON from engine"));
        }
      });

      cp.stdin.write(JSON.stringify(payload));
      cp.stdin.end();
    });

  return runWithCmd("python3").catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    // Fallback for environments where python3 is unavailable.
    if (msg.includes("ENOENT")) return runWithCmd("python");
    throw err;
  });
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

  let profile: Awaited<ReturnType<typeof prisma.userProfile.findUnique>> = null;
  try {
    profile = await prisma.userProfile.findUnique({
      where: { email: session.user.email },
    });
  } catch (e) {
    console.error("Dashboard API: profile lookup failed:", e);
    return Response.json({
      _source: "dummy",
      timeRange,
      payload: getDummyPayloadByTimeRange(timeRange),
      _surveyDataPresent: false,
      _profileError: true,
    });
  }

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
    const output = await runEngine(payload);
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
