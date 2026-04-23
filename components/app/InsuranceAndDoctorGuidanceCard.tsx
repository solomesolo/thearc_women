"use client";

import type { DoctorGuidancePayload } from "@/lib/doctor-guidance/types";

// ── Status badge colour map ───────────────────────────────────────────────────
const GKV_BADGE: Record<string, string> = {
  "Usually covered":        "bg-[#dcfce7] text-[#166534]",
  "Covered with indication":"bg-[#dbeafe] text-[#1e40af]",
  "Covered as screening":   "bg-[#dbeafe] text-[#1e40af]",
  "Often covered":          "bg-[#dbeafe] text-[#1e40af]",
  "Covered for monitoring": "bg-[#dbeafe] text-[#1e40af]",
  "Sometimes covered":      "bg-[#fef9c3] text-[#854d0e]",
  "Depends on context":     "bg-[#fef9c3] text-[#854d0e]",
  "Usually self-paid":      "bg-[#fee2e2] text-[#991b1b]",
  "Not routine-covered":    "bg-[#fee2e2] text-[#991b1b]",
};

const PKV_BADGE: Record<string, string> = {
  "Often covered":        "bg-[#dcfce7] text-[#166534]",
  "Depends on your tariff":"bg-[#fef9c3] text-[#854d0e]",
  "Sometimes covered":    "bg-[#fef9c3] text-[#854d0e]",
  "May be self-paid":     "bg-[#fee2e2] text-[#991b1b]",
};

function badgeClass(label: string, map: Record<string, string>) {
  return map[label] ?? "bg-[#f5f5f4] text-[#525252]";
}

// ── Section headings ──────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a3a3a3]">
      {children}
    </p>
  );
}

// ── Small info icon ───────────────────────────────────────────────────────────
function InfoDot() {
  return (
    <span
      className="mt-[0.35em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#d4d4d4]"
      aria-hidden
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function InsuranceAndDoctorGuidanceCard({
  guidance,
  isLoading,
  country,
}: {
  guidance: DoctorGuidancePayload | null;
  isLoading?: boolean;
  country?: string | null;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-3 w-2/3 rounded bg-[#f0f0ef]" />
        <div className="h-3 w-full rounded bg-[#f0f0ef]" />
        <div className="h-3 w-5/6 rounded bg-[#f0f0ef]" />
      </div>
    );
  }

  if (!guidance) {
    return (
      <div className="space-y-2">
        <SectionLabel>Through your doctor</SectionLabel>
        <ul className="space-y-2">
          {[
            "Bring this recommendation to your next appointment.",
            "Ask if it can be added to routine bloodwork.",
            "If not routinely covered, ask about the self-paid option.",
          ].map((line) => (
            <li key={line} className="flex gap-2">
              <InfoDot />
              <span className="text-[0.875rem] leading-[1.6] text-[#525252]">{line}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const { gkv, pkv, how_to_ask } = guidance;
  const isUK = country === "GB";
  const gkvLabel = isUK ? "NHS coverage" : "Covered by GKV";
  const pkvLabel = isUK ? "Private healthcare" : "Covered by PKV";

  return (
    <div className="space-y-4">
      {/* GKV / NHS */}
      <div>
        <SectionLabel>{gkvLabel}</SectionLabel>
        <div className="mt-2 rounded-[10px] border border-black/[0.07] bg-[#fafaf9] p-3">
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold ${badgeClass(gkv.status_label, GKV_BADGE)}`}
          >
            {gkv.status_label}
          </span>
          <p className="mt-2 text-[0.8125rem] leading-[1.6] text-[#404040]">{gkv.user_text}</p>
          {gkv.frequency_text && (
            <p className="mt-1.5 text-[0.75rem] leading-snug text-[#737373]">
              {gkv.frequency_text}
            </p>
          )}
          {gkv.extra_note && (
            <p className="mt-1.5 text-[0.75rem] leading-snug text-[#a3a3a3]">
              {gkv.extra_note}
            </p>
          )}
        </div>
      </div>

      {/* PKV / Private */}
      <div>
        <SectionLabel>{pkvLabel}</SectionLabel>
        <div className="mt-2 rounded-[10px] border border-black/[0.07] bg-[#fafaf9] p-3">
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold ${badgeClass(pkv.status_label, PKV_BADGE)}`}
          >
            {pkv.status_label}
          </span>
          <p className="mt-2 text-[0.8125rem] leading-[1.6] text-[#404040]">{pkv.user_text}</p>
          {pkv.extra_note && (
            <p className="mt-1.5 text-[0.75rem] leading-snug text-[#a3a3a3]">
              {pkv.extra_note}
            </p>
          )}
        </div>
      </div>

      {/* How to ask */}
      <div>
        <SectionLabel>How to ask about this test</SectionLabel>
        <div className="mt-2 space-y-1.5">
          <p className="text-[0.8125rem] leading-[1.6] text-[#525252] italic">
            {how_to_ask.why_this_matters}
          </p>
          <ul className="mt-2 space-y-2">
            {how_to_ask.suggested_lines.map((line, i) => (
              <li key={i} className="flex gap-2">
                <InfoDot />
                <span className="text-[0.8125rem] leading-[1.6] text-[#404040]">{line}</span>
              </li>
            ))}
          </ul>
          {how_to_ask.self_pay_note && (
            <p className="mt-2 text-[0.75rem] leading-snug text-[#a3a3a3]">
              {how_to_ask.self_pay_note}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
