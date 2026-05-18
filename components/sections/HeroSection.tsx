"use client";

import { useRef } from "react";
import Image from "next/image";
import { useReducedMotion, useInView } from "framer-motion";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { homepageContent } from "@/content/homepage";
import { useEarlyAccessModal } from "@/lib/early-access/EarlyAccessContext";

const defaultContent = homepageContent.hero;

const EASE = [0.16, 1, 0.3, 1] as const;
const STAGGER = 0.09;
const DURATION = 0.7;

export type HeroFlowStep = {
  title: string;
  line: string;
};

type HeroSectionProps = {
  eyebrow?: string;
  headlineLines?: readonly string[];
  serifLineIndices?: readonly number[];
  /** @deprecated Legacy single-line headline for localized pages */
  headline?: string;
  supporting?: string;
  ctaPrimaryLabel?: string;
  ctaPrimaryHref?: string;
  ctaSecondaryLabel?: string;
  ctaSecondaryHref?: string;
  socialProof?: string;
  /** @deprecated Legacy localized props */
  secondarySupport?: string;
  trustLine?: string;
  flowTitle?: string;
  flowSteps?: readonly HeroFlowStep[];
  whatsIncludedLabel?: string;
  whatsIncludedItems?: readonly string[];
  imageSrc?: string;
  imageAlt?: string;
};

export function HeroSection({
  eyebrow = defaultContent.eyebrow,
  headlineLines = defaultContent.headlineLines,
  serifLineIndices = defaultContent.serifLineIndices,
  headline,
  supporting = defaultContent.supporting,
  ctaPrimaryLabel = defaultContent.ctaPrimaryLabel,
  ctaSecondaryLabel = defaultContent.ctaSecondaryLabel,
  socialProof = defaultContent.socialProof,
  imageSrc = defaultContent.imageSrc,
  imageAlt = defaultContent.imageAlt,
}: HeroSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const { openApply, openInvite } = useEarlyAccessModal();

  const leftRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(leftRef, { once: true, amount: 0.15 });

  const lines = headline ? [headline] : headlineLines;
  const serifSet = new Set(serifLineIndices);

  // Shared variants — children inherit and are staggered by the parent container
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : STAGGER,
        delayChildren: 0.05,
      },
    },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0.25 : DURATION, ease: EASE },
    },
  };

  const lineVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 22 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0.25 : DURATION, ease: EASE },
    },
  };

  const dividerVariants = {
    hidden: { opacity: 0, scaleX: 0 },
    visible: {
      opacity: 1,
      scaleX: 1,
      transition: { duration: prefersReducedMotion ? 0.2 : 0.5, ease: EASE },
    },
  };

  const eyebrowVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 8 },
    visible: {
      opacity: 0.45,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0.2 : 0.55, ease: EASE },
    },
  };

  return (
    <Section
      id="hero"
      variant="default"
      className="relative min-h-0 md:min-h-[640px] lg:min-h-[720px]"
    >
      <Container className="relative z-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-center md:gap-8 lg:gap-12 xl:gap-16 md:-translate-y-3 lg:-translate-y-5">

          {/* ── Left column — stagger-driven reveal ── */}
          <motion.div
            ref={leftRef}
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="relative flex flex-col md:col-span-7 md:max-w-none"
          >
            {/* Eyebrow */}
            <motion.p
              variants={eyebrowVariants}
              className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#0c0c0c]"
            >
              {eyebrow}
            </motion.p>

            {/* Headline — each line is its own stagger step */}
            <h1 className="mt-5 md:mt-6">
              {lines.map((line, i) => (
                <motion.span
                  key={`${line}-${i}`}
                  variants={lineVariants}
                  className={[
                    "block text-[#0c0c0c]",
                    serifSet.has(i)
                      ? "font-[Georgia,'Times_New_Roman',serif] font-normal tracking-[-0.015em]"
                      : "font-sans font-medium tracking-[-0.025em]",
                    "text-[1.95rem] leading-[1.04] sm:text-[2.25rem] md:text-[2.45rem] lg:text-[2.8rem] xl:text-[3.1rem]",
                  ].join(" ")}
                >
                  {line}
                </motion.span>
              ))}
            </h1>

            {/* Thin divider */}
            <motion.div
              variants={dividerVariants}
              style={{ originX: 0 }}
              className="mt-8 h-px w-10 bg-[#0c0c0c]/[0.12]"
            />

            {/* Supporting text */}
            <motion.p
              variants={fadeUp}
              className="mt-5 max-w-[30rem] text-[0.9375rem] leading-[1.72] text-[#5a5a5a] md:max-w-[480px]"
            >
              {supporting}
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeUp}
              className="mt-9 flex w-full flex-col gap-3.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5"
            >
              <Button onClick={openApply} variant="hero" className="w-full shrink-0 sm:w-auto">
                {ctaPrimaryLabel}
              </Button>
              <button
                type="button"
                onClick={openInvite}
                className="group inline-flex w-full items-center justify-center gap-2 text-[0.875rem] font-medium text-[#737373] transition-colors duration-200 hover:text-[#0c0c0c] sm:w-auto sm:justify-start"
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

            {/* Social proof */}
            <motion.p
              variants={fadeUp}
              className="mt-7 max-w-[34rem] text-[0.6875rem] leading-[1.6] text-[#b0b0b0]"
            >
              {socialProof}
            </motion.p>
          </motion.div>

          {/* ── Right column — image fades in slightly after left ── */}
          <motion.div
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
            animate={
              isInView
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: prefersReducedMotion ? 0 : 10 }
            }
            transition={{
              delay: prefersReducedMotion ? 0 : 0.18,
              duration: prefersReducedMotion ? 0.3 : 1.0,
              ease: EASE,
            }}
            className="relative mx-auto aspect-[4/5] w-full max-h-[min(380px,52svh)] max-w-[500px] overflow-hidden rounded-[21px] border border-[#e8e6e4] sm:max-h-[min(420px,50svh)] md:col-span-5 md:col-start-8 md:mx-0 md:max-h-[660px] md:aspect-[4/5] md:w-full"
            style={{
              background:
                "linear-gradient(145deg, #e8e6e4 0%, #e0ddda 48%, #ddd9d6 100%)",
            }}
          >
            <Image
              src={imageSrc}
              alt={imageAlt}
              width={600}
              height={750}
              className="h-full w-full object-cover"
              priority
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9Ijc1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZThlNmU0Ii8+PC9zdmc+"
            />
          </motion.div>
        </div>
      </Container>
    </Section>
  );
}
