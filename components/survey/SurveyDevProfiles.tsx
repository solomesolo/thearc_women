"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DEV_FIXTURES = [
  { id: "baseline_low_signal", label: "Baseline" },
  { id: "stress_sleep", label: "Stress / Sleep" },
  { id: "iron_pattern", label: "Iron / Bleeding" },
  { id: "sugar_instability", label: "Blood sugar" },
];

export function SurveyDevProfiles() {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runProfile = async (name: string) => {
    setLoadingId(name);
    setError(null);
    try {
      const res = await fetch("/api/dev/profiles/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: name }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? `HTTP ${res.status}`);
      }
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to apply profile");
      setLoadingId(null);
    }
  };

  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="mb-6 rounded-[10px] border border-dashed border-black/10 bg-black/[0.02] px-3 py-2 text-xs text-black/70">
      <div className="mb-1 font-medium">Test profiles (dev only)</div>
      <div className="flex flex-wrap gap-2">
        {DEV_FIXTURES.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => runProfile(f.id)}
            disabled={loadingId != null}
            className="rounded-[999px] border border-black/10 bg-white px-3 py-1 text-xs font-medium text-black/80 hover:bg-black/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/40"
          >
            {loadingId === f.id ? `${f.label}…` : f.label}
          </button>
        ))}
      </div>
      {error ? <p className="mt-2 text-[11px] text-red-600">{error}</p> : null}
    </div>
  );
}

