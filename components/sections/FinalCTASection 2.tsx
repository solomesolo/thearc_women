"use client";

import { Fragment } from "react";
import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { homepageContent } from "@/content/homepage";

const defaultContent = homepageContent.finalCta;

const easeOut = [0, 0, 0.2, 1] as const;

type FinalCTASectionProps = {
  headline?: string;
  supporting?: string;
  ctaPrimaryLabel?: string;
  ctaPrimaryHref?: string;
  ctaSecondaryLabel?: string;
  ctaSecondaryHref?: string;
  primaryMicrocopy?: string;
  trustSignals?: readonly string[];
  afterStartLabel?: string;
  afterStartItems?: readonly string[];
};

export function FinalCTASection({
  headline = defaultContent.headline,
  supporting = defaultContent.supporting,
  ctaPrimaryLabel = defaultContent.ctaPrimaryLabel,
  ctaPrimaryHref = defaultContent.ctaPrimaryHref,
  ctaSecondaryLabel = defaultContent.ctaSecondaryLabel,
  ctaSecondaryHref = defaultContent.ctaSecondaryHref,
  primaryMicrocopy = defaultContent.primaryMicrocopy,
  trustSignals = defaultContent.trustSignals,
  afterStartLabel = defaultContent.afterStartLabel,
  afterStartItems = defaultContent.afterStartItems,
}: FinalCTASectionProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <Section
      id="cta"
      variant="default"
      className="relative scroll-mt-20 border-t border-black/[0.06] bg-[linear-gradient(180deg,#f4f4f2_0%,var(--background)_22%,#fafaf9_100%)] py-[4.5rem] md:py-28 lg:py-32"
    >
      <Container>
        <motion.div
          className="mx-auto max-w-[40rem] text-center"
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: easeOut }}
        >
          <h2 className="text-[1.75rem] font-medium leading-[1.15] tracking-tight text-[#0c0c0c] sm:text-[1.95rem] md:text-[2.25rem] lg:text-[2.5rem]">
            {headline}
          </h2>

          <p className="mx-auto mt-7 max-w-[38rem] text-[1rem] leading-[1.68] text-[#404040] md:mt-8 md:text-[1.0625rem]">
            {supporting}
          </p>

          <div className="mx-auto mt-10 flex w-full max-w-md flex-col items-stretch justify-center gap-4 sm:mt-11 sm:max-w-2xl sm:flex-row sm:items-start sm:justify-center sm:gap-5 md:max-w-none">
            <div className="flex w-full flex-col items-center sm:w-auto sm:min-w-[min(100%,280px)] sm:items-stretch">
              <Button
                href={ctaPrimaryHref}
                variant="hero"
                className="h-[56px] w-full px-8 text-[1.05rem] font-semibold sm:w-auto sm:min-w-[280px]"
              >
                {ctaPrimaryLabel}
              </Button>
              <p className="mt-2.5 text-center text-[0.8125rem] leading-snug text-[#737373] sm:text-left md:text-sm">
                {primaryMicrocopy}
              </p>
            </div>
            <div className="flex w-full justify-center sm:w-auto sm:shrink-0">
              <Button
                href={ctaSecondaryHref}
                variant="outline"
                className="h-[52px] min-h-[52px] w-full sm:w-auto sm:min-w-[220px]"
              >
                {ctaSecondaryLabel}
              </Button>
            </div>
          </div>

          <ul className="mx-auto mt-10 max-w-[38rem] space-y-2.5 text-left text-[0.8125rem] leading-[1.5] text-[#525252] sm:mt-12 md:flex md:flex-wrap md:justify-center md:gap-x-1 md:space-y-0 md:text-center md:text-[0.84375rem]">
            {trustSignals.map((line, i) => (
              <Fragment key={line}>
                {i > 0 && (
                  <li className="hidden list-none md:inline md:text-[#d4d4d4]" aria-hidden>
                    ·
                  </li>
                )}
                <li className="relative flex pl-5 md:inline md:pl-0 md:pr-1">
                  <span
                    className="absolute left-0 top-[0.45em] h-1 w-1 shrink-0 rounded-full bg-[#bfbfbf] md:hidden"
                    aria-hidden
                  />
                  <span className="md:whitespace-nowrap">{line}</span>
                </li>
              </Fragment>
            ))}
          </ul>

          <motion.div
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: 0.08, ease: easeOut }}
            className="mx-auto mt-10 max-w-[34rem] text-left sm:mt-12"
          >
            <details className="group/after rounded-[16px] border border-black/[0.08] bg-white/[0.5] px-4 py-1 shadow-[0_1px_0_rgba(0,0,0,0.03)] open:bg-white/[0.65] md:px-5">
              <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 py-2 text-left [&::-webkit-details-marker]:hidden">
                <span className="text-[0.9375rem] font-medium text-[#404040] underline decoration-black/25 decoration-dotted underline-offset-4">
                  {afterStartLabel}
                </span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="shrink-0 text-[#737373] transition-transform duration-200 group-open/after:rotate-180"
                  aria-hidden
                >
                  <path
                    d="M4 6l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </summary>
              <ol className="mt-1 space-y-2.5 border-t border-black/[0.06] pb-4 pt-4 text-[0.8125rem] leading-[1.55] text-[#525252] md:text-[0.84375rem]">
                {afterStartItems.map((item, idx) => (
                  <li key={item} className="flex gap-3 pl-0">
                    <span className="mt-0.5 w-5 shrink-0 text-right font-mono text-[11px] font-semibold tabular-nums text-[#a3a3a3]">
                      {idx + 1}.
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </details>
          </motion.div>
        </motion.div>
      </Container>
    </Section>
  );
}
