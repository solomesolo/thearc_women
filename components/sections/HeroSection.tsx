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

export type HeroFlowStep = {
  title: string;
  line: string;
};

type HeroSectionProps = {
  eyebrow?: string;
  headline?: string;
  supporting?: string;
  secondarySupport?: string;
  ctaPrimaryLabel?: string;
  ctaPrimaryHref?: string;
  ctaSecondaryLabel?: string;
  ctaSecondaryHref?: string;
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
  headline = defaultContent.headline,
  supporting = defaultContent.supporting,
  secondarySupport = defaultContent.secondarySupport,
  ctaPrimaryLabel = defaultContent.ctaPrimaryLabel,
  ctaPrimaryHref = defaultContent.ctaPrimaryHref,
  ctaSecondaryLabel = defaultContent.ctaSecondaryLabel,
  ctaSecondaryHref = defaultContent.ctaSecondaryHref,
  trustLine = defaultContent.trustLine,
  flowTitle = defaultContent.flowTitle,
  flowSteps = defaultContent.flowSteps,
  whatsIncludedLabel = defaultContent.whatsIncludedLabel,
  whatsIncludedItems = defaultContent.whatsIncludedItems,
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

  const motionBase = (delay: number, d = 0.55) =>
    prefersReducedMotion
      ? { duration: 0.26 }
      : { delay, duration: d, ease: easeOut };

  return (
    <Section
      id="hero"
      variant="default"
      className="relative min-h-0 md:min-h-[640px] lg:min-h-[720px]"
    >
      <div
        className="pointer-events-none absolute left-0 top-0 h-full w-[60%] max-w-[720px] opacity-[0.035]"
        aria-hidden
        style={{
          background: "radial-gradient(ellipse 80% 70% at 20% 50%, var(--foreground) 0%, transparent 70%)",
        }}
      />

      <Container className="relative z-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-center md:gap-8 lg:gap-12 xl:gap-16 md:-translate-y-3 lg:-translate-y-5">
          {/* Left column: ~58% on md+ */}
          <div className="relative flex flex-col md:col-span-7 md:max-w-none">
            <motion.p
              initial="hidden"
              animate="visible"
              variants={variants}
              transition={motionBase(0.04, 0.45)}
              className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#737373]"
            >
              {eyebrow}
            </motion.p>

            <motion.h1
              initial="hidden"
              animate="visible"
              variants={variants}
              transition={motionBase(0.1, 0.65)}
              className="mt-3 max-w-[16ch] text-balance text-[2rem] font-medium leading-[1.12] tracking-tight text-[#0c0c0c] sm:max-w-[20ch] sm:text-[2.35rem] md:mt-4 md:max-w-[18ch] md:text-[2.5rem] lg:max-w-[22ch] lg:text-[2.85rem] xl:text-[3.2rem]"
            >
              {headline}
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="visible"
              variants={variants}
              transition={motionBase(0.18, 0.55)}
              className="mt-6 max-w-[38rem] text-base leading-[1.62] text-[#404040] md:mt-8 md:text-[1.0625rem]"
            >
              {supporting}
            </motion.p>

            <motion.p
              initial="hidden"
              animate="visible"
              variants={variants}
              transition={motionBase(0.22, 0.5)}
              className="mt-6 max-w-[36rem] text-[0.9375rem] leading-[1.55] text-[#525252] md:mt-7 md:text-base"
            >
              {secondarySupport}
            </motion.p>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={variants}
              transition={motionBase(0.26, 0.45)}
            >
              <details className="group mt-6 border-0 open:pb-0">
                <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-[#404040] [&::-webkit-details-marker]:hidden">
                  <span className="border-b border-dashed border-black/30 pb-px leading-normal">
                    {whatsIncludedLabel}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="shrink-0 text-[#737373] transition-transform duration-200 group-open:rotate-180"
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
                <ul className="mt-4 max-w-[38rem] space-y-3 border-l-2 border-black/[0.08] pl-4 text-[0.9375rem] leading-[1.55] text-[#404040] md:text-[0.96875rem]">
                  {whatsIncludedItems.map((item) => (
                    <li key={item} className="pl-1">
                      {item}
                    </li>
                  ))}
                </ul>
              </details>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={variants}
              transition={motionBase(0.3, 0.5)}
              className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
            >
              <Button href={ctaPrimaryHref} variant="hero" className="w-full shrink-0 sm:w-auto">
                {ctaPrimaryLabel}
              </Button>
              <Button
                href={ctaSecondaryHref}
                variant="outline"
                className="w-full shrink-0 sm:w-auto"
              >
                {ctaSecondaryLabel}
              </Button>
            </motion.div>

            <motion.p
              initial="hidden"
              animate="visible"
              variants={variants}
              transition={motionBase(0.36, 0.42)}
              className="mt-4 max-w-[36rem] text-[0.8125rem] leading-[1.5] text-[#525252] md:text-sm"
            >
              {trustLine}
            </motion.p>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={variants}
              transition={motionBase(0.42, 0.55)}
              className="mt-10 md:mt-12 lg:mt-14"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#737373]">
                {flowTitle}
              </p>

              {/* Mobile: stacked cards */}
              <ul className="mt-4 flex flex-col gap-3 md:hidden" aria-label={flowTitle}>
                {flowSteps.map((step) => (
                  <li
                    key={step.title}
                    className="rounded-[14px] border border-black/[0.07] bg-white/[0.45] px-4 py-3.5 shadow-[0_1px_0_rgba(0,0,0,0.04)]"
                  >
                    <p className="text-[13px] font-semibold text-[#0c0c0c]">{step.title}</p>
                    <p className="mt-1 text-[14px] leading-snug text-[#404040]">{step.line}</p>
                  </li>
                ))}
              </ul>

              {/* md+: scannable journey grid; 3 cols on tablet, 5 on large desktop */}
              <ol
                aria-label={flowTitle}
                className="mt-5 hidden md:mt-6 md:grid md:grid-cols-3 md:gap-x-5 md:gap-y-5 lg:grid-cols-5 lg:gap-x-6 lg:gap-y-4 [&>li]:relative [&>li]:min-w-0 [&>li+li]:border-l [&>li+li]:border-black/[0.08] [&>li+li]:pl-4 md:[&>li+li]:pl-5 lg:[&>li+li]:pl-5"
              >
                {flowSteps.map((step, i) => (
                  <li key={step.title}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#737373]">
                      {step.title}
                    </p>
                    <p className="mt-1.5 text-[13px] font-medium leading-snug text-[#0c0c0c] lg:text-[0.8125rem]">
                      {step.line}
                    </p>
                    {i < flowSteps.length - 1 && (
                      <span
                        className="pointer-events-none absolute right-0 top-2 hidden translate-x-1/2 text-sm font-light leading-none text-[#d4d4d4] lg:block"
                        aria-hidden
                      >
                        →
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </motion.div>
          </div>

          {/* Right column — same image treatment as before */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={visualVariants}
            transition={
              prefersReducedMotion
                ? { duration: 0.28, delay: 0.06 }
                : { delay: 0.18, duration: 0.9, ease: easeOut }
            }
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
