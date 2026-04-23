import type {
  ApplyProgressEventRequest,
  ApplyProgressEventResponse,
  DashboardProgressCounts,
  ProgressItem,
  ProgressListResponse,
  ProgressSummaryResponse,
  RecommendationStatus,
} from "./progressTypes";

type StoreItem = ProgressItem;

type StoreState = {
  itemsById: Record<string, StoreItem>;
};

const STORE_PREFIX = "engine_d_progress_mock:";

const store: {
  activeKey: string | null;
  state: StoreState;
  listeners: Set<() => void>;
} = {
  activeKey: null,
  state: { itemsById: {} },
  listeners: new Set(),
};

function safeParse(json: string | null): StoreState | null {
  if (!json) return null;
  try {
    const v = JSON.parse(json) as StoreState;
    if (!v || typeof v !== "object" || typeof (v as any).itemsById !== "object") return null;
    return v;
  } catch {
    return null;
  }
}

function persist() {
  if (typeof window === "undefined") return;
  if (!store.activeKey) return;
  try {
    window.localStorage.setItem(store.activeKey, JSON.stringify(store.state));
  } catch {
    // ignore quota / storage failures in mock mode
  }
}

function setActiveUserKey(userKey: string) {
  const key = `${STORE_PREFIX}${userKey}`;
  if (store.activeKey === key) return;
  store.activeKey = key;
  if (typeof window === "undefined") {
    store.state = { itemsById: {} };
    return;
  }
  const loaded = safeParse(window.localStorage.getItem(key));
  store.state = loaded ?? { itemsById: {} };
}

function notify() {
  persist();
  for (const fn of store.listeners) fn();
}

export function subscribeProgressStore(fn: () => void) {
  store.listeners.add(fn);
  return () => {
    store.listeners.delete(fn);
  };
}

function computeCounts(items: StoreItem[]): DashboardProgressCounts {
  let action_needed = 0;
  let planned = 0;
  let completed = 0;

  for (const it of items) {
    if (it.progress_state === "completed") {
      completed += 1;
      continue;
    }
    if (it.recommendation_status === "missing" || it.recommendation_status === "outdated") {
      if (it.progress_state === "planned") planned += 1;
      else action_needed += 1;
    }
  }
  return { action_needed, planned, completed };
}

function ensureItem(id: string, recommendation_status: RecommendationStatus): StoreItem {
  const existing = store.state.itemsById[id];
  if (existing) {
    if (existing.recommendation_status !== recommendation_status) {
      existing.recommendation_status = recommendation_status;
    }
    return existing;
  }
  const created: StoreItem = {
    recommendation_instance_id: id,
    recommendation_status,
    progress_state: "not_started",
    selected_route: null,
    selected_product_id: null,
    selected_action_option_id: null,
    planned_for_date: null,
    completed_at: null,
  };
  store.state.itemsById[id] = created;
  return created;
}

export async function mockFetchDashboardProgressSummary(params: {
  userKey: string;
  ids: string[];
  recommendationStatusById: Record<string, RecommendationStatus>;
}): Promise<ProgressSummaryResponse> {
  setActiveUserKey(params.userKey);
  for (const id of params.ids) {
    ensureItem(id, params.recommendationStatusById[id] ?? "missing");
  }
  const counts = computeCounts(Object.values(store.state.itemsById));
  return { counts };
}

export async function mockFetchRecommendationProgressList(params: {
  userKey: string;
  ids: string[];
  recommendationStatusById: Record<string, RecommendationStatus>;
}): Promise<ProgressListResponse> {
  setActiveUserKey(params.userKey);
  const items: StoreItem[] = [];
  for (const id of params.ids) {
    items.push(ensureItem(id, params.recommendationStatusById[id] ?? "missing"));
  }
  return { items };
}

export async function mockApplyProgressEvent(params: {
  userKey: string;
  req: ApplyProgressEventRequest;
}): Promise<ApplyProgressEventResponse> {
  setActiveUserKey(params.userKey);
  const req = params.req;
  const id = req.recommendation_instance_id;
  const item = ensureItem(id, "missing");

  if (req.event_type === "mark_planned") {
    item.progress_state = "planned";
  } else if (req.event_type === "mark_completed") {
    item.progress_state = "completed";
    item.completed_at = new Date().toISOString();
  } else if (req.event_type === "select_lab_option") {
    item.selected_route = "lab";
    item.selected_action_option_id = req.selected_action_option_id ?? "act_lab_default";
    item.selected_product_id = req.selected_product_id ?? "prod_lab_default";
    if (item.progress_state === "not_started") item.progress_state = "planned";
  } else if (req.event_type === "select_home_test_option") {
    item.selected_route = "home_test";
    item.selected_action_option_id = req.selected_action_option_id ?? "act_home_default";
    item.selected_product_id = req.selected_product_id ?? "prod_home_default";
    if (item.progress_state === "not_started") item.progress_state = "planned";
  }

  const counts = computeCounts(Object.values(store.state.itemsById));
  notify();

  return {
    recommendation_instance_id: id,
    progress: {
      progress_state: item.progress_state,
      selected_route: item.selected_route,
      selected_product_id: item.selected_product_id,
      selected_action_option_id: item.selected_action_option_id,
      planned_for_date: item.planned_for_date,
      completed_at: item.completed_at,
    },
    counts,
  };
}

