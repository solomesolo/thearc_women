"use client";

/**
 * GatedSection — renders a single article section.
 * If gated and user is not a subscriber: shows preview + upgrade prompt.
 * If subscriber or not gated: shows full content.
 *
 * Uses card-based styling consistent with InsightSection / InsightCard.
 */

import { clsx } from "clsx";

import { stripMarkdownBoldMarkers } from "@/lib/stripMarkdownBoldMarkers";

const PREVIEW_LENGTH = 220;
const WHAT_YOU_GET = [
  "Full evidence breakdown and limitations",
  "When it applies to your profile",
  "Implementation considerations",
  "Source citations and context",
];

type GatedSectionProps = {
  sectionIndex: number;
  title: string | null;
  body: string;
  isGated: boolean;
  preview?: string | null;
  isSubscriber?: boolean;
};

/** Heading style for action sections (7+) */
function headingClass(idx: number): string {
  return idx >= 7
    ? "text-[16px] font-semibold tracking-[-0.01em] text-[#6b3f1f] mb-4"
    : "text-[15px] font-semibold tracking-[-0.005em] text-[var(--text-primary)] mb-4";
}

function SectionBadge({ idx }: { idx: number }) {
  const labels: Record<number, string> = { 7: "Implementation", 8: "Protocol", 9: "Tracking" };
  const label = labels[idx];
  if (!label) return null;
  return (
    <span className="mb-3 inline-flex items-center rounded-full bg-[#f0e6dc] border border-[#ddd0c6] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[#8a6a50]">
      {label}
    </span>
  );
}

export function GatedSection({
  sectionIndex,
  title,
  body,
  isGated,
  preview: previewProp,
  isSubscriber = false,
}: GatedSectionProps) {
  const showFull = !isGated || isSubscriber;
  const bodyDisplay = stripMarkdownBoldMarkers(body);
  const preview =
    previewProp && previewProp.trim()
      ? stripMarkdownBoldMarkers(previewProp)
      : bodyDisplay.slice(0, PREVIEW_LENGTH) +
        (bodyDisplay.length > PREVIEW_LENGTH ? "…" : "");

  const isActionSection = sectionIndex >= 7;

  // ── Full content (subscriber or non-gated) ────────────────────────────────
  if (showFull) {
    return (
      <section
        id={`section-${sectionIndex}`}
        className={clsx(
          "scroll-mt-[100px] rounded-[20px] border px-7 py-7 md:px-9 md:py-9",
          isActionSection
            ? "bg-[#fdf8f5] border-[#e8ddd6] shadow-[0_1px_0_rgba(12,12,12,0.03),0_4px_16px_rgba(12,12,12,0.04)]"
            : "bg-white border-black/[0.07] shadow-[0_1px_0_rgba(12,12,12,0.04),0_6px_24px_rgba(12,12,12,0.04)]"
        )}
      >
        <SectionBadge idx={sectionIndex} />
        {title && (
          <h2 className={headingClass(sectionIndex)}>{title}</h2>
        )}
        <div className="whitespace-pre-wrap text-[15px] leading-[1.75] text-[var(--text-secondary)] max-w-prose">
          {bodyDisplay}
        </div>
      </section>
    );
  }

  // ── Gated — show preview + upgrade prompt ─────────────────────────────────
  return (
    <section
      id={`section-${sectionIndex}`}
      className="scroll-mt-[100px] rounded-[20px] border border-[#e8ddd6] bg-[#fdf8f5] px-7 py-7 md:px-9 md:py-9 shadow-[0_1px_0_rgba(12,12,12,0.03),0_4px_16px_rgba(12,12,12,0.04)]"
    >
      <SectionBadge idx={sectionIndex} />
      {title && (
        <h2 className={clsx("text-[16px] font-semibold tracking-[-0.01em] text-[#6b3f1f] mb-4")}>
          {title}
        </h2>
      )}

      {/* Preview text */}
      <p className="text-[15px] leading-[1.75] text-[var(--text-secondary)] max-w-prose">
        {preview}
      </p>

      {/* Gradient fade indicator */}
      <div className="my-5 h-px bg-gradient-to-r from-[#ddd0c6] via-[#e8ddd6] to-transparent" />

      {/* What you get */}
      <div className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-black/40 mb-3">
          What you get with full access
        </p>
        <ul className="space-y-2">
          {WHAT_YOU_GET.map((item, i) => (
            <li key={i} className="flex items-center gap-2.5 text-[13px] text-black/70">
              <span
                className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-[#f0e6dc] text-[10px] text-[#8a6a50]"
                aria-hidden
              >
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Comparison table */}
      <div className="mb-6 overflow-x-auto rounded-[12px] border border-[#ddd0c6] bg-white">
        <table className="w-full min-w-[280px] text-[13px]">
          <thead>
            <tr className="border-b border-[#e8ddd6]">
              <th className="px-4 py-2.5 text-left font-medium text-black/45 w-1/2">
                As a visitor
              </th>
              <th className="px-4 py-2.5 text-left font-semibold text-[var(--text-primary)] w-1/2">
                As a member
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#f0e8e0]">
              <td className="px-4 py-2.5 text-black/45">Preview only</td>
              <td className="px-4 py-2.5 text-[var(--text-primary)]">Full section</td>
            </tr>
            <tr className="border-b border-[#f0e8e0]">
              <td className="px-4 py-2.5 text-black/45">—</td>
              <td className="px-4 py-2.5 text-[var(--text-primary)]">Evidence &amp; context</td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 text-black/45">—</td>
              <td className="px-4 py-2.5 text-[var(--text-primary)]">Implementation notes</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center rounded-[14px] bg-black/90 px-6 text-[13px] font-semibold text-white transition-opacity hover:opacity-85 focus:outline-none"
        >
          Unlock full access
        </button>
        <span className="text-[12px] text-black/40">
          Sign in or subscribe to read in full
        </span>
      </div>
    </section>
  );
}
