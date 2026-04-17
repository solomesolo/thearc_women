"use client";

import { Fragment } from "react";
import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { homepageContent } from "@/content/homepage";

const defaultContent = homepageContent.howItWorksSimple;
const easeOut = [0, 0, 0.2, 1] as const;

type SimpleStep = { num: string; title: string; body: string };

type HowItWorksSimpleSectionProps = {
  label?: string;
  headline?: string;
  steps?: readonly SimpleStep[];
};

export function HowItWorksSimpleSection({
  label = defaultContent.label,
  headline = defaultContent.headline,
  steps = defaultContent.steps,
}: HowItWorksSimpleSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <Section
      id="how-it-works-simple"
      variant="default"
      className="relative scroll-mt-20 border-t border-black/[0.06] bg-[linear-gradient(180deg,#fafaf9_0%,var(--background)_20%)] py-20 md:py-28 lg:py-32"
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

        {/* Mobile: stacked */}
        <div className="mt-12 flex flex-col gap-5 md:hidden">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{
                duration: 0.45,
                delay: i * (prefersReducedMotion ? 0.03 : 0.06),
                ease: easeOut,
              }}
              className="flex gap-4 rounded-[18px] border border-black/[0.08] bg-white/[0.45] p-5 shadow-[0_1px_0_rgba(0,0,0,0.03)]"
            >
              <span className="mt-0.5 font-mono text-[1.125rem] font-semibold tabular-nums text-[#0c0c0c]/[0.18]">
                {step.num}
              </span>
              <div>
                <p className="text-[1rem] font-semibold leading-snug tracking-tight text-[#0c0c0c]">
                  {step.title}
                </p>
                <p className="mt-1.5 text-[0.9375rem] leading-[1.58] text-[#525252]">
                  {step.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* md+: horizontal row with arrows */}
        <div className="mx-auto mt-12 hidden max-w-[60rem] items-stretch md:flex md:mt-14 lg:mt-16">
          {steps.map((step, i) => (
            <Fragment key={step.num}>
              <motion.div
                initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: 0.48,
                  delay: i * (prefersReducedMotion ? 0.03 : 0.1),
                  ease: easeOut,
                }}
                className="flex min-w-0 flex-1 flex-col rounded-[20px] border border-black/[0.08] bg-white/[0.45] p-6 shadow-[0_1px_0_rgba(0,0,0,0.03)] lg:p-7"
              >
                <span className="font-mono text-[1.5rem] font-semibold tabular-nums text-[#0c0c0c]/[0.12]">
                  {step.num}
                </span>
                <h3 className="mt-5 text-[1.0625rem] font-semibold leading-snug tracking-tight text-[#0c0c0c] lg:text-[1.125rem]">
                  {step.title}
                </h3>
                <p className="mt-2.5 text-[0.9375rem] leading-[1.62] text-[#525252]">
                  {step.body}
                </p>
              </motion.div>

              {i < steps.length - 1 && (
                <div
                  className="flex w-8 shrink-0 items-center justify-center"
                  aria-hidden
                >
                  <span className="text-lg font-light text-black/[0.14]">
                    →
                  </span>
                </div>
              )}
            </Fragment>
          ))}
        </div>
      </Container>
    </Section>
  );
}
