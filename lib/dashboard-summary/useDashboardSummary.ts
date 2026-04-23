"use client";

import { useEffect, useState } from "react";
import type { DashboardSummary } from "./dashboardSummaryTypes";
import { fetchDashboardSummary } from "./dashboardSummaryApi";

export function useDashboardSummary() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  async function reload() {
    setIsLoading(true);
    setError(null);
    try {
      const r = await fetchDashboardSummary();
      setData(r);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to load"));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  return { data, isLoading, error, reload };
}

