import type { ProfileSnapshot } from "@prisma/client";
import type { ProfileSummaryVM } from "./dashboardSummaryTypes";

function joinGoalLabels(snapshot: ProfileSnapshot | null): string {
  if (!snapshot) return "—";
  const summary = (snapshot.profileSummary as any) ?? {};
  const goalsLabel = (summary.goals_label as string | null) ?? null;
  if (goalsLabel) return goalsLabel;

  const arr = Array.isArray(snapshot.goalLabels) ? (snapshot.goalLabels as any[]) : [];
  const labels = arr.filter((x) => typeof x === "string" && x.trim().length > 0);
  return labels.length ? labels.join(", ") : "—";
}

export function buildProfileSummary(snapshot: ProfileSnapshot | null): ProfileSummaryVM {
  const summary = (snapshot?.profileSummary as any) ?? {};
  const age = (summary.age_group_label as string | null) ?? snapshot?.ageGroupLabel ?? "—";
  const life = (summary.life_stage_label as string | null) ?? snapshot?.lifeStageLabel ?? "—";
  const goals = joinGoalLabels(snapshot);
  return {
    age_group: age,
    life_stage: life,
    goals,
    retake_assessment_route: "/onboarding/start",
  };
}

