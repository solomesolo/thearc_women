"use client";

import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { homepageContent } from "@/content/homepage";

const defaultContent = homepageContent.finalCta;

const easeOut = [0, 0, 0.2, 1] as const;

type FinalCTASectionProps = {
  headline?: string;
  ctaLabel?: string;
  ctaHref?: string;
  microtext?: string;
  variant?: "default" | "subtleSurface";
};

export function FinalCTASection({
  headline = defaultContent.headline,
  ctaLabel = defaultContent.ctaLabel,
  ctaHref = defaultContent.ctaHref,
  microtext = defaultContent.microtext,
  variant = defaultContent.variant,
}: FinalCTASectionProps) {
  const prefersReducedMotion = useReducedMotion();

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: prefersReducedMotion ? 0.08 : 0.13,
        delayChildren: 0,
      },
    },
  };

  const headlineVariants = prefersReducedMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.26 } },
      }
    : {
        hidden: { opacity: 0, y: 6 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.62, ease: easeOut },
        },
      };

  const buttonVariants = prefersReducedMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.26 } },
      }
    : {
        hidden: { opacity: 0, y: 6 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: easeOut },
        },
      };

  const microtextVariants = prefersReducedMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.24 } },
      }
    : {
        hidden: { opacity: 0, y: 4 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.45, ease: easeOut },
        },
      };

  const useSurface = variant === "subtleSurface";

  return (
    <Section
      id="cta"
      variant="default"
      className="py-20 md:py-28"
    >
      <Container>
        <motion.div
          className={clsx(
            "mx-auto w-full max-w-[45rem] text-center lg:max-w-[51.25rem]",
            useSurface &&
              "rounded-[26px] border border-[var(--color-border-hairline)] bg-[var(--color-surface)]/60 px-7 py-8 md:px-10 md:py-10"
          )}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={containerVariants}
        >
          <motion.h2
            variants={headlineVariants}
            className="text-[2rem] font-medium leading-[1.18] tracking-tight text-[var(--text-primary)] md:text-[2.5rem] md:leading-[1.15] lg:text-[3.5rem]"
          >
            {headline}
          </motion.h2>

          <motion.div variants={buttonVariants} className="mt-6 md:mt-7">
            <Button
              href={ctaHref}
              className="h-12 min-h-[48px] max-h-[54px] rounded-[14px] px-6 md:rounded-[16px]"
            >
              {ctaLabel}
            </Button>
          </motion.div>

          <motion.p
            variants={microtextVariants}
            className="mx-auto mt-3 max-w-[38ch] text-center text-[13px] leading-[1.55] text-[var(--text-secondary)] md:mt-4 md:text-sm md:leading-[1.6]"
          >
            {microtext}
          </motion.p>
        </motion.div>
      </Container>
    </Section>
  );
}
