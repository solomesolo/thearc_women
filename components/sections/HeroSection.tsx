"use client";

import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { homepageContent } from "@/content/homepage";

const defaultContent = homepageContent.hero;

const easeOut = [0, 0, 0.2, 1] as const;

type HeroSectionProps = {
  headline?: string;
  subline?: string;
  ctaLabel?: string;
  ctaHref?: string;
  microtext?: string;
  imageSrc?: string;
  imageAlt?: string;
};

export function HeroSection({
  headline = defaultContent.headline,
  subline = defaultContent.subline,
  ctaLabel = defaultContent.ctaLabel,
  ctaHref = defaultContent.ctaHref,
  microtext = defaultContent.microtext,
  imageSrc = defaultContent.imageSrc,
  imageAlt = defaultContent.imageAlt,
}: HeroSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  const duration = prefersReducedMotion ? 0.26 : undefined;
  const variants = prefersReducedMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: duration ?? 0.26 } } }
    : { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } };
  const visualVariants = prefersReducedMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: duration ?? 0.26 } } }
    : { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } };

  return (
    <Section
      id="hero"
      variant="default"
      className="relative min-h-0 md:min-h-[640px] lg:min-h-[720px]"
    >
      {/* Task 8: Very faint radial gradient behind left column for depth */}
      <div
        className="pointer-events-none absolute left-0 top-0 h-full w-[60%] max-w-[720px] opacity-[0.035]"
        aria-hidden
        style={{
          background: "radial-gradient(ellipse 80% 70% at 20% 50%, var(--foreground) 0%, transparent 70%)",
        }}
      />

      <Container className="relative z-10">
        <div className="grid grid-cols-1 gap-7 md:grid-cols-12 md:gap-8 md:items-center lg:gap-16 xl:gap-20">
          {/* Copy column: 7 from tablet up */}
          <div className="relative flex flex-col md:col-span-7">
            <motion.h1
              initial="hidden"
              animate="visible"
              variants={variants}
              transition={
                prefersReducedMotion
                  ? { duration: 0.26 }
                  : { duration: 0.7, ease: easeOut }
              }
              className="max-w-[14em] text-balance text-[2.5rem] font-medium leading-[1.1] tracking-tight text-[#0c0c0c] md:text-[2.75rem] lg:text-[3.5rem] xl:text-[4rem]"
            >
              {headline}
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="visible"
              variants={variants}
              transition={
                prefersReducedMotion
                  ? { duration: 0.24, delay: 0.06 }
                  : { delay: 0.14, duration: 0.55, ease: easeOut }
              }
              className="mt-5 max-w-xl text-base leading-[1.6] text-[#525252] md:mt-6 md:text-lg lg:text-[1.25rem]"
            >
              {subline}
            </motion.p>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={variants}
              transition={
                prefersReducedMotion
                  ? { duration: 0.22, delay: 0.1 }
                  : { delay: 0.28, duration: 0.5, ease: easeOut }
              }
              className="mt-8 md:mt-10"
            >
              <Button href={ctaHref} variant="hero">
                {ctaLabel}
              </Button>
            </motion.div>

            <motion.p
              initial="hidden"
              animate="visible"
              variants={variants}
              transition={
                prefersReducedMotion
                  ? { duration: 0.22, delay: 0.14 }
                  : { delay: 0.38, duration: 0.45, ease: easeOut }
              }
              className="mt-3 max-w-[32rem] text-[13px] leading-[1.5] text-[#737373] md:text-sm"
            >
              {microtext}
            </motion.p>
          </div>

          {/* Task 1–3: Visual block — muted surface, subtle gradient, radius 20–22, Task 2: max-width 460–520, max-height 620–680 */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={visualVariants}
            transition={
              prefersReducedMotion
                ? { duration: 0.28, delay: 0.06 }
                : { delay: 0.18, duration: 0.9, ease: easeOut }
            }
            className="relative aspect-square w-full max-w-[500px] overflow-hidden rounded-[21px] border border-[#e8e6e4] md:col-span-5 md:col-start-8 md:aspect-[4/5] md:max-h-[660px] md:w-full"
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
