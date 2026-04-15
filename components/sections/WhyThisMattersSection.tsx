"use client";

import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { homepageContent } from "@/content/homepage";

const defaultContent = homepageContent.whyThisMatters;

const easeOut = [0, 0, 0.2, 1] as const;

type WhyThisMattersSectionProps = {
  label?: string;
  headline?: string;
  main?: string;
  supporting?: string;
  secondaryLine?: string;
  credibilityTitle?: string;
  credibilityBullets?: readonly string[];
  researchGuidedLabel?: string;
  researchGuidedItems?: readonly string[];
};

function SubtleDataField() {
  return (
    <div
      className="pointer-events-none absolute inset-0 -z-0 opacity-[0.45] md:opacity-[0.5]"
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(115deg, rgba(245,245,244,0.9) 0%, transparent 42%, rgba(250,250,249,0.6) 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(12, 12, 12, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(12, 12, 12, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 85% 75% at 70% 40%, black 0%, transparent 68%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 85% 75% at 70% 40%, black 0%, transparent 68%)",
        }}
      />
    </div>
  );
}

export function WhyThisMattersSection({
  label = defaultContent.label,
  headline = defaultContent.headline,
  main = defaultContent.main,
  supporting = defaultContent.supporting,
  secondaryLine = defaultContent.secondaryLine,
  credibilityTitle = defaultContent.credibilityTitle,
  credibilityBullets = defaultContent.credibilityBullets,
  researchGuidedLabel = defaultContent.researchGuidedLabel,
  researchGuidedItems = defaultContent.researchGuidedItems,
}: WhyThisMattersSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <Section
      id="why-this-matters"
      variant="default"
      className="relative scroll-mt-20 overflow-hidden py-20 md:py-24 lg:py-28"
    >
      <SubtleDataField />

      <Container className="relative z-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-start lg:gap-14 xl:gap-16">
          {/* Narrative — slightly wider on desktop */}
          <motion.div
            className="lg:col-span-7"
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.52, ease: easeOut }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#737373]">
              {label}
            </p>
            <h2 className="mt-3 max-w-[38rem] text-[1.65rem] font-medium leading-[1.15] tracking-tight text-[#0c0c0c] sm:text-[1.85rem] md:mt-4 md:text-[2rem] lg:text-[2.15rem]">
              {headline}
            </h2>
            <p className="mt-7 max-w-[40rem] text-[1rem] leading-[1.68] text-[#404040] md:mt-8 md:text-[1.0625rem]">
              {main}
            </p>
            <p className="mt-6 max-w-[40rem] text-[0.9375rem] leading-[1.65] text-[#525252] md:mt-7 md:text-[1rem]">
              {supporting}
            </p>
            <p className="mt-5 max-w-[36rem] text-sm leading-[1.55] text-[#737373] md:mt-6 md:text-[0.9375rem]">
              {secondaryLine}
            </p>
          </motion.div>

          {/* Credibility + expandable */}
          <motion.aside
            className="lg:col-span-5"
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.52, delay: prefersReducedMotion ? 0 : 0.08, ease: easeOut }}
          >
            <div className="rounded-[20px] border border-black/[0.08] bg-white/[0.55] p-6 shadow-[0_1px_0_rgba(0,0,0,0.03)] md:p-7">
              <h3 className="text-[0.9375rem] font-semibold leading-snug tracking-tight text-[#0c0c0c] md:text-base">
                {credibilityTitle}
              </h3>
              <ul className="mt-5 space-y-3.5 text-[0.9375rem] leading-[1.55] text-[#404040] md:text-[0.96875rem]">
                {credibilityBullets.map((item) => (
                  <li
                    key={item}
                    className="relative border-l-2 border-black/[0.1] pl-4"
                  >
                    {item}
                  </li>
                ))}
              </ul>

              <details className="group/rg mt-6 border-t border-black/[0.07] pt-5">
                <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 text-left [&::-webkit-details-marker]:hidden">
                  <span className="text-[0.9375rem] font-medium text-[#404040] underline decoration-black/25 decoration-dotted underline-offset-4">
                    {researchGuidedLabel}
                  </span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="shrink-0 text-[#737373] transition-transform duration-200 group-open/rg:rotate-180"
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
                <ul className="mt-4 space-y-2.5 text-[0.8125rem] leading-[1.5] text-[#525252] md:text-[0.84375rem]">
                  {researchGuidedItems.map((item) => (
                    <li
                      key={item}
                      className="relative pl-4 before:absolute before:left-0 before:top-[0.5em] before:h-1 before:w-1 before:rounded-full before:bg-[#c4c4c4]"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          </motion.aside>
        </div>
      </Container>
    </Section>
  );
}
