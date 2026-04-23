"use client";

import { Fragment } from "react";
import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { homepageContent } from "@/content/homepage";

const defaultContent = homepageContent.howItWorks;

const easeOut = [0, 0, 0.2, 1] as const;

export type ProductFlowHint =
  | "survey"
  | "insights"
  | "protocols"
  | "tracking"
  | "results";

export type ProductFlowStep = {
  phase: string;
  title: string;
  description: string;
  supporting: string;
  hint: ProductFlowHint;
  learnMore: readonly string[];
};

type HowItWorksSectionProps = {
  label?: string;
  headline?: string;
  intro?: string;
  steps?: readonly ProductFlowStep[];
};

function StepHint({ variant }: { variant: ProductFlowHint }) {
  const common = "h-10 w-full max-w-[7.5rem] text-[#0c0c0c]/[0.22]";
  switch (variant) {
    case "survey":
      return (
        <svg className={common} viewBox="0 0 120 40" fill="none" aria-hidden>
          <rect x="8" y="6" width="104" height="6" rx="1" stroke="currentColor" strokeWidth="1.1" />
          <rect x="8" y="18" width="88" height="6" rx="1" stroke="currentColor" strokeWidth="1.1" />
          <path
            d="M104 21l4 3 4-3"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="8" y="30" width="72" height="6" rx="1" stroke="currentColor" strokeWidth="1.1" />
        </svg>
      );
    case "insights":
      return (
        <svg className={common} viewBox="0 0 120 40" fill="none" aria-hidden>
          <rect x="8" y="8" width="36" height="26" rx="2" stroke="currentColor" strokeWidth="1.1" />
          <rect x="50" y="8" width="62" height="11" rx="1.5" fill="currentColor" opacity="0.12" />
          <rect x="50" y="23" width="44" height="11" rx="1.5" stroke="currentColor" strokeWidth="1" />
        </svg>
      );
    case "protocols":
      return (
        <svg className={common} viewBox="0 0 120 40" fill="none" aria-hidden>
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(10, ${8 + i * 11})`}>
              <circle cx="4" cy="5" r="3" stroke="currentColor" strokeWidth="1" fill="none" />
              <rect x="14" y="2" width="96" height="6" rx="1" stroke="currentColor" strokeWidth="0.9" />
            </g>
          ))}
        </svg>
      );
    case "tracking":
      return (
        <svg className={common} viewBox="0 0 120 40" fill="none" aria-hidden>
          <path
            d="M10 28 L28 22 L46 26 L64 14 L82 18 L100 10 L110 8"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="28" cy="22" r="2" fill="currentColor" opacity="0.35" />
          <circle cx="64" cy="14" r="2" fill="currentColor" opacity="0.35" />
          <circle cx="100" cy="10" r="2" fill="currentColor" opacity="0.35" />
        </svg>
      );
    case "results":
      return (
        <svg className={common} viewBox="0 0 120 40" fill="none" aria-hidden>
          <rect x="10" y="10" width="100" height="7" rx="1" stroke="currentColor" strokeWidth="0.9" />
          <rect x="10" y="22" width="72" height="7" rx="1" fill="currentColor" opacity="0.1" />
          <path
            d="M88 25.5l4 2.5 8-7"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

function FlowStepCard({
  step,
  index,
  prefersReducedMotion,
}: {
  step: ProductFlowStep;
  index: number;
  prefersReducedMotion: boolean | null;
}) {
  const num = String(index + 1).padStart(2, "0");
  const delay = index * (prefersReducedMotion ? 0.03 : 0.055);

  return (
    <motion.article
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.48, delay, ease: easeOut }}
      className="group flex h-full flex-col rounded-[18px] border border-black/[0.08] bg-white/[0.45] p-5 shadow-[0_1px_0_rgba(0,0,0,0.03)] transition-[border-color,box-shadow] duration-200 hover:border-black/[0.14] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] md:p-6"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
            {step.phase}
          </span>
          <span className="font-mono text-[11px] font-semibold tabular-nums text-[#a3a3a3]">{num}</span>
        </div>
        <StepHint variant={step.hint} />
      </div>

      <h3 className="text-[1.0625rem] font-semibold leading-snug tracking-tight text-[#0c0c0c] md:text-[1.125rem]">
        {step.title}
      </h3>

      <p className="mt-3 text-[0.9375rem] leading-[1.6] text-[#404040] md:text-[0.96875rem]">
        {step.description}
      </p>

      <p className="mt-3 text-[0.8125rem] leading-[1.55] text-[#737373] md:text-[0.84375rem]">
        {step.supporting}
      </p>

      <details className="group/details mt-auto border-t border-black/[0.06] pt-4">
        <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 text-left text-sm font-medium text-[#404040] [&::-webkit-details-marker]:hidden">
          <span className="underline decoration-black/25 decoration-dotted underline-offset-4">
            Learn more
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="shrink-0 text-[#737373] transition-transform duration-200 group-open/details:rotate-180"
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
        <ul className="mt-3 space-y-2.5 text-[0.8125rem] leading-[1.5] text-[#525252] md:text-[0.84375rem]">
          {step.learnMore.map((line) => (
            <li
              key={line}
              className="relative pl-4 before:absolute before:left-0 before:top-[0.5em] before:h-1 before:w-1 before:rounded-full before:bg-[#c4c4c4]"
            >
              {line}
            </li>
          ))}
        </ul>
      </details>
    </motion.article>
  );
}

export function HowItWorksSection({
  label = defaultContent.label,
  headline = defaultContent.headline,
  intro = defaultContent.intro,
  steps = defaultContent.steps,
}: HowItWorksSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <Section
      id="how-it-works"
      variant="default"
      className="relative scroll-mt-20 bg-[linear-gradient(180deg,rgba(250,250,249,0.5)_0%,var(--background)_12%,var(--background)_100%)] py-20 md:py-24 lg:py-28"
    >
      <Container>
        <motion.div
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: easeOut }}
        >
          <motion.p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#737373]">
            {label}
          </motion.p>

          <h2 className="mt-3 max-w-[36rem] text-[1.75rem] font-medium leading-[1.15] tracking-tight text-[#0c0c0c] sm:text-[1.95rem] md:mt-4 md:text-[2.15rem] lg:text-[2.35rem]">
            {headline}
          </h2>

          <p className="mt-6 max-w-[40rem] text-[1rem] leading-[1.65] text-[#404040] md:mt-7 md:text-[1.0625rem]">
            {intro}
          </p>
        </motion.div>

        {/* Below xl: single column → md 2-column grid; step 5 centered on md */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:mt-14 md:grid-cols-2 md:gap-x-6 md:gap-y-8 lg:mt-16 xl:hidden">
          {steps.map((step, i) => (
            <div
              key={step.phase}
              className={
                i === steps.length - 1 ? "md:col-span-2 md:flex md:justify-center" : ""
              }
            >
              <div className={i === steps.length - 1 ? "w-full max-w-md" : ""}>
                <FlowStepCard
                  step={step}
                  index={i}
                  prefersReducedMotion={prefersReducedMotion}
                />
              </div>
            </div>
          ))}
        </div>

        {/* xl+: horizontal timeline */}
        <div className="group/row mt-12 hidden gap-0 xl:mt-16 xl:flex xl:items-stretch">
          {steps.map((step, i) => (
            <Fragment key={step.phase}>
              <div className="min-w-0 flex-1">
                <FlowStepCard
                  step={step}
                  index={i}
                  prefersReducedMotion={prefersReducedMotion}
                />
              </div>
              {i < steps.length - 1 && (
                <div
                  className="flex w-6 shrink-0 items-center justify-center self-stretch pt-10"
                  aria-hidden
                >
                  <span className="text-base font-light leading-none text-black/[0.14] transition-colors duration-200 group-hover/row:text-black/[0.22]">
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
