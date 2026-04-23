"use client";

import { useEffect, useState } from "react";
import { getStoredLocale, localeFromPathname, setStoredLocale, type Locale } from "./locale";
import { usePathname } from "next/navigation";

export function useLocale(): Locale {
  const pathname = usePathname();
  // Always start with "en" so server HTML and first client render match (no hydration mismatch).
  // The real stored/path-derived locale is applied in the effect, which runs client-only.
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    const fromPath = localeFromPathname(pathname);
    if (fromPath) {
      setStoredLocale(fromPath);
      setLocale(fromPath);
      return;
    }
    const stored = getStoredLocale();
    setLocale(stored);
  }, [pathname]);

  return locale;
}

