/**
 * Optional dashboard telemetry hooks.
 * Dispatch custom events so analytics or logging can subscribe.
 * No-op if no listener; safe to call from any component.
 */

function emit(eventName: string, detail?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(eventName, { detail: detail ?? {} })
  );
}

export function trackDashboardTimeRangeChanged(range: string) {
  emit("dashboard_time_range_changed", { range });
}

export function trackDashboardSystemOpened(systemId: string) {
  emit("dashboard_system_opened", { systemId });
}

export function trackDashboardTraceOpened(traceId: string) {
  emit("dashboard_trace_opened", { traceId });
}

export function trackDashboardUpdateSignalsClicked() {
  emit("dashboard_update_signals_clicked");
}
