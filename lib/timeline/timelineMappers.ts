import type { TimelineOutput } from "@/lib/timeline-engine/timelineTypes";

export type TimelineUIItem = {
  bundleKey: string;
  title: string;
  eventType: "check" | "follow_up";
  scheduledDate: string;
  status: string;
  source: string;
};

export type TimelineUIGroup = {
  labelKey: string;
  labelText: string;
  items: TimelineUIItem[];
};

export type TimelineUIModel = {
  groupedTimeline: TimelineUIGroup[];
  firstUpcomingCheck?: { bundleKey: string; title: string; scheduledDate: string; labelText: string };
  checkOrder: string[]; // bundleKey order, chronological by scheduledDate
  checkLabelByBundle: Record<string, string>; // bundleKey -> labelText (e.g. "This month")
  followUpByBundle: Record<string, { title: string; scheduledDate: string; labelText: string }>;
};

export const DEFAULT_LABEL_TEXT: Record<string, string> = {
  this_month: "This month",
  next_month: "Next month",
  in_6_weeks: "In 6 weeks",
  in_3_months: "In 3 months",
  later: "Later",
  completed: "Completed",
};

export function mapTimelineResponseToUI(data: TimelineOutput | null | undefined): TimelineUIModel {
  const groupsRaw = data?.timeline ?? [];

  const groupedTimeline: TimelineUIGroup[] = groupsRaw
    .map((g) => {
      const labelText = DEFAULT_LABEL_TEXT[g.label] ?? g.label;
      const items: TimelineUIItem[] = (g.items ?? []).map((it) => ({
        bundleKey: it.bundle_key,
        title: it.title,
        eventType: it.event_type,
        scheduledDate: it.scheduled_date,
        status: it.status,
        source: it.source,
      }));
      return { labelKey: g.label, labelText, items };
    })
    .filter((g) => g.items.length > 0);

  const allItems = groupedTimeline.flatMap((g) => g.items.map((it) => ({ ...it, labelText: g.labelText })));

  const checkItems = allItems
    .filter((it) => it.eventType === "check")
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

  const firstUpcomingCheck = checkItems[0]
    ? {
        bundleKey: checkItems[0].bundleKey,
        title: checkItems[0].title,
        scheduledDate: checkItems[0].scheduledDate,
        labelText: checkItems[0].labelText,
      }
    : undefined;

  const checkOrder = Array.from(new Set(checkItems.map((c) => c.bundleKey)));

  const checkLabelByBundle: Record<string, string> = {};
  for (const c of checkItems) {
    if (!checkLabelByBundle[c.bundleKey]) checkLabelByBundle[c.bundleKey] = c.labelText;
  }

  const followUpByBundle: Record<string, { title: string; scheduledDate: string; labelText: string }> = {};
  const followUps = allItems
    .filter((it) => it.eventType === "follow_up")
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  for (const f of followUps) {
    if (followUpByBundle[f.bundleKey]) continue;
    followUpByBundle[f.bundleKey] = { title: f.title, scheduledDate: f.scheduledDate, labelText: f.labelText };
  }

  return { groupedTimeline, firstUpcomingCheck, checkOrder, checkLabelByBundle, followUpByBundle };
}

export function timelineContextLine(labelText: string | undefined | null): string | null {
  if (!labelText) return null;
  return `Recommended ${labelText.toLowerCase()}`;
}

export function followUpHintLine(followUp: { title: string; labelText: string } | null | undefined): string | null {
  if (!followUp) return null;
  return `Follow-up suggested ${followUp.labelText.toLowerCase()}`;
}

