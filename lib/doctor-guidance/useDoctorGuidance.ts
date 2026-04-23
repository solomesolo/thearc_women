"use client";

import { useEffect, useState } from "react";
import type { DoctorGuidancePayload } from "./types";
import { fetchDoctorGuidance } from "./doctorGuidanceApi";

export function useDoctorGuidance(bundleKey: string | undefined, country?: string | null) {
  const [data, setData] = useState<DoctorGuidancePayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!bundleKey) return;
    let cancelled = false;
    setIsLoading(true);
    fetchDoctorGuidance(bundleKey, country)
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { /* silently fall back to null — component renders generic text */ })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [bundleKey, country]);

  return { data, isLoading };
}
