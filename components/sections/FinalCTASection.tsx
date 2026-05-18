"use client";

import { useState } from "react";
import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { homepageContent } from "@/content/homepage";
import { useEarlyAccessModal } from "@/lib/early-access/EarlyAccessContext";

const defaultContent = homepageContent.finalCta;

const easeOut = [0, 0, 0.2, 1] as const;

type FinalCTASectionProps = {
  headline?: string;
  supporting?: string;
  ctaPrimaryLabel?: string;
  ctaPrimaryHref?: string;
  ctaSecondaryLabel?: string;
  ctaSecondaryHref?: string;
  hoverSignals?: readonly string[];
  /** @deprecated Legacy localized props */
  primaryMicrocopy?: string;
  trustSignals?: readonly string[];
  afterStartLabel?: string;
  afterStartItems?: readonly string[];
};

export function FinalCTASection({
  headline = defaultContent.headline,
  supporting = defaultContent.supporting,
  ctaPrimaryLabel = defaultContent.ctaPrimaryLabel,
  ctaSecondaryLabel = defaultContent.ctaSecondaryLabel,
  hoverSignals = defaultContent.hoverSignals,
}: FinalCTASectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const { openApply, openInvite } = useEarlyAccessModal();
  const [ctaHovered, setCtaHovered] = useState(false);

  return (
    <Section
      id="cta"
      variant="default"
      className="relative scroll-mt-20 overflow-hidden border-t border-black/[0.06] bg-[linear-gradient(180deg,#f4f4f2_0%,var(--background)_30%,#fafaf9_100%)] py-24 md:py-32 lg:py-40"
    >
      <Container>
        <motion.div
          className="relative mx-auto max-w-[44rem] text-center"
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, ease: easeOut }}
        >
          <h2 className="text-[2rem] font-medium leading-[1.08] tracking-tight text-[#0c0c0c] sm:text-[2.35rem] md:text-[2.75rem] lg:text-[3.25rem]">
            {headline}
          </h2>

          <p className="mx-auto mt-7 max-w-[32rem] text-[1rem] leading-[1.65] text-[#525252] md:mt-8 md:text-[1.0625rem]">
            {supporting}
          </p>

          <div
            className="relative mx-auto mt-11 inline-flex flex-col items-center"
            onMouseEnter={() => setCtaHovered(true)}
            onMouseLeave={() => setCtaHovered(false)}
          >
            <motion.div
              className="pointer-events-none absolute inset-0 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4"
              aria-hidden
              initial={false}
              animate={{ opacity: ctaHovered && !prefersReducedMotion ? 1 : 0 }}
              transition={{ duration: 0.55, ease: easeOut }}
            >
              {hoverSignals.map((signal, i) => (
                <span
                  key={signal}
                  className="text-[0.6875rem] font-medium uppercase tracking-[0.22em] text-[#0c0c0c]/[0.07]"
                  style={{
                    transform: `translate(${((i % 3) - 1) * 12}px, ${(i % 2) * 8 - 4}px)`,
                  }}
                >
                  {signal}
                </span>
              ))}
            </motion.div>

            <Button
              onClick={openApply}
              variant="hero"
              className="relative z-[1] h-[56px] w-full px-8 text-[1.05rem] font-semibold sm:w-auto sm:min-w-[280px]"
            >
              {ctaPrimaryLabel}
            </Button>
          </div>

          <button
            type="button"
            onClick={openInvite}
            className="group mx-auto mt-5 inline-flex items-center gap-2 text-[0.9375rem] font-medium text-[#525252] transition-colors hover:text-[#0c0c0c]"
          >
            <span>{ctaSecondaryLabel}</span>
            <span
              className="inline-block transition-transform duration-300 ease-out group-hover:translate-x-[4px]"
              aria-hidden
            >
              →
            </span>
          </button>
        </motion.div>
      </Container>
    </Section>
  );
}
