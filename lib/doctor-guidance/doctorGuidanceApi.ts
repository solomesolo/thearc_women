import type { DoctorGuidancePayload } from "./types";

export async function fetchDoctorGuidance(bundleKey: string, country?: string | null): Promise<DoctorGuidancePayload> {
  const params = new URLSearchParams();
  if (country) params.set("country", country);
  const qs = params.toString() ? `?${params}` : "";
  const res = await fetch(`/api/doctor-guidance/${encodeURIComponent(bundleKey)}${qs}`);
  if (!res.ok) throw new Error(`doctor-guidance fetch failed: ${res.status}`);
  return res.json() as Promise<DoctorGuidancePayload>;
}
