"use client";

import type { WomensHealthDomain, WomensHealthDomainId, DomainSignalStatus } from "@/lib/health-map/domainEngine";

// ── Status color config ───────────────────────────────────────────────────────

const STATUS_RING_STROKE: Record<DomainSignalStatus, string> = {
  in_range: "#16a34a",
  watch: "#d97706",
  needs_attention: "#dc2626",
  not_enough_data: "#d4d4d4",
  no_current_action: "#e5e5e5",
};

const STATUS_TEXT_CLASS: Record<DomainSignalStatus, string> = {
  in_range: "text-[#16a34a]",
  watch: "text-[#d97706]",
  needs_attention: "text-[#dc2626]",
  not_enough_data: "text-[#a3a3a3]",
  no_current_action: "text-[#a3a3a3]",
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

// ── Circular progress ring ────────────────────────────────────────────────────

function DomainRing({
  percent,
  status,
  showDash,
}: {
  percent: number;
  status: DomainSignalStatus;
  showDash: boolean;
}) {
  const r = 32;
  const sw = 5;
  const size = 80;
  const center = size / 2;
  const circumference = 2 * Math.PI * r;
  const offset = showDash ? circumference : circumference * (1 - percent / 100);
  const stroke = STATUS_RING_STROKE[status];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="black"
          strokeOpacity="0.07"
          strokeWidth={sw}
        />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={showDash ? circumference : offset}
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: "stroke-dashoffset 0.7s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono text-[0.875rem] font-semibold tabular-nums text-[#0c0c0c]">
          {showDash ? "—" : `${percent}%`}
        </span>
      </div>
    </div>
  );
}

// ── Domain card ───────────────────────────────────────────────────────────────

function DomainCard({
  domain,
  isSelected,
  isDE,
  onClick,
}: {
  domain: WomensHealthDomain;
  isSelected: boolean;
  isDE: boolean;
  onClick: () => void;
}) {
  const statusLabels = isDE ? STATUS_LABEL_DE : STATUS_LABEL_EN;
  const showDash =
    domain.status === "no_current_action" || domain.status === "not_enough_data";
  const showBadge = domain.attentionItems.length > 0 &&
    (domain.status === "needs_attention" || domain.status === "watch");

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative flex flex-col items-center gap-3 rounded-[20px] border p-5 text-center cursor-pointer transition-all",
        "w-full",
        isSelected
          ? "border-[#0c0c0c] shadow-[0_0_0_2px_#0c0c0c]"
          : "border-black/[0.08] hover:border-black/[0.2]",
      ].join(" ")}
    >
      {/* Attention badge */}
      {showBadge && (
        <span
          className="absolute right-3 top-3 flex h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: STATUS_RING_STROKE[domain.status] }}
          aria-hidden="true"
        />
      )}

      <DomainRing
        percent={domain.dataConfidencePercent}
        status={domain.status}
        showDash={showDash}
      />

      <div className="min-w-0 w-full">
        <p className="truncate text-[0.875rem] font-semibold text-[#0c0c0c]">
          {domain.label}
        </p>
        <p className={`mt-0.5 text-[0.75rem] font-medium ${STATUS_TEXT_CLASS[domain.status]}`}>
          {statusLabels[domain.status]}
        </p>
      </div>
    </button>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface WomensHealthMapProps {
  domains: WomensHealthDomain[];
  selectedDomainId?: WomensHealthDomainId;
  onSelectDomain: (id: WomensHealthDomainId) => void;
  isDE: boolean;
}

export function WomensHealthMap({
  domains,
  selectedDomainId,
  onSelectDomain,
  isDE,
}: WomensHealthMapProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
      {domains.map((domain) => (
        <DomainCard
          key={domain.id}
          domain={domain}
          isSelected={domain.id === selectedDomainId}
          isDE={isDE}
          onClick={() => onSelectDomain(domain.id)}
        />
      ))}
    </div>
  );
}
