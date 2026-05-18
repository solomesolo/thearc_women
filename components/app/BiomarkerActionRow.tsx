"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n/useLocale";

// ── Health Wallet storage ─────────────────────────────────────────────────────

export type BiomarkerResultStatus = "in_range" | "borderline" | "out_of_range" | "unknown";

export interface BiomarkerWalletEntry {
  date: string;
  value: string;
  numericValue: number | null; // parsed from value for trend charts
  notes: string;
  fileName: string | null;
  fileType: string | null;
  status: BiomarkerResultStatus;
  savedAt: string;
}

function parseNumericValue(raw: string): number | null {
  const m = raw.match(/[-+]?(\d+\.?\d*|\.\d+)/);
  return m ? parseFloat(m[0]) : null;
}

function walletKey(biomarkerKey: string) {
  return `arc_bm_wallet_${biomarkerKey}`;
}

export function loadWalletHistory(biomarkerKey: string): BiomarkerWalletEntry[] {
  try {
    const raw = localStorage.getItem(walletKey(biomarkerKey));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Migrate: old format was a single object, new format is an array
    if (Array.isArray(parsed)) return parsed as BiomarkerWalletEntry[];
    // Single legacy object → wrap in array, backfill new fields
    const legacy = parsed as Record<string, unknown>;
    return [{
      date: (legacy.date as string) ?? "",
      value: (legacy.value as string) ?? "",
      numericValue: parseNumericValue((legacy.value as string) ?? ""),
      notes: (legacy.notes as string) ?? "",
      fileName: (legacy.fileName as string | null) ?? null,
      fileType: (legacy.fileType as string | null) ?? null,
      status: "unknown" as BiomarkerResultStatus,
      savedAt: (legacy.savedAt as string) ?? new Date().toISOString(),
    }];
  } catch { return []; }
}

function saveWalletHistory(biomarkerKey: string, entries: BiomarkerWalletEntry[]) {
  try { localStorage.setItem(walletKey(biomarkerKey), JSON.stringify(entries)); } catch { /* ignore */ }
}

// ── Component ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: BiomarkerResultStatus; labelEn: string; labelDe: string; color: string }[] = [
  { value: "in_range",     labelEn: "In range",     labelDe: "Im Normalbereich", color: "text-[#16a34a]" },
  { value: "borderline",   labelEn: "Borderline",   labelDe: "Grenzwertig",      color: "text-[#d97706]" },
  { value: "out_of_range", labelEn: "Out of range", labelDe: "Außerhalb",        color: "text-[#dc2626]" },
  { value: "unknown",      labelEn: "Not sure",     labelDe: "Unklar",           color: "text-[#737373]" },
];

export function BiomarkerActionRow({
  biomarkerName,
  biomarkerKey,
  country: _country,
}: {
  biomarkerName: string;
  biomarkerKey: string;
  country: string | null;
}) {
  const locale = useLocale();
  const isDE = locale === "de";

  const [open, setOpen] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [history, setHistory] = useState<BiomarkerWalletEntry[]>(() => {
    if (typeof window === "undefined") return [];
    return loadWalletHistory(biomarkerKey);
  });

  const [resultDate, setResultDate] = useState("");
  const [resultValue, setResultValue] = useState("");
  const [resultNotes, setResultNotes] = useState("");
  const [resultStatus, setResultStatus] = useState<BiomarkerResultStatus>("unknown");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const latest = history.length > 0 ? history[history.length - 1] : null;
  const isSaved = latest !== null;

  const statusColor = (s: BiomarkerResultStatus) => {
    if (s === "in_range") return "text-[#16a34a]";
    if (s === "borderline") return "text-[#d97706]";
    if (s === "out_of_range") return "text-[#dc2626]";
    return "text-[#737373]";
  };

  const statusBgBorder = (s: BiomarkerResultStatus) => {
    if (s === "out_of_range") return "border-red-200 bg-red-50";
    if (s === "borderline") return "border-amber-200 bg-amber-50";
    if (s === "in_range") return "border-green-200 bg-[#f0fdf4]";
    return "border-black/[0.08] bg-white";
  };

  const L = {
    hide: isDE ? "Verbergen" : "Hide booking & coverage",
    show: isDE ? "Buchung & Abdeckung anzeigen" : "Show booking & coverage",
    walletTitle: isDE ? "Ergebnis in Health Wallet speichern" : "Save result to Health Wallet",
    walletSaved: isDE ? "In Health Wallet gespeichert" : "Saved to Health Wallet",
    addResult: isDE ? "Ergebnis hinzufügen" : "Add result",
    editResult: isDE ? "Bearbeiten" : "Edit",
    dateLabel: isDE ? "Datum (optional)" : "Date (optional)",
    valueLabel: isDE ? "Messwert" : "Result value",
    valuePh: isDE ? "z. B. 12,5 ng/mL" : "e.g. 12.5 ng/mL",
    notesLabel: isDE ? "Notizen (optional)" : "Notes (optional)",
    notesPh: isDE ? "z. B. Arzt empfiehlt Wiederholung in 3 Monaten" : "e.g. Doctor recommends repeat in 3 months",
    statusLabel: isDE ? "Ergebnisstatus" : "Result status",
    uploadFile: isDE ? "PDF oder Foto hochladen" : "Upload PDF or photo",
    fileSelected: isDE ? "Datei ausgewählt" : "File selected",
    saveBtn: isDE ? "In Wallet speichern" : "Save to Wallet",
    cancelBtn: isDE ? "Abbrechen" : "Cancel",
    consultDoctor: isDE ? "Mit dem Arzt besprechen" : "Consult your doctor",
    history: isDE ? "Verlauf" : "History",
    noHistory: isDE ? "Noch keine Einträge" : "No entries yet",
  };

  const handleSave = () => {
    const entry: BiomarkerWalletEntry = {
      date: resultDate,
      value: resultValue,
      numericValue: parseNumericValue(resultValue),
      notes: resultNotes,
      fileName: selectedFile?.name ?? null,
      fileType: selectedFile?.type ?? null,
      status: resultStatus,
      savedAt: new Date().toISOString(),
    };
    const next = [...history, entry];
    saveWalletHistory(biomarkerKey, next);
    setHistory(next);
    setShowWallet(false);
    setSelectedFile(null);
    setResultDate("");
    setResultValue("");
    setResultNotes("");
    setResultStatus("unknown");
  };

  const latestStatusOpt = STATUS_OPTIONS.find((o) => o.value === latest?.status);

  return (
    <div className={`overflow-hidden rounded-[18px] border ${latest ? statusBgBorder(latest.status) : "border-black/[0.08] bg-white"}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[0.9375rem] font-semibold text-[#0c0c0c]">{biomarkerName}</p>
            {isSaved && latest && (
              <span className={`text-[0.6875rem] font-semibold ${statusColor(latest.status)}`}>
                {latestStatusOpt ? (isDE ? latestStatusOpt.labelDe : latestStatusOpt.labelEn) : ""}
              </span>
            )}
            {isSaved && (
              <span className="rounded-full bg-[#f0f0ef] px-2 py-0.5 text-[0.6875rem] font-semibold text-[#525252]">
                ✓ Wallet
              </span>
            )}
          </div>
          {latest?.value && (
            <p className="mt-0.5 text-[0.8125rem] text-[#404040]">
              {latest.value}{latest.date ? ` · ${latest.date}` : ""}
              {history.length > 1 && (
                <span className="ml-1.5 text-[#737373]">({history.length} entries)</span>
              )}
            </p>
          )}
          {!latest && (
            <p className="mt-0.5 text-[0.8125rem] text-[#737373]">
              {open ? L.hide : L.show}
            </p>
          )}
        </div>
        <span className="mt-0.5 shrink-0 text-[0.8125rem] font-medium text-[#737373]">
          {open ? "—" : "+"}
        </span>
      </button>

      {open && (
        <div className="border-t border-black/[0.07]">

          {/* Out-of-range warning */}
          {latest?.status === "out_of_range" && (
            <div className="flex items-center gap-2 border-b border-red-100 bg-red-50 px-5 py-3">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0 text-red-500">
                <path d="M8 2L1 14h14L8 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M8 7v3M8 11.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <p className="text-[0.8125rem] font-medium text-red-700">{L.consultDoctor}</p>
            </div>
          )}
          {latest?.status === "borderline" && (
            <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50 px-5 py-3">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0 text-amber-500">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
                <path d="M8 5v4M8 10.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <p className="text-[0.8125rem] font-medium text-amber-700">
                {isDE ? "Grenzwertiger Befund — beim nächsten Arztbesuch ansprechen" : "Borderline result — worth discussing at your next appointment"}
              </p>
            </div>
          )}

          {/* Health Wallet strip */}
          {!showWallet && (
            <div className="flex items-center justify-between gap-3 bg-[#fafaf9] px-5 py-3.5">
              {isSaved && latest ? (
                <div className="min-w-0">
                  <p className={`text-[0.8125rem] font-medium ${statusColor(latest.status)}`}>
                    {latestStatusOpt ? (isDE ? latestStatusOpt.labelDe : latestStatusOpt.labelEn) : "✓"} · {latest.value || L.walletSaved}
                    {latest.date ? ` · ${latest.date}` : ""}
                  </p>
                  {latest.fileName && <p className="text-[0.75rem] text-[#a3a3a3]">📎 {latest.fileName}</p>}
                </div>
              ) : (
                <p className="text-[0.8125rem] text-[#a3a3a3]">
                  {isDE ? "PDF oder Foto hochladen und Ergebnis speichern." : "Upload a lab PDF or photo and save the result."}
                </p>
              )}
              <button
                type="button"
                onClick={() => setShowWallet(true)}
                className="shrink-0 rounded-[12px] border border-black/[0.1] px-3 py-2 text-[0.8125rem] font-medium text-[#404040] transition-colors hover:text-[#0c0c0c]"
              >
                {isSaved ? L.editResult : L.addResult}
              </button>
            </div>
          )}

          {/* Wallet entry form */}
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
                    placeholder={L.valuePh}
                    className="mt-1.5 w-full rounded-[10px] border border-black/[0.1] bg-white px-3 py-2 text-[0.875rem] text-[#0c0c0c] placeholder:text-[#a3a3a3] focus:border-black/[0.3] focus:outline-none"
                  />
                </div>
              </div>

              {/* Status selector */}
              <div>
                <label className="block text-[0.8125rem] font-medium text-[#737373]">{L.statusLabel}</label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setResultStatus(opt.value)}
                      className={`rounded-[8px] border px-3 py-1.5 text-[0.8125rem] font-medium transition-colors ${
                        resultStatus === opt.value
                          ? `${opt.color} border-current bg-white shadow-sm`
                          : "border-black/[0.1] text-[#737373] hover:text-[#404040]"
                      }`}
                    >
                      {isDE ? opt.labelDe : opt.labelEn}
                    </button>
                  ))}
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
                  <input type="file" accept="image/*,.pdf" className="sr-only" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
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

          {/* Entry history (shown when 2+ entries) */}
          {history.length > 1 && !showWallet && (
            <div className="border-b border-black/[0.07] px-5 py-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#737373]">{L.history}</p>
              <div className="space-y-1">
                {history.slice().reverse().slice(0, 4).map((e, i) => {
                  const sOpt = STATUS_OPTIONS.find((o) => o.value === e.status);
                  return (
                    <div key={i} className="flex items-center gap-2 text-[0.8125rem]">
                      <span className="text-[#a3a3a3]">{e.date || "—"}</span>
                      <span className="font-medium text-[#404040]">{e.value || "—"}</span>
                      {sOpt && <span className={`text-[0.75rem] ${sOpt.color}`}>{isDE ? sOpt.labelDe : sOpt.labelEn}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
