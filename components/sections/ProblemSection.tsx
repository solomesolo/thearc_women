"use client";

import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { homepageContent } from "@/content/homepage";

const defaultContent = homepageContent.problem;
const easeOut = [0, 0, 0.2, 1] as const;

type ProblemIcon = "scatter" | "overview" | "unclear" | "followthrough";

function ProblemIcon({ variant }: { variant: ProblemIcon }) {
  const cls = "h-8 w-8 text-[#0c0c0c]/[0.3]";
  switch (variant) {
    case "scatter":
      return (
        <svg className={cls} viewBox="0 0 32 32" fill="none" aria-hidden>
          <rect x="4" y="5" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <rect x="18" y="5" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <rect x="4" y="19" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <rect x="18" y="19" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M14 9h4M14 23h4M16 13v6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
        </svg>
      );
    case "overview":
      return (
        <svg className={cls} viewBox="0 0 32 32" fill="none" aria-hidden>
          <rect x="4" y="7" width="24" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <rect x="4" y="14" width="16" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <rect x="4" y="21" width="20" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="26" cy="23" r="4" stroke="currentColor" strokeWidth="1.2" />
          <path d="M24 23h4M26 21v4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
        </svg>
      );
    case "unclear":
      return (
        <svg className={cls} viewBox="0 0 32 32" fill="none" aria-hidden>
          <circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="1.2" />
          <path d="M16 10v7l4 2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 8l16 16" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.25" />
        </svg>
      );
    case "followthrough":
      return (
        <svg className={cls} viewBox="0 0 32 32" fill="none" aria-hidden>
          <rect x="6" y="6" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="1.2" />
          <path d="M6 12h20" stroke="currentColor" strokeWidth="1" />
          <circle cx="10" cy="9" r="1.5" fill="currentColor" opacity="0.35" />
          <circle cx="22" cy="9" r="1.5" fill="currentColor" opacity="0.35" />
          <path d="M10 18l2 2 6-5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
        </svg>
      );
  }
}

type ProblemCard = {
  icon: "scatter" | "overview" | "unclear" | "followthrough";
  title: string;
  body: string;
};

type ProblemSectionProps = {
  label?: string;
  headline?: string;
  cards?: readonly ProblemCard[];
  punchline?: string;
};

export function ProblemSection({
  label = defaultContent.label,
  headline = defaultContent.headline,
  cards = defaultContent.cards,
  punchline = defaultContent.punchline,
}: ProblemSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <Section
      id="problem"
      variant="default"
      className="relative scroll-mt-20 border-t border-black/[0.06] bg-[linear-gradient(180deg,#fafaf9_0%,var(--background)_18%)] py-20 md:py-28 lg:py-32"
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

        <div className="mx-auto mt-12 grid max-w-[56rem] grid-cols-1 gap-5 sm:grid-cols-2 md:mt-14 lg:grid-cols-4 lg:gap-6">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.48,
                delay: i * (prefersReducedMotion ? 0.03 : 0.06),
                ease: easeOut,
              }}
              className="flex flex-col rounded-[18px] border border-black/[0.08] bg-white/[0.45] p-5 shadow-[0_1px_0_rgba(0,0,0,0.03)] md:p-6"
            >
              <ProblemIcon variant={card.icon} />
              <h3 className="mt-4 text-[1rem] font-semibold leading-snug tracking-tight text-[#0c0c0c]">
                {card.title}
              </h3>
              <p className="mt-2 text-[0.9375rem] leading-[1.6] text-[#525252]">
                {card.body}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.48, delay: 0.2, ease: easeOut }}
          className="mx-auto mt-10 max-w-[36rem] text-center text-[1rem] font-medium leading-[1.6] text-[#404040] md:mt-12 md:text-[1.0625rem]"
        >
          {punchline}
        </motion.p>
      </Container>
    </Section>
  );
}
