import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { mapHero, mapKeyAreas, mapSignals } from "@/lib/dashboard/mappers";
import type { DashboardPayload } from "@/lib/dashboard/types";
import { createHash } from "crypto";

type RawRow = Record<string, unknown>;

// Supabase `user_id` is a UUID column, but NextAuth credentials currently use email as the user identifier.
// We derive a stable UUID from the identifier so all related dev/test writes and reads agree.
function uuidV5FromName(namespaceUuid: string, name: string) {
  const ns = namespaceUuid.replace(/-/g, "").toLowerCase();
  const nsBytes = Buffer.from(ns, "hex"); // 16 bytes
  const nameBytes = Buffer.from(name, "utf8");

  const hash = createHash("sha1").update(Buffer.concat([nsBytes, nameBytes])).digest();
  // Set version (5) and variant (RFC 4122)
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;

  const bytes = hash.subarray(0, 16);
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
    16,
    20
  )}-${hex.slice(20)}`;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function toSupabaseUserId(rawId: string) {
  const normalized = rawId.trim();
  if (!normalized) return null;
  if (UUID_RE.test(normalized)) return normalized;
  // DNS namespace UUID per RFC 4122.
  return uuidV5FromName("6ba7b810-9dad-11d1-80b4-00c04fd430c8", normalized.toLowerCase());
}

async function resolveAuthUserIdViaGoTrueAdmin(
  supabaseUrl: string,
  serviceKey: string,
  email: string
): Promise<string | null> {
  const emailNorm = email.trim().toLowerCase();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${serviceKey}`,
    apikey: serviceKey,
    "Content-Type": "application/json",
  };

  const extractId = (json: any): string | null => {
    const id =
      json?.id ??
      json?.user?.id ??
      json?.data?.id ??
      json?.data?.user?.id ??
      json?.data?.user_id ??
      null;
    if (typeof id === "string") return id;

    const users = json?.users ?? json?.data?.users ?? json?.data?.items ?? null;
    if (Array.isArray(users)) {
      const match = users.find((u) => String(u?.email ?? "").toLowerCase() === emailNorm);
      const matchId = match?.id ?? match?.user?.id ?? null;
      return typeof matchId === "string" ? matchId : null;
    }
    return null;
  };

  // Try email search first (if supported).
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(emailNorm)}`, {
      headers,
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const json = await res.json();
      const id = extractId(json);
      if (id) return id;
    }
  } catch {
    // ignore
  }

  // Fallback: list users and filter.
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${supabaseUrl}/auth/v1/admin/users?per_page=100&page=0`, {
      headers,
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const json = await res.json();
      const id = extractId(json);
      if (id) return id;
    }
  } catch {
    // ignore
  }

  return null;
}

function logWarnings(scope: string, warnings: string[]) {
  if (warnings.length === 0) return;
  console.warn(
    JSON.stringify({
      scope,
      warnings,
    })
  );
}

function heroFallbackFromKeyAreas(hasKeyAreas: boolean): DashboardPayload["hero"] {
  if (hasKeyAreas) {
    return {
      code: "fallback_refining",
      title: "Your patterns are starting to take shape",
      shortBody:
        "We have some signal-level insights, but your top summary is still being refined.",
      longBody: null,
      keyLever: null,
      tone: "supportive",
      severity: "mixed",
    };
  }
  return {
    code: "fallback_building",
    title: "We’re building your baseline",
    shortBody: "Complete more tracking to make the dashboard more personalized.",
    longBody: null,
    keyLever: null,
    tone: "supportive",
    severity: "stable",
  };
}

function devFixturePayload(fixture: string): DashboardPayload {
  const base: DashboardPayload = {
    responseSessionId: `fixture:${fixture}`,
    surveyId: "dev-fixture",
    generatedAt: new Date().toISOString(),
    hero: {
      code: fixture,
      title: "Your patterns are starting to take shape",
      shortBody:
        "This is a dev fixture view. Use it to preview dashboard states without waiting for full computed layers.",
      longBody: null,
      keyLever: "sleep_consistency",
      tone: "supportive",
      severity: "mixed",
      evidence: { fixture },
    },
    keyAreas: [],
    signals: [],
    warnings: [`fixture_override:${fixture}`],
  };

  if (fixture === "baseline_low_signal") {
    base.hero = {
      code: fixture,
      title: "Mostly steady baseline with light opportunities",
      shortBody: "Sleep consistency and stress recovery are your highest-leverage focus areas this week.",
      longBody: null,
      keyLever: "sleep_consistency",
      tone: "supportive",
      severity: "stable",
      evidence: { fixture },
    };
  } else if (fixture === "stress_sleep") {
    base.hero = {
      code: fixture,
      title: "Stress and sleep patterns are worth attention",
      shortBody: "Recovery is likely being affected by sustained stress load and sleep variability.",
      longBody: null,
      keyLever: "recovery",
      tone: "supportive",
      severity: "mild",
      evidence: { fixture },
    };
  } else if (fixture === "iron_pattern") {
    base.hero = {
      code: fixture,
      title: "Energy support may need deeper context",
      shortBody: "You may benefit from recovery-first pacing and discussing energy-related labs with your clinician.",
      longBody: null,
      keyLever: "energy_stability",
      tone: "supportive",
      severity: "mixed",
      evidence: { fixture },
    };
  } else if (fixture === "sugar_instability") {
    base.hero = {
      code: fixture,
      title: "Energy regulation patterns need refinement",
      shortBody: "A steadier rhythm in sleep and fueling may help reduce variability through the week.",
      longBody: null,
      keyLever: "metabolic_stability",
      tone: "supportive",
      severity: "mild",
      evidence: { fixture },
    };
  }

  return base;
}

export async function getLatestDashboard(options?: {
  fixture?: string | null;
}): Promise<DashboardPayload | null> {
  const session = await getServerSession(authOptions);
  const rawUserId = session?.user?.email ?? (session?.user as { id?: string } | undefined)?.id;
  if (!rawUserId) return null;
  let userId = toSupabaseUserId(String(rawUserId));
  if (!userId) return null;

  const fixture = options?.fixture?.trim();
  if (process.env.NODE_ENV !== "production" && fixture) {
    return devFixturePayload(fixture);
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return {
      responseSessionId: "none",
      surveyId: null,
      generatedAt: null,
      hero: heroFallbackFromKeyAreas(false),
      keyAreas: [],
      signals: [],
      warnings: ["supabase_env_missing"],
    };
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  // Prefer the real Supabase Auth UUID (matches FK targets for `survey_responses.user_id`).
  try {
    const resolvedAuthUserId = await resolveAuthUserIdViaGoTrueAdmin(
      supabaseUrl,
      serviceKey,
      String(rawUserId)
    );
    if (resolvedAuthUserId && UUID_RE.test(resolvedAuthUserId)) userId = resolvedAuthUserId;
  } catch {
    // Fall back to deterministic UUID.
  }

  const warnings: string[] = [];

  const latestResp = await supabase
    .from("survey_responses")
    .select("id,survey_id,completed_at,created_at,status")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1);

  if (latestResp.error) {
    warnings.push(`survey_responses_error:${latestResp.error.message}`);
    logWarnings("dashboard_loader", warnings);
    return {
      responseSessionId: "none",
      surveyId: null,
      generatedAt: null,
      hero: heroFallbackFromKeyAreas(false),
      keyAreas: [],
      signals: [],
      warnings,
    };
  }

  const latest = (latestResp.data?.[0] ?? null) as RawRow | null;
  if (!latest) {
    warnings.push("no_completed_survey_response");
    logWarnings("dashboard_loader", warnings);
    return {
      responseSessionId: "none",
      surveyId: null,
      generatedAt: null,
      hero: heroFallbackFromKeyAreas(false),
      keyAreas: [],
      signals: [],
      warnings,
    };
  }

  const responseSessionId = String(latest.id ?? "none");
  const surveyId = typeof latest.survey_id === "string" ? latest.survey_id : null;
  // `generated_at` is not present in the current schema; fall back to completed/created time.
  const generatedAt =
    typeof (latest as any).generated_at === "string"
      ? (latest as any).generated_at
      : typeof latest.completed_at === "string"
        ? latest.completed_at
        : typeof latest.created_at === "string"
          ? latest.created_at
          : null;

  const [heroRel, keyAreaRel, signalRel] = await Promise.all([
    supabase
      .from("user_hero_baseline")
      .select("*")
      .eq("response_session_id", responseSessionId)
      .limit(1),
    supabase
      .from("user_key_area_scores")
      .select("*")
      .eq("response_session_id", responseSessionId),
    supabase
      .from("user_signal_scores")
      .select("*")
      .eq("response_session_id", responseSessionId),
  ]);

  if (heroRel.error) warnings.push(`user_hero_baseline_error:${heroRel.error.message}`);
  if (keyAreaRel.error) warnings.push(`user_key_area_scores_error:${keyAreaRel.error.message}`);
  if (signalRel.error) warnings.push(`user_signal_scores_error:${signalRel.error.message}`);

  const heroBaselineRow = (heroRel.data?.[0] ?? null) as RawRow | null;
  const heroCode =
    (heroBaselineRow?.hero_code as string | undefined) ??
    (heroBaselineRow?.baseline_code as string | undefined) ??
    null;
  const heroBaselineId = heroBaselineRow?.hero_baseline_id as string | undefined;

  let heroContentRow: RawRow | null = null;
  if (heroCode) {
    const heroContent = await supabase
      .from("hero_baselines")
      .select("*")
      .eq("code", heroCode)
      .limit(1);
    if (heroContent.error) warnings.push(`hero_baselines_error:${heroContent.error.message}`);
    heroContentRow = (heroContent.data?.[0] ?? null) as RawRow | null;
  } else if (heroBaselineId) {
    const heroContent = await supabase
      .from("hero_baselines")
      .select("*")
      .eq("id", heroBaselineId)
      .limit(1);
    if (heroContent.error) warnings.push(`hero_baselines_error:${heroContent.error.message}`);
    heroContentRow = (heroContent.data?.[0] ?? null) as RawRow | null;
  } else {
    warnings.push("hero_code_missing");
  }

  const userKeyRows = (keyAreaRel.data ?? []) as RawRow[];
  let keyAreaStatesRows: RawRow[] = [];
  const codes = userKeyRows
    .map((r) => String(r.key_area_code ?? r.state_code ?? ""))
    .filter((x) => x.length > 0);
  if (codes.length > 0) {
    const statesByCode = await supabase
      .from("key_area_states")
      .select("*")
      .in("code", codes);
    if (statesByCode.error) warnings.push(`key_area_states_error:${statesByCode.error.message}`);
    keyAreaStatesRows = (statesByCode.data ?? []) as RawRow[];
  } else {
    const allStates = await supabase.from("key_area_states").select("*");
    if (allStates.error) warnings.push(`key_area_states_all_error:${allStates.error.message}`);
    keyAreaStatesRows = (allStates.data ?? []) as RawRow[];
  }

  const userSignalRows = (signalRel.data ?? []) as RawRow[];
  const signalCodes = userSignalRows
    .map((r) => String(r.signal_code ?? r.code ?? ""))
    .filter((x) => x.length > 0);
  let signalDefRows: RawRow[] = [];
  if (signalCodes.length > 0) {
    const defs = await supabase
      .from("signal_definitions")
      .select("*")
      .in("signal_code", signalCodes);
    if (defs.error) warnings.push(`signal_definitions_error:${defs.error.message}`);
    signalDefRows = (defs.data ?? []) as RawRow[];
  }

  const keyAreas = mapKeyAreas(userKeyRows, keyAreaStatesRows);
  let hero = mapHero(heroBaselineRow, heroContentRow);
  if (!hero) {
    warnings.push("hero_missing_using_fallback");
    hero = heroFallbackFromKeyAreas(keyAreas.length > 0);
  }

  const payload: DashboardPayload = {
    responseSessionId,
    surveyId,
    generatedAt,
    hero,
    keyAreas,
    signals: mapSignals(userSignalRows, signalDefRows),
    warnings,
  };
  logWarnings("dashboard_loader", warnings);
  return payload;
}

