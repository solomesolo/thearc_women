"use client";

import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { homepageContent } from "@/content/homepage";

const defaultContent = homepageContent.howItWorks;

const easeOut = [0, 0, 0.2, 1] as const;

type HowItWorksSectionProps = {
  headline?: string;
};

export function HowItWorksSection({
  headline = defaultContent.headline,
}: HowItWorksSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <Section id="how" variant="default">
      <Container>
        <motion.div
          className="w-full"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={
            prefersReducedMotion
              ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
              : {
                  hidden: { opacity: 0, y: 8 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.5, ease: easeOut },
                  },
                }
          }
        >
          <motion.h2 className="mb-3 text-left text-[1.875rem] font-medium leading-[1.2] tracking-tight text-[var(--text-primary)] md:mb-4 md:text-[2.5rem] md:leading-[1.15] lg:text-[3rem]">
            {headline}
          </motion.h2>

          <p className="mb-8 text-left text-[1.05rem] leading-[1.6] text-[var(--text-secondary)] md:mb-10 md:text-[1.15rem] md:leading-[1.65]">
            From population averages{" "}
            <span className="inline-block align-baseline">
              to personal intelligence.
            </span>
          </p>

          {/* FROM → TO comparison layout */}
          <div className="grid grid-cols-1 gap-y-8 gap-x-10 md:grid-cols-2 md:gap-y-0 md:gap-x-16">
            <div>
              <p className="mb-4 text-[0.85rem] font-medium uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                The old model
              </p>
              <div className="space-y-2.5 md:space-y-3">
                {[
                  "Based on population data",
                  "Reactive",
                  "Symptom-driven",
                  "Fragmented specialists",
                  "One-size-fits-all thresholds",
                  "You adapt to the system",
                ].map((line) => (
                  <p
                    key={line}
                    className="text-[0.98rem] leading-[1.7] text-[rgba(12,12,12,0.72)] md:text-[1.02rem] md:leading-[1.75]"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-4 text-[0.85rem] font-medium uppercase tracking-[0.16em] text-[var(--text-primary)]">
                The new model
              </p>
              <div className="space-y-2.5 md:space-y-3">
                {[
                  "Built around your physiology",
                  "Preventive",
                  "Pattern-aware",
                  "Integrated across domains",
                  "Responsive to life stage",
                  "The system adapts to you",
                ].map((line) => (
                  <p
                    key={line}
                    className="text-[0.98rem] leading-[1.7] text-[var(--text-primary)] md:text-[1.02rem] md:leading-[1.75]"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </Container>
    </Section>
  );
}
