"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
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
import { loadScreeningEvents } from "@/lib/calendar/localHealthCalendarStore";

const UploadResultsModal = dynamic(
  () => import("@/components/app/UploadResultsModal").then((m) => ({ default: m.UploadResultsModal })),
  { ssr: false },
);

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

type Tab = "biomarkers" | "screenings" | "timeline";

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

// ── ProgressRing ──────────────────────────────────────────────────────────────

function ProgressRing({ value, size = 52, strokeWidth = 4 }: { value: number; size?: number; strokeWidth?: number }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value));
  const offset = circ - (pct / 100) * circ;
  const cx = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#f0f0ef" strokeWidth={strokeWidth} />
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#0c0c0c" strokeWidth={strokeWidth}
        strokeDasharray={`${circ}`} strokeDashoffset={`${offset}`}
        strokeLinecap="round" transform={`rotate(-90 ${cx} ${cx})`} />
    </svg>
  );
}

// ── PriorityPill (standalone) ─────────────────────────────────────────────────

function PriorityPill({ priority }: { priority: Priority }) {
  if (priority === "do_now") return <span className="rounded-full bg-[#0c0c0c] px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-white">Do now</span>;
  if (priority === "do_soon") return <span className="rounded-full bg-[#525252] px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-white">Do soon</span>;
  return <span className="rounded-full border border-black/[0.1] bg-[#f5f5f4] px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-[#737373]">Optional</span>;
}

// ── BiomarkerResultCard ───────────────────────────────────────────────────────

function BiomarkerResultCard({ bm }: { bm: WalletBiomarker }) {
  const entries = bm.entries;
  const latest = entries[entries.length - 1];
  const numeric = entries.map((e) => e.numericValue).filter((v): v is number => v !== null);

  const bgBorder: Record<BiomarkerResultStatus, string> = {
    in_range: "bg-[#f0fdf4] border-green-100",
    borderline: "bg-amber-50 border-amber-100",
    out_of_range: "bg-red-50 border-red-100",
    unknown: "bg-[#fafaf9] border-black/[0.06]",
  };
  const valueColor: Record<BiomarkerResultStatus, string> = {
    in_range: "text-[#16a34a]",
    borderline: "text-[#d97706]",
    out_of_range: "text-[#dc2626]",
    unknown: "text-[#404040]",
  };

  return (
    <div className={`rounded-[14px] border p-3.5 ${bgBorder[latest.status] ?? bgBorder.unknown}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.875rem] font-semibold text-[#0c0c0c]">{bm.name}</p>
          <div className="mt-1 flex flex-wrap items-baseline gap-1.5">
            {latest.value && (
              <span className={`text-[0.9375rem] font-semibold tabular-nums ${valueColor[latest.status] ?? valueColor.unknown}`}>
                {latest.value}
              </span>
            )}
            {latest.date && <span className="text-[0.75rem] text-[#a3a3a3]">{latest.date}</span>}
          </div>
          {latest.fileName && <p className="mt-0.5 truncate text-[0.7rem] text-[#a3a3a3]">{latest.fileName}</p>}
          {latest.status === "out_of_range" && (
            <p className="mt-1.5 text-[0.75rem] font-medium text-[#dc2626]">Consult your doctor</p>
          )}
          {latest.status === "borderline" && (
            <p className="mt-1.5 text-[0.75rem] text-[#d97706]">Monitor closely</p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {numeric.length >= 2 ? (
            <Sparkline entries={entries} status={latest.status} />
          ) : (
            <span className="max-w-[68px] text-right text-[0.7rem] leading-snug text-[#a3a3a3]">
              Trend after next result
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── BiomarkerGroupCard ────────────────────────────────────────────────────────

function BiomarkerGroupCard({
  group,
  onUpload,
}: {
  group: DomainGroup;
  onUpload: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const completed = group.biomarkers.filter((b) => b.entries.length > 0);
  const missing = group.biomarkers.filter((b) => b.entries.length === 0);
  const pct = group.total > 0 ? Math.round((group.completed / group.total) * 100) : 0;

  const CHIP_MAX = 4;
  const visibleMissing = expanded ? missing : missing.slice(0, CHIP_MAX);
  const hiddenCount = missing.length - CHIP_MAX;

  const latestDate = completed
    .flatMap((b) => b.entries)
    .filter((e) => e.date)
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))[0]?.date ?? null;

  const statusText =
    pct === 100 && group.total > 0 ? "Complete"
    : completed.length > 0 ? `${completed.length} of ${group.total} added`
    : "No results added yet";

  const showToggle = completed.length > 3 || missing.length > CHIP_MAX;

  return (
    <div className="overflow-hidden rounded-[20px] border border-black/[0.08] bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)]">
      <div className="p-5 md:p-6">
        {/* Header row */}
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <ProgressRing value={pct} size={52} strokeWidth={4} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[0.6rem] font-semibold tabular-nums text-[#0c0c0c]">{pct}%</span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[1rem] font-semibold leading-snug tracking-tight text-[#0c0c0c]">{group.name}</h3>
              <PriorityPill priority={group.priority} />
            </div>
            <p className="mt-0.5 text-[0.8125rem] text-[#737373]">{statusText}</p>
            {latestDate && (
              <p className="text-[0.75rem] text-[#a3a3a3]">Last result: {latestDate}</p>
            )}
          </div>
          {showToggle && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="shrink-0 rounded-[10px] border border-black/[0.1] px-3 py-1.5 text-[0.8125rem] font-medium text-[#404040] transition-colors hover:text-[#0c0c0c]"
            >
              {expanded ? "Show less" : "Show all"}
            </button>
          )}
        </div>

        {/* Completed biomarkers */}
        {completed.length > 0 && (
          <div className="mt-5">
            <p className="mb-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#737373]">
              What we know
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(expanded ? completed : completed.slice(0, 3)).map((bm) => (
                <BiomarkerResultCard key={bm.key} bm={bm} />
              ))}
              {!expanded && completed.length > 3 && (
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="rounded-[14px] border border-dashed border-black/[0.1] p-3.5 text-left text-[0.8125rem] text-[#737373] transition-colors hover:text-[#0c0c0c]"
                >
                  +{completed.length - 3} more results
                </button>
              )}
            </div>
          </div>
        )}

        {/* Missing chips */}
        {missing.length > 0 && (
          <div className="mt-4">
            <p className="mb-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#737373]">
              Still useful to add
            </p>
            <div className="flex flex-wrap gap-1.5">
              {visibleMissing.map((bm) => (
                <span
                  key={bm.key}
                  className="rounded-full border border-black/[0.08] bg-[#fafaf9] px-2.5 py-1 text-[0.8125rem] text-[#525252]"
                >
                  {bm.name}
                </span>
              ))}
              {!expanded && hiddenCount > 0 && (
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="rounded-full border border-black/[0.08] bg-[#f0f0ef] px-2.5 py-1 text-[0.8125rem] text-[#737373] transition-colors hover:text-[#0c0c0c]"
                >
                  +{hiddenCount} more
                </button>
              )}
            </div>
          </div>
        )}

        {/* CTAs */}
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onUpload}
            className="rounded-[12px] bg-[#0c0c0c] px-4 py-2.5 text-[0.875rem] font-medium text-white transition-[filter] hover:brightness-[0.88]"
          >
            Upload result
          </button>
          <Link
            href="/results/action-plan"
            className="rounded-[12px] border border-black/[0.1] px-4 py-2.5 text-[0.875rem] font-medium text-[#404040] transition-colors hover:text-[#0c0c0c]"
          >
            Plan test
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── ScreeningCard ─────────────────────────────────────────────────────────────

function ScreeningCard({
  sc,
  groupName,
  plannedDate,
}: {
  sc: WalletScreening;
  groupName: string;
  plannedDate: string | null;
}) {
  const displayStatus =
    sc.status === "done" ? "completed"
    : sc.status === "planned" ? "planned"
    : "recommended";

  const dot = {
    recommended: "bg-[#0c0c0c]",
    planned: "bg-[#525252]",
    completed: "bg-[#16a34a]",
  }[displayStatus];

  const labelText = { recommended: "Recommended", planned: "Planned", completed: "Completed" }[displayStatus];
  const labelClass = { recommended: "text-[#0c0c0c]", planned: "text-[#525252]", completed: "text-[#16a34a]" }[displayStatus];
  const isDone = displayStatus === "completed";
  const cardBg = isDone ? "bg-[#fafaf9] border-black/[0.05]" : "bg-white border-black/[0.08]";

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className={`rounded-[18px] border p-4 md:p-5 ${cardBg}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
            <p className={`text-[0.9375rem] font-semibold ${isDone ? "text-[#737373]" : "text-[#0c0c0c]"}`}>
              {sc.name}
            </p>
            <span className={`text-[0.75rem] font-semibold ${labelClass}`}>{labelText}</span>
          </div>

          <div className="mt-1.5 space-y-0.5 pl-4">
            {isDone && sc.result?.date && (
              <p className="text-[0.8125rem] text-[#737373]">
                Completed: {sc.result.date}
                {sc.result.notes ? ` · ${sc.result.notes}` : ""}
              </p>
            )}
            {displayStatus === "planned" && plannedDate && (
              <p className="text-[0.8125rem] text-[#737373]">
                Planned: {formatDate(plannedDate)}
              </p>
            )}
            {displayStatus === "recommended" && (
              <p className="text-[0.8125rem] text-[#a3a3a3]">
                No result added yet · Recommended for: {groupName}
              </p>
            )}
            {sc.result?.fileName && (
              <p className="text-[0.75rem] text-[#a3a3a3]">{sc.result.fileName}</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {!isDone && (
            <Link
              href="/results/action-plan"
              className="rounded-[10px] bg-[#0c0c0c] px-3 py-1.5 text-[0.8125rem] font-medium text-white transition-[filter] hover:brightness-[0.88]"
            >
              Add result
            </Link>
          )}
          {isDone && (
            <Link
              href="/results/action-plan"
              className="rounded-[10px] border border-black/[0.1] px-3 py-1.5 text-[0.8125rem] font-medium text-[#404040] transition-colors hover:text-[#0c0c0c]"
            >
              View details
            </Link>
          )}
          {displayStatus === "planned" && (
            <Link
              href="/my-health-calendar"
              className="rounded-[10px] border border-black/[0.1] px-3 py-1.5 text-[0.8125rem] font-medium text-[#404040] transition-colors hover:text-[#0c0c0c]"
            >
              View calendar
            </Link>
          )}
          {displayStatus === "recommended" && (
            <RemindMeButton checkKey={sc.checkKey} checkName={sc.name} />
          )}
        </div>
      </div>
    </div>
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

  const [tab, setTab] = useState<Tab>("biomarkers");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [scPlannedDates, setScPlannedDates] = useState<Record<string, string>>({});

  // Load screening calendar events from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const events = loadScreeningEvents();
      const dates: Record<string, string> = {};
      for (const [key, ev] of Object.entries(events)) {
        dates[key] = ev.meta.plannedDateISO;
      }
      setScPlannedDates(dates);
    } catch { /* ignore */ }
  }, []);

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
    // All individual biomarker entries (not just latest)
    for (const bm of wallet.biomarkers) {
      for (const entry of bm.entries) {
        const sub = [entry.value, entry.fileName ? `Source: ${entry.fileName}` : null]
          .filter(Boolean).join(" · ") || "Result saved";
        events.push({ label: bm.name, sub, date: entry.savedAt, type: "completed" });
      }
    }
    for (const sc of wallet.screenings) {
      if (sc.status === "done" && sc.result) {
        const sub = sc.result.notes ? `Completed · ${sc.result.notes}` : "Screening completed";
        events.push({ label: sc.name, sub, date: sc.result.savedAt, type: "completed" });
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
      allowStates={["AUTH_ACTIVE_DASHBOARD_READY", "AUTH_PROFILE_READY_RESULTS_UNSEEN", "AUTH_PROFILE_READY_NO_RECOMMENDATIONS", "ANON_COMPLETED_SURVEY_UNREGISTERED"]}
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

        {/* ── Tab: Biomarkers ── */}
        {!isLoading && tab === "biomarkers" && (
          <div className="space-y-5">
            {wallet.groups.filter((g) => !g.isScreening && g.biomarkers.length > 0).length === 0 && (
              <div className="rounded-[20px] border border-black/[0.08] bg-white p-8 text-center">
                <p className="text-[0.9375rem] font-semibold text-[#404040]">No biomarker results added yet</p>
                <p className="mt-1.5 text-[0.8125rem] text-[#737373]">
                  Upload existing results or plan your first recommended test.
                </p>
                <div className="mt-4 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(true)}
                    className="rounded-[12px] bg-[#0c0c0c] px-4 py-2.5 text-[0.875rem] font-medium text-white hover:brightness-[0.88]"
                  >
                    Upload existing result
                  </button>
                  <Link
                    href="/results/action-plan"
                    className="rounded-[12px] border border-black/[0.1] px-4 py-2.5 text-[0.875rem] font-medium text-[#404040] hover:text-[#0c0c0c]"
                  >
                    Plan your first test
                  </Link>
                </div>
              </div>
            )}

            {wallet.groups
              .filter((g) => !g.isScreening && g.biomarkers.length > 0)
              .map((group) => (
                <BiomarkerGroupCard
                  key={group.checkKey}
                  group={group}
                  onUpload={() => setShowUploadModal(true)}
                />
              ))}
          </div>
        )}

        {/* ── Tab: Screenings ── */}
        {!isLoading && tab === "screenings" && (
          <div className="space-y-6">
            {wallet.groups.filter((g) => g.isScreening && g.screenings.length > 0).length === 0 && (
              <div className="rounded-[20px] border border-black/[0.08] bg-white p-8 text-center">
                <p className="text-[0.9375rem] font-semibold text-[#404040]">No screenings added yet</p>
                <p className="mt-1.5 text-[0.8125rem] text-[#737373]">
                  You can add past screenings or plan recommended ones.
                </p>
                <Link
                  href="/results/action-plan"
                  className="mt-4 inline-flex rounded-[12px] bg-[#0c0c0c] px-4 py-2.5 text-[0.875rem] font-medium text-white hover:brightness-[0.9]"
                >
                  {L.openActionPlan}
                </Link>
              </div>
            )}

            {wallet.groups
              .filter((g) => g.isScreening && g.screenings.length > 0)
              .map((group) => (
                <div key={group.checkKey}>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <h2 className="text-[0.9375rem] font-semibold text-[#0c0c0c]">{group.name}</h2>
                    <PriorityPill priority={group.priority} />
                    <span className="text-[0.8125rem] text-[#a3a3a3]">
                      {group.completed}/{group.total} {group.completed === group.total && group.total > 0 ? "· Complete" : ""}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {group.screenings.map((sc) => {
                      const scKey = sc.name.replace(/\s+/g, "_");
                      const plannedDate = scPlannedDates[scKey] ?? null;
                      return (
                        <ScreeningCard
                          key={sc.name}
                          sc={sc}
                          groupName={group.name}
                          plannedDate={plannedDate}
                        />
                      );
                    })}
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
                <p className="text-[0.9375rem] font-semibold text-[#404040]">Your timeline will appear here</p>
                <p className="mt-1.5 text-[0.8125rem] text-[#737373]">
                  Once you add results or plan checks, each action will appear here in chronological order.
                </p>
                <div className="mt-4 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(true)}
                    className="rounded-[12px] bg-[#0c0c0c] px-4 py-2.5 text-[0.875rem] font-medium text-white hover:brightness-[0.88]"
                  >
                    Upload result
                  </button>
                  <Link
                    href="/results/action-plan"
                    className="rounded-[12px] border border-black/[0.1] px-4 py-2.5 text-[0.875rem] font-medium text-[#404040] hover:text-[#0c0c0c]"
                  >
                    {L.openActionPlan}
                  </Link>
                </div>
              </div>
            ) : (() => {
              // Group events by calendar date
              const byDate: Record<string, TimelineEvent[]> = {};
              for (const ev of timelineEvents) {
                const key = ev.date
                  ? new Date(ev.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                  : "Unknown date";
                if (!byDate[key]) byDate[key] = [];
                byDate[key].push(ev);
              }
              const dateGroups = Object.entries(byDate);

              return (
                <div className="space-y-6">
                  {dateGroups.map(([dateLabel, evs]) => (
                    <div key={dateLabel}>
                      <p className="mb-3 text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-[#a3a3a3]">
                        {dateLabel}
                      </p>
                      <div className="relative space-y-2">
                        <div className="absolute left-[15px] top-0 bottom-0 w-px bg-black/[0.07]" aria-hidden />
                        {evs.map((ev, i) => (
                          <div key={i} className="relative flex items-start gap-3">
                            <span
                              className={`relative z-10 mt-0.5 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border ${
                                ev.type === "completed"
                                  ? "border-transparent bg-[#0c0c0c] text-white"
                                  : "border-black/[0.1] bg-white text-[#737373]"
                              }`}
                            >
                              {ev.type === "completed" ? (
                                <svg width="9" height="7" viewBox="0 0 9 7" fill="none" aria-hidden>
                                  <path d="M1 3.5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              ) : (
                                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden>
                                  <circle cx="4" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.3" />
                                </svg>
                              )}
                            </span>
                            <div className="flex-1 rounded-[14px] border border-black/[0.07] bg-white px-4 py-3">
                              <p className="text-[0.875rem] font-semibold text-[#0c0c0c]">{ev.label}</p>
                              <p className="mt-0.5 text-[0.8125rem] text-[#737373]">{ev.sub}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

      </div>

      <UploadResultsModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />
    </ProtectedRouteGate>
  );
}
