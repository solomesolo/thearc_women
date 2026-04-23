import type { TimelineOutput } from "@/lib/timeline-engine/timelineTypes";
import type { UpcomingCheckVM } from "./dashboardSummaryTypes";
import { DEFAULT_LABEL_TEXT, mapTimelineResponseToUI } from "@/lib/timeline/timelineMappers";

const UPPER_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(DEFAULT_LABEL_TEXT).map(([k, v]) => [k, v.toUpperCase()]),
);

export function buildUpcomingChecks(input: { timeline: TimelineOutput | null; maxItems?: number }): UpcomingCheckVM[] {
  const max = input.maxItems ?? 4;
  if (!input.timeline) return [];

  // (ui is useful as a future hook for per-bundle metadata)
  mapTimelineResponseToUI(input.timeline);
  const flat: Array<{ labelKey: string; item: (TimelineOutput["timeline"][number]["items"][number]) }> = [];
  for (const g of input.timeline.timeline) {
    for (const it of g.items) flat.push({ labelKey: g.label, item: it });
  }

  // Prefer chronological by scheduled_date; fall back to group order.
  flat.sort((a, b) => (a.item.scheduled_date ?? "").localeCompare(b.item.scheduled_date ?? ""));

  return flat.slice(0, max).map(({ labelKey, item }) => ({
    time_label: UPPER_LABEL[labelKey] ?? labelKey.toUpperCase(),
    title: item.title,
    bundle_key: item.bundle_key,
    event_type: item.event_type,
  }));
}

