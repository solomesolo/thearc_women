export type Locale = "en" | "de";

export const LOCALE_STORAGE_KEY = "arc_locale";

export function normalizeLocale(v: unknown): Locale {
  return v === "de" ? "de" : "en";
}

export function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    return normalizeLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY));
  } catch {
    return "en";
  }
}

export function setStoredLocale(locale: Locale) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {}
}

export function localeFromPathname(pathname: string | null | undefined): Locale | null {
  if (!pathname) return null;
  return pathname.startsWith("/de") ? "de" : null;
}

