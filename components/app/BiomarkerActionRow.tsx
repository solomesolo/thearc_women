"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/useLocale";
import { InsuranceAndDoctorGuidanceCard } from "@/components/app/InsuranceAndDoctorGuidanceCard";
import { useBiomarkerGuidance } from "@/lib/doctor-guidance/useBiomarkerGuidance";

// ── Health Wallet storage ─────────────────────────────────────────────────────

interface BiomarkerWalletEntry {
  date: string;
  value: string;
  notes: string;
  fileName: string | null;
  fileType: string | null;
  savedAt: string;
}

function walletKey(biomarkerKey: string) {
  return `arc_bm_wallet_${biomarkerKey}`;
}

function loadWalletEntry(biomarkerKey: string): BiomarkerWalletEntry | null {
  try {
    const raw = localStorage.getItem(walletKey(biomarkerKey));
    if (raw) return JSON.parse(raw) as BiomarkerWalletEntry;
  } catch { /* ignore */ }
  return null;
}

function saveWalletEntry(biomarkerKey: string, entry: BiomarkerWalletEntry) {
  try { localStorage.setItem(walletKey(biomarkerKey), JSON.stringify(entry)); } catch { /* ignore */ }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BiomarkerActionRow({
  biomarkerName,
  biomarkerKey,
  country,
}: {
  biomarkerName: string;
  biomarkerKey: string;
  country: string | null;
}) {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [savedEntry, setSavedEntry] = useState<BiomarkerWalletEntry | null>(() => {
    if (typeof window === "undefined") return null;
    return loadWalletEntry(biomarkerKey);
  });
  const [resultDate, setResultDate] = useState("");
  const [resultValue, setResultValue] = useState("");
  const [resultNotes, setResultNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { data: guidance, isLoading } = useBiomarkerGuidance(open ? biomarkerKey : null, country);

  const L = {
    hideBooking: locale === "de" ? "Verbergen" : "Hide booking & coverage",
    showBooking: locale === "de" ? "Buchung & Abdeckung anzeigen" : "Show booking & coverage",
    walletTitle: locale === "de" ? "In Health Wallet speichern" : "Save to Health Wallet",
    walletSaved: locale === "de" ? "In Health Wallet gespeichert" : "Saved to Health Wallet",
    walletButton: locale === "de" ? "Ergebnis hinzufügen" : "Add result",
    dateLabel: locale === "de" ? "Datum (optional)" : "Date (optional)",
    valueLabel: locale === "de" ? "Messwert (optional)" : "Result value (optional)",
    valuePlaceholder: locale === "de" ? "z. B. 12,5 ng/mL" : "e.g. 12.5 ng/mL",
    notesLabel: locale === "de" ? "Notizen (optional)" : "Notes (optional)",
    notesPh: locale === "de" ? "z. B. Im Normalbereich" : "e.g. Within normal range",
    uploadFile: locale === "de" ? "PDF oder Foto hochladen" : "Upload PDF or photo",
    fileSelected: locale === "de" ? "Datei ausgewählt" : "File selected",
    saveBtn: locale === "de" ? "In Wallet speichern" : "Save to Wallet",
    cancelBtn: locale === "de" ? "Abbrechen" : "Cancel",
    bookLab: locale === "de" ? "Im Labor buchen" : "Book at a lab",
    homeTest: locale === "de" ? "Heimtest" : "Home test",
    throughDoctor: locale === "de" ? "Beim Arzt" : "Through your doctor",
    localLab: locale === "de" ? "Nächstes Labor" : "Local lab",
    chooseLab: locale === "de" ? "Labor in der Nähe wählen" : "Choose a nearby lab",
    openMaps: locale === "de" ? "In Maps öffnen" : "Open in Maps",
    homeTestOption: locale === "de" ? "Heimtest-Option" : "Home test option",
    ifAvailable: locale === "de" ? "Falls in Ihrer Region verfügbar" : "If available in your area",
    orderOnline: locale === "de" ? "Online bestellen" : "Order online",
  };

  const handleSave = () => {
    const entry: BiomarkerWalletEntry = {
      date: resultDate,
      value: resultValue,
      notes: resultNotes,
      fileName: selectedFile?.name ?? null,
      fileType: selectedFile?.type ?? null,
      savedAt: new Date().toISOString(),
    };
    saveWalletEntry(biomarkerKey, entry);
    setSavedEntry(entry);
    setShowWallet(false);
    setSelectedFile(null);
    setResultDate("");
    setResultValue("");
    setResultNotes("");
  };

  const isSaved = !!savedEntry;

  return (
    <div className="overflow-hidden rounded-[18px] border border-black/[0.08] bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[0.9375rem] font-semibold text-[#0c0c0c]">{biomarkerName}</p>
            {isSaved && (
              <span className="rounded-full bg-[#f0f0ef] px-2 py-0.5 text-[0.6875rem] font-semibold text-[#525252]">
                ✓ Wallet
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[0.8125rem] text-[#737373]">
            {open ? L.hideBooking : L.showBooking}
          </p>
        </div>
        <span className="mt-0.5 shrink-0 text-[0.8125rem] font-medium text-[#737373]">
          {open ? "—" : "+"}
        </span>
      </button>

      {open && (
        <div className="border-t border-black/[0.07]">

          {/* ── Health Wallet strip ── */}
          {!showWallet && (
            <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-[#fafaf9]">
              {isSaved ? (
                <div className="min-w-0">
                  <p className="text-[0.8125rem] font-medium text-[#404040]">✓ {L.walletSaved}</p>
                  <p className="text-[0.75rem] text-[#a3a3a3]">
                    {savedEntry.value && <>{savedEntry.value} · </>}
                    {savedEntry.date && <>{savedEntry.date} · </>}
                    {savedEntry.fileName && <>📎 {savedEntry.fileName}</>}
                    {!savedEntry.value && !savedEntry.date && !savedEntry.fileName && savedEntry.notes.slice(0, 60)}
                  </p>
                </div>
              ) : (
                <p className="text-[0.8125rem] text-[#a3a3a3]">
                  {locale === "de"
                    ? "PDF oder Foto hochladen und Ergebnis speichern."
                    : "Upload a lab PDF or photo and save the result."}
                </p>
              )}
              <button
                type="button"
                onClick={() => setShowWallet(true)}
                className="shrink-0 rounded-[12px] border border-black/[0.1] px-3 py-2 text-[0.8125rem] font-medium text-[#404040] transition-colors hover:text-[#0c0c0c]"
              >
                {isSaved
                  ? (locale === "de" ? "Bearbeiten" : "Edit")
                  : L.walletButton}
              </button>
            </div>
          )}

          {/* ── Wallet entry panel ── */}
          {showWallet && (
            <div className="border-b border-black/[0.07] bg-[#fafaf9] px-5 py-5 space-y-3">
              <p className="text-[0.9375rem] font-semibold text-[#0c0c0c]">{L.walletTitle}</p>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-[0.8125rem] font-medium text-[#737373]">{L.dateLabel}</label>
                  <input
                    type="date"
                    value={resultDate}
                    onChange={(e) => setResultDate(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    className="mt-1.5 w-full rounded-[10px] border border-black/[0.1] bg-white px-3 py-2 text-[0.875rem] text-[#0c0c0c] focus:border-black/[0.3] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[0.8125rem] font-medium text-[#737373]">{L.valueLabel}</label>
                  <input
                    type="text"
                    value={resultValue}
                    onChange={(e) => setResultValue(e.target.value)}
                    placeholder={L.valuePlaceholder}
                    className="mt-1.5 w-full rounded-[10px] border border-black/[0.1] bg-white px-3 py-2 text-[0.875rem] text-[#0c0c0c] placeholder:text-[#a3a3a3] focus:border-black/[0.3] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[0.8125rem] font-medium text-[#737373]">{L.notesLabel}</label>
                <textarea
                  value={resultNotes}
                  onChange={(e) => setResultNotes(e.target.value)}
                  rows={2}
                  placeholder={L.notesPh}
                  className="mt-1.5 w-full resize-none rounded-[10px] border border-black/[0.1] bg-white px-3 py-2 text-[0.875rem] text-[#0c0c0c] placeholder:text-[#a3a3a3] focus:border-black/[0.3] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[0.8125rem] font-medium text-[#737373]">{L.uploadFile}</label>
                <label className="mt-1.5 flex cursor-pointer items-center gap-2.5 rounded-[10px] border border-dashed border-black/[0.15] bg-white px-4 py-3 transition-colors hover:border-black/[0.3]">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0 text-[#737373]">
                    <path d="M8 1v10M4 5l4-4 4 4M2 13h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-[0.8125rem] text-[#525252]">
                    {selectedFile ? `${L.fileSelected}: ${selectedFile.name}` : L.uploadFile}
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="sr-only"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-[10px] bg-[#0c0c0c] px-4 py-2 text-[0.875rem] font-medium text-white transition-[filter] hover:brightness-[0.88]"
                >
                  {L.saveBtn}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowWallet(false); setSelectedFile(null); }}
                  className="rounded-[10px] border border-black/[0.1] px-4 py-2 text-[0.875rem] font-medium text-[#737373] transition-colors hover:text-[#0c0c0c]"
                >
                  {L.cancelBtn}
                </button>
              </div>
            </div>
          )}

          {/* ── Booking / coverage panels ── */}
          <div className="grid grid-cols-1 divide-y divide-black/[0.07] md:grid-cols-3 md:divide-x md:divide-y-0">
            <div className="px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">{L.bookLab}</p>
              <div className="mt-3 rounded-[12px] border border-black/[0.07] bg-[#fafaf9] p-3.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[0.9375rem] font-semibold text-[#0c0c0c]">{L.localLab}</span>
                  <span className="shrink-0 text-[0.9375rem] font-semibold text-[#0c0c0c]">—</span>
                </div>
                <p className="mt-1 text-[0.8125rem] leading-snug text-[#737373]">{L.chooseLab}</p>
                <Link
                  href="#"
                  className="mt-2.5 inline-flex items-center gap-1 rounded-[8px] border border-black/[0.1] bg-white px-3 py-1.5 text-[0.8125rem] font-medium text-[#404040] transition-colors hover:bg-[#f0f0ef]"
                >
                  {L.openMaps}
                </Link>
              </div>
            </div>

            <div className="px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">{L.homeTest}</p>
              <div className="mt-3 rounded-[12px] border border-black/[0.07] bg-[#fafaf9] p-3.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[0.9375rem] font-semibold text-[#0c0c0c]">{L.homeTestOption}</span>
                  <span className="shrink-0 text-[0.9375rem] font-semibold text-[#0c0c0c]">—</span>
                </div>
                <p className="mt-1 text-[0.8125rem] leading-snug text-[#737373]">{L.ifAvailable}</p>
                <Link
                  href="#"
                  className="mt-2.5 inline-flex items-center gap-1 rounded-[8px] border border-black/[0.1] bg-white px-3 py-1.5 text-[0.8125rem] font-medium text-[#404040] transition-colors hover:bg-[#f0f0ef]"
                >
                  {L.orderOnline}
                </Link>
              </div>
            </div>

            <div className="px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">{L.throughDoctor}</p>
              <div className="mt-3">
                <InsuranceAndDoctorGuidanceCard guidance={guidance} isLoading={isLoading} country={country} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
