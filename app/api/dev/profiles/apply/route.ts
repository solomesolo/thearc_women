import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { createHash, randomUUID } from "crypto";

type ProfileId =
  | "baseline_low_signal"
  | "stress_sleep"
  | "iron_pattern"
  | "sugar_instability";

type ProfileSpec = {
  id: ProfileId;
  heroKeywords: string[];
  areaPlan: Array<{
    area: string;
    preferredSeverities: string[];
    fallbackScore: number;
  }>;
};

const PROFILE_SPECS: Record<ProfileId, ProfileSpec> = {
  baseline_low_signal: {
    id: "baseline_low_signal",
    heroKeywords: ["baseline", "steady", "stable"],
    areaPlan: [
      { area: "sleep", preferredSeverities: ["mild", "mixed"], fallbackScore: 0.55 },
      { area: "stress", preferredSeverities: ["mild", "mixed"], fallbackScore: 0.58 },
      { area: "energy", preferredSeverities: ["mixed", "mild", "stable"], fallbackScore: 0.52 },
      { area: "recovery", preferredSeverities: ["mild", "mixed"], fallbackScore: 0.56 },
      { area: "hormones", preferredSeverities: ["stable", "improving"], fallbackScore: 0.35 },
    ],
  },
  stress_sleep: {
    id: "stress_sleep",
    heroKeywords: ["stress", "sleep"],
    areaPlan: [
      { area: "stress", preferredSeverities: ["moderate", "mild"], fallbackScore: 0.76 },
      { area: "sleep", preferredSeverities: ["moderate", "mild"], fallbackScore: 0.72 },
      { area: "recovery", preferredSeverities: ["mild", "mixed"], fallbackScore: 0.62 },
      { area: "energy", preferredSeverities: ["mixed", "mild"], fallbackScore: 0.60 },
    ],
  },
  iron_pattern: {
    id: "iron_pattern",
    heroKeywords: ["energy", "iron", "reserve"],
    areaPlan: [
      { area: "energy", preferredSeverities: ["mild", "mixed"], fallbackScore: 0.68 },
      { area: "recovery", preferredSeverities: ["mild", "mixed"], fallbackScore: 0.61 },
      { area: "nutrition", preferredSeverities: ["mixed", "mild"], fallbackScore: 0.57 },
      { area: "hormones", preferredSeverities: ["stable", "mixed"], fallbackScore: 0.46 },
    ],
  },
  sugar_instability: {
    id: "sugar_instability",
    heroKeywords: ["metabolic", "energy", "stability"],
    areaPlan: [
      { area: "metabolism", preferredSeverities: ["mild", "mixed", "moderate"], fallbackScore: 0.71 },
      { area: "energy", preferredSeverities: ["mixed", "mild"], fallbackScore: 0.65 },
      { area: "sleep", preferredSeverities: ["mild", "mixed"], fallbackScore: 0.56 },
      { area: "stress", preferredSeverities: ["mild", "mixed"], fallbackScore: 0.58 },
    ],
  },
};

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

function withTimeout<T>(promise: PromiseLike<T>, ms: number, timeoutMessage: string) {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(timeoutMessage)), ms);
    Promise.resolve(promise)
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((err) => {
        clearTimeout(t);
        reject(err);
      });
  });
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

  // 1) Try direct email search (if supported).
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(emailNorm)}`,
      { headers, method: "GET", signal: controller.signal }
    );
    clearTimeout(timeout);
    if (res.ok) {
      const json = await res.json();
      const id = extractId(json);
      if (id) return id;
    }
  } catch {
    // ignore
  }

  // 2) Fallback: list users and filter (best-effort).
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

  // 3) Create a synthetic auth user.
  try {
    const password = randomUUID();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: "POST",
      headers,
      body: JSON.stringify({ email: emailNorm, password, email_confirm: true }),
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function tableColumns(supabase: any, tableName: string): Promise<Set<string>> {
  const q = await supabase
    .from("information_schema.columns")
    .select("column_name")
    .eq("table_schema", "public")
    .eq("table_name", tableName);
  if (q.error) return new Set<string>();
  return new Set((q.data ?? []).map((r: any) => String(r.column_name)));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function tableColumnsForSchema(supabase: any, tableSchema: string, tableName: string): Promise<Set<string>> {
  const q = await supabase
    .from("information_schema.columns")
    .select("column_name")
    .eq("table_schema", tableSchema)
    .eq("table_name", tableName);
  if (q.error) return new Set<string>();
  return new Set((q.data ?? []).map((r: any) => String(r.column_name)));
}

function pickColumns<T extends Record<string, unknown>>(row: T, cols: Set<string>) {
  // If column introspection is unavailable (e.g. information_schema blocked),
  // fall back to raw payload keys and let insert errors guide retries.
  if (cols.size === 0) return { ...row };
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (cols.has(k) && v !== undefined) out[k] = v;
  }
  return out;
}

function parseColumnDoesNotExist(message: string): string | null {
  // Supabase-js can fail before SQL execution if its schema cache doesn't include a column:
  // "Could not find the 'key_area_code' column of 'user_key_area_scores' in the schema cache"
  const m0 = message.match(/Could not find the\s+'([a-zA-Z0-9_]+)'\s+column of\s+'[^']+'\s+in the schema cache/i);
  if (m0 && m0[1]) return m0[1];
  // Examples we may see:
  // - column user_key_area_scores.key_area_code does not exist
  // - column "user_key_area_scores"."key_area_code" does not exist
  // - column key_area_code does not exist
  const m1 = message.match(/column\s+[a-zA-Z0-9_]+\.([a-zA-Z0-9_]+)\s+does not exist/i);
  if (m1 && m1[1]) return m1[1];
  const m2 = message.match(
    /column\s+"?[a-zA-Z0-9_]+"?\."?([a-zA-Z0-9_]+)"?\s+does not exist/i
  );
  if (m2 && m2[1]) return m2[1];
  const m3 = message.match(/column\s+"?([a-zA-Z0-9_]+)"?\s+does not exist/i);
  if (m3 && m3[1]) return m3[1];
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function insertRowDroppingMissingColumns(
  supabase: any,
  table: string,
  row: Record<string, unknown>,
  maxAttempts = 8
): Promise<{ ok: boolean; error: { message?: string } | null; triedErrors: string[]; usedRow: Record<string, unknown> }> {
  let payload = { ...row };
  const triedErrors: string[] = [];

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await (supabase.from(table) as any).insert(payload);
    if (!res.error) {
      return { ok: true, error: null, triedErrors, usedRow: payload };
    }

    const msg = res.error?.message ?? "unknown";
    triedErrors.push(msg);

    const missingCol = parseColumnDoesNotExist(msg);
    if (missingCol && Object.prototype.hasOwnProperty.call(payload, missingCol)) {
      delete (payload as any)[missingCol];
      continue;
    }

    // Can't automatically recover from this error class.
    return { ok: false, error: res.error ?? null, triedErrors, usedRow: payload };
  }

  return { ok: false, error: { message: `insert_failed_after_${maxAttempts}_attempts` }, triedErrors, usedRow: payload };
}

function rankSeverity(value: string | null | undefined) {
  if (!value) return 999;
  const v = value.toLowerCase();
  if (v === "moderate") return 0;
  if (v === "mild") return 1;
  if (v === "mixed") return 2;
  if (v === "stable") return 3;
  if (v === "improving") return 4;
  return 20;
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Not available in production" }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  const rawUserId = session?.user?.email ?? (session?.user as { id?: string } | undefined)?.id;
  if (!rawUserId) return new Response(null, { status: 401 });
  let fallbackUserId = toSupabaseUserId(String(rawUserId));
  if (!fallbackUserId) return new Response(null, { status: 401 });

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return Response.json(
      { error: "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are required." },
      { status: 500 }
    );
  }

  // Use Supabase Auth GoTrue to resolve the real user UUID that satisfies FK constraints.
  try {
    const resolvedAuthUserId = await resolveAuthUserIdViaGoTrueAdmin(
      supabaseUrl,
      serviceKey,
      String(rawUserId)
    );
    if (resolvedAuthUserId && UUID_RE.test(resolvedAuthUserId)) {
      fallbackUserId = resolvedAuthUserId;
    }
  } catch {
    // keep deterministic fallback
  }

  const body = (await request.json().catch(() => ({}))) as { profileId?: string };
  const profileId = body.profileId as ProfileId | undefined;
  if (!profileId || !(profileId in PROFILE_SPECS)) {
    return Response.json({ error: "Invalid profileId" }, { status: 400 });
  }
  const profile = PROFILE_SPECS[profileId];

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const [surveyRespCols, heroLinkCols, keyScoreCols] = await Promise.all([
    tableColumns(supabase, "survey_responses"),
    tableColumns(supabase, "user_hero_baseline"),
    tableColumns(supabase, "user_key_area_scores"),
  ]);

  const now = new Date().toISOString();
  // Resolve the real Supabase auth user UUID (foreign key target for `survey_responses.user_id`).
  let userId = fallbackUserId;
  const userResolutionDebug: Record<string, unknown> = {
    fallbackUserId,
    resolvedUserId: fallbackUserId,
    fkTargetConstraintName: "survey_responses_user_id_fkey",
    fkTarget: null,
    resolvedViaEmail: false,
  };

  // Figure out what table/column the foreign key points at, then try to resolve the correct user UUID by email.
  // This avoids relying on `supabase.auth.admin` methods (which may not be available in our installed SDK build).
  try {
    const fkTargetQ = await withTimeout(
      supabase
        .from("information_schema.constraint_column_usage")
        .select("table_schema,table_name,column_name")
        .eq("constraint_name", "survey_responses_user_id_fkey")
        .limit(5),
      5000,
      "supabase_fk_introspection_timeout"
    );

    if (fkTargetQ.error) {
      userResolutionDebug.fkIntrospectionError = fkTargetQ.error.message;
    }

    const target = fkTargetQ.data?.[0] as
      | { table_schema?: string; table_name?: string; column_name?: string }
      | undefined;
    if (target?.table_schema && target?.table_name && target?.column_name) {
      userResolutionDebug.fkTarget = target;
      const fromTable =
        target.table_schema === "public"
          ? target.table_name
          : `${target.table_schema}.${target.table_name}`;

      const foreignCols = await tableColumnsForSchema(
        supabase,
        target.table_schema,
        target.table_name
      );
      // Most likely the FK target has an `email` column we can match on.
      if (foreignCols.has("email")) {
        const byEmail = await withTimeout(
          supabase
            .from(fromTable)
            .select(target.column_name)
            .eq("email", String(rawUserId))
            .limit(1),
          5000,
          "supabase_fk_user_lookup_timeout"
        );
        if (byEmail.error) userResolutionDebug.fkByEmailError = byEmail.error.message;
        const resolved =
          (byEmail.data?.[0] as { [k: string]: unknown } | undefined)?.[target.column_name];
        if (typeof resolved === "string" && UUID_RE.test(resolved)) {
          userId = resolved;
          userResolutionDebug.resolvedViaEmail = true;
          userResolutionDebug.resolvedUserId = resolved;
        }
      }
    }
  } catch {
    // ignore; we'll surface FK errors from the insert attempt
  }

  // If we couldn't introspect the FK target table, fall back to probing common user-mapping tables.
  // This is a best-effort approach for the dev-only synthetic data flow.
  if (userId === fallbackUserId && userResolutionDebug.resolvedViaEmail !== true) {
    const email = String(rawUserId);
    userResolutionDebug.probedTables = [];
    const candidateTables = ["profiles", "user_profiles", "auth.users"];
    for (const t of candidateTables) {
      try {
        (userResolutionDebug.probedTables as string[]).push(t);
        const r = await withTimeout(
          supabase.from(t).select("*").eq("email", email).limit(1),
          5000,
          "supabase_user_probe_timeout"
        );
        if (r.error) {
          userResolutionDebug[`probeError_${t.replace(/\\W+/g, "_")}`] = r.error.message;
          continue;
        }
        const row = (r.data?.[0] ?? null) as any;
        const resolved = row?.id ?? row?.user_id ?? row?.userId ?? null;
        if (typeof resolved === "string" && UUID_RE.test(resolved)) {
          userId = resolved;
          userResolutionDebug.resolvedViaEmail = true;
          userResolutionDebug.resolvedUserId = resolved;
          break;
        }
      } catch {
        // ignore
      }
    }

    // Extra heuristic: if `user_profiles.email` doesn't exist, try columns that look like "email"
    // (e.g. `user_email`, `login_email`, `contact_email`) by sampling schema from one row.
    if (userId === fallbackUserId) {
      try {
        const sample = await withTimeout(
          supabase.from("user_profiles").select("*").limit(1),
          5000,
          "supabase_user_profiles_sample_timeout"
        );
        if (sample.error) userResolutionDebug.userProfilesSampleError = sample.error.message;
        const first = sample.data?.[0] as any;
        const keys = first ? Object.keys(first) : [];
        const emailLikeKeys = keys.filter((k) => k.toLowerCase().includes("email"));
        userResolutionDebug.userProfilesSampleKeys = keys.slice(0, 50);
        userResolutionDebug.userProfilesEmailLikeKeys = emailLikeKeys;

        // If the table is empty, sample-based key discovery won't work; fall back to column introspection.
        const userProfileCols = await tableColumns(supabase, "user_profiles");
        userResolutionDebug.userProfilesColumns = Array.from(userProfileCols).slice(0, 80);
        if (userProfileCols.size > 0) {
          const emailCols = Array.from(userProfileCols).filter((k) => k.toLowerCase().includes("email"));
          userResolutionDebug.userProfilesEmailColumns = emailCols.slice(0, 10);

          const keyCol = userProfileCols.has("id")
            ? "id"
            : userProfileCols.has("user_id")
              ? "user_id"
              : Array.from(userProfileCols)[0];

          if (keyCol) {
            const payload: Record<string, unknown> = { [keyCol]: fallbackUserId };
            if (emailCols.length > 0) payload[emailCols[0]] = email;
            try {
              const seeded = await withTimeout(
                supabase.from("user_profiles").insert(payload).select("*").limit(1),
                5000,
                "supabase_user_profiles_seed_timeout"
              );
              userResolutionDebug.seedAttempt = { payload, seededError: seeded.error?.message ?? null };
              if (!seeded.error) userResolutionDebug.seededUserProfile = true;
            } catch {
              // ignore seed errors
            }
          }
        } else {
          // As a last resort, try inserting with common UUID key column names.
          const seedCandidates: Array<Record<string, unknown>> = [
            { id: fallbackUserId },
            { user_id: fallbackUserId },
          ];
          userResolutionDebug.userProfilesSeedCandidates = seedCandidates.map((c) => Object.keys(c)[0]);
          for (const payload of seedCandidates) {
            try {
              const seeded = await withTimeout(
                supabase.from("user_profiles").insert(payload).select("*").limit(1),
                5000,
                "supabase_user_profiles_blind_seed_timeout"
              );
              userResolutionDebug.seedAttempt = {
                payload,
                seededError: seeded.error?.message ?? null,
              };
              if (!seeded.error) {
                userResolutionDebug.seededUserProfile = true;
                break;
              }
            } catch {
              // ignore and try next
            }
          }
        }

        for (const k of emailLikeKeys) {
          try {
            const r = await withTimeout(
              supabase.from("user_profiles").select("*").eq(k, email).limit(1),
              5000,
              "supabase_user_profiles_email_like_probe_timeout"
            );
            if (r.error) {
              userResolutionDebug[`userProfilesProbeError_${k}`] = r.error.message;
              continue;
            }
            const row = (r.data?.[0] ?? null) as any;
            const resolved = row?.id ?? row?.user_id ?? row?.userId ?? null;
            if (typeof resolved === "string" && UUID_RE.test(resolved)) {
              userId = resolved;
              userResolutionDebug.resolvedViaEmail = true;
              userResolutionDebug.resolvedUserId = resolved;
              userResolutionDebug.resolvedViaEmailColumn = k;
              break;
            }
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }
    }
  }

  // `survey_responses.survey_id` is a UUID in Supabase. We re-use an existing one if present,
  // otherwise fall back to a generated UUID (for local/dev synthetic sessions).
  const existingSurveyIdQ = await supabase
    .from("survey_responses")
    .select("survey_id")
    .limit(1);
  const existingSurveyId = (existingSurveyIdQ.data?.[0] as { survey_id?: unknown } | undefined)?.survey_id;

  const surveyCode = "arc_core_intake_v1";
  const tryResolveSurveyId = async () => {
    const tableCandidates = [
      "surveys",
      "survey_definitions",
      "survey_catalog",
      "survey_configs",
    ];
    const codeColumns = ["code", "survey_code", "slug", "name", "survey_id"];
    const idColumns = ["id", "survey_id"];

    for (const table of tableCandidates) {
      for (const codeCol of codeColumns) {
        for (const idCol of idColumns) {
          try {
            const q = await withTimeout(
              supabase
                .from(table)
                .select(idCol)
                .eq(codeCol, surveyCode)
                .limit(1),
              5000,
              "supabase_survey_id_resolve_timeout"
            );
            if (q.error || !q.data || q.data.length === 0) continue;
            const idVal = (q.data[0] as any)?.[idCol];
            if (typeof idVal === "string" && UUID_RE.test(idVal)) return idVal;
          } catch {
            // ignore and try next candidate
          }
        }
      }
    }

    // Code-based resolution didn't find a match; best-effort fallback:
    // pick *any* valid UUID from likely survey-definition tables.
    for (const table of tableCandidates) {
      for (const idCol of idColumns) {
        try {
          const q = await withTimeout(
            supabase.from(table).select(idCol).limit(1),
            5000,
            "supabase_survey_id_resolve_fallback_timeout"
          );
          if (q.error || !q.data || q.data.length === 0) continue;
          const idVal = (q.data[0] as any)?.[idCol];
          if (typeof idVal === "string" && UUID_RE.test(idVal)) return idVal;
        } catch {
          // ignore
        }
      }
    }
    return null;
  };

  const resolvedSurveyId = await tryResolveSurveyId();
  const deterministicSurveyId = toSupabaseUserId(surveyCode);
  const surveyIdCandidatesSet = new Set<string>();
  if (typeof existingSurveyId === "string" && UUID_RE.test(existingSurveyId)) surveyIdCandidatesSet.add(existingSurveyId);
  if (typeof resolvedSurveyId === "string" && UUID_RE.test(resolvedSurveyId)) surveyIdCandidatesSet.add(resolvedSurveyId);
  if (typeof deterministicSurveyId === "string" && UUID_RE.test(deterministicSurveyId)) surveyIdCandidatesSet.add(deterministicSurveyId);

  // If we don't know which UUID the FK expects, keep probing likely survey-definition tables for IDs.
  const surveyTableCandidates = ["surveys", "survey_definitions", "survey_catalog", "survey_configs"];
  const surveyIdColumns = ["id", "survey_id"];
  for (const table of surveyTableCandidates) {
    for (const idCol of surveyIdColumns) {
      try {
        const q = await withTimeout(
          supabase.from(table).select(idCol).limit(5),
          5000,
          "supabase_survey_id_candidates_timeout"
        );
        if (q.error || !q.data) continue;
        for (const row of q.data as unknown as Array<Record<string, unknown>>) {
          const v = row?.[idCol];
          if (typeof v === "string" && UUID_RE.test(v)) surveyIdCandidatesSet.add(v);
        }
      } catch {
        // ignore
      }
    }
  }

  // Ensure we have at least one candidate to try.
  if (surveyIdCandidatesSet.size === 0) surveyIdCandidatesSet.add(randomUUID());
  const surveyIdCandidates = Array.from(surveyIdCandidatesSet);

  let insertedResp: { data: { id?: unknown } | null; error: { message?: string } | null } | null = null;
  const insertErrors: string[] = [];
  const triedSurveyIds: string[] = [];

  outer: for (const sid of surveyIdCandidates) {
    triedSurveyIds.push(sid);

    const responseCandidatesRaw: Array<Record<string, unknown>> = [
      {
        user_id: String(userId),
        status: "completed",
        completed_at: now,
        created_at: now,
        survey_id: sid,
      },
      { user_id: String(userId), status: "completed", completed_at: now, survey_id: sid },
      { user_id: String(userId), status: "completed", created_at: now, survey_id: sid },
      { user_id: String(userId), status: "completed", survey_id: sid },
    ];

    // Avoid `surveyRespCols`-based filtering here; it's easy for introspection to fail and
    // accidentally drop required columns like `survey_id`.
    const responseCandidates = responseCandidatesRaw.filter((row) => Object.keys(row).length > 0);

    for (const candidate of responseCandidates) {
      const attempt = await supabase
        .from("survey_responses")
        .insert(candidate)
        .select("id")
        .single();
      if (!attempt.error && attempt.data?.id) {
        insertedResp = attempt;
        break outer;
      }
      insertErrors.push(attempt.error?.message ?? "unknown");
    }
  }

  if (insertedResp?.error || !insertedResp?.data?.id) {
    const errMsg =
      insertedResp?.error?.message ??
      (insertErrors.length > 0 ? insertErrors.join(" | ") : "unknown");
    return Response.json(
      {
        error: `Failed to create survey response: ${errMsg}`,
        debug: {
          rawUserId,
          usedUserId: userId,
          userResolutionDebug,
          surveyCode,
          existingSurveyId,
          resolvedSurveyId,
          deterministicSurveyId,
          triedSurveyIds,
        },
      },
      { status: 500 }
    );
  }
  const responseSessionId = String(insertedResp.data.id);

  const [heroRowsQ, keyStatesQ] = await Promise.all([
    supabase.from("hero_baselines").select("id,code,title,short_body,severity,tone"),
    supabase.from("key_area_states").select("id,code,area,state,severity"),
  ]);

  const heroRows = (heroRowsQ.data ?? []) as Array<Record<string, unknown>>;
  const keyStates = (keyStatesQ.data ?? []) as Array<Record<string, unknown>>;

  let heroCode: string | null = null;
  let heroBaselineId: string | null = null;
  if (heroRows.length > 0) {
    const kw = profile.heroKeywords.map((k) => k.toLowerCase());
    const match =
      heroRows.find((r) => {
        const text = `${r.code ?? ""} ${r.title ?? ""} ${r.short_body ?? ""}`.toLowerCase();
        return kw.some((k) => text.includes(k));
      }) ?? heroRows[0];
    heroCode = String(match.code ?? "");
    heroBaselineId = typeof match.id === "string" ? match.id : null;
  }

  let insertedHero = 0;
  const heroInsertErrors: string[] = [];
  if (heroCode) {
    const heroLink = pickColumns(
      {
        response_session_id: responseSessionId,
        user_id: userId,
        hero_baseline_id: heroBaselineId ?? undefined,
        hero_code: heroCode,
        baseline_code: heroCode,
        evidence: { source: "dev_profile", profileId },
      },
      heroLinkCols
    );
    if (Object.keys(heroLink).length > 0) {
      const heroInsert = await insertRowDroppingMissingColumns(supabase, "user_hero_baseline", heroLink);
      if (!heroInsert.ok) {
        console.warn("dev profile hero insert warning:", heroInsert.error?.message, heroInsert.triedErrors);
        heroInsertErrors.push(heroInsert.error?.message ?? "unknown");
      } else {
        insertedHero = 1;
      }
    }
  }

  const byArea = new Map<string, Array<Record<string, unknown>>>();
  for (const row of keyStates) {
    const area = String(row.area ?? "");
    if (!area) continue;
    if (!byArea.has(area)) byArea.set(area, []);
    byArea.get(area)!.push(row);
  }

  const keyAreaRows: Array<Record<string, unknown>> = [];
  for (const plan of profile.areaPlan) {
    const rows = byArea.get(plan.area) ?? [];
    if (rows.length === 0) continue;
    rows.sort((a, b) => rankSeverity(String(a.severity ?? "")) - rankSeverity(String(b.severity ?? "")));

    let chosen = rows[0]!;
    for (const targetSeverity of plan.preferredSeverities) {
      const hit = rows.find((r) => String(r.severity ?? "").toLowerCase() === targetSeverity.toLowerCase());
      if (hit) {
        chosen = hit;
        break;
      }
    }

    const state = String(chosen.state ?? "stable");
    const code = String(chosen.code ?? "");
    const row = pickColumns(
      {
        response_session_id: responseSessionId,
        user_id: userId,
        area: plan.area,
        state,
        key_area_state_id: chosen.id ?? undefined,
        key_area_code: code || undefined,
        state_code: code || undefined,
        score: plan.fallbackScore,
        severity: chosen.severity ?? undefined,
        evidence: { source: "dev_profile", profileId, matchedCode: code || null },
      },
      keyScoreCols
    );
    if (Object.keys(row).length > 0) keyAreaRows.push(row);
  }

  // Insert key areas one-by-one so we can recover from schema mismatches by dropping missing columns.
  let insertedKeyAreas = 0;
  const keyInsertErrors: string[] = [];
  for (const row of keyAreaRows) {
    const keyInsert = await insertRowDroppingMissingColumns(
      supabase,
      "user_key_area_scores",
      row as Record<string, unknown>
    );
    if (!keyInsert.ok) {
      keyInsertErrors.push(keyInsert.error?.message ?? "unknown");
      console.warn("dev profile key area insert warning:", keyInsert.error?.message, keyInsert.triedErrors);
    } else {
      insertedKeyAreas += 1;
    }
  }

  return Response.json({
    ok: true,
    profileId,
    responseSessionId,
    createdRows: {
      hero: insertedHero,
      keyAreas: insertedKeyAreas,
    },
    heroInsertErrors: heroInsertErrors.length > 0 ? heroInsertErrors : null,
    insertErrors: keyInsertErrors.length > 0 ? keyInsertErrors : null,
  });
}

