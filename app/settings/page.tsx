"use client";

import { Suspense } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/lib/i18n/useLocale";
import { setStoredLocale } from "@/lib/i18n/locale";
import { clearArcLocalState } from "@/lib/profile-engine-a/frontendClient";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SettingsData {
  user: { email: string; name: string | null; createdAt: string | null };
  profile: { lifeStage: string | null; ageGroup: string | null; goals: string[] };
  settings: {
    language: string;
    emailReminders: boolean;
    calendarReminders: boolean;
    weeklySummary: boolean;
    defaultReminderTiming: string;
  };
  consent: { givenAt: string; isActive: boolean; revokedAt: string | null } | null;
}

interface AccessCode {
  id: string;
  code: string;
  token?: string;
  status: "available" | "used" | "revoked" | "expired";
  createdAt: string;
  usedAt: string | null;
  expiresAt: string | null;
  offline?: boolean;
}

interface CalendarConnection {
  id: string;
  provider: "google" | "outlook" | "ical";
  label: string | null;
  calendarId: string | null;
  icalFeedToken: string | null;
  createdAt: string;
}

interface CalendarState {
  connections: CalendarConnection[];
  loading: boolean;
  connecting: string | null; // provider being connected
  copiedFeed: boolean;
  disconnecting: string | null;
  error: string | null;
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-6 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:opacity-40 ${on ? "bg-[#0c0c0c]" : "bg-[#d4d4d4]"}`}
    >
      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );
}

function SectionCard({ children, danger }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <div className={`rounded-[20px] border bg-white p-6 ${danger ? "border-red-200" : "border-black/[0.08]"} shadow-[0_1px_0_rgba(0,0,0,0.03)]`}>
      {children}
    </div>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-[1rem] font-semibold text-[#0c0c0c]">{title}</h2>
      {subtitle && <p className="mt-0.5 text-[0.8125rem] text-[#737373]">{subtitle}</p>}
    </div>
  );
}

function FieldRow({ label, value, action }: { label: string; value: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-black/[0.05] last:border-0">
      <div className="min-w-0">
        <p className="text-[0.8125rem] font-medium text-[#737373]">{label}</p>
        <div className="mt-0.5 text-[0.9375rem] text-[#0c0c0c]">{value}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function StatusChip({ status }: { status: "available" | "used" | "revoked" | "expired" }) {
  const styles: Record<string, string> = {
    available: "bg-[#f0fdf4] text-[#16a34a] border-green-100",
    used: "bg-[#f5f5f4] text-[#737373] border-black/[0.08]",
    revoked: "bg-red-50 text-[#dc2626] border-red-100",
    expired: "bg-amber-50 text-[#d97706] border-amber-100",
  };
  const labels: Record<string, { en: string; de: string }> = {
    available: { en: "Available", de: "Verfügbar" },
    used: { en: "Code used", de: "Code verwendet" },
    revoked: { en: "Revoked", de: "Widerrufen" },
    expired: { en: "Expired", de: "Abgelaufen" },
  };
  const locale = useLocale();
  const lang = locale === "de" ? "de" : "en";
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[0.75rem] font-semibold ${styles[status] ?? styles.expired}`}>
      {labels[status]?.[lang] ?? status}
    </span>
  );
}

// ── Calendar provider icons ───────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function OutlookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <rect width="14" height="14" x="1" y="5" rx="2" fill="#0078D4"/>
      <rect width="14" height="14" x="9" y="5" rx="2" fill="#28A8E8"/>
      <path d="M9 5h6v14H9z" fill="#50D9FF" opacity=".5"/>
      <rect width="8" height="8" x="13" y="1" rx="1.5" fill="#0078D4"/>
      <path d="M4 9h6v6H4z" rx="1" fill="white" opacity=".9"/>
      <text x="4.5" y="17.5" fontSize="7" fontWeight="bold" fill="#0078D4" fontFamily="sans-serif">O</text>
    </svg>
  );
}

function ICalIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="4" width="18" height="17" rx="2" stroke="#737373" strokeWidth="1.5"/>
      <path d="M3 9h18" stroke="#737373" strokeWidth="1.5"/>
      <path d="M8 2v4M16 2v4" stroke="#737373" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M8 13h3M8 16.5h5" stroke="#737373" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

type CalL = { subscribe: string; disconnect: string; connected: string };

function CalendarProviderRow({
  icon, name, hint, connected, connecting, disconnecting, onConnect, onDisconnect, L,
}: {
  icon: React.ReactNode;
  name: string;
  hint: string;
  connected: boolean;
  connecting: boolean;
  disconnecting: boolean;
  onConnect: () => void;
  onDisconnect?: () => void;
  L: CalL;
}) {
  return (
    <div className="rounded-[14px] border border-black/[0.07] bg-[#fafaf9] px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white border border-black/[0.08]">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[0.9375rem] font-medium text-[#0c0c0c]">{name}</span>
            {connected && (
              <span className="rounded-full border border-green-100 bg-[#f0fdf4] px-2 py-0.5 text-[0.7rem] font-semibold text-[#16a34a]">
                {L.connected}
              </span>
            )}
          </div>
          {!connected && <p className="mt-0.5 text-[0.8125rem] text-[#737373]">{hint}</p>}
        </div>
        {connected ? (
          <button
            type="button"
            onClick={onDisconnect}
            disabled={disconnecting}
            className="shrink-0 rounded-[10px] border border-red-100 px-3 py-1.5 text-[0.8125rem] font-medium text-[#dc2626] hover:bg-red-50 transition-colors disabled:opacity-40"
          >
            {disconnecting ? "…" : L.disconnect}
          </button>
        ) : (
          <button
            type="button"
            onClick={onConnect}
            disabled={connecting}
            className="shrink-0 rounded-[10px] border border-black/[0.1] bg-white px-3 py-1.5 text-[0.8125rem] font-medium text-[#0c0c0c] hover:bg-[#f0f0ef] transition-colors disabled:opacity-40"
          >
            {connecting ? "…" : L.subscribe}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsPageInner />
    </Suspense>
  );
}

function SettingsPageInner() {
  const { data: session } = useSession();
  const locale = useLocale();
  const isDE = locale === "de";
  const router = useRouter();
  const searchParams = useSearchParams();

  // Clear OAuth result query params after reading them
  useEffect(() => {
    const connected = searchParams.get("calendar_connected");
    const error = searchParams.get("calendar_error");
    if (connected || error) {
      if (error) setCal((prev) => ({ ...prev, error: `Connection failed (${error}).` }));
      router.replace("/settings");
      // Refresh calendar connections after successful connect
      if (connected) {
        fetch("/api/calendar/connections")
          .then((r) => r.json())
          .then((d) => setCal((prev) => ({ ...prev, connections: d.connections ?? [], error: null })))
          .catch(() => {});
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [codesLoading, setCodesLoading] = useState(true);

  // localStorage key for offline (pre-migration) codes
  const offlineCodesKey = session?.user?.email ? `arc_offline_codes_${session.user.email}` : null;

  function loadOfflineCodes(): AccessCode[] {
    if (!offlineCodesKey) return [];
    try { return JSON.parse(localStorage.getItem(offlineCodesKey) ?? "[]"); } catch { return []; }
  }

  function saveOfflineCodes(list: AccessCode[]) {
    if (!offlineCodesKey) return;
    try { localStorage.setItem(offlineCodesKey, JSON.stringify(list.filter((c) => c.offline))); } catch { /* noop */ }
  }

  // Editing states
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [nameSaving, setNameSaving] = useState(false);

  // Reminder timing save state
  const [reminderSaving, setReminderSaving] = useState(false);

  // Access codes
  const [generatingCode, setGeneratingCode] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Delete flow
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteInputRef = useRef<HTMLInputElement>(null);

  // Consent revoke
  const [consentRevoking, setConsentRevoking] = useState(false);

  // Calendar connections
  const [cal, setCal] = useState<CalendarState>({
    connections: [],
    loading: true,
    connecting: null,
    copiedFeed: false,
    disconnecting: null,
    error: null,
  });

  const L = {
    title: isDE ? "Einstellungen" : "Settings",
    subtitle: isDE
      ? "Verwalten Sie Ihr Konto, Erinnerungen, Datenschutz und Daten."
      : "Manage your account, reminders, privacy, and data.",

    account: isDE ? "Konto" : "Account",
    email: isDE ? "E-Mail" : "Email",
    name: isDE ? "Name" : "Name",
    ageGroup: isDE ? "Altersgruppe" : "Age group",
    lifeStage: isDE ? "Lebensphase" : "Life stage",
    healthGoals: isDE ? "Gesundheitsziele" : "Health goals",
    retakeSurvey: isDE ? "Gesundheitsprofil erneut ausfüllen" : "Retake health profile",
    memberSince: isDE ? "Mitglied seit" : "Member since",
    editName: isDE ? "Bearbeiten" : "Edit",
    saveName: isDE ? "Speichern" : "Save",
    cancelName: isDE ? "Abbrechen" : "Cancel",
    signOut: isDE ? "Abmelden" : "Sign out",
    notSet: isDE ? "Nicht angegeben" : "Not set",

    language: isDE ? "Sprache" : "Language",
    languageSubtitle: isDE
      ? "Wählen Sie die Sprache, die in The Arc verwendet wird."
      : "Choose the language used across The Arc.",
    english: isDE ? "Englisch" : "English",
    german: isDE ? "Deutsch" : "German",

    reminders: isDE ? "Erinnerungen" : "Reminders",
    remindersSubtitle: isDE
      ? "Wählen Sie, wie The Arc Sie an geplante Checks und nächste Schritte erinnert."
      : "Choose how The Arc reminds you about planned checks and next steps.",
    emailReminders: isDE ? "E-Mail-Erinnerungen" : "Email reminders",
    calendarReminders: isDE ? "Kalender-Erinnerungen" : "Calendar reminders",
    weeklySummary: isDE ? "Wöchentliche Gesundheitsübersicht" : "Weekly health summary",
    defaultTiming: isDE ? "Standard-Erinnerungszeitpunkt" : "Default reminder timing",
    timingTomorrow: isDE ? "Morgen" : "Tomorrow",
    timingIn3Days: isDE ? "In 3 Tagen" : "In 3 days",
    timingNextWeek: isDE ? "Nächste Woche" : "Next week",
    timingCustom: isDE ? "Benutzerdefiniertes Datum" : "Custom date",

    connectedAccounts: isDE ? "Verbundene Konten" : "Connected accounts",
    connectedAccountsSubtitle: isDE
      ? "Verbinden Sie Ihren Kalender, um Gesundheitserinnerungen automatisch einzutragen."
      : "Connect your calendar to automatically add health reminders.",
    connectedEmail: isDE ? "Verbundene E-Mail" : "Connected email",
    calendarGoogle: "Google Calendar",
    calendarOutlook: isDE ? "Outlook Kalender" : "Outlook Calendar",
    calendarIcal: "iCalendar",
    calendarIcalDesc: isDE
      ? "Abonnieren Sie Ihre Erinnerungen in Apple Calendar, Google Calendar oder jeder anderen App."
      : "Subscribe to your reminders in Apple Calendar, Google Calendar, or any other app.",
    subscribe: isDE ? "Abonnieren" : "Subscribe",
    disconnect: isDE ? "Trennen" : "Disconnect",
    connected: isDE ? "Abonniert" : "Subscribed",
    copyLink: isDE ? "Link kopieren" : "Copy link",
    calCopied: isDE ? "Kopiert!" : "Copied!",
    generateFeed: isDE ? "Abonnement-Link erstellen" : "Create subscription link",
    regenerateFeed: isDE ? "Neuen Link erstellen" : "Regenerate link",
    calendarError: isDE ? "Verbindung fehlgeschlagen." : "Connection failed.",
    subscribeHint: isDE
      ? "Öffnet Ihren Kalender, um die Erinnerungen zu abonnieren."
      : "Opens your calendar app to subscribe to health reminders.",

    inviteFriends: isDE ? "Freunde einladen" : "Invite friends",
    inviteSubtitle: isDE
      ? "Generieren Sie bis zu 3 Zugangscodes für Freunde."
      : "Generate up to 3 access codes for friends.",
    inviteNote: isDE
      ? "Zugangscodes ermöglichen eingeladenen Personen, ein eigenes Konto zu erstellen. Sie geben keinen Zugriff auf Ihre Gesundheitsdaten."
      : "Access codes let invited people create their own account. They do not give access to your health data.",
    generateCode: isDE ? "Zugangscode generieren" : "Generate access code",
    copyCode: isDE ? "Code kopieren" : "Copy code",
    copied: isDE ? "Kopiert" : "Copied",
    revoke: isDE ? "Widerrufen" : "Revoke",
    noCodesYet: isDE ? "Noch keine Codes generiert" : "No codes generated yet",
    maxCodes: isDE ? "Maximal 3 aktive Codes erlaubt." : "Maximum 3 active codes allowed.",

    exportTitle: isDE ? "Daten herunterladen" : "Download your data",
    exportSubtitle: isDE
      ? "Sie können die in Ihrem Konto gespeicherten Daten herunterladen."
      : "You can download the data stored in your account.",
    exportPdfTitle: isDE ? "PDF-Zusammenfassung" : "PDF summary",
    exportPdfDesc: isDE
      ? "Eine lesbare Zusammenfassung Ihres Profils, Empfehlungen, Ergebnisse und mehr."
      : "A readable summary of your profile, recommendations, results, screenings, reminders, and uploaded document references.",
    exportJsonTitle: isDE ? "Maschinenlesbarer Export" : "Machine-readable export",
    exportJsonDesc: isDE
      ? "JSON- und CSV-Dateien für Datenübertragbarkeit."
      : "JSON and CSV files for data portability.",
    downloadPdf: isDE ? "PDF herunterladen" : "Download PDF",
    downloadJson: isDE ? "JSON herunterladen" : "Download JSON",
    downloadCsv: isDE ? "CSV herunterladen" : "Download CSV",

    privacyTitle: isDE ? "Datenschutz und Einwilligung" : "Privacy and consent",
    privacySubtitle: isDE
      ? "Überprüfen Sie, wie Ihre Gesundheitsinformationen zur Erstellung Ihrer persönlichen Empfehlungen verwendet werden."
      : "Review how your health information is used to create your personal recommendations.",
    consentGiven: isDE ? "Einwilligung erteilt" : "Consent given",
    consentActive: isDE ? "Aktiv" : "Active",
    consentRevoked: isDE ? "Widerrufen" : "Revoked",
    reviewConsent: isDE ? "Einwilligung anzeigen" : "Review consent",
    privacyPolicy: isDE ? "Datenschutzerklärung" : "Privacy policy",
    revokeConsent: isDE ? "Einwilligung widerrufen" : "Revoke consent",
    revokeConsentWarning: isDE
      ? "Wenn Sie Ihre Einwilligung widerrufen, werden Ihre Gesundheitsdaten nicht mehr für Empfehlungen verwendet."
      : "Revoking consent will stop your health data from being used to generate recommendations.",
    consentNotRecorded: isDE ? "Keine Einwilligung aufgezeichnet" : "No consent on record",

    deleteTitle: isDE ? "Konto und Gesundheitsdaten löschen" : "Delete account and health data",
    deleteDesc: isDE
      ? "Dadurch werden Ihr Profil, Ihre Gesundheitsdaten, Empfehlungen, hochgeladenen Dokumente, Erinnerungen und Zugangscodes dauerhaft gelöscht."
      : "This will permanently delete your profile, health data, recommendations, uploaded documents, reminders, and access codes.",
    deleteIrreversible: isDE ? "Diese Aktion kann nicht rückgängig gemacht werden." : "This action cannot be undone.",
    deleteButton: isDE ? "Mein Konto und meine Daten löschen" : "Delete my account and data",

    deleteModalTitle: isDE ? "Sind Sie sicher?" : "Are you sure?",
    deleteModalDesc: isDE
      ? "Ihr Konto und Ihre Gesundheitsdaten werden dauerhaft gelöscht."
      : "Your account and health data will be permanently deleted.",
    deleteConfirmPrompt: isDE
      ? `Geben Sie zur Bestätigung ${isDE ? "LÖSCHEN" : "DELETE"} ein.`
      : "To confirm, type DELETE.",
    deleteConfirmWord: isDE ? "LÖSCHEN" : "DELETE",
    deleteConfirmPlaceholder: isDE ? "LÖSCHEN eingeben" : "Type DELETE",
    deleteConfirmButton: isDE ? "Endgültig löschen" : "Permanently delete",
    cancel: isDE ? "Abbrechen" : "Cancel",
    scheduled: isDE ? "Löschung geplant" : "Deletion scheduled",
    scheduledDesc: isDE
      ? "Ihr Konto wird in 24 Stunden gelöscht. Sie wurden abgemeldet."
      : "Your account will be deleted within 24 hours. You have been signed out.",
  };

  // ── Data fetching ────────────────────────────────────────────────────────────

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);

    fetch("/api/settings", { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => { setData(d); setNameInput(d.user?.name ?? ""); })
      .catch(() => {})
      .finally(() => { clearTimeout(t); setLoading(false); });

    const ctrl2 = new AbortController();
    const t2 = setTimeout(() => ctrl2.abort(), 8000);

    fetch("/api/access-codes", { signal: ctrl2.signal })
      .then((r) => r.json())
      .then((d) => {
        const serverCodes: AccessCode[] = d.codes ?? [];
        // Merge offline codes — keep only those whose code string isn't already in server list
        const serverCodeStrings = new Set(serverCodes.map((c) => c.code));
        const offline = loadOfflineCodes().filter((c) => !serverCodeStrings.has(c.code));
        setCodes([...offline, ...serverCodes]);
      })
      .catch(() => {
        // Server unreachable — show only offline codes
        setCodes(loadOfflineCodes());
      })
      .finally(() => { clearTimeout(t2); setCodesLoading(false); });

    const ctrl3 = new AbortController();
    const t3 = setTimeout(() => ctrl3.abort(), 8000);
    fetch("/api/calendar/connections", { signal: ctrl3.signal })
      .then((r) => r.json())
      .then((d) => setCal((prev) => ({ ...prev, connections: d.connections ?? [] })))
      .catch(() => {})
      .finally(() => { clearTimeout(t3); setCal((prev) => ({ ...prev, loading: false })); });
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  async function saveName() {
    if (!nameInput.trim()) return;
    setNameSaving(true);
    const res = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: nameInput.trim() }) });
    if (res.ok) {
      const d = await res.json();
      setData((prev) => prev ? { ...prev, user: { ...prev.user, name: d.name } } : prev);
      setEditingName(false);
    }
    setNameSaving(false);
  }

  async function switchLanguage(lang: "en" | "de") {
    setStoredLocale(lang);
    await fetch("/api/settings/language", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ language: lang }) });
    setData((prev) => prev ? { ...prev, settings: { ...prev.settings, language: lang } } : prev);
    // Reload page to apply new locale
    window.location.reload();
  }

  async function toggleReminder(key: "emailReminders" | "calendarReminders" | "weeklySummary", val: boolean) {
    setReminderSaving(true);
    await fetch("/api/settings/reminders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [key]: val }) });
    setData((prev) => prev ? { ...prev, settings: { ...prev.settings, [key]: val } } : prev);
    setReminderSaving(false);
  }

  async function setTiming(timing: string) {
    setReminderSaving(true);
    await fetch("/api/settings/reminders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ defaultReminderTiming: timing }) });
    setData((prev) => prev ? { ...prev, settings: { ...prev.settings, defaultReminderTiming: timing } } : prev);
    setReminderSaving(false);
  }

  async function generateCode() {
    setGeneratingCode(true);
    setCodeError(null);
    const res = await fetch("/api/access-codes", { method: "POST" });
    const d = await res.json();
    if (res.ok) {
      const newCode: AccessCode = d.code;
      setCodes((prev) => {
        const updated = [newCode, ...prev];
        if (newCode.offline) saveOfflineCodes(updated);
        return updated;
      });
    } else {
      setCodeError(d.error ?? "Failed to generate code");
    }
    setGeneratingCode(false);
  }

  async function copyCode(id: string, code: string) {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function revokeCode(id: string) {
    setRevokingId(id);
    // Offline codes are only in localStorage — just mark them revoked locally
    if (id.startsWith("offline:")) {
      setCodes((prev) => {
        const updated = prev.map((c) => c.id === id ? { ...c, status: "revoked" as const } : c);
        saveOfflineCodes(updated);
        return updated;
      });
      setRevokingId(null);
      return;
    }
    const res = await fetch(`/api/access-codes/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCodes((prev) => prev.map((c) => c.id === id ? { ...c, status: "revoked" as const } : c));
    }
    setRevokingId(null);
  }

  async function revokeConsent() {
    setConsentRevoking(true);
    const res = await fetch("/api/consent/revoke", { method: "POST" });
    if (res.ok) {
      setData((prev) => prev ? {
        ...prev,
        consent: { givenAt: prev.consent?.givenAt ?? new Date().toISOString(), isActive: false, revokedAt: new Date().toISOString() },
      } : prev);
    }
    setConsentRevoking(false);
  }

  // Returns the ICS feed URL for a given token
  const icsUrl = useCallback((token: string) =>
    `${window.location.origin}/api/calendar/ics/${token}/arc-health.ics`, []);

  // Connect a calendar provider: creates/gets feed token, then opens the subscription deep-link
  const connectCalendar = useCallback(async (provider: "google" | "outlook" | "ical") => {
    setCal((prev) => ({ ...prev, connecting: provider, error: null }));
    const res = await fetch("/api/calendar/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider }),
    });
    const d = await res.json();
    if (!res.ok) {
      setCal((prev) => ({ ...prev, connecting: null, error: d.error ?? "Failed" }));
      return;
    }

    const token: string = d.token;
    const feedUrl = `${window.location.origin}/api/calendar/ics/${token}/arc-health.ics`;
    const webcalUrl = feedUrl.replace(/^https?:/, "webcal:");

    // Open provider-specific deep link to subscribe
    if (provider === "google") {
      window.open(`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl)}`, "_blank");
    } else if (provider === "outlook") {
      window.open(`https://outlook.live.com/calendar/0/addcalendar?url=${encodeURIComponent(webcalUrl)}&name=${encodeURIComponent("The Arc Health")}`, "_blank");
    }
    // iCal: handled separately via copyIcalFeed

    const LABELS: Record<string, string> = { google: "Google Calendar", outlook: "Outlook Calendar", ical: "iCalendar" };
    setCal((prev) => ({
      ...prev,
      connecting: null,
      connections: [
        ...prev.connections.filter((c) => c.provider !== provider),
        { id: d.id, provider, label: LABELS[provider], calendarId: null, icalFeedToken: token, createdAt: new Date().toISOString() },
      ],
    }));
  }, []);

  const copyIcalFeed = useCallback(async (token: string) => {
    await navigator.clipboard.writeText(icsUrl(token));
    setCal((prev) => ({ ...prev, copiedFeed: true }));
    setTimeout(() => setCal((prev) => ({ ...prev, copiedFeed: false })), 2000);
  }, [icsUrl]);

  const disconnectCalendar = useCallback(async (id: string) => {
    setCal((prev) => ({ ...prev, disconnecting: id, error: null }));
    const res = await fetch(`/api/calendar/connections/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCal((prev) => ({ ...prev, disconnecting: null, connections: prev.connections.filter((c) => c.id !== id) }));
    } else {
      setCal((prev) => ({ ...prev, disconnecting: null, error: "Failed to disconnect" }));
    }
  }, []);

  async function submitDelete() {
    if (deleteInput !== L.deleteConfirmWord) return;
    setDeleteSubmitting(true);
    setDeleteError(null);
    const res = await fetch("/api/account/delete-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmText: deleteInput }),
    });
    if (res.ok) {
      clearArcLocalState();
      signOut({ callbackUrl: "/" });
    } else {
      const d = await res.json();
      setDeleteError(d.error ?? "Something went wrong");
      setDeleteSubmitting(false);
    }
  }

  useEffect(() => {
    if (showDeleteModal) {
      setDeleteInput("");
      setDeleteError(null);
      setTimeout(() => deleteInputRef.current?.focus(), 80);
    }
  }, [showDeleteModal]);

  // ── Skeleton ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-12 md:px-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="h-7 w-40 animate-pulse rounded-[10px] bg-[#f0f0ef]" />
            <div className="h-4 w-72 animate-pulse rounded-[8px] bg-[#f0f0ef]" />
          </div>
          <Link href="/dashboard" className="shrink-0 flex items-center gap-1.5 rounded-[10px] border border-black/[0.1] bg-white px-3 py-2 text-[0.8125rem] font-medium text-[#404040] hover:bg-[#f0f0ef] transition-colors mt-1">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M8.5 2.5 3.5 7l5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {isDE ? "Zum Dashboard" : "Back to dashboard"}
          </Link>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="mb-5 h-40 animate-pulse rounded-[20px] bg-[#f0f0ef]" />
        ))}
      </div>
    );
  }

  const activeCodesCount = codes.filter((c) => c.status === "available").length;
  const timingOptions = [
    { value: "tomorrow", label: L.timingTomorrow },
    { value: "in_3_days", label: L.timingIn3Days },
    { value: "next_week", label: L.timingNextWeek },
    { value: "custom", label: L.timingCustom },
  ];

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 md:px-8">
      {/* Page header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[1.625rem] font-semibold tracking-tight text-[#0c0c0c]">{L.title}</h1>
          <p className="mt-1 text-[0.9375rem] text-[#737373]">{L.subtitle}</p>
        </div>
        <Link
          href="/dashboard"
          className="shrink-0 flex items-center gap-1.5 rounded-[10px] border border-black/[0.1] bg-white px-3 py-2 text-[0.8125rem] font-medium text-[#404040] hover:bg-[#f0f0ef] transition-colors mt-1"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M8.5 2.5 3.5 7l5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {isDE ? "Zum Dashboard" : "Back to dashboard"}
        </Link>
      </div>

      <div className="space-y-5">

        {/* ── Account ── */}
        <SectionCard>
          <SectionHeading title={L.account} />
          <FieldRow
            label={L.email}
            value={<span className="font-mono text-[0.9rem]">{data?.user.email ?? session?.user?.email}</span>}
          />
          <FieldRow
            label={L.name}
            value={
              editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
                    className="rounded-[10px] border border-black/[0.15] bg-[#fafaf9] px-3 py-1.5 text-[0.9375rem] text-[#0c0c0c] outline-none focus:border-black/40"
                    autoFocus
                  />
                  <button onClick={saveName} disabled={nameSaving} className="rounded-[8px] bg-[#0c0c0c] px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-40">
                    {nameSaving ? "…" : L.saveName}
                  </button>
                  <button onClick={() => setEditingName(false)} className="rounded-[8px] border border-black/[0.1] px-3 py-1.5 text-[0.8125rem] font-medium text-[#404040]">
                    {L.cancelName}
                  </button>
                </div>
              ) : (
                data?.user.name ?? <span className="text-[#a3a3a3]">{L.notSet}</span>
              )
            }
            action={
              !editingName ? (
                <button onClick={() => { setEditingName(true); setNameInput(data?.user.name ?? ""); }} className="text-[0.8125rem] font-medium text-[#404040] hover:text-[#0c0c0c]">
                  {L.editName}
                </button>
              ) : undefined
            }
          />
          {data?.profile.ageGroup && (
            <FieldRow label={L.ageGroup} value={data.profile.ageGroup} />
          )}
          {data?.profile.lifeStage && (
            <FieldRow label={L.lifeStage} value={data.profile.lifeStage} />
          )}
          {data?.profile.goals && data.profile.goals.length > 0 && (
            <FieldRow
              label={L.healthGoals}
              value={
                <div className="flex flex-wrap gap-1.5 mt-0.5">
                  {data.profile.goals.map((g) => (
                    <span key={g} className="rounded-full border border-black/[0.08] bg-[#f5f5f4] px-2.5 py-0.5 text-[0.8125rem] text-[#525252]">{g}</span>
                  ))}
                </div>
              }
            />
          )}
          {data?.user.createdAt && (
            <FieldRow
              label={L.memberSince}
              value={new Date(data.user.createdAt).toLocaleDateString(isDE ? "de-DE" : "en-GB", { day: "numeric", month: "long", year: "numeric" })}
            />
          )}

          <div className="mt-5 flex flex-wrap gap-3 pt-2 border-t border-black/[0.05]">
            <Link
              href="/survey"
              className="rounded-[12px] border border-black/[0.12] px-4 py-2 text-[0.875rem] font-medium text-[#404040] hover:text-[#0c0c0c] transition-colors"
            >
              {L.retakeSurvey}
            </Link>
            <button
              type="button"
              onClick={() => { clearArcLocalState(); signOut({ callbackUrl: "/" }); }}
              className="rounded-[12px] border border-black/[0.12] px-4 py-2 text-[0.875rem] font-medium text-[#404040] hover:text-[#0c0c0c] transition-colors"
            >
              {L.signOut}
            </button>
          </div>
        </SectionCard>

        {/* ── Language ── */}
        <SectionCard>
          <SectionHeading title={L.language} subtitle={L.languageSubtitle} />
          <div className="flex gap-3">
            {(["en", "de"] as const).map((lang) => {
              const label = lang === "en" ? L.english : L.german;
              const active = (data?.settings.language ?? locale) === lang;
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => switchLanguage(lang)}
                  className={`flex-1 rounded-[14px] border py-3 text-[0.9375rem] font-medium transition-colors ${
                    active
                      ? "border-[#0c0c0c] bg-[#0c0c0c] text-white"
                      : "border-black/[0.1] bg-white text-[#404040] hover:border-black/30"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </SectionCard>

        {/* ── Reminders ── */}
        <SectionCard>
          <SectionHeading title={L.reminders} subtitle={L.remindersSubtitle} />
          <div className="space-y-4">
            {([
              { key: "emailReminders" as const, label: L.emailReminders },
              { key: "calendarReminders" as const, label: L.calendarReminders },
              { key: "weeklySummary" as const, label: L.weeklySummary },
            ]).map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <span className="text-[0.9375rem] text-[#0c0c0c]">{label}</span>
                <Toggle
                  on={data?.settings[key] ?? false}
                  onChange={(v) => toggleReminder(key, v)}
                  disabled={reminderSaving}
                />
              </div>
            ))}
            <div className="pt-2 border-t border-black/[0.05]">
              <p className="mb-2.5 text-[0.8125rem] font-medium text-[#737373]">{L.defaultTiming}</p>
              <div className="grid grid-cols-2 gap-2">
                {timingOptions.map(({ value, label }) => {
                  const active = (data?.settings.defaultReminderTiming ?? "next_week") === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={reminderSaving}
                      onClick={() => setTiming(value)}
                      className={`rounded-[12px] border py-2 text-[0.875rem] font-medium transition-colors ${
                        active
                          ? "border-[#0c0c0c] bg-[#0c0c0c] text-white"
                          : "border-black/[0.1] bg-white text-[#404040] hover:border-black/30"
                      } disabled:opacity-40`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── Connected accounts ── */}
        <SectionCard>
          <SectionHeading title={L.connectedAccounts} subtitle={L.connectedAccountsSubtitle} />
          <FieldRow
            label={L.connectedEmail}
            value={<span className="font-mono text-[0.9rem]">{data?.user.email ?? session?.user?.email}</span>}
          />

          {cal.error && (
            <p className="mb-3 text-[0.8125rem] text-[#dc2626]">{L.calendarError}</p>
          )}

          <div className="mt-4 space-y-3">
            {/* Google Calendar */}
            {(() => {
              const conn = cal.connections.find((c) => c.provider === "google");
              return (
                <CalendarProviderRow
                  icon={<GoogleIcon />}
                  name={L.calendarGoogle}
                  hint={L.subscribeHint}
                  connected={!!conn}
                  connecting={cal.connecting === "google"}
                  disconnecting={cal.disconnecting === conn?.id}
                  onConnect={() => connectCalendar("google")}
                  onDisconnect={conn ? () => disconnectCalendar(conn.id) : undefined}
                  L={L}
                />
              );
            })()}

            {/* Outlook */}
            {(() => {
              const conn = cal.connections.find((c) => c.provider === "outlook");
              return (
                <CalendarProviderRow
                  icon={<OutlookIcon />}
                  name={L.calendarOutlook}
                  hint={L.subscribeHint}
                  connected={!!conn}
                  connecting={cal.connecting === "outlook"}
                  disconnecting={cal.disconnecting === conn?.id}
                  onConnect={() => connectCalendar("outlook")}
                  onDisconnect={conn ? () => disconnectCalendar(conn.id) : undefined}
                  L={L}
                />
              );
            })()}

            {/* iCalendar — copy URL for Apple Calendar / any app */}
            {(() => {
              const conn = cal.connections.find((c) => c.provider === "ical");
              return (
                <div className="rounded-[14px] border border-black/[0.07] bg-[#fafaf9] p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white border border-black/[0.08]">
                      <ICalIcon />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[0.9375rem] font-medium text-[#0c0c0c]">{L.calendarIcal}</span>
                        {conn && (
                          <span className="rounded-full border border-green-100 bg-[#f0fdf4] px-2 py-0.5 text-[0.7rem] font-semibold text-[#16a34a]">
                            {L.connected}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[0.8125rem] text-[#737373]">{L.calendarIcalDesc}</p>

                      {conn?.icalFeedToken ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => copyIcalFeed(conn.icalFeedToken!)}
                            className="rounded-[10px] border border-black/[0.1] bg-white px-3 py-1.5 text-[0.8125rem] font-medium text-[#0c0c0c] hover:bg-[#f5f5f4] transition-colors"
                          >
                            {cal.copiedFeed ? L.calCopied : L.copyLink}
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              setCal((prev) => ({ ...prev, connecting: "ical" }));
                              const res = await fetch("/api/calendar/connections", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ provider: "ical", regenerate: true }),
                              });
                              const d = await res.json();
                              if (res.ok) {
                                setCal((prev) => ({
                                  ...prev,
                                  connecting: null,
                                  connections: prev.connections.map((c) =>
                                    c.provider === "ical" ? { ...c, icalFeedToken: d.token } : c
                                  ),
                                }));
                              } else {
                                setCal((prev) => ({ ...prev, connecting: null }));
                              }
                            }}
                            disabled={cal.connecting === "ical"}
                            className="rounded-[10px] border border-black/[0.1] bg-white px-3 py-1.5 text-[0.8125rem] font-medium text-[#737373] hover:bg-[#f5f5f4] transition-colors disabled:opacity-40"
                          >
                            {cal.connecting === "ical" ? "…" : L.regenerateFeed}
                          </button>
                          <button
                            type="button"
                            onClick={() => disconnectCalendar(conn.id)}
                            disabled={cal.disconnecting === conn.id}
                            className="rounded-[10px] border border-red-100 px-3 py-1.5 text-[0.8125rem] font-medium text-[#dc2626] hover:bg-red-50 transition-colors disabled:opacity-40"
                          >
                            {L.disconnect}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => connectCalendar("ical")}
                          disabled={cal.connecting === "ical"}
                          className="mt-3 rounded-[10px] border border-black/[0.1] bg-white px-3 py-1.5 text-[0.8125rem] font-medium text-[#0c0c0c] hover:bg-[#f5f5f4] transition-colors disabled:opacity-40"
                        >
                          {cal.connecting === "ical" ? "…" : L.generateFeed}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </SectionCard>

        {/* ── Access codes ── */}
        <SectionCard>
          <SectionHeading title={L.inviteFriends} subtitle={L.inviteSubtitle} />
          <p className="mb-5 text-[0.8125rem] text-[#737373]">{L.inviteNote}</p>

          {codesLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-[14px] bg-[#f0f0ef]" />)}
            </div>
          ) : codes.length === 0 ? (
            <p className="mb-4 text-[0.875rem] text-[#a3a3a3]">{L.noCodesYet}</p>
          ) : (
            <div className="mb-4 space-y-2">
              {codes.map((c) => (
                <div key={c.id} className="flex items-center gap-3 rounded-[14px] border border-black/[0.07] bg-[#fafaf9] px-4 py-3">
                  <code className="flex-1 font-mono text-[0.9375rem] font-semibold tracking-widest text-[#0c0c0c]">{c.code}</code>
                  <StatusChip status={c.status} />
                  {c.status === "available" && (
                    <>
                      <button
                        type="button"
                        onClick={() => copyCode(c.id, c.code)}
                        className="rounded-[8px] border border-black/[0.1] px-3 py-1.5 text-[0.8125rem] font-medium text-[#404040] transition-colors hover:text-[#0c0c0c]"
                      >
                        {copiedId === c.id ? L.copied : L.copyCode}
                      </button>
                      <button
                        type="button"
                        onClick={() => revokeCode(c.id)}
                        disabled={revokingId === c.id}
                        className="rounded-[8px] border border-red-200 px-3 py-1.5 text-[0.8125rem] font-medium text-[#dc2626] transition-colors hover:bg-red-50 disabled:opacity-40"
                      >
                        {L.revoke}
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {codeError && <p className="mb-3 text-[0.8125rem] text-[#dc2626]">{codeError}</p>}

          <button
            type="button"
            onClick={generateCode}
            disabled={generatingCode || activeCodesCount >= 3}
            className="rounded-[12px] bg-[#0c0c0c] px-4 py-2.5 text-[0.875rem] font-medium text-white hover:brightness-[0.88] transition-[filter] disabled:opacity-40"
          >
            {generatingCode ? "…" : L.generateCode}
          </button>
          {activeCodesCount >= 3 && (
            <p className="mt-2 text-[0.8125rem] text-[#a3a3a3]">{L.maxCodes}</p>
          )}
        </SectionCard>

        {/* ── Data export ── */}
        <SectionCard>
          <SectionHeading title={L.exportTitle} subtitle={L.exportSubtitle} />
          <div className="space-y-4">
            <div className="rounded-[14px] border border-black/[0.06] bg-[#fafaf9] p-4">
              <p className="text-[0.875rem] font-semibold text-[#0c0c0c]">{L.exportPdfTitle}</p>
              <p className="mt-0.5 text-[0.8125rem] text-[#737373]">{L.exportPdfDesc}</p>
              <button
                type="button"
                onClick={() => window.open("/results/overview?print=1", "_blank")}
                className="mt-3 rounded-[10px] border border-black/[0.1] px-4 py-2 text-[0.8125rem] font-medium text-[#0c0c0c] hover:bg-[#f0f0ef] transition-colors"
              >
                {L.downloadPdf}
              </button>
            </div>
            <div className="rounded-[14px] border border-black/[0.06] bg-[#fafaf9] p-4">
              <p className="text-[0.875rem] font-semibold text-[#0c0c0c]">{L.exportJsonTitle}</p>
              <p className="mt-0.5 text-[0.8125rem] text-[#737373]">{L.exportJsonDesc}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href="/api/export/json"
                  download
                  className="rounded-[10px] border border-black/[0.1] px-4 py-2 text-[0.8125rem] font-medium text-[#0c0c0c] hover:bg-[#f0f0ef] transition-colors"
                >
                  {L.downloadJson}
                </a>
                <a
                  href="/api/export/csv"
                  download
                  className="rounded-[10px] border border-black/[0.1] px-4 py-2 text-[0.8125rem] font-medium text-[#0c0c0c] hover:bg-[#f0f0ef] transition-colors"
                >
                  {L.downloadCsv}
                </a>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── Privacy & consent ── */}
        <SectionCard>
          <SectionHeading title={L.privacyTitle} subtitle={L.privacySubtitle} />
          {data?.consent ? (
            <>
              <FieldRow
                label={L.consentGiven}
                value={new Date(data.consent.givenAt).toLocaleDateString(isDE ? "de-DE" : "en-GB", { day: "numeric", month: "long", year: "numeric" })}
                action={
                  <span className={`rounded-full border px-2.5 py-0.5 text-[0.75rem] font-semibold ${data.consent.isActive ? "border-green-100 bg-[#f0fdf4] text-[#16a34a]" : "border-red-100 bg-red-50 text-[#dc2626]"}`}>
                    {data.consent.isActive ? L.consentActive : L.consentRevoked}
                  </span>
                }
              />
              <div className="mt-4 flex flex-wrap gap-3 pt-3 border-t border-black/[0.05]">
                <Link href="/privacy" className="rounded-[10px] border border-black/[0.1] px-3 py-2 text-[0.8125rem] font-medium text-[#404040] hover:text-[#0c0c0c] transition-colors">
                  {L.privacyPolicy}
                </Link>
                {data.consent.isActive && (
                  <button
                    type="button"
                    onClick={revokeConsent}
                    disabled={consentRevoking}
                    className="rounded-[10px] border border-red-200 px-3 py-2 text-[0.8125rem] font-medium text-[#dc2626] hover:bg-red-50 transition-colors disabled:opacity-40"
                  >
                    {consentRevoking ? "…" : L.revokeConsent}
                  </button>
                )}
              </div>
              {data.consent.isActive && (
                <p className="mt-3 text-[0.775rem] text-[#a3a3a3]">{L.revokeConsentWarning}</p>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-[0.875rem] text-[#a3a3a3]">{L.consentNotRecorded}</p>
              <Link href="/privacy" className="inline-flex rounded-[10px] border border-black/[0.1] px-3 py-2 text-[0.8125rem] font-medium text-[#404040] hover:text-[#0c0c0c] transition-colors">
                {L.privacyPolicy}
              </Link>
            </div>
          )}
        </SectionCard>

        {/* ── Delete account ── */}
        <SectionCard danger>
          <div className="mb-2 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#dc2626]" aria-hidden>
              <path d="M8 2a6 6 0 100 12A6 6 0 008 2zm0 3.5v3M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <h2 className="text-[1rem] font-semibold text-[#0c0c0c]">{L.deleteTitle}</h2>
          </div>
          <p className="mb-1 text-[0.8125rem] text-[#737373]">{L.deleteDesc}</p>
          <p className="mb-5 text-[0.8125rem] font-medium text-[#dc2626]">{L.deleteIrreversible}</p>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="rounded-[12px] border border-red-200 px-4 py-2.5 text-[0.875rem] font-medium text-[#dc2626] hover:bg-red-50 transition-colors"
          >
            {L.deleteButton}
          </button>
        </SectionCard>

      </div>

      {/* ── Delete confirmation modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setShowDeleteModal(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-[24px] bg-white p-6 shadow-2xl">
            <h3 className="text-[1.0625rem] font-semibold text-[#0c0c0c]">{L.deleteModalTitle}</h3>
            <p className="mt-1.5 text-[0.8125rem] text-[#737373]">{L.deleteModalDesc}</p>
            <p className="mt-4 text-[0.8125rem] text-[#404040]">{L.deleteConfirmPrompt}</p>
            <input
              ref={deleteInputRef}
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder={L.deleteConfirmPlaceholder}
              className="mt-2 w-full rounded-[12px] border border-black/[0.15] bg-[#fafaf9] px-4 py-3 text-[0.9375rem] font-mono tracking-widest text-[#0c0c0c] outline-none focus:border-red-400"
            />
            {deleteError && <p className="mt-2 text-[0.8125rem] text-[#dc2626]">{deleteError}</p>}
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 rounded-full border border-black/[0.12] py-2.5 text-[0.875rem] font-medium text-[#404040] hover:bg-[#f0f0ef] transition-colors"
              >
                {L.cancel}
              </button>
              <button
                type="button"
                onClick={submitDelete}
                disabled={deleteInput !== L.deleteConfirmWord || deleteSubmitting}
                className="flex-1 rounded-full bg-[#dc2626] py-2.5 text-[0.875rem] font-medium text-white hover:bg-[#b91c1c] transition-colors disabled:opacity-40"
              >
                {deleteSubmitting ? "…" : L.deleteConfirmButton}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
