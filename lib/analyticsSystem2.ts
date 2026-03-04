/**
 * Stub for system2 page analytics. Replace with real analytics (e.g. segment, gtag).
 */
export function systemTraceOpened(
  traceId: string,
  sourceSection: string,
  sourceElement?: string
) {
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    console.log("[analytics] system_trace_opened", { traceId, sourceSection, sourceElement });
  }
}

export function systemDomainSelected(domainId: string) {
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    console.log("[analytics] system_domain_selected", { domainId });
  }
}

export function systemSignalSelected(signalId: string) {
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    console.log("[analytics] system_signal_selected", { signalId });
  }
}

export function systemEdgeSelected(edgeKey: string) {
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    console.log("[analytics] system_edge_selected", { edgeKey });
  }
}

export function systemWeeklyTabChanged(tabId: string) {
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    console.log("[analytics] system_weekly_tab_changed", { tabId });
  }
}
