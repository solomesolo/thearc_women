/**
 * SignalSummaryCard — right-column card in the article hero.
 * Shows: evidence status badge, signal chips (from tags), CTA buttons.
 * Placeholder structure — ready for personalization data once wired.
 */
import { clsx } from "clsx";
import { InsightCard } from "./InsightCard";

type TagItem = { slug: string; label: string; type: string };

type SignalSummaryCardProps = {
  evidenceLevel: string | null;
  tags: TagItem[];
  isSubscriber?: boolean;
  hasGatedContent?: boolean;
};

const EVIDENCE_COLOR: Record<string, string> = {
  "high-evidence":
    "bg-emerald-50 text-emerald-700 border-emerald-200",
  "moderate-evidence":
    "bg-amber-50 text-amber-700 border-amber-200",
  "emerging-evidence":
    "bg-sky-50 text-sky-700 border-sky-200",
  "clinical-practice-based":
    "bg-violet-50 text-violet-700 border-violet-200",
  "trend-analysis":
    "bg-orange-50 text-orange-700 border-orange-200",
  "myth-busting":
    "bg-rose-50 text-rose-700 border-rose-200",
};

function evidenceLabel(level: string | null): string {
  if (!level) return "Research-reviewed";
  return level
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Pick signal chips from root cause, symptom, or body system tags first
const SIGNAL_TYPES = ["rootCause", "symptom", "bodySystem", "goal"];

function pickSignalChips(tags: TagItem[], max = 3): TagItem[] {
  const ordered: TagItem[] = [];
  for (const type of SIGNAL_TYPES) {
    ordered.push(...tags.filter((t) => t.type === type));
  }
  // Fill remaining from any tag
  for (const t of tags) {
    if (!ordered.find((o) => o.slug === t.slug)) ordered.push(t);
  }
  return ordered.slice(0, max);
}

export function SignalSummaryCard({
  evidenceLevel,
  tags,
  isSubscriber = false,
  hasGatedContent = false,
}: SignalSummaryCardProps) {
  const signalChips = pickSignalChips(tags);
  const badgeClass =
    (evidenceLevel && EVIDENCE_COLOR[evidenceLevel]) ||
    "bg-[#f5f1ec] text-[#8a6a50] border-[#ddd0c6]";

  return (
    <InsightCard variant="warm" className="p-6">
      {/* Status badge */}
      <div className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-black/40 mb-2">
          Evidence status
        </p>
        <span
          className={clsx(
            "inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-semibold",
            badgeClass
          )}
        >
          {evidenceLabel(evidenceLevel)}
        </span>
      </div>

      {/* Signal chips */}
      {signalChips.length > 0 && (
        <div className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-black/40 mb-2">
            Key signals
          </p>
          <div className="flex flex-wrap gap-2">
            {signalChips.map((t) => (
              <span
                key={t.slug}
                className="inline-flex items-center rounded-full bg-white border border-black/[0.09] px-3 py-1 text-[12px] font-medium text-black/70"
              >
                {t.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="my-5 border-t border-black/[0.07]" />

      {/* CTA buttons */}
      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          className="w-full inline-flex h-11 items-center justify-center rounded-[14px] bg-black/90 px-5 text-[13px] font-semibold text-white transition-opacity hover:opacity-85 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2"
        >
          Save this insight
        </button>
        {hasGatedContent && !isSubscriber ? (
          <button
            type="button"
            className="w-full inline-flex h-11 items-center justify-center rounded-[14px] border border-black/[0.15] bg-transparent px-5 text-[13px] font-semibold text-black/80 transition-colors hover:bg-black/[0.04] focus:outline-none"
          >
            Unlock full access
          </button>
        ) : (
          <button
            type="button"
            className="w-full inline-flex h-11 items-center justify-center rounded-[14px] border border-black/[0.12] bg-transparent px-5 text-[13px] font-medium text-black/65 transition-colors hover:bg-black/[0.04] focus:outline-none"
          >
            Add to my health plan
          </button>
        )}
      </div>
    </InsightCard>
  );
}
