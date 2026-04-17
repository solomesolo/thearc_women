"use client";

import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { homepageContent } from "@/content/homepage";

const defaultContent = homepageContent.whatThisIs;

const easeOut = [0, 0, 0.2, 1] as const;

/** Subtle system motif: light grid + minimal node graph (decorative only). */
function SystemMotif() {
  return (
    <div
      className="pointer-events-none absolute inset-0 -z-0 flex justify-center overflow-hidden"
      aria-hidden
    >
      <div
        className="absolute inset-0 opacity-[0.22] md:opacity-[0.28]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(12, 12, 12, 0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(12, 12, 12, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse 75% 65% at 50% 45%, black 0%, transparent 72%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 75% 65% at 50% 45%, black 0%, transparent 72%)",
        }}
      />
      <svg
        className="relative mt-8 h-[min(320px,42vw)] w-full max-w-[720px] shrink-0 text-[#0c0c0c] opacity-[0.09] md:mt-12 md:h-[280px] md:opacity-[0.11]"
        viewBox="0 0 720 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M80 100H240M240 100L360 50M240 100L360 150M360 50H480M360 150H480M480 80L600 100M480 120L600 100M600 100H660"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <circle cx="80" cy="100" r="5" fill="currentColor" opacity="0.35" />
        <circle cx="240" cy="100" r="5" fill="currentColor" opacity="0.45" />
        <circle cx="360" cy="50" r="4.5" fill="currentColor" opacity="0.3" />
        <circle cx="360" cy="150" r="4.5" fill="currentColor" opacity="0.3" />
        <circle cx="480" cy="100" r="5" fill="currentColor" opacity="0.4" />
        <circle cx="600" cy="100" r="5" fill="currentColor" opacity="0.35" />
        <circle cx="660" cy="100" r="4" fill="currentColor" opacity="0.25" />
      </svg>
    </div>
  );
}

type WhatThisIsSectionProps = {
  label?: string;
  headline?: string;
  main?: string;
  supporting?: string;
  secondaryLine?: string;
  differentLabel?: string;
  differentItems?: readonly string[];
};

export function WhatThisIsSection({
  label = defaultContent.label,
  headline = defaultContent.headline,
  main = defaultContent.main,
  supporting = defaultContent.supporting,
  secondaryLine = defaultContent.secondaryLine,
  differentLabel = defaultContent.differentLabel,
  differentItems = defaultContent.differentItems,
}: WhatThisIsSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const t = (delay: number, duration = 0.5) =>
    prefersReducedMotion
      ? { duration: 0.22 }
      : { duration, delay, ease: easeOut };

  const mainParagraphs = main.split("\n\n").filter(Boolean);

  return (
    <Section
      id="what-this-is"
      variant="default"
      className="relative py-20 md:py-28 lg:py-32"
    >
      <SystemMotif />

      <Container className="relative z-10">
        <motion.div
          className="mx-auto max-w-[720px] text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: prefersReducedMotion ? 0.04 : 0.08 },
            },
          }}
        >
          <motion.p
            variants={{
              hidden: { opacity: 0, y: 6 },
              visible: { opacity: 1, y: 0, transition: t(0, 0.4) },
            }}
            className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#737373]"
          >
            {label}
          </motion.p>

          <motion.h2
            variants={{
              hidden: { opacity: 0, y: 8 },
              visible: { opacity: 1, y: 0, transition: t(0.06, 0.58) },
            }}
            className="mt-3 text-balance text-[1.625rem] font-medium leading-[1.15] tracking-tight text-[#0c0c0c] sm:text-[1.85rem] md:text-[2rem] lg:text-[2.125rem]"
          >
            {headline}
          </motion.h2>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 8 },
              visible: { opacity: 1, y: 0, transition: t(0.14, 0.55) },
            }}
            className="mt-7 space-y-4 text-left md:mt-9"
          >
            {mainParagraphs.map((para, i) => (
              <p
                key={i}
                className="text-[1rem] leading-[1.65] text-[#404040] md:text-[1.0625rem]"
              >
                {para}
              </p>
            ))}
          </motion.div>

          <motion.p
            variants={{
              hidden: { opacity: 0, y: 8 },
              visible: { opacity: 1, y: 0, transition: t(0.22, 0.5) },
            }}
            className="mt-5 text-left text-[0.9375rem] leading-[1.6] text-[#525252] md:mt-6 md:text-base"
          >
            {supporting}
          </motion.p>

          <motion.p
            variants={{
              hidden: { opacity: 0, y: 8 },
              visible: { opacity: 1, y: 0, transition: t(0.28, 0.45) },
            }}
            className="mt-4 text-left text-sm leading-[1.55] text-[#737373] md:text-[0.9375rem]"
          >
            {secondaryLine}
          </motion.p>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 8 },
              visible: { opacity: 1, y: 0, transition: t(0.34, 0.48) },
            }}
            className="mt-8 text-left md:mt-10"
          >
            <details className="group rounded-[14px] border border-black/[0.07] bg-white/[0.35] px-4 py-3 shadow-[0_1px_0_rgba(0,0,0,0.03)] open:bg-white/[0.55] open:pb-4 md:px-5 md:py-4 open:md:pb-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-left [&::-webkit-details-marker]:hidden">
                <span className="text-[15px] font-medium text-[#404040] underline decoration-black/25 decoration-dotted underline-offset-4">
                  {differentLabel}
                </span>
                <svg
                  width="18"
                  height="18"
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
              <ul className="mt-4 space-y-3 border-t border-black/[0.06] pt-4 text-[0.9375rem] leading-[1.55] text-[#525252] md:text-[0.96875rem]">
                {differentItems.map((item) => (
                  <li key={item} className="relative pl-5 before:absolute before:left-0 before:top-[0.55em] before:h-1 before:w-1 before:rounded-full before:bg-[#a3a3a3]">
                    {item}
                  </li>
                ))}
              </ul>
            </details>
          </motion.div>
        </motion.div>
      </Container>
    </Section>
  );
}
