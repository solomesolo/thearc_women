export type TimelineEventType = "check" | "follow_up";
export type TimelineLabelKey = "this_month" | "next_month" | "in_6_weeks" | "in_3_months" | "later" | "completed";
export type TimelineUrgency = "low" | "medium" | "high";

export type TimelineItem = {
  bundle_key: string;
  event_type: TimelineEventType;
  scheduled_date: string; // YYYY-MM-DD
  source: string; // default_policy | user_plan | generated_follow_up
  urgency: TimelineUrgency;
  label_key: TimelineLabelKey;
  title: string;
  subtitle?: string;
  status: string; // missing | outdated | planned | future | completed
};

export type TimelineGroup = {
  label: TimelineLabelKey;
  items: Array<Pick<TimelineItem, "bundle_key" | "title" | "event_type" | "scheduled_date" | "status" | "source">>;
};

export type TimelineOutput = {
  anchor_date: string;
  timeline: TimelineGroup[];
};

