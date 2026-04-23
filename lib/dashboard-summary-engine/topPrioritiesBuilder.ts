import type { TopPriorityVM } from "./dashboardSummaryTypes";

type Candidate = {
  bundle_key: string;
  display_name: string;
  status: string; // missing/outdated/current/planned/completed/optional
  priority_score: number;
  progress_state: string; // not_started/planned/completed
  urgency_label?: string | null; // from timeline label if present
};

function badgeLabel(status: string): string {
  const s = status.toLowerCase();
  if (s === "missing") return "MISSING";
  if (s === "outdated") return "OUTDATED";
  if (s === "planned") return "PLANNED";
  if (s === "completed") return "DONE";
  if (s === "current") return "CURRENT";
  return s.toUpperCase();
}

function severityRank(status: string): number {
  const s = status.toLowerCase();
  if (s === "missing") return 0;
  if (s === "outdated") return 1;
  if (s === "planned") return 2;
  if (s === "current") return 3;
  if (s === "completed") return 4;
  return 9;
}

function actionNeeded(status: string, progressState: string): boolean {
  const s = status.toLowerCase();
  return (s === "missing" || s === "outdated") && progressState === "not_started";
}

export function buildTopPriorities(input: { candidates: Candidate[]; maxItems?: number }): TopPriorityVM[] {
  const max = input.maxItems ?? 3;
  const sorted = [...input.candidates].sort((a, b) => {
    const aNeed = actionNeeded(a.status, a.progress_state) ? 0 : 1;
    const bNeed = actionNeeded(b.status, b.progress_state) ? 0 : 1;
    if (aNeed !== bNeed) return aNeed - bNeed;

    const sev = severityRank(a.status) - severityRank(b.status);
    if (sev !== 0) return sev;

    // Higher priority_score first
    const ps = (b.priority_score ?? 0) - (a.priority_score ?? 0);
    if (ps !== 0) return ps;

    return a.bundle_key.localeCompare(b.bundle_key);
  });

  return sorted.slice(0, max).map((c, idx) => ({
    rank: idx + 1,
    bundle_key: c.bundle_key,
    display_name: c.display_name,
    status: c.status,
    badge_label: badgeLabel(c.status),
  }));
}

