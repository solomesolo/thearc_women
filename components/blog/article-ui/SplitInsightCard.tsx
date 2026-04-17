/**
 * SplitInsightCard — two-column "Why this matters" section.
 *
 * Combines sections 1 (Context) and 2 (Why trending) into a single card
 * with a left/right split. Desktop: side by side. Mobile: stacked.
 *
 * Left col: foundational context (what this is + why it matters)
 * Right col: current relevance (why this is a conversation now)
 *
 * All body text is passed through unchanged.
 */

type SplitSection = {
  sectionIndex: number;
  title: string | null;
  body: string;
};

type SplitInsightCardProps = {
  /** Section 1 — Context */
  left: SplitSection | null;
  /** Section 2 — Why this is trending */
  right: SplitSection | null;
};

function ColumnHead({ title, accent }: { title: string | null; accent?: boolean }) {
  if (!title) return null;
  return (
    <h2
      className={
        accent
          ? "text-[14px] font-semibold tracking-[-0.005em] text-[var(--text-primary)] mb-3"
          : "text-[14px] font-semibold tracking-[-0.005em] text-[var(--text-primary)] mb-3"
      }
    >
      {title}
    </h2>
  );
}

export function SplitInsightCard({ left, right }: SplitInsightCardProps) {
  if (!left && !right) return null;

  return (
    <div
      id="section-why-this-matters"
      className="rounded-[20px] border border-black/[0.07] bg-white shadow-[0_1px_0_rgba(12,12,12,0.04),0_6px_24px_rgba(12,12,12,0.04)] overflow-hidden scroll-mt-[100px]"
    >
      {/* Section framing label */}
      <div className="border-b border-black/[0.06] px-7 py-4 md:px-9">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-black/35">
          Why this matters
        </span>
      </div>

      {/* Two-column body */}
      <div className="grid grid-cols-1 divide-y divide-black/[0.06] lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        {/* Left: Context */}
        {left && (
          <div className="px-7 py-7 md:px-9 md:py-8">
            <div className="mb-4 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-black/25" aria-hidden />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-black/35">
                Background
              </span>
            </div>
            <ColumnHead title={left.title} />
            <p className="text-[15px] leading-[1.75] text-[var(--text-secondary)] max-w-prose whitespace-pre-wrap">
              {left.body}
            </p>
          </div>
        )}

        {/* Right: Why trending */}
        {right && (
          <div className="px-7 py-7 md:px-9 md:py-8 lg:bg-[#fdfcfb]">
            <div className="mb-4 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-black/35">
                Why it&apos;s coming up now
              </span>
            </div>
            <ColumnHead title={right.title} />
            <p className="text-[15px] leading-[1.75] text-[var(--text-secondary)] max-w-prose whitespace-pre-wrap">
              {right.body}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
