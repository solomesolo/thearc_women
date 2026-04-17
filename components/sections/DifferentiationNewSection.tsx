"use client";

import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { homepageContent } from "@/content/homepage";

const defaultContent = homepageContent.differentiationNew;
const easeOut = [0, 0, 0.2, 1] as const;

type DiffSide = { title: string; items: readonly string[] };

type DifferentiationNewSectionProps = {
  label?: string;
  headline?: string;
  intro?: string;
  left?: DiffSide;
  right?: DiffSide;
};

export function DifferentiationNewSection({
  label = defaultContent.label,
  headline = defaultContent.headline,
  intro = defaultContent.intro,
  left = defaultContent.left,
  right = defaultContent.right,
}: DifferentiationNewSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <Section
      id="differentiation"
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
          <p className="mt-4 text-[1rem] leading-[1.65] text-[#525252] md:text-[1.0625rem]">
            {intro}
          </p>
        </motion.div>

        <div className="mx-auto mt-12 grid max-w-[44rem] grid-cols-1 gap-5 sm:grid-cols-2 md:mt-14 md:gap-6">
          {/* Left: Other tools */}
          <motion.div
            initial={{ opacity: 0, x: prefersReducedMotion ? 0 : -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: 0.04, ease: easeOut }}
            className="rounded-[20px] border border-black/[0.07] bg-[#fafaf9] p-6 md:p-7"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a3a3a3]">
              {left.title}
            </p>
            <ul className="mt-5 space-y-3.5">
              {left.items.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-black/[0.12]"
                    aria-hidden
                  >
                    <span className="h-px w-2.5 bg-black/[0.2]" />
                  </span>
                  <span className="text-[0.9375rem] text-[#737373]">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Right: Our product */}
          <motion.div
            initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: 0.1, ease: easeOut }}
            className="rounded-[20px] border border-black/[0.14] bg-[#0c0c0c] p-6 md:p-7"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/[0.35]">
              {right.title}
            </p>
            <ul className="mt-5 space-y-3.5">
              {right.items.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.12]"
                    aria-hidden
                  >
                    <svg
                      width="10"
                      height="8"
                      viewBox="0 0 10 8"
                      fill="none"
                      className="text-white/[0.7]"
                    >
                      <path
                        d="M1 4l2.5 2.5L9 1"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="text-[0.9375rem] text-white/[0.8]">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </Container>
    </Section>
  );
}
