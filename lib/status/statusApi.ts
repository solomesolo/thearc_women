export type BundleStatus = {
  recency_status: "missing" | "outdated" | "current";
  execution_status: "none" | "planned" | "completed";
  final_status: "missing" | "outdated" | "current" | "planned" | "completed";
  state_group: "action_needed" | "in_progress" | "done" | "up_to_date";
  effective_interval_months: number;
  evidence_source_used?: string;
  evidence_date_used?: string;
};

export type EngineCDashboardResponse = {
  by_bundle: Record<string, BundleStatus>;
  dashboard_counts: {
    tests_to_action: number;
    planned: number;
    completed: number;
    current: number;
  };
};

export async function fetchDashboardStatus(userId: string): Promise<EngineCDashboardResponse> {
  const anonId = typeof window === "undefined" ? null : window.localStorage.getItem("engine_a_anon_id");
  const res = await fetch(`/api/status/dashboard/${encodeURIComponent(userId)}`, {
    cache: "no-store",
    headers: anonId ? { "x-arc-anon-id": anonId } : undefined,
  });
  if (!res.ok) throw new Error("Failed to fetch dashboard status");
  return (await res.json()) as EngineCDashboardResponse;
}

