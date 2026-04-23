export const PROGRESS_STATES = ["not_started", "planned", "completed"] as const;
export type ProgressState = (typeof PROGRESS_STATES)[number];

export const ROUTE_KEYS = ["doctor", "private", "lab", "home_test"] as const;
export type RouteKey = (typeof ROUTE_KEYS)[number];

export const PROGRESS_EVENT_TYPES = [
  "mark_not_started",
  "mark_planned",
  "mark_completed",
  "select_route",
  "select_product",
  "select_action_option",
  "clear_selection",
  "note",
  // UI aliases (accepted by API; normalized by service)
  "book_at_lab",
  "order_home_test",
  "select_doctor_route",
  "select_private_route",
] as const;

export type ProgressEventType = (typeof PROGRESS_EVENT_TYPES)[number];

export type RecommendationStatus = "missing" | "outdated" | "current";

export type ProgressSelection = {
  selected_route?: RouteKey;
  selected_product_id?: string;
  selected_action_option_id?: string;
};

export type ProgressStateRow = {
  progress_state: ProgressState;
  selected_route?: RouteKey;
  selected_product_id?: string;
  selected_action_option_id?: string;
};

export type ProgressEventInput = {
  event_type: ProgressEventType;
  selection?: ProgressSelection;
  note?: string;
  client_event_id?: string;
};

export type ProgressEventNormalized = {
  event_type:
    | "mark_not_started"
    | "mark_planned"
    | "mark_completed"
    | "select_route"
    | "select_product"
    | "select_action_option"
    | "clear_selection"
    | "note";
  selection?: ProgressSelection;
  note?: string;
  client_event_id?: string;
};

