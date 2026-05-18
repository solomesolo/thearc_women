/**
 * Persist user-confirmed screening document uploads in localStorage for the
 * Health Wallet "Screenings" tab (alongside recommendation-driven screenings).
 */

export const SCREENING_DOC_UPLOADS_KEY = "arc_health_wallet_screening_uploads_v1";

export interface ScreeningDocumentUpload {
  id: string;
  documentId: string;
  /** Human-readable screening type, e.g. "MRT Neurokranium". User-editable at save time. */
  screeningName: string;
  date: string;
  findings: string;
  fileName: string | null;
  fileType: string | null;
  savedAt: string;
}

function safeParse(json: string | null): ScreeningDocumentUpload[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json) as unknown;
    return Array.isArray(v) ? (v as ScreeningDocumentUpload[]) : [];
  } catch {
    return [];
  }
}

export function loadScreeningDocumentUploads(): ScreeningDocumentUpload[] {
  if (typeof window === "undefined") return [];
  try {
    return safeParse(window.localStorage.getItem(SCREENING_DOC_UPLOADS_KEY));
  } catch {
    return [];
  }
}

export function appendScreeningDocumentUpload(entry: ScreeningDocumentUpload): void {
  if (typeof window === "undefined") return;
  const prev = loadScreeningDocumentUploads();
  prev.unshift(entry);
  window.localStorage.setItem(SCREENING_DOC_UPLOADS_KEY, JSON.stringify(prev));
  window.dispatchEvent(new Event("arc_screening_uploads_change"));
}

export function removeScreeningDocumentUpload(id: string): void {
  if (typeof window === "undefined") return;
  const next = loadScreeningDocumentUploads().filter((e) => e.id !== id);
  window.localStorage.setItem(SCREENING_DOC_UPLOADS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("arc_screening_uploads_change"));
}
