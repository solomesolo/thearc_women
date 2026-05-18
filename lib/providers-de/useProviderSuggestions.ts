"use client";

import { useEffect, useState } from "react";
import type { ProviderSuggestions } from "./types";

// ── ZIP preference storage ────────────────────────────────────────────────────

const ZIP_KEY = "arc_user_zip_de";

export function loadUserZip(): string | null {
  try { return localStorage.getItem(ZIP_KEY); } catch { return null; }
}

export function saveUserZip(zip: string) {
  try { localStorage.setItem(ZIP_KEY, zip.trim()); } catch { /* ignore */ }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useProviderSuggestions(
  checkKey: string,
  isScreening: boolean,
  includedBiomarkers: string[],
) {
  const [zip, setZip] = useState<string | null>(() =>
    typeof window !== "undefined" ? loadUserZip() : null,
  );
  const [data, setData] = useState<ProviderSuggestions | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!checkKey) return;

    setLoading(true);
    setData(null);

    const params = new URLSearchParams({ checkKey, isScreening: String(isScreening) });
    if (zip) params.set("zip", zip);
    if (includedBiomarkers.length > 0)
      params.set("biomarkers", includedBiomarkers.join(","));

    fetch(`/api/providers-de?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkKey, isScreening, zip]);

  const updateZip = (newZip: string) => {
    saveUserZip(newZip);
    setZip(newZip);
  };

  return { data, loading, zip, updateZip };
}
