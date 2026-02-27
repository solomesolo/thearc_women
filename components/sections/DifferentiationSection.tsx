"use client";

import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { homepageContent } from "@/content/homepage";

const defaultContent = homepageContent.differentiation;

type DifferentiationSectionProps = {
  headline?: string;
  paragraphs?: readonly string[];
  themeVariant?: "inverted" | "default";
};

export function DifferentiationSection({
  headline = defaultContent.headline,
  paragraphs = defaultContent.paragraphs,
  themeVariant = defaultContent.themeVariant,
}: DifferentiationSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  const isInverted = themeVariant === "inverted";

  const easeOut = [0, 0, 0.2, 1] as const;

  const blockVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: prefersReducedMotion ? 0.24 : 0.58,
        ease: easeOut,
      },
    },
  };

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.09,
        delayChildren: 0,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: prefersReducedMotion ? 0.22 : 0.5,
        ease: easeOut,
      },
    },
  };

  const useSequential = !prefersReducedMotion;

  return (
    <Section
      id="differentiation"
      variant={isInverted ? "inverted" : "default"}
      className={isInverted ? "bg-[#0c0c0c]" : undefined}
    >
      <Container>
        <motion.div
          className={`mx-auto max-w-[52rem] text-left lg:max-w-[55rem] ${isInverted ? "text-neutral-100" : "text-[var(--text-primary)]"}`}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={useSequential ? containerVariants : blockVariants}
        >
          <motion.h2
            variants={useSequential ? itemVariants : blockVariants}
            className={
              isInverted
                ? "text-[2rem] font-medium leading-[1.18] tracking-tight text-neutral-100 md:text-[2.75rem] md:leading-[1.15] lg:text-[3.25rem]"
                : "text-[2rem] font-medium leading-[1.18] tracking-tight text-[var(--text-primary)] md:text-[2.75rem] md:leading-[1.15] lg:text-[3.25rem]"
            }
          >
            {headline}
          </motion.h2>

          <div className="mt-7 space-y-3.5 md:mt-8 md:space-y-4">
            {paragraphs.slice(0, -1).map((line, i) => (
              <motion.p
                key={i}
                variants={useSequential ? itemVariants : blockVariants}
                className={
                  isInverted
                    ? "text-base leading-[1.65] text-neutral-300 md:text-lg md:leading-[1.7]"
                    : "text-base leading-[1.65] text-[var(--text-secondary)] md:text-lg md:leading-[1.7]"
                }
              >
                {line}
              </motion.p>
            ))}
          </div>

          <motion.p
            variants={useSequential ? itemVariants : blockVariants}
            className={
              isInverted
                ? "mt-5 text-base leading-[1.65] text-neutral-100 md:mt-6 md:text-lg md:leading-[1.7]"
                : "mt-5 text-base leading-[1.65] text-[var(--text-primary)] md:mt-6 md:text-lg md:leading-[1.7]"
            }
          >
            {paragraphs[paragraphs.length - 1]}
          </motion.p>
        </motion.div>
      </Container>
    </Section>
  );
}
