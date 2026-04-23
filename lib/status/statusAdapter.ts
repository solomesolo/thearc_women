import type { BundleStatus } from "@/lib/status/statusApi";

export type BadgeTone = "critical" | "warning" | "neutral" | "info" | "success";

export const statusLabelMap: Record<BundleStatus["final_status"], string> = {
  missing: "Missing",
  outdated: "Outdated",
  current: "Current",
  planned: "Planned",
  completed: "Completed",
};

export const statusToneMap: Record<BundleStatus["final_status"], BadgeTone> = {
  missing: "critical",
  outdated: "warning",
  current: "neutral",
  planned: "info",
  completed: "success",
};

export function mapBundleStatusToBadge(status: BundleStatus | undefined | null) {
  const final = status?.final_status ?? "current";
  return {
    label: statusLabelMap[final],
    tone: statusToneMap[final],
    final_status: final,
    state_group: status?.state_group ?? "up_to_date",
  };
}

export function badgeClassName(tone: BadgeTone) {
  // Keep existing pill style language, vary background subtly.
  if (tone === "critical") return "bg-[#0c0c0c] text-white";
  if (tone === "warning") return "bg-[#525252] text-white";
  if (tone === "info") return "bg-[#0c0c0c]/[0.06] text-[#0c0c0c]";
  if (tone === "success") return "bg-[#0c0c0c]/[0.06] text-[#0c0c0c]";
  return "bg-[#404040] text-white";
}

export function ctaIntentForFinalStatus(final: BundleStatus["final_status"]) {
  return {
    emphasizePrimary: final === "missing" || final === "outdated",
    disablePlan: final === "planned" || final === "completed",
    disableDone: final === "completed",
    supportLine:
      final === "outdated"
        ? "Last known check may be outside the recommended interval."
        : final === "current"
          ? "This check looks up to date based on the latest evidence."
          : null,
  };
}

