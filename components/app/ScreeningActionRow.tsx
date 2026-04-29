"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/lib/i18n/useLocale";
import { AddToHealthCalendarModal } from "@/components/app/AddToHealthCalendarModal";
import { RemindMeButton } from "@/components/app/RemindMeButton";
import {
  loadScreeningEvents,
  saveScreeningEvents,
  type HealthCalendarEventMeta,
} from "@/lib/calendar/localHealthCalendarStore";
export {
  SCREENING_ALIASES,
  RISK_ADJUSTED_SCREENINGS,
  deduplicateScreenings,
  getRiskAdjustedScreenings,
} from "@/lib/screenings/screeningUtils";

// ── Types ─────────────────────────────────────────────────────────────────────

type ScreeningStatus = "missing" | "planned" | "done";

export interface ScreeningResult {
  date: string;
  notes: string;
  fileName: string | null;
  fileType: string | null;
  savedAt: string;
}

import {
  SCREENING_ALIASES,
  RISK_ADJUSTED_SCREENINGS,
} from "@/lib/screenings/screeningUtils";

// ── Bilingual metadata ────────────────────────────────────────────────────────

type Meta = {
  why_en: string; why_de: string;
  where_en: string; where_de: string;
  wait_en: string; wait_de: string;
};

const METADATA: Record<string, Meta> = {
  "Chlamydia (Urine)": {
    why_en: "At your age, this is a simple 'peace of mind' test. Chlamydia often has no symptoms, so checking once a year ensures you protect your long-term fertility and health without any guesswork.",
    why_de: "In Ihrem Alter gibt Ihnen dieser einfache Test Sicherheit. Da Chlamydien oft keine Symptome verursachen, schützt ein jährlicher Check Ihre Fruchtbarkeit und Gesundheit.",
    where_en: "Gynecologist (Frauenarzt) or General Practitioner (Hausarzt)",
    where_de: "Frauenarzt oder Hausarzt",
    wait_en: "1–4 weeks", wait_de: "1–4 Wochen",
  },
  "Dental": {
    why_en: "Beyond a bright smile, regular checks prevent inflammation that can affect your whole body. Plus, keeping your 'Bonusheft' stamped every year saves you significant costs on future dental work.",
    why_de: "Neben einem strahlenden Lächeln verhindern regelmäßige Kontrollen Entzündungen, die den ganzen Körper belasten können. Zudem spart ein gepflegtes Bonusheft Ihnen später viel Geld.",
    where_en: "Dentist (Zahnarzt)",
    where_de: "Zahnarzt",
    wait_en: "2–6 weeks", wait_de: "2–6 Wochen",
  },
  "Physical": {
    why_en: "This is your regular 'health baseline' check. It's a moment for you and your doctor to look at the big picture — like blood pressure and heart health — to keep you feeling your best as you age.",
    why_de: "Dies ist Ihr regelmäßiger Gesundheits-Check-up. Ein Moment, in dem Sie und Ihr Arzt das Gesamtbild — wie Blutdruck und Herzgesundheit — im Blick behalten.",
    where_en: "General Practitioner (Hausarzt)",
    where_de: "Hausarzt",
    wait_en: "1–3 weeks", wait_de: "1–3 Wochen",
  },
  "Pap Smear": {
    why_en: "Your body is excellent at renewal, but sometimes small changes happen unnoticed. This routine cell-check ensures any shifts are caught early when they are incredibly easy to manage.",
    why_de: "Ihr Körper erneuert sich ständig, aber manchmal treten kleine Veränderungen unbemerkt auf. Diese Routine-Untersuchung stellt sicher, dass alles im grünen Bereich bleibt.",
    where_en: "Gynecologist (Frauenarzt)",
    where_de: "Frauenarzt",
    wait_en: "2–4 months", wait_de: "2–4 Monate",
  },
  "Genital Exam": {
    why_en: "A gentle physical check to ensure everything is functioning as it should. It's the best way to detect any structural changes or infections before they cause discomfort.",
    why_de: "Eine sanfte Untersuchung, um sicherzustellen, dass alles so funktioniert, wie es soll. Der beste Weg, Veränderungen frühzeitig zu bemerken.",
    where_en: "Gynecologist (Frauenarzt)",
    where_de: "Frauenarzt",
    wait_en: "2–4 months", wait_de: "2–4 Monate",
  },
  "Breast Palpation": {
    why_en: "Starting at 30, your doctor helps you stay familiar with your body. Feeling for changes is a simple, proactive way to ensure your breast health is monitored between scans.",
    why_de: "Ab 30 hilft Ihnen Ihr Arzt, Ihren Körper besser kennenzulernen. Das Abtasten ist ein einfacher Weg, um Ihre Brustgesundheit zwischen den Scans im Blick zu behalten.",
    where_en: "Gynecologist (Frauenarzt)",
    where_de: "Frauenarzt",
    wait_en: "2–4 months", wait_de: "2–4 Monate",
  },
  "Skin Check": {
    why_en: "Our skin 'remembers' every sunlit day. This head-to-toe check-up gives you the confidence that your beauty marks and moles are healthy, especially if you have a family history of light skin.",
    why_de: "Unsere Haut vergisst keinen Sonnenstrahl. Dieser Ganzkörper-Check gibt Ihnen die Sicherheit, dass Ihre Muttermale gesund sind — besonders bei hellem Hauttyp in der Familie.",
    where_en: "Dermatologist (Hautarzt) or certified GP",
    where_de: "Hautarzt oder zertifizierter Hausarzt",
    wait_en: "3–6 months", wait_de: "3–6 Monate",
  },
  "HPV+Pap": {
    why_en: "From age 35, we add an HPV test to your routine Pap smear. It's the highest level of protection available, giving you dual-layered certainty about your cervical health.",
    why_de: "Ab 35 ergänzen wir den Pap-Test um einen HPV-Test. Das ist die sicherste Vorsorge für den Muttermund, die Ihnen doppelte Gewissheit bietet.",
    where_en: "Gynecologist (Frauenarzt)",
    where_de: "Frauenarzt",
    wait_en: "2–4 months", wait_de: "2–4 Monate",
  },
  "Mammography": {
    why_en: "As tissue changes with age, X-rays are the most reliable way to see 'under the surface.' Every two years, this routine scan catches tiny hidden spots long before they can be felt.",
    why_de: "Da sich das Gewebe im Alter verändert, ist Röntgen die sicherste Methode. Alle zwei Jahre findet dieser Scan kleinste Stellen, bevor man sie überhaupt tasten kann.",
    where_en: "Radiologist (Mammographie-Zentrum)",
    where_de: "Radiologe (Mammographie-Zentrum)",
    wait_en: "4–8 weeks", wait_de: "4–8 Wochen",
  },
  "Stool Test": {
    why_en: "A simple, non-invasive check for your colon health. It looks for tiny invisible signs of blood, which is the best early warning system starting at age 50.",
    why_de: "Ein einfacher, diskreter Test für Ihre Darmgesundheit. Er sucht nach unsichtbaren Spuren von Blut — das beste Frühwarnsystem ab 50 Jahren.",
    where_en: "GP (Hausarzt) or Gynecologist",
    where_de: "Hausarzt oder Frauenarzt",
    wait_en: "1–2 weeks", wait_de: "1–2 Wochen",
  },
  "Colonoscopy": {
    why_en: "This is the 'gold standard' for prevention. It doesn't just find problems — it can actually prevent cancer by removing tiny polyps during the exam. One check every 10 years is usually all it takes.",
    why_de: "Dies ist der Goldstandard der Vorsorge. Er findet Probleme nicht nur — er kann Krebs verhindern, indem Polypen direkt entfernt werden. Meist reicht eine Untersuchung alle 10 Jahre.",
    where_en: "Gastroenterologist (Gastroenterologe)",
    where_de: "Gastroenterologe",
    wait_en: "3–6 months", wait_de: "3–6 Monate",
  },
};

const FALLBACK: Meta = {
  why_en: "This screening is recommended for your age group under German statutory health insurance guidelines.",
  why_de: "Diese Vorsorgeuntersuchung wird für Ihre Altersgruppe gemäß den GKV-Richtlinien empfohlen.",
  where_en: "General Practitioner (Hausarzt) or relevant specialist",
  where_de: "Hausarzt oder zuständiger Facharzt",
  wait_en: "2–6 weeks", wait_de: "2–6 Wochen",
};

function resolveMeta(name: string): Meta {
  if (METADATA[name]) return METADATA[name];
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(METADATA)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return val;
  }
  return FALLBACK;
}

// ── Storage helpers ───────────────────────────────────────────────────────────

function storageKey(name: string, suffix: string) {
  return `arc_sc_${suffix}_${name.replace(/\s+/g, "_")}`;
}

function loadStatus(name: string): ScreeningStatus {
  try {
    const v = localStorage.getItem(storageKey(name, "status"));
    if (v === "planned" || v === "done") return v;
  } catch { /* ignore */ }
  return "missing";
}

function saveStatus(name: string, status: ScreeningStatus) {
  try { localStorage.setItem(storageKey(name, "status"), status); } catch { /* ignore */ }
}

function loadResult(name: string): ScreeningResult | null {
  try {
    const raw = localStorage.getItem(storageKey(name, "result"));
    if (raw) return JSON.parse(raw) as ScreeningResult;
  } catch { /* ignore */ }
  return null;
}

function saveResult(name: string, result: ScreeningResult) {
  try { localStorage.setItem(storageKey(name, "result"), JSON.stringify(result)); } catch { /* ignore */ }
}

// ── Calendar helper ───────────────────────────────────────────────────────────

function downloadCalendarEvent(name: string) {
  const d = new Date();
  d.setDate(d.getDate() + 90);
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStr = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//The Arc Woman//Preventive Screening//EN",
    "BEGIN:VEVENT",
    `SUMMARY:${name}`,
    `DTSTART;VALUE=DATE:${dateStr}`,
    `DTEND;VALUE=DATE:${dateStr}`,
    "DESCRIPTION:GKV covered preventive screening — The Arc Woman",
    `UID:arc-${name.replace(/\s+/g, "-")}-${Date.now()}@thearc`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name.replace(/[^a-z0-9]/gi, "_")}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ScreeningActionRow({ screeningName }: { screeningName: string }) {
  const locale = useLocale();
  const meta = resolveMeta(screeningName);

  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<ScreeningStatus>("missing");
  const [savedResult, setSavedResult] = useState<ScreeningResult | null>(null);
  const [showResultsPanel, setShowResultsPanel] = useState(false);
  const [resultDate, setResultDate] = useState("");
  const [resultNotes, setResultNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [initialMeta, setInitialMeta] = useState<Partial<HealthCalendarEventMeta> | undefined>(undefined);

  // Load persisted state on mount (client-only)
  useEffect(() => {
    setStatus(loadStatus(screeningName));
    setSavedResult(loadResult(screeningName));
  }, [screeningName]);

  const markPlanned = () => {
    saveStatus(screeningName, "planned");
    setStatus("planned");
  };

  const markDone = () => {
    setShowResultsPanel(true);
  };

  const handleSaveResult = () => {
    const result: ScreeningResult = {
      date: resultDate,
      notes: resultNotes,
      fileName: selectedFile?.name ?? null,
      fileType: selectedFile?.type ?? null,
      savedAt: new Date().toISOString(),
    };
    saveResult(screeningName, result);
    saveStatus(screeningName, "done");
    setSavedResult(result);
    setStatus("done");
    setShowResultsPanel(false);
    setSelectedFile(null);
  };

  const handleSkipResult = () => {
    saveStatus(screeningName, "done");
    setStatus("done");
    setShowResultsPanel(false);
  };

  const handleCalendar = () => {
    const stored = loadScreeningEvents();
    const existing = stored[screeningName]?.meta ?? null;
    setInitialMeta(existing ?? undefined);
    setCalendarOpen(true);
  };

  const isDone = status === "done";
  const isPlanned = status === "planned";

  const L = {
    hideDetails: locale === "de" ? "Details ausblenden" : "Hide details",
    showDetails: locale === "de" ? "Details anzeigen" : "Where to get this done",
    whyMatters: locale === "de" ? "Warum wichtig" : "Why this matters",
    whereTo: locale === "de" ? "Wo hingehen" : "Where to go",
    waitTime: locale === "de" ? "Wartezeit" : "Wait time",
    coverage: locale === "de" ? "Kostenübernahme" : "Coverage",
    covered: locale === "de" ? "GKV — übernommen" : "GKV — covered",
    coveredDetail: locale === "de"
      ? "Vollständig durch die gesetzliche Krankenversicherung abgedeckt."
      : "Covered by German statutory health insurance — no additional cost.",
    markPlanned: locale === "de" ? "Als geplant markieren" : "Mark as planned",
    addCalendar: locale === "de" ? "Zum Kalender" : "Add to Calendar",
    done: locale === "de" ? "Erledigt" : "Done",
    planned: locale === "de" ? "Geplant" : "Planned",
    doneLabel: locale === "de" ? "Abgeschlossen" : "Completed",
    resultsTitle: locale === "de" ? "Ergebnisse zur Health Wallet hinzufügen" : "Add results to your Health Wallet",
    resultsDateLabel: locale === "de" ? "Wann erledigt? (optional)" : "When did you complete this? (optional)",
    resultsNotesLabel: locale === "de" ? "Notizen (optional)" : "Notes (optional)",
    uploadFile: locale === "de" ? "PDF oder Foto hochladen" : "Upload PDF or photo",
    fileSelected: locale === "de" ? "Datei ausgewählt" : "File selected",
    saveResults: locale === "de" ? "In Health Wallet speichern" : "Save to Health Wallet",
    skipResults: locale === "de" ? "Überspringen" : "Skip",
    resultSaved: locale === "de" ? "In Health Wallet gespeichert" : "Saved to Health Wallet",
  };

  return (
    <div className={`overflow-hidden rounded-[18px] border bg-white transition-colors ${isDone ? "border-black/[0.05] bg-[#fafaf9]" : "border-black/[0.08]"}`}>
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <div className="min-w-0 flex items-center gap-2.5">
          {isDone && (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0c0c0c] text-white">
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden>
                <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          )}
          {isPlanned && !isDone && (
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#525252]" aria-hidden />
          )}
          <div>
            <p className={`text-[0.9375rem] font-semibold ${isDone ? "text-[#737373] line-through" : "text-[#0c0c0c]"}`}>
              {screeningName}
            </p>
            {isPlanned && !isDone && (
              <p className="text-[0.75rem] text-[#525252]">{L.planned}</p>
            )}
            {isDone && (
              <p className="text-[0.75rem] text-[#737373]">
                {savedResult?.date ? `${L.doneLabel} · ${savedResult.date}` : L.doneLabel}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 text-[0.8125rem] font-medium text-[#737373] transition-colors hover:text-[#0c0c0c]"
        >
          {open ? "—" : "+"}
        </button>
      </div>

      {open && (
        <div className="border-t border-black/[0.07]">
          {/* Metadata: why / where / coverage */}
          <div className="grid grid-cols-1 divide-y divide-black/[0.07] md:grid-cols-3 md:divide-x md:divide-y-0">
            <div className="px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">{L.whyMatters}</p>
              <div className="mt-3 rounded-[12px] border border-black/[0.07] bg-[#fafaf9] p-3.5">
                <p className="text-[0.8125rem] leading-[1.55] text-[#525252]">
                  {locale === "de" ? meta.why_de : meta.why_en}
                </p>
              </div>
            </div>
            <div className="px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">{L.whereTo}</p>
              <div className="mt-3 rounded-[12px] border border-black/[0.07] bg-[#fafaf9] p-3.5">
                <p className="text-[0.9375rem] font-semibold text-[#0c0c0c]">
                  {locale === "de" ? meta.where_de : meta.where_en}
                </p>
                <p className="mt-1.5 text-[0.8125rem] text-[#737373]">
                  {L.waitTime}: {locale === "de" ? meta.wait_de : meta.wait_en}
                </p>
              </div>
            </div>
            <div className="px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">{L.coverage}</p>
              <div className="mt-3 rounded-[12px] border border-black/[0.07] bg-[#fafaf9] p-3.5">
                <p className="text-[0.9375rem] font-semibold text-[#0c0c0c]">{L.covered}</p>
                <p className="mt-1 text-[0.8125rem] leading-snug text-[#737373]">{L.coveredDetail}</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {!isDone && (
            <div className="flex flex-wrap items-center gap-2 border-t border-black/[0.07] px-5 py-4">
              {!isPlanned && (
                <button
                  type="button"
                  onClick={markPlanned}
                  className="rounded-[10px] bg-[#0c0c0c] px-3.5 py-2 text-[0.8125rem] font-medium text-white transition-[filter] hover:brightness-[0.88]"
                >
                  {L.markPlanned}
                </button>
              )}
              <button
                type="button"
                onClick={handleCalendar}
                className="rounded-[10px] border border-black/[0.1] px-3.5 py-2 text-[0.8125rem] font-medium text-[#404040] transition-colors hover:text-[#0c0c0c]"
              >
                {L.addCalendar}
              </button>
              {!isDone && (
                <RemindMeButton
                  checkKey={`screening_${screeningName.replace(/\s+/g, "_")}`}
                  checkName={screeningName}
                  isDE={locale === "de"}
                  variant="raw"
                  className="rounded-[10px] border border-black/[0.1] px-3.5 py-2 text-[0.8125rem] font-medium text-[#404040] transition-colors hover:text-[#0c0c0c]"
                />
              )}
              <button
                type="button"
                onClick={markDone}
                className="rounded-[10px] border border-black/[0.1] px-3.5 py-2 text-[0.8125rem] font-medium text-[#404040] transition-colors hover:text-[#0c0c0c]"
              >
                {L.done}
              </button>
            </div>
          )}

          {isDone && savedResult && (
            <div className="border-t border-black/[0.07] px-5 py-3 space-y-0.5">
              <p className="text-[0.8125rem] text-[#737373]">
                {L.resultSaved}
                {savedResult.notes && <> — {savedResult.notes.slice(0, 80)}</>}
              </p>
              {savedResult.fileName && (
                <p className="text-[0.75rem] text-[#a3a3a3]">
                  📎 {savedResult.fileName}
                </p>
              )}
            </div>
          )}

          {/* Results panel (shown when "Done" is clicked) */}
          {showResultsPanel && (
            <div className="border-t border-black/[0.07] bg-[#fafaf9] px-5 py-5">
              <p className="text-[0.9375rem] font-semibold text-[#0c0c0c]">{L.resultsTitle}</p>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-[0.8125rem] font-medium text-[#737373]">
                    {L.resultsDateLabel}
                  </label>
                  <input
                    type="date"
                    value={resultDate}
                    onChange={(e) => setResultDate(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    className="mt-1.5 w-full rounded-[10px] border border-black/[0.1] bg-white px-3 py-2 text-[0.875rem] text-[#0c0c0c] focus:border-black/[0.3] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[0.8125rem] font-medium text-[#737373]">
                    {L.resultsNotesLabel}
                  </label>
                  <textarea
                    value={resultNotes}
                    onChange={(e) => setResultNotes(e.target.value)}
                    rows={2}
                    placeholder={locale === "de" ? "z. B. Ergebnis normal, nächste in 3 Jahren" : "e.g. Result normal, next due in 3 years"}
                    className="mt-1.5 w-full resize-none rounded-[10px] border border-black/[0.1] bg-white px-3 py-2 text-[0.875rem] text-[#0c0c0c] placeholder:text-[#a3a3a3] focus:border-black/[0.3] focus:outline-none"
                  />
                </div>
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
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSaveResult}
                  className="rounded-[10px] bg-[#0c0c0c] px-4 py-2 text-[0.875rem] font-medium text-white transition-[filter] hover:brightness-[0.88]"
                >
                  {L.saveResults}
                </button>
                <button
                  type="button"
                  onClick={handleSkipResult}
                  className="rounded-[10px] border border-black/[0.1] px-4 py-2 text-[0.875rem] font-medium text-[#737373] transition-colors hover:text-[#0c0c0c]"
                >
                  {L.skipResults}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <AddToHealthCalendarModal
        open={calendarOpen}
        title={screeningName}
        initial={initialMeta}
        onClose={() => setCalendarOpen(false)}
        onSave={(meta) => {
          const stored = loadScreeningEvents();
          stored[screeningName] = {
            screeningName,
            meta,
            createdAtISO: new Date().toISOString(),
          };
          saveScreeningEvents(stored);
          saveStatus(screeningName, "planned");
          setStatus("planned");
          setCalendarOpen(false);
        }}
      />
    </div>
  );
}
