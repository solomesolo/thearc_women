/**
 * InsightSection — modular card wrapper for each article section.
 *
 * Visual variants by section type:
 *   sectionIndex 1–2   (intro/context)        → default white card
 *   sectionIndex 3–6   (research/implications) → default white card, research-style heading
 *   sectionIndex 7–9   (action protocol zone)  → warm card with action-style heading
 *
 * Body text is rendered with whitespace-pre-wrap to preserve
 * the line breaks stored in the DB. No copy changes.
 */
import { clsx } from "clsx";
import { InsightCard } from "./InsightCard";

type InsightSectionProps = {
  sectionIndex: number;
  title: string | null;
  body: string;
  /** Optional framing label shown above the section heading */
  frameLabel?: string | null;
};

/** Determine the card variant and heading style by section index */
function sectionVariant(idx: number): "default" | "warm" {
  return idx >= 7 ? "warm" : "default";
}

/** Returns Tailwind classes for the section heading H2 */
function headingClass(idx: number): string {
  if (idx >= 7) {
    // Action zone — slightly warmer, stronger weight
    return "text-[16px] font-semibold tracking-[-0.01em] text-[#6b3f1f]";
  }
  if (idx >= 3) {
    // Research zone — standard heading
    return "text-[15px] font-semibold tracking-[-0.005em] text-[var(--text-primary)]";
  }
  // Intro/context
  return "text-[15px] font-medium tracking-wide uppercase text-[var(--text-secondary)]";
}

/** Section number badge for action sections */
function SectionIndex({ idx }: { idx: number }) {
  if (idx < 7) return null;
  const actionLabels: Record<number, string> = {
    7: "Implementation",
    8: "Protocol",
    9: "Tracking",
  };
  const label = actionLabels[idx];
  if (!label) return null;
  return (
    <span className="mb-3 inline-flex items-center rounded-full bg-[#f0e6dc] border border-[#ddd0c6] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[#8a6a50]">
      {label}
    </span>
  );
}

export function InsightSection({ sectionIndex, title, body, frameLabel }: InsightSectionProps) {
  const variant = sectionVariant(sectionIndex);

  return (
    <InsightCard
      as="section"
      id={`section-${sectionIndex}`}
      variant={variant}
      className={clsx(
        "scroll-mt-[100px] px-7 py-7 md:px-9 md:py-9",
        // Action sections get slightly more top padding for breathing room
        sectionIndex >= 7 && "pt-7 md:pt-9"
      )}
    >
      {/* Action badge for protocol/tracking sections */}
      <SectionIndex idx={sectionIndex} />

      {/* Frame label — contextual framing above the heading */}
      {frameLabel && (
        <div className="mb-3 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-black/20" aria-hidden />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-black/35">
            {frameLabel}
          </span>
        </div>
      )}

      {/* Section heading */}
      {title && (
        <h2 className={clsx("mb-4", headingClass(sectionIndex))}>
          {title}
        </h2>
      )}

      {/* Body — prose text, no markup changes */}
      <div
        className={clsx(
          "whitespace-pre-wrap text-[15px] leading-[1.75]",
          variant === "warm"
            ? "text-[var(--text-primary)]"
            : "text-[var(--text-secondary)]",
          // Readable line length
          "max-w-prose"
        )}
      >
        {body}
      </div>
    </InsightCard>
  );
}
