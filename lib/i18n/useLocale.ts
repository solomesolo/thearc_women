"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import { getStoredLocale, localeFromPathname, setStoredLocale, type Locale } from "./locale";
import { usePathname } from "next/navigation";

export function useLocale(): Locale {
  const pathname = usePathname();
  const [locale, setLocale] = useState<Locale>("en");

  const sync = useCallback(() => {
    const fromPath = localeFromPathname(pathname);
    if (fromPath) {
      setStoredLocale(fromPath);
      setLocale(fromPath);
      return;
    }
    setLocale(getStoredLocale());
  }, [pathname]);

  useEffect(() => {
    startTransition(() => {
      sync();
    });
  }, [sync]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onLocaleChange = () => {
      startTransition(() => {
        const fromPath = localeFromPathname(pathname);
        if (fromPath) {
          setLocale(fromPath);
          return;
        }
        setLocale(getStoredLocale());
      });
    };
    window.addEventListener("arc_locale_change", onLocaleChange);
    return () => window.removeEventListener("arc_locale_change", onLocaleChange);
  }, [pathname]);

  return locale;
}
