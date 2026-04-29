"use client";
import { useState, useEffect, useRef } from "react";
import { googleCalendarUrl } from "@/lib/reminders/generateIcal";

export interface RemindMeModalProps {
  checkKey: string;
  checkName: string;
  isDE?: boolean;
  onClose: () => void;
}

type Channel = "app" | "email" | "calendar";
type Preset = "1w" | "2w" | "1m" | "3m" | "6m";

const PRESETS: { key: Preset; label: string; labelDE: string; days: number }[] = [
  { key: "1w",  label: "In 1 week",    labelDE: "In 1 Woche",     days: 7   },
  { key: "2w",  label: "In 2 weeks",   labelDE: "In 2 Wochen",    days: 14  },
  { key: "1m",  label: "In 1 month",   labelDE: "In 1 Monat",     days: 30  },
  { key: "3m",  label: "In 3 months",  labelDE: "In 3 Monaten",   days: 90  },
  { key: "6m",  label: "In 6 months",  labelDE: "In 6 Monaten",   days: 180 },
];

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function toDateInputValue(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function RemindMeModal({ checkKey, checkName, isDE, onClose }: RemindMeModalProps) {
  const [preset, setPreset] = useState<Preset>("1m");
  const [channel, setChannel] = useState<Channel>("app");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [savedReminderId, setSavedReminderId] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const selectedPreset = PRESETS.find((p) => p.key === preset)!;
  const remindAt = addDays(today, selectedPreset.days);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleConfirm() {
    if (channel === "calendar") {
      const dtstart = remindAt;
      const dtend = addDays(remindAt, 0);
      dtend.setHours(dtend.getHours() + 1);
      const url = googleCalendarUrl({
        uid: `reminder-${checkKey}`,
        summary: isDE ? `Gesundheitscheck: ${checkName}` : `Health check: ${checkName}`,
        description: isDE
          ? `Erinnerung von The Arc Woman für: ${checkName}`
          : `Reminder from The Arc Woman for: ${checkName}`,
        dtstart,
        dtend,
      });
      window.open(url, "_blank");
      onClose();
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkKey, checkName, remindAt: remindAt.toISOString(), channel }),
      });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setSavedReminderId(data.reminder?.id ?? null);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  function handleDownloadIcal() {
    if (!savedReminderId) return;
    window.location.href = `/api/reminders/${savedReminderId}/ical`;
  }

  const t = {
    title:    isDE ? "Erinnerung setzen" : "Set a reminder",
    subtitle: isDE ? `Für: ${checkName}` : `For: ${checkName}`,
    when:     isDE ? "Wann?" : "When?",
    how:      isDE ? "Wie erinnert werden?" : "How?",
    channels: {
      app:      isDE ? "In-App"         : "In-App",
      email:    isDE ? "Per E-Mail"     : "Via email",
      calendar: isDE ? "Kalender-Link"  : "Calendar link",
    },
    confirm:  isDE ? "Erinnerung setzen" : "Set reminder",
    success:  isDE ? "Erinnerung gespeichert!" : "Reminder set!",
    ical:     isDE ? "Kalender-Datei (.ics) herunterladen" : "Download calendar file (.ics)",
    gcal:     isDE ? "In Google Kalender öffnen" : "Open in Google Calendar",
    close:    isDE ? "Schließen" : "Close",
    error:    isDE ? "Fehler — bitte erneut versuchen." : "Something went wrong — please try again.",
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm sm:items-center"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="w-full max-w-md rounded-t-[24px] bg-white p-6 shadow-xl sm:rounded-[24px]">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-[17px] font-semibold text-[#0c0c0c]">{t.title}</p>
            <p className="text-[13px] text-[#888] mt-0.5">{t.subtitle}</p>
          </div>
          <button onClick={onClose} className="text-[#888] hover:text-[#0c0c0c] text-xl leading-none mt-0.5">✕</button>
        </div>

        {status === "success" ? (
          <div className="space-y-4">
            <div className="rounded-[14px] bg-[#f0faf0] p-4 text-center">
              <p className="text-[16px] font-semibold text-[#16a34a]">✓ {t.success}</p>
              <p className="text-[13px] text-[#444] mt-1">
                {selectedPreset.label} — {remindAt.toLocaleDateString(isDE ? "de-DE" : "en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>

            {savedReminderId && (
              <div className="space-y-2">
                <button
                  onClick={handleDownloadIcal}
                  className="w-full rounded-[12px] border border-[#e5e5e5] py-3 text-[14px] font-medium text-[#0c0c0c] hover:bg-[#f5f5f3] transition-colors"
                >
                  📅 {t.ical}
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full rounded-[12px] bg-[#0c0c0c] py-3 text-[14px] font-semibold text-white"
            >
              {t.close}
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* When */}
            <div>
              <p className="mb-2 text-[13px] font-medium text-[#444]">{t.when}</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setPreset(p.key)}
                    className={`rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                      preset === p.key
                        ? "border-[#0c0c0c] bg-[#0c0c0c] text-white"
                        : "border-[#e5e5e5] bg-white text-[#0c0c0c] hover:border-[#0c0c0c]"
                    }`}
                  >
                    {isDE ? p.labelDE : p.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[12px] text-[#888]">
                {remindAt.toLocaleDateString(isDE ? "de-DE" : "en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>

            {/* How */}
            <div>
              <p className="mb-2 text-[13px] font-medium text-[#444]">{t.how}</p>
              <div className="grid grid-cols-3 gap-2">
                {(["app", "email", "calendar"] as Channel[]).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setChannel(ch)}
                    className={`flex flex-col items-center gap-1.5 rounded-[14px] border p-3 text-[12px] font-medium transition-colors ${
                      channel === ch
                        ? "border-[#0c0c0c] bg-[#0c0c0c] text-white"
                        : "border-[#e5e5e5] bg-white text-[#0c0c0c] hover:border-[#0c0c0c]"
                    }`}
                  >
                    <span className="text-[18px]">{ch === "app" ? "🔔" : ch === "email" ? "✉️" : "📅"}</span>
                    <span>{t.channels[ch]}</span>
                  </button>
                ))}
              </div>
              {channel === "email" && (
                <p className="mt-1.5 text-[11px] text-[#888]">
                  {isDE ? "Wir senden eine Erinnerungs-E-Mail zum eingestellten Datum." : "We'll send a reminder email on that date."}
                </p>
              )}
              {channel === "calendar" && (
                <p className="mt-1.5 text-[11px] text-[#888]">
                  {isDE ? "Öffnet Google Kalender. Für Apple/Outlook lade eine .ics-Datei herunter." : "Opens Google Calendar. For Apple/Outlook, download the .ics file after saving."}
                </p>
              )}
            </div>

            {status === "error" && (
              <p className="text-[13px] text-red-600">{t.error}</p>
            )}

            <button
              onClick={handleConfirm}
              disabled={status === "loading"}
              className="w-full rounded-[14px] bg-[#0c0c0c] py-3.5 text-[14px] font-semibold text-white disabled:opacity-50 transition-opacity"
            >
              {status === "loading" ? "…" : t.confirm}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
