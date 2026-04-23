import { getOrCreateAnonId } from "@/lib/profile-engine-a/frontendClient";
import type { DashboardSummary } from "./dashboardSummaryTypes";
import { MOCK_DASHBOARD_SUMMARY } from "./dashboardSummaryMock";

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const anonId = typeof window === "undefined" ? null : getOrCreateAnonId();
  const res = await fetch("/api/dashboard/summary", {
    cache: "no-store",
    headers: anonId ? { "x-arc-anon-id": anonId } : undefined,
  });
  if (!res.ok) throw new Error(`dashboard_summary_http_${res.status}`);
  return (await res.json()) as DashboardSummary;
}

