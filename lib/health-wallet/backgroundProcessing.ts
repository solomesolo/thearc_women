export const BG_TASKS_STORAGE_KEY = "arc_bg_processing_v1";
export const BG_TASKS_CHANGED_EVENT = "arc_bg_tasks_changed";

export interface BackgroundTask {
  id: string;
  docId: string;
  uploadKind: "lab" | "screening";
  fileName: string;
  locale: "en" | "de";
  startedAt: string;
}

export function loadBackgroundTasks(): BackgroundTask[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(BG_TASKS_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as BackgroundTask[]) : [];
  } catch {
    return [];
  }
}

export function addBackgroundTask(task: BackgroundTask): void {
  if (typeof window === "undefined") return;
  const tasks = loadBackgroundTasks();
  tasks.unshift(task);
  window.localStorage.setItem(BG_TASKS_STORAGE_KEY, JSON.stringify(tasks));
  window.dispatchEvent(new Event(BG_TASKS_CHANGED_EVENT));
}

export function removeBackgroundTask(id: string): void {
  if (typeof window === "undefined") return;
  const next = loadBackgroundTasks().filter((t) => t.id !== id);
  window.localStorage.setItem(BG_TASKS_STORAGE_KEY, JSON.stringify(next));
}

/** Remove tasks older than maxAgeMs (default 60 min) to avoid polling forever */
export function pruneStaleBackgroundTasks(maxAgeMs = 60 * 60 * 1000): void {
  if (typeof window === "undefined") return;
  const cutoff = Date.now() - maxAgeMs;
  const next = loadBackgroundTasks().filter(
    (t) => new Date(t.startedAt).getTime() > cutoff,
  );
  window.localStorage.setItem(BG_TASKS_STORAGE_KEY, JSON.stringify(next));
}
