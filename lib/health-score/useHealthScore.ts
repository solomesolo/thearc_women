"use client";

import { useEffect, useState } from "react";
import type { HealthScoreApiResponse } from "./healthScoreApi";
import { fetchHealthScore } from "./healthScoreApi";

export function useHealthScore() {
  const [data, setData] = useState<HealthScoreApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  async function reload() {
    setIsLoading(true);
    setError(null);
    try {
      const r = await fetchHealthScore();
      setData(r);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to fetch"));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // Initial load: fetch latest score quickly; calculation will only happen if needed.
    void reload();
  }, []);

  return { data, isLoading, error, reload };
}

