/**
 * TrustCue — non-diagnostic microcopy trust indicator.
 * Renders a small contextual disclaimer that this content is informational,
 * not a substitute for professional medical advice.
 *
 * Placed at the bottom of the article, above sources.
 */

export function TrustCue() {
  return (
    <div className="flex items-start gap-3 rounded-[14px] border border-black/[0.07] bg-[#f8f7f5] px-5 py-4">
      <span
        className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-black/20"
        aria-hidden
      />
      <p className="text-[12px] leading-[1.6] text-black/45">
        This article is for informational purposes only. It is not a diagnosis,
        treatment recommendation, or substitute for care from a qualified health
        professional. Individual responses vary.
      </p>
    </div>
  );
}
