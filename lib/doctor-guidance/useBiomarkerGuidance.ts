"use client";

import { useEffect, useState } from "react";
import type { DoctorGuidancePayload } from "./types";

type State = { data: DoctorGuidancePayload | null; isLoading: boolean; error: Error | null };

export function useBiomarkerGuidance(biomarkerKey: string | null, country: string | null) {
  const [state, setState] = useState<State>({ data: null, isLoading: Boolean(biomarkerKey), error: null });

  useEffect(() => {
    let cancelled = false;
    if (!biomarkerKey) {
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      setState((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const qs = new URLSearchParams();
        if (country) qs.set("country", country);
        const res = await fetch(
          `/api/doctor-guidance/biomarker/${encodeURIComponent(biomarkerKey)}?${qs.toString()}`,
          { cache: "no-store" },
        );
        const json = (await res.json()) as DoctorGuidancePayload;
        if (cancelled) return;
        setState({ data: json, isLoading: false, error: null });
      } catch (e) {
        if (cancelled) return;
        setState({ data: null, isLoading: false, error: e instanceof Error ? e : new Error("Failed") });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [biomarkerKey, country]);

  return state;
}

