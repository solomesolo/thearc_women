import type { BundleKey, ExecutionStatus, UserAction } from "@/lib/status-engine/statusTypes";

export function resolveExecutionStatus(bundle: BundleKey, actions: UserAction[], now = new Date()): ExecutionStatus {
  const relevant = actions.filter((a) => a.bundle_key === bundle);
  if (relevant.length === 0) return "none";

  relevant.sort((a, b) => b.action_at.getTime() - a.action_at.getTime());
  const latest = relevant[0]!;

  if (latest.action_type === "mark_completed") return "completed";
  if (latest.action_type === "mark_planned") {
    // Planned expires after 90 days.
    const ageDays = (now.getTime() - latest.action_at.getTime()) / (1000 * 60 * 60 * 24);
    return ageDays <= 90 ? "planned" : "none";
  }
  if (latest.action_type === "unmark_planned") return "none";
  if (latest.action_type === "reopen") return "none";
  return "none";
}

