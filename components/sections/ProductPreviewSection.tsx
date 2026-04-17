"use client";

import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { homepageContent } from "@/content/homepage";

const defaultContent = homepageContent.productPreview;
const easeOut = [0, 0, 0.2, 1] as const;

type ProductPreviewSectionProps = {
  label?: string;
  headline?: string;
  scoreLabel?: string;
  scoreValue?: number;
  missingLabel?: string;
  missing?: readonly string[];
  timelineLabel?: string;
  timeline?: readonly { month: string; item: string }[];
  ctaLabel?: string;
  ctaHref?: string;
};

export function ProductPreviewSection({
  label = defaultContent.label,
  headline = defaultContent.headline,
  scoreLabel = defaultContent.scoreLabel,
  scoreValue = defaultContent.scoreValue,
  missingLabel = defaultContent.missingLabel,
  missing = defaultContent.missing,
  timelineLabel = defaultContent.timelineLabel,
  timeline = defaultContent.timeline,
  ctaLabel = defaultContent.ctaLabel,
  ctaHref = defaultContent.ctaHref,
}: ProductPreviewSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <Section
      id="product-preview"
      variant="default"
      className="relative scroll-mt-20 py-20 md:py-28 lg:py-32"
    >
      <Container>
        <motion.div
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="mx-auto max-w-[44rem] text-center"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#737373]">
            {label}
          </p>
          <h2 className="mt-3 text-balance text-[1.75rem] font-medium leading-[1.15] tracking-tight text-[#0c0c0c] sm:text-[1.95rem] md:mt-4 md:text-[2.15rem] lg:text-[2.35rem]">
            {headline}
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.08, ease: easeOut }}
          className="mx-auto mt-12 max-w-[56rem] overflow-hidden rounded-[24px] border border-black/[0.1] bg-white shadow-[0_4px_40px_rgba(0,0,0,0.07)] md:mt-14"
        >
          {/* Mock UI header bar */}
          <div className="flex items-center gap-2 border-b border-black/[0.07] bg-[#fafaf9] px-5 py-3.5">
            <span className="h-2.5 w-2.5 rounded-full bg-black/[0.1]" aria-hidden />
            <span className="h-2.5 w-2.5 rounded-full bg-black/[0.07]" aria-hidden />
            <span className="h-2.5 w-2.5 rounded-full bg-black/[0.05]" aria-hidden />
            <span className="ml-3 font-mono text-[11px] text-[#a3a3a3]">
              thearc.health/dashboard
            </span>
          </div>

          {/* Mock UI body */}
          <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
            {/* Left: Score + Missing */}
            <div className="border-b border-black/[0.07] p-6 md:border-b-0 md:border-r md:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                {scoreLabel}
              </p>

              <div className="mt-4 flex items-end gap-3">
                <span className="font-mono text-[3rem] font-semibold leading-none tabular-nums text-[#0c0c0c]">
                  {scoreValue}%
                </span>
              </div>

              {/* Score bar */}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/[0.07]">
                <div
                  className="h-full rounded-full bg-[#0c0c0c]"
                  style={{ width: `${scoreValue}%` }}
                />
              </div>

              <div className="mt-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                  {missingLabel}
                </p>
                <ul className="mt-3 space-y-2.5">
                  {missing.map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-black/[0.15]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#0c0c0c]/[0.4]" />
                      </span>
                      <span className="text-[0.9375rem] text-[#404040]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right: Timeline */}
            <div className="p-6 md:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                {timelineLabel}
              </p>
              <ol className="mt-4 space-y-0">
                {timeline.map((entry, i) => (
                  <li
                    key={entry.month}
                    className="relative flex gap-4 pb-5 last:pb-0"
                  >
                    {/* Connector line */}
                    {i < timeline.length - 1 && (
                      <span
                        className="absolute left-[9px] top-[22px] h-[calc(100%-22px)] w-px bg-black/[0.08]"
                        aria-hidden
                      />
                    )}
                    <span className="relative mt-1 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-black/[0.15] bg-white">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#0c0c0c]/[0.5]" />
                    </span>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#737373]">
                        {entry.month}
                      </p>
                      <p className="mt-0.5 text-[0.9375rem] font-medium text-[#0c0c0c]">
                        {entry.item}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* CTA bar */}
          <div className="flex items-center justify-between border-t border-black/[0.07] bg-[#fafaf9] px-6 py-4 md:px-8">
            <p className="text-[0.8125rem] text-[#737373]">
              No medical advice — just structured insights.
            </p>
            <Link
              href={ctaHref}
              className="rounded-[10px] bg-[#0c0c0c] px-4 py-2 text-[0.875rem] font-medium text-white transition-[filter] duration-[180ms] hover:brightness-[0.9]"
            >
              {ctaLabel}
            </Link>
          </div>
        </motion.div>
      </Container>
    </Section>
  );
}
