export const CONSENT_STORAGE_KEY = "thearc_cookie_consent";
export const PRIVACY_VERSION = "1.0";
export const TERMS_VERSION = "1.0";

export interface ConsentPreferences {
  analytics: boolean;
  preferences: boolean;
  marketing: boolean;
  timestamp: string;
  privacyVersion?: string;
  termsVersion?: string;
}

export const DEFAULT_CONSENT: ConsentPreferences = {
  analytics: false,
  preferences: false,
  marketing: false,
  timestamp: new Date().toISOString(),
  privacyVersion: PRIVACY_VERSION,
  termsVersion: TERMS_VERSION,
};

export function getStoredConsent(): ConsentPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ConsentPreferences;
  } catch {
    return null;
  }
}

export function setStoredConsent(consent: ConsentPreferences): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
  } catch {
    // no-op
  }
}

export function hasValidConsent(): boolean {
  const stored = getStoredConsent();
  if (!stored) return false;
  return stored.privacyVersion === PRIVACY_VERSION;
}

/** Load analytics scripts only when consent.analytics === true (call from client). */
export function shouldLoadAnalytics(): boolean {
  const c = getStoredConsent();
  return c?.analytics === true;
}
