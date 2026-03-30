/**
 * Dedicated server-side loader for the "Your Starting Line" hero card.
 *
 * Priority chain:
 *   1. Latest user_hero_result row for this user (engine has already run)
 *   2. If no run exists: trigger the TS engine synchronously and persist
 *   3. Explicit fallback if engine fails or user has no survey data
 *
 * All downstream table queries are anchored to the same run_id to prevent
 * mixed-run results.
 */

import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createHash, randomUUID } from "crypto";
import type { StartingLineViewModel } from "./startingLineTypes";

const ENGINE_VERSION = "v1";

// ─── User ID helpers (mirrors getLatestDashboard.ts) ─────────────────────────

function uuidV5FromName(namespaceUuid: string, name: string): string {
  const ns = namespaceUuid.replace(/-/g, "").toLowerCase();
  const nsBytes = Buffer.from(ns, "hex");
  const nameBytes = Buffer.from(name, "utf8");
  const hash = createHash("sha1")
    .update(Buffer.concat([nsBytes, nameBytes]))
    .digest();
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const bytes = hash.subarray(0, 16);
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function toSupabaseUserId(rawId: string): string | null {
  const normalized = rawId.trim();
  if (!normalized) return null;
  if (UUID_RE.test(normalized)) return normalized;
  return uuidV5FromName(
    "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    normalized.toLowerCase()
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

type RawRow = Record<string, unknown>;

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function strNull(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}
function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

const KEY_LEVER_LABELS: Record<string, string> = {
  sleep_consistency: "Improve sleep consistency",
  recovery: "Prioritize recovery first",
  stress_reduction: "Reduce overall stress load",
  energy_stability: "Support energy stability",
  metabolic_stability: "Support metabolic stability",
  nutrition_timing: "Optimize nutrition timing",
  cycle_alignment: "Align activity with your cycle",
  hormonal_balance: "Support hormonal balance",
  iron_support: "Support iron and energy levels",
};

function makeFallback(reason: string): StartingLineViewModel {
  console.warn("Starting Line fallback used", { reason });
  return {
    runId: "fallback",
    updatedAt: new Date().toISOString(),
    hero: {
      code: "HERO_BASELINE",
      title: "Complete the survey to see your personalized baseline",
      subtitle:
        "Once you've answered the health questions, your personalized Starting Line will appear here.",
      confidence: "low",
      score: 0,
    },
    focus: null,
    explainers: { primary: [], secondary: [] },
    contributingSignals: [],
    keyAreas: [],
    debug: { heroCode: "HERO_BASELINE", source: "fallback", runId: "fallback" },
  };
}

// ─── Main loader ──────────────────────────────────────────────────────────────

export async function getStartingLineForUser(): Promise<StartingLineViewModel> {
  const session = await getServerSession(authOptions);
  const rawId =
    session?.user?.email ??
    (session?.user as { id?: string } | undefined)?.id;
  if (!rawId) return makeFallback("no_session");

  const userId = toSupabaseUserId(String(rawId));
  if (!userId) return makeFallback("invalid_user_id");

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return makeFallback("no_supabase_env");

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  // ── Step 1: Find the latest resolved run for this user ────────────────────
  let heroRow: RawRow | null = null;
  try {
    const { data } = await supabase
      .from("user_hero_result")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);
    heroRow = (data?.[0] ?? null) as RawRow | null;
  } catch {
    // Table may not exist yet (migration not applied)
  }

  // ── Step 2: No run found — trigger the TS engine ──────────────────────────
  if (!heroRow) {
    try {
      const profile = await prisma.userProfile.findUnique({
        where: { email: String(rawId) },
      });
      const surveyAnswers = profile?.surveyResponses as
        | Record<string, unknown>
        | null
        | undefined;
      const hasSurvey =
        surveyAnswers &&
        typeof surveyAnswers === "object" &&
        Object.keys(surveyAnswers).length > 0;

      if (hasSurvey) {
        // Dynamic import so the engine is not bundled into the server component
        // unless actually needed (avoids loading all Supabase rule fetch modules
        // on every page render when a run already exists).
        const { runDashboardEngine } = await import(
          "@/lib/engine/runDashboardEngine"
        );

        const runId = randomUUID();
        await runDashboardEngine({
          userId,
          runId,
          surveyAnswers: surveyAnswers!,
          engineVersion: ENGINE_VERSION,
        });

        // Read back the hero row we just wrote
        const { data } = await supabase
          .from("user_hero_result")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1);
        heroRow = (data?.[0] ?? null) as RawRow | null;
      }
    } catch (err) {
      console.warn("Starting Line engine run failed", {
        userId,
        reason: String(err),
      });
    }
  }

  if (!heroRow) return makeFallback("no_resolved_run");

  // ── Step 3: Anchor all queries to this run_id ─────────────────────────────
  const runId = str(heroRow.run_id) || "unknown";
  const heroCode = str(heroRow.hero_code) || "HERO_BASELINE";
  const heroScore = num(heroRow.score);
  const heroConfidence = (str(heroRow.confidence) ||
    "low") as "low" | "medium" | "high";
  const updatedAt =
    str(heroRow.created_at) || new Date().toISOString();
  const whySelectedJson = (heroRow.why_selected_json ??
    {}) as Record<string, unknown>;

  // ── Step 4: Parallel fetch of result tables + hero editorial ──────────────
  const [kaRes, sigRes, heroEditRes] = await Promise.all([
    supabase
      .from("user_key_area_results")
      .select("*")
      .eq("user_id", userId)
      .eq("run_id", runId)
      .order("score", { ascending: false }),
    supabase
      .from("user_signal_results")
      .select("signal_code,signal_strength,confidence,trigger_score")
      .eq("user_id", userId)
      .eq("run_id", runId)
      .eq("is_active", true)
      .order("trigger_score", { ascending: false })
      .limit(12),
    supabase
      .from("hero_baselines")
      .select("title,short_body,long_body,key_lever")
      .eq("code", heroCode)
      .limit(1),
  ]);

  const kaRows = (kaRes.data ?? []) as RawRow[];
  const sigRows = (sigRes.data ?? []) as RawRow[];
  const heroEditRow = (heroEditRes.data?.[0] ?? null) as RawRow | null;

  // ── Step 5: Editorial lookups for key areas + signal labels ──────────────
  const kaCodes = [...new Set(kaRows.map((r) => str(r.key_area_code)).filter(Boolean))];
  const sigCodes = [...new Set(sigRows.map((r) => str(r.signal_code)).filter(Boolean))];

  const [kaStatesRes, sigDefRes] = await Promise.all([
    kaCodes.length > 0
      ? supabase
          .from("key_area_states")
          .select("area,state,title,short_body,why_it_matters,severity")
          .in("area", kaCodes)
      : Promise.resolve({ data: [] as RawRow[] }),
    sigCodes.length > 0
      ? supabase
          .from("signal_definitions")
          .select("signal_code,title")
          .in("signal_code", sigCodes)
      : Promise.resolve({ data: [] as RawRow[] }),
  ]);

  const kaStates = (kaStatesRes.data ?? []) as RawRow[];
  const sigDefs = (sigDefRes.data ?? []) as RawRow[];

  // Build lookup maps
  const kaEditMap = new Map<string, RawRow>();
  for (const s of kaStates) {
    kaEditMap.set(`${str(s.area)}:${str(s.state)}`, s);
  }

  const sigLabelMap = new Map<string, string>();
  for (const d of sigDefs) {
    const code = str(d.signal_code);
    if (code) sigLabelMap.set(code, str(d.title) || code);
  }

  // ── Step 6: Build the view model ──────────────────────────────────────────

  // Hero title: editorial first, then generic
  const heroTitle =
    str(heroEditRow?.title) || "Your health patterns are taking shape";

  // Subtitle: editorial short_body is the canonical source; don't use raw rule text
  const heroShortBody = str(heroEditRow?.short_body);
  const heroSubtitle =
    heroShortBody ||
    "Your personalized health pattern is ready. Explore the details below.";

  // Focus: from editorial key_lever code
  const keyLeverCode = strNull(heroEditRow?.key_lever);
  const focusLabel = keyLeverCode
    ? (KEY_LEVER_LABELS[keyLeverCode] ?? keyLeverCode)
    : null;
  const focus: StartingLineViewModel["focus"] = focusLabel
    ? {
        code: keyLeverCode!,
        label: focusLabel,
        confidence: heroConfidence,
        score: heroScore,
      }
    : null;

  // Explainers: key area candidates + why_selected context
  const primary: string[] = [];
  const whyReason = str(whySelectedJson.reason);
  if (
    whyReason &&
    !whyReason.startsWith("no_qualifying_rule") &&
    !whyReason.startsWith("rule:")
  ) {
    primary.push(whyReason);
  }
  for (const ka of kaRows.slice(0, 3)) {
    const exJson = (ka.explanation_json ?? {}) as Record<string, unknown>;
    const candidates = Array.isArray(exJson.candidates)
      ? (exJson.candidates as unknown[])
      : [];
    for (const c of candidates.slice(0, 2)) {
      if (typeof c === "string" && c.length > 0 && !primary.includes(c)) {
        primary.push(c);
      }
    }
  }

  // Contributing signals
  const contributingSignals: StartingLineViewModel["contributingSignals"] =
    sigRows.map((r) => {
      const code = str(r.signal_code);
      return {
        code,
        label: sigLabelMap.get(code) || code,
        strength: (str(r.signal_strength) || "mild") as
          | "mild"
          | "moderate"
          | "strong",
        confidence: (str(r.confidence) || "low") as
          | "low"
          | "medium"
          | "high",
      };
    });

  // Key areas: join with editorial
  const keyAreas: StartingLineViewModel["keyAreas"] = kaRows.map((r) => {
    const code = str(r.key_area_code);
    const stateCode = str(r.resolved_state_code);
    const editorial = kaEditMap.get(`${code}:${stateCode}`);
    return {
      code,
      stateCode,
      score: num(r.score),
      confidence: (str(r.confidence) || "low") as "low" | "medium" | "high",
      title: strNull(editorial?.title),
      shortBody: strNull(editorial?.short_body),
      whyItMatters: strNull(editorial?.why_it_matters),
      severity: strNull(editorial?.severity),
    };
  });

  return {
    runId,
    updatedAt,
    hero: {
      code: heroCode,
      title: heroTitle,
      subtitle: heroSubtitle,
      confidence: heroConfidence,
      score: heroScore,
    },
    focus,
    explainers: { primary, secondary: [] },
    contributingSignals,
    keyAreas,
    debug: { heroCode, source: "resolved_run", runId },
  };
}
