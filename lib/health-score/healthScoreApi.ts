export type HealthScoreApiResponse = {
  score: number;
  method: string;
  band: string;
  kpi_label: string;
  widget?: {
    score: number;
    subtitle: string;
  };
  summary: {
    denominator_total: number;
    numerator_total: number;
    bundle_count: number;
  };
  top_gaps: string[];
  bundle_breakdown: Array<{
    bundle_key: string;
    status: string;
    base_weight: number;
    relevance_weight: number;
    status_multiplier: number;
    coverage_ratio: number;
    denominator_weight: number;
    numerator_value: number;
    rationale: string[];
  }>;
};

type HealthScoreLatestResponse = {
  has_score: boolean;
  score: number | null;
  payload: any | null;
  created_at: string | null;
};

const MOCK_HEALTH_SCORE: HealthScoreApiResponse = {
  score: 32,
  method: "weighted_completion_v1",
  band: "moderate",
  kpi_label: "32% completeness",
  widget: { score: 32, subtitle: "Based on your current health data" },
  summary: { denominator_total: 68, numerator_total: 21.8, bundle_count: 7 },
  top_gaps: ["vitamin_d", "iron_status", "thyroid_basic"],
  bundle_breakdown: [
    {
      bundle_key: "vitamin_d",
      status: "missing",
      base_weight: 8,
      relevance_weight: 1.5,
      status_multiplier: 0.2,
      coverage_ratio: 0.0,
      denominator_weight: 12,
      numerator_value: 2.4,
      rationale: ["symptom:fatigue", "lifestyle:low_sun_exposure"],
    },
    {
      bundle_key: "iron_status",
      status: "outdated",
      base_weight: 9,
      relevance_weight: 1.55,
      status_multiplier: 0.5,
      coverage_ratio: 1.0,
      denominator_weight: 14,
      numerator_value: 7.0,
      rationale: ["symptom:fatigue", "symptom:heavy_periods"],
    },
    {
      bundle_key: "thyroid_basic",
      status: "outdated",
      base_weight: 9,
      relevance_weight: 1.45,
      status_multiplier: 0.5,
      coverage_ratio: 1.0,
      denominator_weight: 13,
      numerator_value: 6.5,
      rationale: ["family_history:fh_thyroid", "symptom:fatigue"],
    },
  ],
};

function normalizeHealthScorePayload(payload: any): HealthScoreApiResponse | null {
  if (!payload || typeof payload !== "object") return null;
  // If payload is already in API response shape (from calculate route), accept it.
  if (typeof payload.score === "number" && Array.isArray(payload.top_gaps) && Array.isArray(payload.bundle_breakdown)) {
    return payload as HealthScoreApiResponse;
  }
  // If payload is engine output shape persisted in DB, map it.
  if (typeof payload.score === "number" && Array.isArray(payload.bundle_breakdown)) {
    return {
      score: Math.round(Number(payload.score)),
      method: String(payload.method ?? "weighted_completion_v1"),
      band: String(payload.band ?? "low"),
      kpi_label: `${Math.round(Number(payload.score))}% completeness`,
      widget: { score: Math.round(Number(payload.score)), subtitle: "Based on your current health data" },
      summary: {
        denominator_total: Number(payload.denominator_total ?? 0),
        numerator_total: Number(payload.numerator_total ?? 0),
        bundle_count: Number(payload.bundle_count ?? 0),
      },
      top_gaps: Array.isArray(payload.top_gaps) ? (payload.top_gaps as string[]) : [],
      bundle_breakdown: (payload.bundle_breakdown as any[]).map((b) => ({
        bundle_key: String(b.bundle_key ?? b.bundleKey ?? ""),
        status: String(b.status ?? ""),
        base_weight: Number(b.base_weight ?? b.baseWeight ?? 0),
        relevance_weight: Number(b.relevance_weight ?? b.relevanceWeight ?? 0),
        status_multiplier: Number(b.status_multiplier ?? b.statusMultiplier ?? 0),
        coverage_ratio: Number(b.coverage_ratio ?? b.coverageRatio ?? 0),
        denominator_weight: Number(b.denominator_weight ?? b.denominatorWeight ?? 0),
        numerator_value: Number(b.numerator_value ?? b.numeratorValue ?? 0),
        rationale: Array.isArray(b.rationale) ? (b.rationale as string[]) : Array.isArray(b.rationale?.factors) ? (b.rationale.factors as string[]) : [],
      })),
    };
  }
  return null;
}

export async function fetchHealthScore(policy_key = "weighted_completion_v1"): Promise<HealthScoreApiResponse> {
  const anonId = typeof window === "undefined" ? null : window.localStorage.getItem("engine_a_anon_id");
  // Fast path: read latest persisted score (no heavy recalculation).
  try {
    const latestRes = await fetch("/api/health-score/latest", {
      method: "GET",
      cache: "no-store",
      headers: {
        ...(anonId ? { "x-arc-anon-id": anonId } : {}),
      },
    });
    if (latestRes.ok) {
      const latest = (await latestRes.json()) as HealthScoreLatestResponse;
      if (latest?.has_score && latest.payload) {
        const normalized = normalizeHealthScorePayload(latest.payload);
        if (normalized) return normalized;
      }
    }
  } catch {
    // Ignore and fall back to calculate.
  }

  const res = await fetch("/api/health-score/calculate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(anonId ? { "x-arc-anon-id": anonId } : {}),
    },
    body: JSON.stringify({ policy_key }),
  });
  if (!res.ok) throw new Error(`health_score_http_${res.status}`);
  const json = (await res.json()) as HealthScoreApiResponse;
  return json?.widget ? json : { ...json, widget: { score: json.score, subtitle: "Based on your current health data" } };
}

