"use client";

import { useState } from "react";
import { loadUserZip, saveUserZip } from "@/lib/providers-de/useProviderSuggestions";

interface Props {
  isDE: boolean;
  onZipSaved: (zip: string) => void;
}

export function ZipPromptBanner({ isDE, onZipSaved }: Props) {
  const [zip, setZip] = useState<string | null>(() =>
    typeof window !== "undefined" ? loadUserZip() : null,
  );
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState(false);

  const handleSave = () => {
    const val = draft.trim().replace(/\s/g, "");
    if (/^\d{5}$/.test(val)) {
      saveUserZip(val);
      setZip(val);
      setEditing(false);
      setError(false);
      onZipSaved(val);
    } else {
      setError(true);
    }
  };

  if (zip && !editing) {
    return (
      <div className="mb-5 flex items-center justify-between gap-4 rounded-[16px] border border-black/[0.06] bg-[#fafaf9] px-4 py-3">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className="shrink-0 text-[#525252]">
            <path d="M7 1C4.79 1 3 2.79 3 5c0 3.25 4 8 4 8s4-4.75 4-8c0-2.21-1.79-4-4-4z" fill="currentColor" />
            <circle cx="7" cy="5" r="1.25" fill="white" />
          </svg>
          <p className="text-[0.875rem] text-[#525252]">
            {isDE
              ? `Lokale Ergebnisse für PLZ ${zip}`
              : `Local results for ZIP code ${zip}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setDraft(zip); setEditing(true); setError(false); }}
          className="text-[0.8125rem] text-[#737373] underline underline-offset-2 hover:text-[#0c0c0c]"
        >
          {isDE ? "Ändern" : "Change"}
        </button>
      </div>
    );
  }

  return (
    <div className="mb-5 rounded-[16px] border border-black/[0.08] bg-white px-4 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[0.9375rem] font-semibold text-[#0c0c0c]">
            {isDE ? "Lokale Testoptionen anzeigen" : "See local testing options"}
          </p>
          <p className="mt-0.5 text-[0.8125rem] text-[#737373]">
            {isDE
              ? "PLZ eingeben, um Labors und Praxen in Ihrer Nähe zu finden."
              : "Enter your ZIP code to find labs and clinics near you."}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={5}
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value.replace(/\D/g, ""));
                  setError(false);
                }}
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                placeholder={isDE ? "PLZ" : "ZIP"}
                autoComplete="postal-code"
                className={`w-24 rounded-[10px] border px-3 py-2 text-[0.875rem] text-[#0c0c0c] placeholder:text-[#a3a3a3] focus:outline-none ${
                  error
                    ? "border-red-400 focus:border-red-500"
                    : "border-black/[0.1] focus:border-black/[0.3]"
                }`}
              />
              <button
                type="button"
                onClick={handleSave}
                disabled={draft.length !== 5}
                className="rounded-[10px] bg-[#0c0c0c] px-4 py-2 text-[0.875rem] font-medium text-white transition-[filter] hover:brightness-[0.88] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isDE ? "Speichern" : "Save"}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={() => { setEditing(false); setError(false); }}
                  className="text-[0.8125rem] text-[#a3a3a3] hover:text-[#737373]"
                >
                  {isDE ? "Abbrechen" : "Cancel"}
                </button>
              )}
            </div>
            {error && (
              <p className="text-[0.75rem] text-red-500">
                {isDE ? "Bitte 5-stellige PLZ eingeben" : "Please enter a valid 5-digit ZIP code"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
