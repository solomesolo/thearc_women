"use client";

import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { homepageContent } from "@/content/homepage";

const defaultContent = homepageContent.solution;
const easeOut = [0, 0, 0.2, 1] as const;

type SolutionPillar = { num: string; title: string; subtitle: string; body: string };

type SolutionSectionProps = {
  label?: string;
  headline?: string;
  pillars?: readonly SolutionPillar[];
};

export function SolutionSection({
  label = defaultContent.label,
  headline = defaultContent.headline,
  pillars = defaultContent.pillars,
}: SolutionSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <Section
      id="solution"
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
        </motion.div>

        <div className="mx-auto mt-12 grid max-w-[60rem] grid-cols-1 gap-5 md:mt-14 md:grid-cols-3 md:gap-6 lg:gap-8">
          {pillars.map((pillar, i) => {
            const isCenter = i === 1;
            return (
              <motion.div
                key={pillar.num}
                initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: 0.5,
                  delay: i * (prefersReducedMotion ? 0.03 : 0.08),
                  ease: easeOut,
                }}
                className={[
                  "flex flex-col rounded-[20px] border p-6 md:p-7",
                  isCenter
                    ? "border-black/[0.14] bg-[#0c0c0c] text-white shadow-[0_8px_40px_rgba(0,0,0,0.14)]"
                    : "border-black/[0.08] bg-white/[0.45] shadow-[0_1px_0_rgba(0,0,0,0.03)]",
                ].join(" ")}
              >
                <span
                  className={[
                    "font-mono text-[2rem] font-semibold leading-none tabular-nums",
                    isCenter ? "text-white/[0.18]" : "text-[#0c0c0c]/[0.12]",
                  ].join(" ")}
                >
                  {pillar.num}
                </span>

                <h3
                  className={[
                    "mt-5 text-[1.375rem] font-semibold leading-none tracking-tight",
                    isCenter ? "text-white" : "text-[#0c0c0c]",
                  ].join(" ")}
                >
                  {pillar.title}
                </h3>

                <p
                  className={[
                    "mt-2 text-[0.9375rem] font-medium leading-snug",
                    isCenter ? "text-white/[0.7]" : "text-[#404040]",
                  ].join(" ")}
                >
                  {pillar.subtitle}
                </p>

                <p
                  className={[
                    "mt-4 text-[0.9375rem] leading-[1.62]",
                    isCenter ? "text-white/[0.55]" : "text-[#525252]",
                  ].join(" ")}
                >
                  {pillar.body}
                </p>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
