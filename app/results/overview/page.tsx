"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRecommendations } from "@/lib/recommendations/useRecommendations";
import { getOrCreateAnonId } from "@/lib/profile-engine-a/frontendClient";
import { useLocale } from "@/lib/i18n/useLocale";
import { ProtectedRouteGate } from "@/components/navigation/ProtectedRouteGate";
import { deduplicateScreenings } from "@/lib/screenings/screeningUtils";
import {
  loadWalletHistory,
  type BiomarkerWalletEntry,
  type BiomarkerResultStatus,
} from "@/components/app/BiomarkerActionRow";
import { HealthWalletHeader } from "@/components/app/HealthWalletHeader";
import { RemindMeButton } from "@/components/app/RemindMeButton";
import type { CheckRecommendation } from "@/lib/recommendations-engine/types";

// ── localStorage helpers for screenings ───────────────────────────────────────

interface ScreeningWalletResult {
  date: string;
  notes: string;
  fileName: string | null;
  fileType: string | null;
  savedAt: string;
}

function normBmKey(name: string) {
  return name.trim().toLowerCase().replaceAll(/[^a-z0-9]+/g, "_").replaceAll(/^_+|_+$/g, "");
}

function readScStatus(name: string): "missing" | "planned" | "done" {
  try {
    const v = localStorage.getItem(`arc_sc_status_${name.replace(/\s+/g, "_")}`);
    if (v === "planned" || v === "done") return v;
  } catch { /* ignore */ }
  return "missing";
}

function readScResult(name: string): ScreeningWalletResult | null {
  try {
    const raw = localStorage.getItem(`arc_sc_result_${name.replace(/\s+/g, "_")}`);
    return raw ? (JSON.parse(raw) as ScreeningWalletResult) : null;
  } catch { return null; }
}

// ── Domain model ──────────────────────────────────────────────────────────────

type Priority = "do_now" | "do_soon" | "optional";

function checkPriority(c: CheckRecommendation): Priority {
  if (c.timeframe === "next_month") return "do_now";
  if (c.timeframe === "next_3_months" || c.timeframe === "next_6_months") return "do_soon";
  return "optional";
}

interface WalletBiomarker {
  name: string;
  key: string;
  groupName: string;
  checkKey: string;
  priority: Priority;
  entries: BiomarkerWalletEntry[];
}

interface WalletScreening {
  name: string;
  checkKey: string;
  priority: Priority;
  status: "missing" | "planned" | "done";
  result: ScreeningWalletResult | null;
}

interface DomainGroup {
  checkKey: string;
  name: string;
  isScreening: boolean;
  priority: Priority;
  biomarkers: WalletBiomarker[];
  screenings: WalletScreening[];
  total: number;
  completed: number;
  planned: number;
  missing: number;
}

type Tab = "overview" | "biomarkers" | "screenings" | "timeline";

interface TimelineEvent {
  label: string;
  sub: string;
  date: string;
  type: "completed" | "planned" | "missing";
}

// ── Sparkline ─────────────────────────────────────────────────────────────────

function Sparkline({ entries, status }: { entries: BiomarkerWalletEntry[]; status: BiomarkerResultStatus }) {
  const numeric = entries
    .map((e) => e.numericValue)
    .filter((v): v is number => v !== null);
  if (numeric.length < 2) return null;

  const W = 72, H = 28, pad = 3;
  const min = Math.min(...numeric);
  const max = Math.max(...numeric);
  const range = max - min || 1;

  const pts = numeric.map((v, i) => {
    const x = pad + (i / (numeric.length - 1)) * (W - pad * 2);
    const y = pad + (1 - (v - min) / range) * (H - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const stroke =
    status === "out_of_range" ? "#dc2626"
    : status === "borderline"  ? "#d97706"
    : "#16a34a";

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden className="shrink-0">
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Latest value dot */}
      {(() => {
        const last = pts[pts.length - 1].split(",");
        return <circle cx={last[0]} cy={last[1]} r="2.5" fill={stroke} />;
      })()}
    </svg>
  );
}

// ── Status coloring helpers ───────────────────────────────────────────────────

function bmCardClass(status: BiomarkerResultStatus | null): string {
  if (status === "out_of_range") return "border-[#fca5a5] bg-[#fff5f5]";
  if (status === "borderline") return "border-[#fcd34d] bg-[#fffbeb]";
  return "border-black/[0.05] bg-[#fafaf9]";
}

function statusLabel(status: BiomarkerResultStatus, isDE: boolean): string | null {
  if (status === "out_of_range") return isDE ? "Ärztliche Beratung empfohlen" : "Consult your doctor";
  if (status === "borderline") return isDE ? "Grenzwert — beobachten" : "Borderline — monitor closely";
  return null;
}

// ── PDF export ────────────────────────────────────────────────────────────────

function generateHealthSummaryPDF(
  biomarkers: WalletBiomarker[],
  screenings: WalletScreening[],
  userName: string | null,
  isDE: boolean,
) {
  const lang = isDE ? "de" : "en";
  const date = new Date().toLocaleDateString(lang === "de" ? "de-DE" : "en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  const t = {
    title: isDE ? "Gesundheitsübersicht" : "Health Summary",
    subtitle: isDE ? "Erstellt von The Arc Woman" : "Generated by The Arc Woman",
    forDoctor: isDE ? "Für den Arztbesuch" : "For your doctor visit",
    biomarkersSection: isDE ? "Biomarker" : "Biomarkers",
    screeningsSection: isDE ? "Vorsorgeuntersuchungen" : "Preventive Screenings",
    value: isDE ? "Wert" : "Value",
    date: isDE ? "Datum" : "Date",
    notes: isDE ? "Notizen" : "Notes",
    inRange: isDE ? "Im Normalbereich" : "In range",
    borderline: isDE ? "Grenzwertig" : "Borderline",
    outOfRange: isDE ? "Außerhalb des Normalbereichs" : "Out of range",
    unknown: isDE ? "Unbekannt" : "Unknown",
    noValue: isDE ? "Kein Wert angegeben" : "No value recorded",
    completed: isDE ? "Abgeschlossen" : "Completed",
    planned: isDE ? "Geplant" : "Planned",
    missing: isDE ? "Fehlend" : "Missing",
    consultNote: isDE
      ? "Bitte besprechen Sie die markierten Werte mit Ihrem Arzt."
      : "Please discuss highlighted values with your doctor.",
    disclaimer: isDE
      ? "Diese Zusammenfassung dient nur zur Information und ersetzt keine ärztliche Beratung."
      : "This summary is for informational purposes only and does not replace medical advice.",
  };

  const statusText = (s: BiomarkerResultStatus) => {
    if (s === "in_range") return `<span style="color:#16a34a">${t.inRange}</span>`;
    if (s === "borderline") return `<span style="color:#d97706;font-weight:600">${t.borderline}</span>`;
    if (s === "out_of_range") return `<span style="color:#dc2626;font-weight:700">⚠ ${t.outOfRange}</span>`;
    return `<span style="color:#737373">${t.unknown}</span>`;
  };

  const bmWithData = biomarkers.filter((b) => b.entries.length > 0);
  const scWithData = screenings.filter((s) => s.status !== "missing");

  const bmRows = bmWithData.map((bm) => {
    const latest = bm.entries[bm.entries.length - 1];
    const history = bm.entries.length > 1
      ? `<div style="font-size:11px;color:#737373;margin-top:2px">
           ${bm.entries.slice(-3).map((e) => `${e.date}: ${e.value || "—"}`).join(" · ")}
         </div>`
      : "";
    return `
      <tr style="border-bottom:1px solid #e5e7eb">
        <td style="padding:8px 4px;font-weight:500">${bm.name}</td>
        <td style="padding:8px 4px">${latest.value || t.noValue}${history}</td>
        <td style="padding:8px 4px">${latest.date || "—"}</td>
        <td style="padding:8px 4px">${statusText(latest.status)}</td>
        <td style="padding:8px 4px;color:#737373;font-size:12px">${latest.notes || "—"}</td>
      </tr>`;
  }).join("");

  const scRows = scWithData.map((sc) => {
    const statusColor = sc.status === "done" ? "#16a34a" : "#d97706";
    const statusTxt = sc.status === "done" ? t.completed : t.planned;
    return `
      <tr style="border-bottom:1px solid #e5e7eb">
        <td style="padding:8px 4px;font-weight:500">${sc.name}</td>
        <td style="padding:8px 4px;color:${statusColor};font-weight:600">${statusTxt}</td>
        <td style="padding:8px 4px;color:#737373">${sc.result?.date || "—"}</td>
        <td style="padding:8px 4px;color:#737373;font-size:12px">${sc.result?.notes || "—"}</td>
      </tr>`;
  }).join("");

  const hasOutOfRange = bmWithData.some((b) => b.entries.at(-1)?.status === "out_of_range");
  const consultBanner = hasOutOfRange
    ? `<div style="background:#fff5f5;border:1px solid #fca5a5;border-radius:8px;padding:12px 16px;margin-bottom:20px;color:#b91c1c;font-weight:600">⚠ ${t.consultNote}</div>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <title>${t.title} — The Arc Woman</title>
  <style>
    @page { size: A4; margin: 20mm 18mm; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #111; line-height: 1.5; }
    h1 { font-size: 22px; font-weight: 700; margin: 0 0 4px; }
    h2 { font-size: 14px; font-weight: 700; margin: 24px 0 10px; border-bottom: 2px solid #e5e7eb; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { text-align: left; padding: 6px 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #737373; border-bottom: 2px solid #e5e7eb; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb; }
    .logo { font-size: 16px; font-weight: 800; letter-spacing: -0.03em; }
    .meta { font-size: 11px; color: #737373; text-align: right; }
    .disclaimer { margin-top: 32px; font-size: 11px; color: #a3a3a3; border-top: 1px solid #e5e7eb; padding-top: 12px; }
    @media print { button { display: none !important; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">The Arc Woman</div>
      <h1>${t.title}</h1>
      <p style="color:#737373;font-size:12px;margin:2px 0 0">${t.forDoctor}</p>
    </div>
    <div class="meta">
      ${userName ? `<div style="font-weight:600">${userName}</div>` : ""}
      <div>${date}</div>
    </div>
  </div>

  ${consultBanner}

  ${bmWithData.length > 0 ? `
  <h2>${t.biomarkersSection}</h2>
  <table>
    <thead>
      <tr>
        <th>${isDE ? "Biomarker" : "Biomarker"}</th>
        <th>${t.value}</th>
        <th>${t.date}</th>
        <th>Status</th>
        <th>${t.notes}</th>
      </tr>
    </thead>
    <tbody>${bmRows}</tbody>
  </table>` : ""}

  ${scWithData.length > 0 ? `
  <h2>${t.screeningsSection}</h2>
  <table>
    <thead>
      <tr>
        <th>${isDE ? "Untersuchung" : "Screening"}</th>
        <th>Status</th>
        <th>${t.date}</th>
        <th>${t.notes}</th>
      </tr>
    </thead>
    <tbody>${scRows}</tbody>
  </table>` : ""}

  <div class="disclaimer">${t.disclaimer}</div>

  <script>window.onload = function() { window.print(); };<\/script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function HealthWalletPage() {
  const { data: session } = useSession();
  const locale = useLocale();
  const userId = session?.user?.email ?? (typeof window !== "undefined" ? `anon:${getOrCreateAnonId()}` : null);
  const { data: recs, isLoading } = useRecommendations(userId);

  const [tab, setTab] = useState<Tab>("overview");

  const [wallet, setWallet] = useState<{
    groups: DomainGroup[];
    biomarkers: WalletBiomarker[];
    screenings: WalletScreening[];
  }>({ groups: [], biomarkers: [], screenings: [] });

  useEffect(() => {
    if (!recs?.pathway) return;

    const allChecks: CheckRecommendation[] = [
      ...(recs.pathway.next_month ?? []),
      ...(recs.pathway.next_3_months ?? []),
      ...(recs.pathway.next_6_months ?? []),
      ...(recs.pathway.next_year ?? []),
      ...(recs.pathway.optional_later ?? []),
    ];

    const groups: DomainGroup[] = [];
    const allBiomarkers: WalletBiomarker[] = [];
    const allScreenings: WalletScreening[] = [];

    const seenBmKeys = new Set<string>();
    const seenScNames = new Set<string>();

    for (const check of allChecks) {
      const priority = checkPriority(check);
      const groupBiomarkers: WalletBiomarker[] = [];
      const groupScreenings: WalletScreening[] = [];

      if (check.isScreening) {
        const rawNames = (check.includedTestsByCategory ?? []).flatMap((cat) => cat.tests);
        const unique = deduplicateScreenings(rawNames);
        for (const name of unique) {
          if (seenScNames.has(name)) continue;
          seenScNames.add(name);
          const status = readScStatus(name);
          const result = readScResult(name);
          const ws: WalletScreening = { name, checkKey: check.checkKey, priority, status, result };
          groupScreenings.push(ws);
          allScreenings.push(ws);
        }
      } else {
        const rawNames = (check.includedTestsByCategory ?? []).flatMap((cat) => cat.tests);
        const unique = Array.from(new Set(rawNames));
        for (const name of unique) {
          const key = normBmKey(name);
          if (seenBmKeys.has(key)) continue;
          seenBmKeys.add(key);
          const entries = loadWalletHistory(key);
          const wb: WalletBiomarker = { name, key, groupName: check.checkName, checkKey: check.checkKey, priority, entries };
          groupBiomarkers.push(wb);
          allBiomarkers.push(wb);
        }
      }

      const total = groupBiomarkers.length + groupScreenings.length;
      if (total === 0) continue;

      const completed =
        groupBiomarkers.filter((b) => b.entries.length > 0).length +
        groupScreenings.filter((s) => s.status === "done").length;
      const planned =
        groupScreenings.filter((s) => s.status === "planned").length;
      const missing =
        groupBiomarkers.filter((b) => b.entries.length === 0).length +
        groupScreenings.filter((s) => s.status === "missing").length;

      groups.push({
        checkKey: check.checkKey,
        name: check.checkName,
        isScreening: check.isScreening,
        priority,
        biomarkers: groupBiomarkers,
        screenings: groupScreenings,
        total,
        completed,
        planned,
        missing,
      });
    }

    setWallet({ groups, biomarkers: allBiomarkers, screenings: allScreenings });
  }, [recs]);

  const timelineEvents = useMemo((): TimelineEvent[] => {
    const events: TimelineEvent[] = [];
    for (const bm of wallet.biomarkers) {
      if (bm.entries.length > 0) {
        const latest = bm.entries[bm.entries.length - 1];
        events.push({ label: bm.name, sub: latest.value ? `Value: ${latest.value}` : "Result saved", date: latest.savedAt, type: "completed" });
      }
    }
    for (const sc of wallet.screenings) {
      if (sc.status === "done" && sc.result) {
        events.push({ label: sc.name, sub: "Screening completed", date: sc.result.savedAt, type: "completed" });
      } else if (sc.status === "planned") {
        events.push({ label: sc.name, sub: "Screening planned", date: new Date().toISOString(), type: "planned" });
      }
    }
    return events.sort((a, b) => b.date.localeCompare(a.date));
  }, [wallet]);

  const isDE = locale === "de";
  const L = {
    title: isDE ? "Meine Health Wallet" : "My Health Wallet",
    subtitle: isDE
      ? "Ihre empfohlenen Biomarker und Vorsorgeuntersuchungen — mit Ergebnissen, Lücken und nächsten Schritten."
      : "Your recommended biomarkers and screenings — with results, gaps, and next actions.",
    recommended: isDE ? "Empfohlen" : "Recommended",
    completed: isDE ? "Abgeschlossen" : "Completed",
    missing: isDE ? "Fehlend" : "Missing",
    planned: isDE ? "Geplant" : "Planned",
    criticalMissing: isDE ? "Kritisch fehlend" : "Critical missing",
    overviewTab: isDE ? "Übersicht" : "Overview",
    biomarkersTab: isDE ? "Biomarker" : "Biomarkers",
    screeningsTab: "Screenings",
    timelineTab: "Timeline",
    complete: isDE ? "vollständig" : "complete",
    viewDetails: isDE ? "Details anzeigen" : "View details",
    addResult: isDE ? "Ergebnis hinzufügen" : "Add result",
    notStarted: isDE ? "Nicht begonnen" : "Not started",
    partiallyComplete: isDE ? "Teilweise abgeschlossen" : "Partially complete",
    doNow: isDE ? "Jetzt handeln" : "Do now",
    doSoon: isDE ? "Bald handeln" : "Do soon",
    optional: "Optional",
    noEvents: isDE ? "Noch keine Einträge in Ihrer Wallet." : "No entries in your wallet yet.",
    loading: isDE ? "Wallet wird geladen…" : "Loading your wallet…",
    empty: isDE ? "Keine Empfehlungen gefunden." : "No recommendations found.",
    openActionPlan: isDE ? "Action Plan öffnen" : "Open Action Plan",
    savedDate: isDE ? "Gespeichert" : "Saved",
    value: isDE ? "Messwert" : "Value",
    statusMissing: isDE ? "Fehlend" : "Missing",
    statusPlanned: isDE ? "Geplant" : "Planned",
    statusDone: isDE ? "Abgeschlossen" : "Completed",
    groupBiomarkers: isDE ? "Bluttests" : "Blood tests",
    groupScreenings: isDE ? "Vorsorgeuntersuchungen" : "Preventive screenings",
    completenessLabel: isDE ? "Ihrer empfohlenen Gesundheitsdaten sind vollständig" : "of your recommended health data is complete",
    criticalNote: isDE ? "Benötigt für: nächste beste Maßnahme oder Risikobewertung" : "Required for: next best action or key risk assessment",
    noCritical: isDE ? "Keine kritisch fehlenden Elemente." : "No critical missing items.",
    noItems: isDE ? "Keine Einträge in dieser Kategorie." : "No items in this category.",
    exportPDF: isDE ? "Zusammenfassung exportieren" : "Export for Doctor",
    exportTitle: isDE ? "PDF für Arztbesuch" : "Doctor visit PDF",
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: L.overviewTab },
    { id: "biomarkers", label: L.biomarkersTab },
    { id: "screenings", label: L.screeningsTab },
    { id: "timeline", label: L.timelineTab },
  ];

  const priorityPill = (p: Priority) => {
    if (p === "do_now") return <span className="rounded-full bg-[#0c0c0c] px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-white">{L.doNow}</span>;
    if (p === "do_soon") return <span className="rounded-full bg-[#525252] px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-white">{L.doSoon}</span>;
    return <span className="rounded-full border border-black/[0.1] bg-[#f5f5f4] px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-[#737373]">{L.optional}</span>;
  };

  const statusBadge = (status: "missing" | "planned" | "done") => {
    if (status === "done") return <span className="rounded-full bg-white border border-black/[0.12] px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-[#404040]">{L.statusDone}</span>;
    if (status === "planned") return <span className="rounded-full bg-[#525252] px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-white">{L.statusPlanned}</span>;
    return <span className="rounded-full bg-[#0c0c0c] px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-white">{L.statusMissing}</span>;
  };

  const hasExportableData =
    wallet.biomarkers.some((b) => b.entries.length > 0) ||
    wallet.screenings.some((s) => s.status !== "missing");

  return (
    <ProtectedRouteGate
      requestedRoute="/results/overview"
      allowStates={["AUTH_ACTIVE_DASHBOARD_READY", "AUTH_PROFILE_READY_RESULTS_UNSEEN", "AUTH_PROFILE_READY_NO_RECOMMENDATIONS"]}
      loadingText={L.loading}
    >
      <div className="mx-auto max-w-[72rem] px-5 py-10 md:px-8">

        {/* ── Page header ── */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-[1.5rem] font-semibold tracking-tight text-[#0c0c0c] md:text-[1.75rem]">
            {L.title}
          </h1>

          {/* Export for Doctor button */}
          {hasExportableData && (
            <button
              type="button"
              onClick={() =>
                generateHealthSummaryPDF(
                  wallet.biomarkers,
                  wallet.screenings,
                  session?.user?.name ?? session?.user?.email ?? null,
                  isDE,
                )
              }
              className="shrink-0 flex items-center gap-2 rounded-[12px] border border-black/[0.12] bg-white px-4 py-2.5 text-[0.875rem] font-medium text-[#0c0c0c] shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-[filter] hover:brightness-[0.95]"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M3 11v2a1 1 0 001 1h8a1 1 0 001-1v-2M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {L.exportPDF}
            </button>
          )}
        </div>

        {/* ── Journey header ── */}
        {isLoading ? (
          <div className="mb-8 space-y-3">
            <div className="h-28 animate-pulse rounded-[20px] bg-[#f0f0ef]" />
            <div className="flex gap-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-28 flex-1 animate-pulse rounded-[16px] bg-[#f0f0ef]" />)}
            </div>
            <div className="h-28 animate-pulse rounded-[20px] bg-[#f0f0ef]" />
          </div>
        ) : (
          <HealthWalletHeader
            biomarkers={wallet.biomarkers}
            screenings={wallet.screenings}
            isDE={isDE}
            onViewBiomarkers={() => setTab("biomarkers")}
            onViewScreenings={() => setTab("screenings")}
          />
        )}

        {/* ── Tab bar ── */}
        <div className="mb-6 flex gap-1 rounded-[14px] border border-black/[0.08] bg-[#fafaf9] p-1">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex-1 rounded-[10px] px-3 py-2 text-[0.875rem] font-medium transition-colors ${
                tab === id
                  ? "bg-white text-[#0c0c0c] shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                  : "text-[#737373] hover:text-[#404040]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Loading skeleton ── */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-[20px] bg-[#f0f0ef]" />
            ))}
          </div>
        )}

        {/* ── Tab: Overview ── */}
        {!isLoading && tab === "overview" && (
          <div className="space-y-4">
            {wallet.groups.length === 0 && (
              <div className="rounded-[20px] border border-black/[0.08] bg-white p-8 text-center">
                <p className="text-[0.9375rem] text-[#737373]">{L.empty}</p>
                <Link href="/health-journey" className="mt-4 inline-flex rounded-[12px] bg-[#0c0c0c] px-4 py-2.5 text-[0.875rem] font-medium text-white hover:brightness-[0.9]">
                  {isDE ? "Assessment starten" : "Start assessment"}
                </Link>
              </div>
            )}

            {wallet.groups.map((group) => {
              const pct = group.total > 0 ? Math.round((group.completed / group.total) * 100) : 0;
              const statusLabel =
                group.completed === group.total && group.total > 0
                  ? isDE ? "Vollständig" : "Complete"
                  : group.completed > 0
                    ? L.partiallyComplete
                    : L.notStarted;

              const previewItems = group.isScreening
                ? group.screenings.slice(0, 4).map((s) => s.name)
                : group.biomarkers.slice(0, 4).map((b) => b.name);

              const nextMissing = group.isScreening
                ? group.screenings.find((s) => s.status === "missing")?.name
                : group.biomarkers.find((b) => b.entries.length === 0)?.name;

              return (
                <div key={group.checkKey} className="rounded-[20px] border border-black/[0.08] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.03)] md:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {priorityPill(group.priority)}
                        <span className="text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-[#a3a3a3]">
                          {group.isScreening ? L.groupScreenings : L.groupBiomarkers}
                        </span>
                      </div>
                      <h3 className="mt-2 text-[1rem] font-semibold tracking-tight text-[#0c0c0c]">
                        {group.name}
                      </h3>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {previewItems.map((item) => (
                          <span key={item} className="rounded-full border border-black/[0.08] bg-[#fafaf9] px-2.5 py-0.5 text-[0.75rem] text-[#525252]">
                            {item}
                          </span>
                        ))}
                        {group.total > 4 && (
                          <span className="rounded-full border border-black/[0.08] bg-[#fafaf9] px-2.5 py-0.5 text-[0.75rem] text-[#a3a3a3]">
                            +{group.total - 4} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="font-mono text-[1.5rem] font-semibold tabular-nums leading-none text-[#0c0c0c]">
                        {group.completed}/{group.total}
                      </p>
                      <p className="mt-0.5 text-[0.75rem] text-[#737373]">{statusLabel}</p>
                    </div>
                  </div>

                  <div className="mt-4 h-1.5 w-full rounded-full bg-[#f0f0ef]">
                    <div className="h-1.5 rounded-full bg-[#0c0c0c] transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-3 text-[0.8125rem] text-[#737373]">
                      <span>{group.completed} {L.completed.toLowerCase()}</span>
                      {group.planned > 0 && <span>{group.planned} {L.planned.toLowerCase()}</span>}
                      <span>{group.missing} {L.missing.toLowerCase()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {nextMissing && (
                        <p className="text-[0.8125rem] text-[#737373]">
                          {isDE ? "Nächste:" : "Next:"} <span className="font-medium text-[#0c0c0c]">{nextMissing}</span>
                        </p>
                      )}
                      <RemindMeButton
                        checkKey={group.checkKey}
                        checkName={group.name}
                        isDE={isDE}
                      />
                      <button
                        type="button"
                        onClick={() => setTab(group.isScreening ? "screenings" : "biomarkers")}
                        className="rounded-[10px] border border-black/[0.1] px-3 py-1.5 text-[0.8125rem] font-medium text-[#404040] transition-colors hover:text-[#0c0c0c]"
                      >
                        {L.viewDetails}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {wallet.groups.length > 0 && (
              <Link
                href="/results/action-plan"
                className="flex items-center justify-between rounded-[20px] border border-black/[0.08] bg-[#0c0c0c] p-5 text-white shadow-[0_1px_0_rgba(0,0,0,0.03)] transition-[filter] hover:brightness-[0.88]"
              >
                <div>
                  <p className="text-[0.9375rem] font-semibold">{L.openActionPlan}</p>
                  <p className="mt-0.5 text-[0.8125rem] text-white/60">
                    {isDE ? "Labs, Heimtests, Arztbesuche planen" : "Plan labs, home tests, doctor visits"}
                  </p>
                </div>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden className="shrink-0 opacity-60">
                  <path d="M4 10h12M11 4l6 6-6 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            )}
          </div>
        )}

        {/* ── Tab: Biomarkers ── */}
        {!isLoading && tab === "biomarkers" && (
          <div className="space-y-4">
            {wallet.biomarkers.length === 0 && (
              <p className="text-[0.9375rem] text-[#737373]">{L.noItems}</p>
            )}

            {wallet.groups.filter((g) => !g.isScreening && g.biomarkers.length > 0).map((group) => (
              <div key={group.checkKey}>
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="text-[0.875rem] font-semibold text-[#0c0c0c]">{group.name}</h2>
                  {priorityPill(group.priority)}
                  <span className="text-[0.8125rem] text-[#a3a3a3]">
                    {group.completed}/{group.total}
                  </span>
                </div>
                <div className="space-y-2">
                  {group.biomarkers.map((bm) => {
                    const hasSaved = bm.entries.length > 0;
                    const latest = hasSaved ? bm.entries[bm.entries.length - 1] : null;
                    const latestStatus: BiomarkerResultStatus = latest?.status ?? "unknown";
                    const consultLabel = hasSaved ? statusLabel(latestStatus, isDE) : null;

                    return (
                      <div
                        key={bm.key}
                        className={`rounded-[16px] border p-4 ${hasSaved ? bmCardClass(latestStatus) : "border-black/[0.08] bg-white"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {hasSaved && (
                                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#0c0c0c] text-white">
                                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none" aria-hidden>
                                    <path d="M1 3l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </span>
                              )}
                              <p className={`text-[0.9375rem] font-semibold ${hasSaved ? "text-[#0c0c0c]" : "text-[#0c0c0c]"}`}>
                                {bm.name}
                              </p>
                              {statusBadge(hasSaved ? "done" : "missing")}

                              {/* Out-of-range / borderline badge */}
                              {consultLabel && (
                                <span className={`rounded-full px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.08em] ${
                                  latestStatus === "out_of_range"
                                    ? "bg-[#dc2626] text-white"
                                    : "bg-[#d97706] text-white"
                                }`}>
                                  {consultLabel}
                                </span>
                              )}
                            </div>

                            {hasSaved && latest ? (
                              <div className="mt-2 space-y-1">
                                <div className="flex flex-wrap gap-3 text-[0.8125rem] text-[#737373]">
                                  {latest.value && <span>{L.value}: <span className="font-medium text-[#404040]">{latest.value}</span></span>}
                                  {latest.date && <span>{L.savedDate}: <span className="font-medium text-[#404040]">{latest.date}</span></span>}
                                  {latest.fileName && <span>📎 {latest.fileName}</span>}
                                  {latest.notes && <span className="line-clamp-1 italic">{latest.notes}</span>}
                                </div>

                                {/* History entries when multiple exist */}
                                {bm.entries.length > 1 && (
                                  <p className="text-[0.75rem] text-[#a3a3a3]">
                                    {bm.entries.length} {isDE ? "Einträge" : "entries"} —&nbsp;
                                    {bm.entries.slice(-3, -1).reverse().map((e, i) => (
                                      <span key={i}>{e.date ? `${e.date}: ` : ""}{e.value || "—"}{i < Math.min(bm.entries.length - 2, 2) - 1 ? ", " : ""}</span>
                                    ))}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="mt-1.5 text-[0.8125rem] text-[#a3a3a3]">
                                {isDE ? "Empfohlen für:" : "Recommended for:"} {bm.groupName}
                              </div>
                            )}
                          </div>

                          <div className="flex shrink-0 flex-col items-end gap-2">
                            {/* Sparkline trend */}
                            {hasSaved && latest && (
                              <Sparkline entries={bm.entries} status={latestStatus} />
                            )}

                            {!hasSaved && (
                              <Link
                                href="/results/action-plan"
                                className="rounded-[10px] border border-black/[0.1] px-3 py-1.5 text-[0.8125rem] font-medium text-[#404040] transition-colors hover:text-[#0c0c0c]"
                              >
                                {L.addResult}
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Tab: Screenings ── */}
        {!isLoading && tab === "screenings" && (
          <div className="space-y-4">
            {wallet.screenings.length === 0 && (
              <p className="text-[0.9375rem] text-[#737373]">{L.noItems}</p>
            )}

            {wallet.groups.filter((g) => g.isScreening && g.screenings.length > 0).map((group) => (
              <div key={group.checkKey}>
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="text-[0.875rem] font-semibold text-[#0c0c0c]">{group.name}</h2>
                  {priorityPill(group.priority)}
                  <span className="text-[0.8125rem] text-[#a3a3a3]">{group.completed}/{group.total}</span>
                </div>
                <div className="space-y-2">
                  {group.screenings.map((sc) => (
                    <div
                      key={sc.name}
                      className={`rounded-[16px] border p-4 ${sc.status === "done" ? "border-black/[0.05] bg-[#fafaf9]" : "border-black/[0.08] bg-white"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {sc.status === "done" && (
                              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#0c0c0c] text-white">
                                <svg width="8" height="6" viewBox="0 0 8 6" fill="none" aria-hidden>
                                  <path d="M1 3l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </span>
                            )}
                            {sc.status === "planned" && (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-[#525252]" />
                            )}
                            <p className={`text-[0.9375rem] font-semibold ${sc.status === "done" ? "text-[#737373] line-through" : "text-[#0c0c0c]"}`}>
                              {sc.name}
                            </p>
                            {statusBadge(sc.status)}
                            <span className="rounded-full border border-black/[0.08] bg-[#fafaf9] px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-[#737373]">
                              GKV covered
                            </span>
                          </div>

                          {sc.result ? (
                            <div className="mt-2 flex flex-wrap gap-3 text-[0.8125rem] text-[#737373]">
                              {sc.result.date && <span>{L.savedDate}: <span className="font-medium text-[#404040]">{sc.result.date}</span></span>}
                              {sc.result.fileName && <span>📎 {sc.result.fileName}</span>}
                              {sc.result.notes && <span className="line-clamp-1 italic">{sc.result.notes}</span>}
                            </div>
                          ) : (
                            <p className="mt-1 text-[0.8125rem] text-[#a3a3a3]">
                              {isDE ? "Empfohlen für:" : "Recommended for:"} {group.name}
                            </p>
                          )}
                        </div>

                        {sc.status !== "done" && (
                          <Link
                            href="/results/action-plan"
                            className="shrink-0 rounded-[10px] border border-black/[0.1] px-3 py-1.5 text-[0.8125rem] font-medium text-[#404040] transition-colors hover:text-[#0c0c0c]"
                          >
                            {sc.status === "planned" ? (isDE ? "Fortschritt" : "Update") : L.addResult}
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Tab: Timeline ── */}
        {!isLoading && tab === "timeline" && (
          <div>
            {timelineEvents.length === 0 ? (
              <div className="rounded-[20px] border border-black/[0.08] bg-white p-8 text-center">
                <p className="text-[0.9375rem] text-[#737373]">{L.noEvents}</p>
                <p className="mt-2 text-[0.8125rem] text-[#a3a3a3]">
                  {isDE
                    ? "Sobald Sie Ergebnisse hinzufügen oder Untersuchungen als abgeschlossen markieren, erscheinen sie hier."
                    : "Once you add results or mark screenings complete, they'll appear here."}
                </p>
                <Link
                  href="/results/action-plan"
                  className="mt-4 inline-flex rounded-[12px] bg-[#0c0c0c] px-4 py-2.5 text-[0.875rem] font-medium text-white hover:brightness-[0.9]"
                >
                  {L.openActionPlan}
                </Link>
              </div>
            ) : (
              <div className="relative space-y-0">
                <div className="absolute left-[19px] top-4 bottom-4 w-px bg-black/[0.08]" aria-hidden />
                <div className="space-y-3">
                  {timelineEvents.map((ev, i) => {
                    const dateStr = ev.date
                      ? new Date(ev.date).toLocaleDateString(isDE ? "de-DE" : "en-GB", { day: "numeric", month: "short", year: "numeric" })
                      : "—";
                    return (
                      <div key={i} className="relative flex gap-4">
                        <span
                          className={`relative z-10 mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
                            ev.type === "completed"
                              ? "border-black/[0.12] bg-[#0c0c0c] text-white"
                              : ev.type === "planned"
                                ? "border-black/[0.12] bg-[#525252] text-white"
                                : "border-black/[0.1] bg-white text-[#737373]"
                          }`}
                        >
                          {ev.type === "completed" ? (
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden>
                              <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : ev.type === "planned" ? (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                              <circle cx="5" cy="5" r="3" stroke="currentColor" strokeWidth="1.4" />
                            </svg>
                          ) : (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                              <path d="M5 2v4M5 7.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                            </svg>
                          )}
                        </span>
                        <div className="flex-1 rounded-[16px] border border-black/[0.07] bg-white p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-[0.9375rem] font-semibold text-[#0c0c0c]">{ev.label}</p>
                              <p className="mt-0.5 text-[0.8125rem] text-[#737373]">{ev.sub}</p>
                            </div>
                            <p className="shrink-0 text-[0.75rem] text-[#a3a3a3]">{dateStr}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </ProtectedRouteGate>
  );
}
