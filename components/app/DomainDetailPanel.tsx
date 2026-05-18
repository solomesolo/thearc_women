"use client";

import Link from "next/link";
import type { WomensHealthDomain, DomainSignalStatus } from "@/lib/health-map/domainEngine";
import type { BiomarkerResultStatus } from "@/components/app/BiomarkerActionRow";

// ── Status chip ───────────────────────────────────────────────────────────────

const STATUS_CHIP_STYLES: Record<DomainSignalStatus, string> = {
  in_range: "bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]",
  watch: "bg-[#fffbeb] text-[#d97706] border border-[#fde68a]",
  needs_attention: "bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]",
  not_enough_data: "bg-[#f5f5f5] text-[#a3a3a3] border border-[#e5e5e5]",
  no_current_action: "bg-[#f5f5f5] text-[#a3a3a3] border border-[#e5e5e5]",
};

const STATUS_LABEL_EN: Record<DomainSignalStatus, string> = {
  in_range: "In range",
  watch: "Watch",
  needs_attention: "Needs attention",
  not_enough_data: "Not enough data",
  no_current_action: "No action needed",
};

const STATUS_LABEL_DE: Record<DomainSignalStatus, string> = {
  in_range: "Im Bereich",
  watch: "Beobachten",
  needs_attention: "Aufmerksamkeit",
  not_enough_data: "Nicht genug Daten",
  no_current_action: "Keine Maßnahme",
};

// ── Biomarker status chip ─────────────────────────────────────────────────────

const BM_STATUS_STYLES: Record<BiomarkerResultStatus, string> = {
  in_range: "bg-[#f0fdf4] text-[#16a34a]",
  borderline: "bg-[#fffbeb] text-[#d97706]",
  out_of_range: "bg-[#fef2f2] text-[#dc2626]",
  unknown: "bg-[#f5f5f5] text-[#a3a3a3]",
};

const BM_STATUS_LABEL_EN: Record<BiomarkerResultStatus, string> = {
  in_range: "In range",
  borderline: "Borderline",
  out_of_range: "Out of range",
  unknown: "Unknown",
};

const BM_STATUS_LABEL_DE: Record<BiomarkerResultStatus, string> = {
  in_range: "Im Bereich",
  borderline: "Grenzwertig",
  out_of_range: "Außerhalb",
  unknown: "Unklar",
};

// ── Close icon ────────────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M4.5 4.5l9 9M13.5 4.5l-9 9"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface DomainDetailPanelProps {
  domain: WomensHealthDomain;
  isDE: boolean;
  onClose?: () => void;
}

export function DomainDetailPanel({ domain, isDE, onClose }: DomainDetailPanelProps) {
  const statusLabels = isDE ? STATUS_LABEL_DE : STATUS_LABEL_EN;
  const bmStatusLabels = isDE ? BM_STATUS_LABEL_DE : BM_STATUS_LABEL_EN;
  const showDash = domain.recommendedItems === 0;

  return (
    <div className="rounded-[20px] border border-black/[0.08] bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.03)]">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="text-[1.125rem] font-semibold text-[#0c0c0c]">{domain.label}</h2>
          <span className={`rounded-full px-2.5 py-0.5 text-[0.75rem] font-medium ${STATUS_CHIP_STYLES[domain.status]}`}>
            {statusLabels[domain.status]}
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-[8px] p-1.5 text-[#737373] transition-colors hover:bg-black/[0.05] hover:text-[#0c0c0c]"
            aria-label={isDE ? "Schließen" : "Close"}
          >
            <CloseIcon />
          </button>
        )}
      </div>

      {/* Two-stat row */}
      <div className="mt-4 flex flex-wrap gap-6">
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#a3a3a3]">
            {isDE ? "Daten bekannt" : "Data known"}
          </p>
          <p className="mt-0.5 text-[1.125rem] font-semibold tabular-nums text-[#0c0c0c]">
            {showDash ? "—" : `${domain.dataConfidencePercent}%`}
          </p>
        </div>
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#a3a3a3]">
            {isDE ? "Verfolgte Einträge" : "Items tracked"}
          </p>
          <p className="mt-0.5 text-[1.125rem] font-semibold tabular-nums text-[#0c0c0c]">
            {showDash ? "—" : `${domain.completedItems} / ${domain.recommendedItems}`}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="my-4 h-px bg-black/[0.06]" />

      {/* Summary */}
      {domain.summary && (
        <p className="text-[0.9375rem] italic leading-relaxed text-[#404040]">
          {domain.summary}
        </p>
      )}

      {/* Attention items */}
      {domain.attentionItems.length > 0 && (
        <div className="mt-5">
          <p className="mb-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-[#737373]">
            {isDE ? "Überprüfen" : "Needs review"}
          </p>
          <ul className="space-y-2">
            {domain.attentionItems.map((item) => (
              <li
                key={item.id}
                className="rounded-[14px] border border-[#fecaca] bg-[#fef2f2] px-4 py-2.5"
              >
                <p className="text-[0.875rem] font-semibold text-[#0c0c0c]">{item.name}</p>
                {item.reason && (
                  <p className="mt-0.5 text-[0.8125rem] text-[#737373]">{item.reason}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Supporting items */}
      {domain.supportingItems.length > 0 && (
        <div className="mt-5">
          <p className="mb-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-[#737373]">
            {isDE ? "In Ihrer Akte" : "In your record"}
          </p>
          <ul className="space-y-2">
            {domain.supportingItems.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-[14px] border border-black/[0.07] bg-[#fafaf9] px-4 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-[0.875rem] font-medium text-[#0c0c0c]">
                    {item.name}
                  </p>
                  {(item.value || item.date) && (
                    <p className="mt-0.5 text-[0.75rem] text-[#737373]">
                      {[item.value, item.unit].filter(Boolean).join(" ")}
                      {item.date && (
                        <span className="ml-2 text-[#a3a3a3]">{item.date}</span>
                      )}
                    </p>
                  )}
                </div>
                {item.status && item.status !== "unknown" && (
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[0.6875rem] font-medium ${BM_STATUS_STYLES[item.status]}`}>
                    {bmStatusLabels[item.status]}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer actions */}
      {(domain.nextAction || domain.supportingItems.length > 0) && (
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-black/[0.06] pt-4">
          {domain.nextAction && (
            <Link
              href={domain.nextAction.href}
              className="rounded-[12px] bg-[#0c0c0c] px-4 py-2.5 text-[0.875rem] font-medium text-white transition-[filter] hover:brightness-[0.88]"
            >
              {domain.nextAction.label}
            </Link>
          )}
          <Link
            href="/results/overview"
            className="rounded-[12px] border border-black/[0.1] px-4 py-2.5 text-[0.875rem] font-medium text-[#404040] transition-colors hover:text-[#0c0c0c]"
          >
            {isDE ? "Wallet ansehen" : "View wallet"}
          </Link>
        </div>
      )}
    </div>
  );
}
