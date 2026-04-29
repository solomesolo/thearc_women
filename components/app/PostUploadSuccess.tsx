"use client";

import { useEffect, useRef, useState } from "react";
import type { WalletSyncEntry } from "@/app/api/health-wallet/sync/route";
import { categorizeByName, selectInsights } from "@/lib/health-insights/insightTexts";

export interface PostUploadSuccessProps {
  addedEntries: WalletSyncEntry[];
  previousCount: number;
  totalExpected: number;
  nextMissingNames?: string[];
  language?: "en" | "de";
  onClose: () => void;
  onViewWallet?: () => void;
}

// ── Animated ring ─────────────────────────────────────────────────────────────

function ProgressRingAnimated({
  from,
  to,
  size = 96,
  strokeWidth = 8,
}: {
  from: number;
  to: number;
  size?: number;
  strokeWidth?: number;
}) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const startOffset = circumference - (from / 100) * circumference;
  const endOffset   = circumference - (to   / 100) * circumference;

  const [offset, setOffset] = useState(startOffset);
  const startRef = useRef<number | null>(null);
  const rafRef   = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = null;
    const duration = 800;

    function easeOutCubic(t: number) {
      return 1 - Math.pow(1 - t, 3);
    }

    function animate(ts: number) {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(elapsed / duration, 1);
      setOffset(startOffset + (endOffset - startOffset) * easeOutCubic(t));
      if (t < 1) rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  const center = size / 2;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle cx={center} cy={center} r={r} fill="none" stroke="#e5e5e5" strokeWidth={strokeWidth} />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="#0c0c0c"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[1.25rem] font-bold text-[#0c0c0c] leading-none">{Math.round(to)}%</span>
        <span className="text-[0.6875rem] text-[#737373] mt-0.5">complete</span>
      </div>
    </div>
  );
}

// ── Alert panels (derived from entries) ───────────────────────────────────────

function AlertPanels({ entries, lang }: { entries: WalletSyncEntry[]; lang: "en" | "de" }) {
  const outOfRange = entries.filter((e) => e.status === "out_of_range");
  const borderline = entries.filter((e) => e.status === "borderline");

  // Overdue: deduplicate by biomarkerKey (first occurrence per key)
  const seenKeys = new Set<string>();
  const overdue = entries.filter((e) => {
    if (!e.isOverdue || seenKeys.has(e.biomarkerKey)) return false;
    seenKeys.add(e.biomarkerKey);
    return true;
  });

  if (!outOfRange.length && !borderline.length && !overdue.length) return null;

  return (
    <div className="space-y-2">
      {outOfRange.length > 0 && (
        <div className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-2 w-2 rounded-full bg-[#dc2626]" />
            <p className="text-[0.8125rem] font-semibold text-[#dc2626]">
              {outOfRange.length}{" "}
              {lang === "de"
                ? `Wert${outOfRange.length > 1 ? "e" : ""} außerhalb des Referenzbereichs`
                : `value${outOfRange.length > 1 ? "s" : ""} outside reference range — monitor closely`}
            </p>
          </div>
          <div className="space-y-1.5">
            {outOfRange.map((e, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <span className="text-[0.8125rem] text-[#991b1b] font-medium truncate">{e.biomarkerName}</span>
                <span className="text-[0.8rem] text-[#dc2626] flex-shrink-0">{e.value}</span>
              </div>
            ))}
          </div>
          <p className="mt-2.5 text-[0.775rem] text-[#991b1b]">
            {lang === "de"
              ? "Bitte besprich diese Werte mit deinem Arzt. Sie wurden in deiner Akte markiert."
              : "Discuss these results with your doctor. They have been flagged in your health record."}
          </p>
        </div>
      )}

      {borderline.length > 0 && (
        <div className="rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-2 w-2 rounded-full bg-[#d97706]" />
            <p className="text-[0.8125rem] font-semibold text-[#92400e]">
              {borderline.length}{" "}
              {lang === "de"
                ? `Grenzwert${borderline.length > 1 ? "e" : ""} — beobachten`
                : `borderline value${borderline.length > 1 ? "s" : ""} — worth watching`}
            </p>
          </div>
          <div className="space-y-1.5">
            {borderline.map((e, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <span className="text-[0.8125rem] text-[#92400e] font-medium truncate">{e.biomarkerName}</span>
                <span className="text-[0.8rem] text-[#d97706] flex-shrink-0">{e.value}</span>
              </div>
            ))}
          </div>
          <p className="mt-2.5 text-[0.775rem] text-[#92400e]">
            {lang === "de"
              ? "Diese Werte liegen am Rand des Referenzbereichs. Beim nächsten Check erneut testen."
              : "These values are near the edge of the reference range. Retest at your next scheduled check."}
          </p>
        </div>
      )}

      {overdue.length > 0 && (
        <div className="rounded-[14px] border border-black/[0.1] bg-[#fafaf9] px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 text-[#737373]">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.25" />
              <path d="M7 4v3.5l2 2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
            </svg>
            <p className="text-[0.8125rem] font-semibold text-[#404040]">
              {overdue.length}{" "}
              {lang === "de"
                ? `Test${overdue.length > 1 ? "s" : ""} überfällig — Zeit für einen Wiederholungstest`
                : `test${overdue.length > 1 ? "s" : ""} overdue — time to retest`}
            </p>
          </div>
          <div className="space-y-2">
            {overdue.map((e, i) => (
              <div key={i} className="flex items-start justify-between gap-3">
                <span className="text-[0.8125rem] text-[#404040] font-medium truncate">{e.biomarkerName}</span>
                <span className="text-[0.775rem] text-[#737373] flex-shrink-0 text-right leading-snug">
                  {e.overdueByMonths}m {lang === "de" ? "überfällig" : "overdue"}
                  <br />
                  <span className="text-[0.725rem]">
                    ({lang === "de" ? "empf. alle" : "rec. every"} {e.overdueByMonths + (e.monthsSinceTest ?? 0)}m)
                  </span>
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2.5 text-[0.775rem] text-[#737373]">
            {lang === "de"
              ? "Diese wurden als hohe Priorität zu deinem Aktionsplan hinzugefügt."
              : "These have been added to your Action Plan as high priority."}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function PostUploadSuccess({
  addedEntries,
  previousCount,
  totalExpected,
  nextMissingNames = [],
  language = "en",
  onClose,
  onViewWallet,
}: PostUploadSuccessProps) {
  const lang = language;
  const newCount = previousCount + addedEntries.length;
  const safeTotal = Math.max(totalExpected, newCount, 1);
  const previousCompletion = Math.round((previousCount / safeTotal) * 100);
  const newCompletion = Math.round((newCount / safeTotal) * 100);

  const categories = addedEntries.map((e) => categorizeByName(e.biomarkerName));
  const insights = selectInsights(categories, lang);

  const displayEntries = addedEntries.slice(0, 5);
  const moreCount = addedEntries.length - 5;

  const STATUS_COLOR: Record<string, string> = {
    in_range:     "text-[#16a34a]",
    borderline:   "text-[#d97706]",
    out_of_range: "text-[#dc2626]",
    unknown:      "text-[#737373]",
  };

  return (
    <div className="space-y-5">
      {/* Ring + headline */}
      <div className="flex items-center gap-5">
        <ProgressRingAnimated from={previousCompletion} to={newCompletion} />
        <div className="min-w-0">
          <p className="text-[0.75rem] font-semibold uppercase tracking-wider text-[#16a34a] mb-1">
            {lang === "de" ? "Gespeichert" : "Saved"}
          </p>
          <h3 className="text-[1.125rem] font-bold text-[#0c0c0c] leading-snug">
            {addedEntries.length === 1
              ? (lang === "de" ? "1 Wert hinzugefügt" : "1 value added")
              : (lang === "de" ? `${addedEntries.length} Werte hinzugefügt` : `${addedEntries.length} values added`)}
          </h3>
          {previousCount > 0 && (
            <p className="text-[0.8125rem] text-[#737373] mt-0.5">
              {lang === "de"
                ? `Health Wallet ${previousCount} → ${newCount} Einträge`
                : `Health Wallet ${previousCount} → ${newCount} entries`}
            </p>
          )}
        </div>
      </div>

      {/* Added biomarkers list */}
      {addedEntries.length > 0 && (
        <div className="rounded-[14px] bg-[#f7f7f6] px-4 py-3">
          <p className="text-[0.75rem] font-semibold uppercase tracking-wider text-[#737373] mb-2">
            {lang === "de" ? "Hinzugefügt" : "Added"}
          </p>
          <div className="space-y-1.5">
            {displayEntries.map((e, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <span className="text-[0.875rem] text-[#0c0c0c] font-medium truncate">{e.biomarkerName}</span>
                <span className={`text-[0.875rem] font-semibold tabular-nums flex-shrink-0 ${STATUS_COLOR[e.status] ?? "text-[#737373]"}`}>
                  {e.value || "—"}
                </span>
              </div>
            ))}
            {moreCount > 0 && (
              <p className="text-[0.8rem] text-[#737373] mt-1">
                {lang === "de" ? `+${moreCount} weitere` : `+${moreCount} more`}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Critical alerts (out of range / borderline / overdue) */}
      <AlertPanels entries={addedEntries} lang={lang} />

      {/* Health insights */}
      {insights.length > 0 && (
        <div className="space-y-2">
          {insights.map((text, i) => (
            <div key={i} className="flex gap-3 rounded-[14px] border border-black/[0.06] bg-white px-4 py-3">
              <span className="mt-0.5 flex-shrink-0 text-[#737373]">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.25" />
                  <path d="M7 6v4M7 4.5v.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                </svg>
              </span>
              <p className="text-[0.8125rem] text-[#404040] leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Next missing checks */}
      {nextMissingNames.length > 0 && (
        <div>
          <p className="text-[0.75rem] font-semibold uppercase tracking-wider text-[#737373] mb-2">
            {lang === "de" ? "Noch fehlend" : "Still missing"}
          </p>
          <div className="flex flex-wrap gap-2">
            {nextMissingNames.slice(0, 6).map((name, i) => (
              <span
                key={i}
                className="rounded-full border border-black/[0.12] bg-[#fafaf9] px-3 py-1 text-[0.8rem] text-[#404040]"
              >
                {name}
              </span>
            ))}
            {nextMissingNames.length > 6 && (
              <span className="rounded-full border border-black/[0.12] bg-[#fafaf9] px-3 py-1 text-[0.8rem] text-[#737373]">
                +{nextMissingNames.length - 6}
              </span>
            )}
          </div>
        </div>
      )}

      {/* CTAs */}
      <div className="flex gap-3">
        {onViewWallet && (
          <button
            type="button"
            onClick={onViewWallet}
            className="flex-1 rounded-full border border-black/[0.12] py-3 text-[0.875rem] font-semibold text-[#0c0c0c] hover:bg-[#f0f0ef] transition-colors"
          >
            {lang === "de" ? "Wallet ansehen" : "View Health Wallet"}
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-full bg-[#0c0c0c] py-3 text-[0.875rem] font-semibold text-white hover:bg-[#1f1f1f] transition-colors"
        >
          {lang === "de" ? "Fertig" : "Done"}
        </button>
      </div>
    </div>
  );
}
