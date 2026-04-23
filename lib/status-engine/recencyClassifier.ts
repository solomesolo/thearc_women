import type { RecencyStatus } from "@/lib/status-engine/statusTypes";

function monthsBetween(a: Date, b: Date): number {
  const ms = Math.abs(b.getTime() - a.getTime());
  return ms / (1000 * 60 * 60 * 24 * 30.4375);
}

export function classifyRecency(latestEvidenceDate: Date | null, effectiveIntervalMonths: number, now = new Date()): RecencyStatus {
  if (!latestEvidenceDate) return "missing";
  const ageMonths = monthsBetween(latestEvidenceDate, now);
  return ageMonths <= effectiveIntervalMonths ? "current" : "outdated";
}

