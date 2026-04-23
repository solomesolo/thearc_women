import type { ExecutionStatus, FinalStatus, RecencyStatus, StateGroup } from "@/lib/status-engine/statusTypes";

export function resolveFinalStatus(recency: RecencyStatus, execution: ExecutionStatus): { final_status: FinalStatus; state_group: StateGroup } {
  // Precedence: completed > planned > recency
  let final_status: FinalStatus = recency;
  if (execution === "completed") final_status = "completed";
  else if (execution === "planned") final_status = "planned";

  const state_group: StateGroup =
    final_status === "completed"
      ? "done"
      : final_status === "planned"
        ? "in_progress"
        : final_status === "current"
          ? "up_to_date"
          : "action_needed";

  return { final_status, state_group };
}

