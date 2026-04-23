import type { ProgressEventNormalized, ProgressStateRow, RouteKey } from "./progressTypes";

function clampRoute(route: unknown): RouteKey | undefined {
  if (route === "doctor" || route === "private" || route === "lab" || route === "home_test") return route;
  return undefined;
}

export function applyProgressEvent(current: ProgressStateRow, event: ProgressEventNormalized): ProgressStateRow {
  switch (event.event_type) {
    case "mark_not_started": {
      return { progress_state: "not_started" };
    }
    case "mark_planned": {
      return { ...current, progress_state: "planned" };
    }
    case "mark_completed": {
      return { ...current, progress_state: "completed" };
    }
    case "clear_selection": {
      return {
        ...current,
        selected_route: undefined,
        selected_product_id: undefined,
        selected_action_option_id: undefined,
      };
    }
    case "select_route": {
      const nextRoute = clampRoute(event.selection?.selected_route);
      if (!nextRoute) return current;
      const nextState = current.progress_state === "not_started" ? "planned" : current.progress_state;
      return { ...current, progress_state: nextState, selected_route: nextRoute };
    }
    case "select_product": {
      const nextProductId = event.selection?.selected_product_id?.trim();
      if (!nextProductId) return current;
      return { ...current, selected_product_id: nextProductId };
    }
    case "select_action_option": {
      const nextOptionId = event.selection?.selected_action_option_id?.trim();
      if (!nextOptionId) return current;
      return { ...current, selected_action_option_id: nextOptionId };
    }
    case "note": {
      return current;
    }
    default: {
      return current;
    }
  }
}

