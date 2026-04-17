/**
 * ApplicabilityPair — side-by-side comparison cards for sections 5 + 6.
 *
 * Section 5 (free): "When this may be relevant"
 * Section 6 (gated): "When this may be less relevant"
 *
 * Desktop: two cards side by side.
 * Mobile: stacked.
 *
 * Section 6 handles gating: if not subscriber, shows preview + lock indicator.
 */

const PREVIEW_LENGTH = 180;

type ApplicabilitySection = {
  sectionIndex: number;
  title: string | null;
  body: string;
  isGated: boolean;
  preview?: string | null;
};

type ApplicabilityPairProps = {
  /** Section 5 — When it might apply */
  mayApply: ApplicabilitySection | null;
  /** Section 6 — When it might not */
  mayCaution: ApplicabilitySection | null;
  isSubscriber?: boolean;
};

function CardHead({ title }: { title: string | null }) {
  if (!title) return null;
  return (
    <h2 className="text-[14px] font-semibold tracking-[-0.005em] text-[var(--text-primary)] mb-3">
      {title}
    </h2>
  );
}

function MayApplyCard({ section }: { section: ApplicabilitySection }) {
  return (
    <div
      id={`section-${section.sectionIndex}`}
      className="flex-1 scroll-mt-[100px] rounded-[18px] border border-emerald-100 bg-white px-6 py-6 shadow-[0_1px_0_rgba(12,12,12,0.03),0_4px_16px_rgba(12,12,12,0.03)]"
    >
      {/* Label */}
      <div className="mb-4 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-widest text-black/35">
          When this may be relevant
        </span>
      </div>
      <CardHead title={section.title} />
      <p className="text-[15px] leading-[1.75] text-[var(--text-secondary)] max-w-prose whitespace-pre-wrap">
        {section.body}
      </p>
    </div>
  );
}

function MayCautionCard({
  section,
  isSubscriber,
}: {
  section: ApplicabilitySection;
  isSubscriber: boolean;
}) {
  const showFull = !section.isGated || isSubscriber;
  const preview =
    section.preview && section.preview.trim()
      ? section.preview
      : section.body.slice(0, PREVIEW_LENGTH) +
        (section.body.length > PREVIEW_LENGTH ? "…" : "");

  return (
    <div
      id={`section-${section.sectionIndex}`}
      className="flex-1 scroll-mt-[100px] rounded-[18px] border border-black/[0.07] bg-[#fdfcfb] px-6 py-6 shadow-[0_1px_0_rgba(12,12,12,0.03),0_4px_16px_rgba(12,12,12,0.03)]"
    >
      {/* Label */}
      <div className="mb-4 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-black/20" aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-widest text-black/35">
          When this may be less relevant
        </span>
        {section.isGated && !isSubscriber && (
          <span className="ml-auto rounded-full bg-black/[0.06] px-2 py-0.5 text-[10px] font-medium text-black/40">
            Members
          </span>
        )}
      </div>
      <CardHead title={section.title} />

      {showFull ? (
        <p className="text-[15px] leading-[1.75] text-[var(--text-secondary)] max-w-prose whitespace-pre-wrap">
          {section.body}
        </p>
      ) : (
        <>
          <p className="text-[15px] leading-[1.75] text-[var(--text-secondary)] max-w-prose">
            {preview}
          </p>
          {/* Soft gate indicator */}
          <div className="mt-4 flex items-center gap-2 rounded-[10px] border border-black/[0.07] bg-white px-3 py-2.5">
            <span className="text-[13px]" aria-hidden>
              ⟐
            </span>
            <span className="text-[12px] text-black/45">
              Full context available to members
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export function ApplicabilityPair({
  mayApply,
  mayCaution,
  isSubscriber = false,
}: ApplicabilityPairProps) {
  if (!mayApply && !mayCaution) return null;

  return (
    <div className="rounded-[20px] border border-black/[0.07] bg-[#f8f7f5] shadow-[0_1px_0_rgba(12,12,12,0.03)] overflow-hidden">
      {/* Section framing label */}
      <div className="border-b border-black/[0.06] px-7 py-4 md:px-9">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-black/35">
          Who this applies to
        </span>
      </div>

      {/* Card pair */}
      <div className="flex flex-col gap-4 p-5 md:p-6 lg:flex-row">
        {mayApply && <MayApplyCard section={mayApply} />}
        {mayCaution && (
          <MayCautionCard section={mayCaution} isSubscriber={isSubscriber} />
        )}
      </div>
    </div>
  );
}
