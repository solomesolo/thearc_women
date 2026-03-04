"use client";

import { useState } from "react";
import Link from "next/link";
import type { ConsentPreferences } from "@/lib/cookieConsent";

type Props = {
  consent: ConsentPreferences;
  onSave: (c: ConsentPreferences) => void;
  onClose: () => void;
};

export function CookieSettingsPanel({ consent, onSave, onClose }: Props) {
  const [analytics, setAnalytics] = useState(consent.analytics);
  const [preferences, setPreferences] = useState(consent.preferences);
  const [marketing, setMarketing] = useState(consent.marketing);

  const handleSave = () => {
    onSave({
      ...consent,
      analytics,
      preferences,
      marketing,
      timestamp: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/10 p-4 sm:items-center">
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--color-border-hairline)] bg-[var(--background)] p-6 shadow-xl"
        role="dialog"
        aria-label="Cookie preferences"
      >
        <h2 className="text-lg font-medium text-[var(--text-primary)]">
          Cookie preferences
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Essential cookies are always active. Choose which other categories you allow.
        </p>
        <div className="mt-6 space-y-4">
          <label className="flex items-center gap-3">
            <input type="checkbox" checked disabled className="rounded" />
            <span className="text-sm text-[var(--text-primary)]">Essential (always active)</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={analytics}
              onChange={(e) => setAnalytics(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-[var(--text-primary)]">Analytics</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={preferences}
              onChange={(e) => setPreferences(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-[var(--text-primary)]">Preferences</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={marketing}
              onChange={(e) => setMarketing(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-[var(--text-primary)]">Marketing</span>
          </label>
        </div>
        <p className="mt-4 text-xs text-[var(--text-secondary)]">
          <Link href="/cookies" className="underline hover:text-[var(--text-primary)]">Cookie policy</Link>
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-[14px] border border-[var(--foreground)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--foreground)]/5"
          >
            Save preferences
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[14px] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
