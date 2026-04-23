export const ENGINE_A_STORAGE = {
  anonId: "engine_a_anon_id",
  sessionId: "engine_a_session_id",
} as const;

export const ARC_SURVEY_STORAGE_KEY = "arc_survey_v2_engine_a";

/** Call on sign-out: wipes session + survey form state. Keeps anon ID so the device stays trackable. */
export function clearArcLocalState(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ENGINE_A_STORAGE.sessionId);
  localStorage.removeItem(ARC_SURVEY_STORAGE_KEY);
}

export function getOrCreateAnonId(): string {
  if (typeof window === "undefined") return "server";
  const existing = window.localStorage.getItem(ENGINE_A_STORAGE.anonId);
  if (existing) return existing;
  const id = crypto.randomUUID();
  window.localStorage.setItem(ENGINE_A_STORAGE.anonId, id);
  return id;
}

function headersWithAnon(): HeadersInit {
  if (typeof window === "undefined") return {};
  const anonId = window.localStorage.getItem(ENGINE_A_STORAGE.anonId) ?? getOrCreateAnonId();
  return anonId ? { "x-arc-anon-id": anonId } : {};
}

export async function apiCreateQuestionnaireSession(): Promise<{ session_id: string; status: string; version: string }> {
  const res = await fetch("/api/questionnaire/session", { method: "POST", headers: { ...headersWithAnon() } });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`create_session_failed:${res.status}:${text.slice(0, 400)}`);
  }
  return (await res.json()) as { session_id: string; status: string; version: string };
}

export async function apiGetLatestQuestionnaireSession(): Promise<{
  session: null | { session_id: string; status: string; last_step_number: number; version: string };
}> {
  const res = await fetch("/api/questionnaire/latest", { headers: { ...headersWithAnon() } });
  if (!res.ok) throw new Error("latest_session_failed");
  return (await res.json()) as any;
}

export async function apiGetQuestionnaireSessionState(sessionId: string): Promise<{
  session: { session_id: string; status: string; last_step_number: number; version: string; answers: Record<string, unknown> };
}> {
  const res = await fetch(`/api/questionnaire/session/${encodeURIComponent(sessionId)}`, { headers: { ...headersWithAnon() } });
  if (!res.ok) throw new Error("get_session_failed");
  return (await res.json()) as any;
}

export async function apiSaveAnswers(sessionId: string, payload: { answers: Array<{ question_key: string; answer_value: unknown }>; last_step_number: number }) {
  const res = await fetch(`/api/questionnaire/${encodeURIComponent(sessionId)}/answers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headersWithAnon() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("save_answers_failed");
  return (await res.json()) as any;
}

export async function apiClaimSession(sessionId: string) {
  const res = await fetch(`/api/questionnaire/claim/${encodeURIComponent(sessionId)}`, { method: "POST" });
  if (!res.ok) throw new Error("claim_failed");
  return (await res.json()) as any;
}

export async function apiBuildProfile(sessionId: string) {
  const res = await fetch(`/api/profile/build-from-session/${encodeURIComponent(sessionId)}`, {
    method: "POST",
    headers: { ...headersWithAnon() },
  });
  if (!res.ok) {
    // Dev fallback: allow frontend wiring even if backend route isn't available.
    if (res.status === 404 || res.status === 501) return mockBuildProfileResponse();
    // Idempotency: session already completed (e.g. StrictMode double-invoke).
    // Return the snapshot that was already built for this specific session.
    if (res.status === 409) {
      const latest = await apiGetLatestProfile().catch(() => null);
      if (latest?.profile_snapshot_id) {
        return {
          profile_snapshot_id: latest.profile_snapshot_id,
          profile: latest.profile ?? null,
        };
      }
    }
    throw new Error("build_profile_failed");
  }
  return (await res.json()) as any;
}

export async function apiGetLatestProfile() {
  const res = await fetch("/api/profile/latest", { cache: "no-store", headers: { ...headersWithAnon() } });
  if (!res.ok) {
    if (res.status === 404 || res.status === 501) return mockLatestProfileResponse();
    throw new Error("latest_profile_failed");
  }
  return (await res.json()) as any;
}

export async function apiGetOnboardingStatus() {
  const res = await fetch("/api/onboarding/status", { cache: "no-store" });
  if (!res.ok) throw new Error("onboarding_status_failed");
  return (await res.json()) as any;
}

export async function apiStartRetake() {
  const res = await fetch("/api/profile-engine/retake", { method: "POST" });
  if (!res.ok) throw new Error("retake_failed");
  return (await res.json()) as any;
}

function mockBuildProfileResponse() {
  return {
    profile_snapshot_id: "demo-profile-1",
    profile: {
      age_group: "30_34",
      life_stage: "reproductive",
      goal_flags: ["goal_prevention", "goal_energy"],
      risk_flags: ["fatigue", "heavy_periods", "high_stress", "low_sun_exposure"],
      condition_flags: [],
      medication_flags: [],
      family_history_flags: ["fh_thyroid"],
      lifestyle_flags: ["high_stress", "low_sun_exposure"],
      last_tests: {
        vitamin_d: null,
        iron_status: "6_12m",
        thyroid_basic: "gt_12m",
        glucose_metabolic: null,
        lipid_panel: null,
        female_hormone_balance: null,
      },
      profile_summary: {
        age_group_label: "30–34",
        life_stage_label: "Regular menstrual cycle",
        goals_label: "General preventive health, More energy and vitality",
      },
    },
  };
}

function mockLatestProfileResponse() {
  return {
    profile_snapshot_id: "demo-profile-1",
    profile: {
      age_group: "30_34",
      life_stage: "reproductive",
      profile_summary: {
        age_group_label: "30–34",
        life_stage_label: "Regular menstrual cycle",
        goals_label: "General preventive health, More energy and vitality",
      },
    },
  };
}

