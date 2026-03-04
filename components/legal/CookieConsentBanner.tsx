"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getStoredConsent,
  setStoredConsent,
  hasValidConsent,
  DEFAULT_CONSENT,
  PRIVACY_VERSION,
  TERMS_VERSION,
  type ConsentPreferences,
} from "@/lib/cookieConsent";
import { CookieSettingsPanel } from "@/components/legal/CookieSettingsPanel";

export function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const consent = getStoredConsent();
    if (!consent || consent.privacyVersion !== PRIVACY_VERSION) {
      setShowBanner(true);
    }
  }, [mounted]);

  const acceptAll = () => {
    const consent: ConsentPreferences = {
      ...DEFAULT_CONSENT,
      analytics: true,
      preferences: true,
      marketing: true,
      timestamp: new Date().toISOString(),
      privacyVersion: PRIVACY_VERSION,
      termsVersion: TERMS_VERSION,
    };
    setStoredConsent(consent);
    setShowBanner(false);
  };

  const rejectNonEssential = () => {
    const consent: ConsentPreferences = {
      ...DEFAULT_CONSENT,
      analytics: false,
      preferences: false,
      marketing: false,
      timestamp: new Date().toISOString(),
      privacyVersion: PRIVACY_VERSION,
      termsVersion: TERMS_VERSION,
    };
    setStoredConsent(consent);
    setShowBanner(false);
  };

  const openPanel = () => {
    setShowPanel(true);
  };

  const savePreferences = (c: ConsentPreferences) => {
    setStoredConsent({
      ...c,
      privacyVersion: PRIVACY_VERSION,
      termsVersion: TERMS_VERSION,
    });
    setShowBanner(false);
  };

  if (!mounted || !showBanner) return null;

  const stored = getStoredConsent();
  const currentConsent: ConsentPreferences = stored ?? DEFAULT_CONSENT;

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-border-hairline)] bg-[var(--background)] p-4 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] md:p-6"
        role="dialog"
        aria-label="Cookie consent"
      >
        <div className="mx-auto max-w-3xl">
          <p className="text-sm leading-[1.6] text-[var(--text-primary)]">
            This website uses cookies to improve functionality, analyze usage,
            and enhance your experience. You can accept all cookies or manage
            your preferences.
          </p>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">
            <Link href="/privacy" className="underline hover:text-[var(--text-primary)]">
              Privacy Policy
            </Link>
            {" · "}
            <Link href="/cookies" className="underline hover:text-[var(--text-primary)]">
              Cookie Policy
            </Link>
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={acceptAll}
              className="rounded-[14px] border border-[var(--foreground)] bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)] hover:opacity-90"
            >
              Accept All
            </button>
            <button
              type="button"
              onClick={rejectNonEssential}
              className="rounded-[14px] border border-[var(--color-border-hairline)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--color-surface)]/60"
            >
              Reject Non-Essential
            </button>
            <button
              type="button"
              onClick={openPanel}
              className="rounded-[14px] border border-[var(--color-border-hairline)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--color-surface)]/60"
            >
              Manage Preferences
            </button>
          </div>
        </div>
      </div>

      {showPanel && (
        <CookieSettingsPanel
          consent={currentConsent}
          onSave={savePreferences}
          onClose={() => setShowPanel(false)}
        />
      )}
    </>
  );
}
