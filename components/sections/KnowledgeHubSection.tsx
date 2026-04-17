"use client";

import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { homepageContent } from "@/content/homepage";

const defaultContent = homepageContent.knowledgeHub;
const easeOut = [0, 0, 0.2, 1] as const;

type KnowledgeBlock = {
  title: string;
  items: readonly string[];
};

type KnowledgeHubSectionProps = {
  label?: string;
  headline?: string;
  subheadline?: string;
  blocks?: readonly KnowledgeBlock[];
  personalizationLabel?: string;
  personalizationBody?: string;
  expertHeadline?: string;
  expertItems?: readonly string[];
  ctaLabel?: string;
  ctaHref?: string;
};

export function KnowledgeHubSection({
  label = defaultContent.label,
  headline = defaultContent.headline,
  subheadline = defaultContent.subheadline,
  blocks = defaultContent.blocks,
  personalizationLabel = defaultContent.personalizationLabel,
  personalizationBody = defaultContent.personalizationBody,
  expertHeadline = defaultContent.expertHeadline,
  expertItems = defaultContent.expertItems,
  ctaLabel = defaultContent.ctaLabel,
  ctaHref = defaultContent.ctaHref,
}: KnowledgeHubSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <Section
      id="knowledge-hub"
      variant="default"
      className="relative scroll-mt-20 border-t border-black/[0.06] bg-[linear-gradient(180deg,#fafaf9_0%,var(--background)_20%)] py-20 md:py-28 lg:py-32"
    >
      <Container>
        {/* Header */}
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
            {subheadline}
          </p>
        </motion.div>

        {/* 3 core blocks */}
        <div className="mx-auto mt-12 grid max-w-[60rem] grid-cols-1 gap-5 md:mt-14 md:grid-cols-3 md:gap-6">
          {blocks.map((block, i) => (
            <motion.div
              key={block.title}
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.5,
                delay: i * (prefersReducedMotion ? 0.03 : 0.08),
                ease: easeOut,
              }}
              className="flex flex-col rounded-[20px] border border-black/[0.08] bg-white/[0.55] p-6 shadow-[0_1px_0_rgba(0,0,0,0.03)] md:p-7"
            >
              <span className="font-mono text-[1.375rem] font-semibold tabular-nums text-[#0c0c0c]/[0.1]">
                0{i + 1}
              </span>
              <h3 className="mt-4 text-[1.0625rem] font-semibold leading-snug tracking-tight text-[#0c0c0c]">
                {block.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {block.items.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span
                      className="mt-[0.38em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#c4c4c4]"
                      aria-hidden
                    />
                    <span className="text-[0.9375rem] leading-[1.6] text-[#525252]">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Personalization hook */}
        <motion.div
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.55, delay: 0.1, ease: easeOut }}
          className="mx-auto mt-6 max-w-[60rem] overflow-hidden rounded-[20px] border border-black/[0.14] bg-[#0c0c0c] p-6 md:p-8"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/[0.35]">
            {personalizationLabel}
          </p>
          <p className="mt-3 max-w-[44rem] text-[1rem] leading-[1.65] text-white/[0.7] md:text-[1.0625rem]">
            {personalizationBody}
          </p>
        </motion.div>

        {/* Expert / community block */}
        <motion.div
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.55, delay: 0.08, ease: easeOut }}
          className="mx-auto mt-6 max-w-[60rem] rounded-[20px] border border-black/[0.08] bg-white/[0.55] p-6 shadow-[0_1px_0_rgba(0,0,0,0.03)] md:p-8"
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10">
            <div>
              <h3 className="text-[1.125rem] font-semibold leading-snug tracking-tight text-[#0c0c0c] md:text-[1.1875rem]">
                {expertHeadline}
              </h3>
            </div>
            <ul className="space-y-3">
              {expertItems.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span
                    className="mt-[0.38em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#c4c4c4]"
                    aria-hidden
                  />
                  <span className="text-[0.9375rem] leading-[1.6] text-[#404040]">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-20px" }}
          transition={{ duration: 0.4, delay: 0.15, ease: easeOut }}
          className="mt-10 flex justify-center md:mt-12"
        >
          <Link
            href={ctaHref}
            className="rounded-[14px] bg-[#0c0c0c] px-6 py-3 text-[0.9375rem] font-medium text-white transition-[filter] duration-[180ms] hover:brightness-[0.9]"
          >
            {ctaLabel}
          </Link>
        </motion.div>
      </Container>
    </Section>
  );
}
