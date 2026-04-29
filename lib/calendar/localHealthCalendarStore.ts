export type HealthCalendarEventMeta = {
  plannedDateISO: string; // yyyy-mm-dd
  doctorName?: string;
  address?: string;
  notes?: string;
};

export type StoredScreeningEvent = {
  screeningName: string;
  meta: HealthCalendarEventMeta;
  createdAtISO: string;
};

const OVERRIDES_KEY = "arc.calendar.overrides.v1";
const NOTES_KEY = "arc.calendar.notes.v1";
const META_KEY = "arc.calendar.meta.v1";
const SCREENINGS_KEY = "arc.calendar.screenings.v1";

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadCalendarOverrides(): Record<string, string> {
  if (typeof window === "undefined") return {};
  return safeJsonParse<Record<string, string>>(window.localStorage.getItem(OVERRIDES_KEY)) ?? {};
}

export function saveCalendarOverrides(next: Record<string, string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(OVERRIDES_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function loadCalendarNotes(): Record<string, string> {
  if (typeof window === "undefined") return {};
  return safeJsonParse<Record<string, string>>(window.localStorage.getItem(NOTES_KEY)) ?? {};
}

export function saveCalendarNotes(next: Record<string, string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(NOTES_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function loadCalendarMeta(): Record<string, HealthCalendarEventMeta> {
  if (typeof window === "undefined") return {};
  return safeJsonParse<Record<string, HealthCalendarEventMeta>>(window.localStorage.getItem(META_KEY)) ?? {};
}

export function saveCalendarMeta(next: Record<string, HealthCalendarEventMeta>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(META_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function loadScreeningEvents(): Record<string, StoredScreeningEvent> {
  if (typeof window === "undefined") return {};
  return safeJsonParse<Record<string, StoredScreeningEvent>>(window.localStorage.getItem(SCREENINGS_KEY)) ?? {};
}

export function saveScreeningEvents(next: Record<string, StoredScreeningEvent>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SCREENINGS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

