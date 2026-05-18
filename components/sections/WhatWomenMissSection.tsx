"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { homepageContent } from "@/content/homepage";

const defaultContent = homepageContent.whatWomenMiss;
const easeOut = [0, 0, 0.2, 1] as const;

type StoryCard = {
  quote: string;
  footer: string;
  wishLine?: string;
};

type WhatWomenMissSectionProps = {
  headline?: string;
  cards?: readonly StoryCard[];
};

export function WhatWomenMissSection({
  headline = defaultContent.headline,
  cards = defaultContent.cards,
}: WhatWomenMissSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const stackRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: stackRef,
    offset: ["start end", "end start"],
  });

  return (
    <Section
      id="what-women-miss"
      variant="default"
      className="scroll-mt-20 bg-[#0c0c0c] py-24 text-[#fafaf9] md:py-32 lg:py-40"
    >
      <Container>
        <motion.h2
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.65, ease: easeOut }}
          className="mx-auto max-w-[20ch] text-center text-[1.85rem] font-medium leading-[1.12] tracking-tight sm:text-[2.15rem] md:text-[2.5rem] lg:text-[2.85rem]"
        >
          {headline}
        </motion.h2>

        <motion.div
          ref={stackRef}
          className="relative mx-auto mt-14 max-w-[52rem] md:mt-20"
          style={{ minHeight: `${cards.length * 28 + 40}vh` }}
        >
          {cards.map((card, i) => (
            <StoryCardBlock
              key={card.quote}
              card={card}
              index={i}
              total={cards.length}
              scrollYProgress={scrollYProgress}
              prefersReducedMotion={!!prefersReducedMotion}
            />
          ))}
        </motion.div>
      </Container>
    </Section>
  );
}

function StoryCardBlock({
  card,
  index,
  total,
  scrollYProgress,
  prefersReducedMotion,
}: {
  card: StoryCard;
  index: number;
  total: number;
  scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
  prefersReducedMotion: boolean;
}) {
  const start = index / (total + 0.5);
  const end = (index + 1.2) / (total + 0.5);

  const y = useTransform(
    scrollYProgress,
    [start, end],
    [prefersReducedMotion ? 0 : 48 + index * 12, prefersReducedMotion ? 0 : index * -6]
  );
  const scale = useTransform(scrollYProgress, [start, end], [0.97, 1]);
  const opacity = useTransform(scrollYProgress, [start, start + 0.08], [0.55, 1]);

  const wishOpacity = useTransform(
    scrollYProgress,
    [start + 0.06, start + 0.14],
    [0, card.wishLine ? 1 : 0]
  );

  return (
    <motion.article
      style={{
        y: prefersReducedMotion ? undefined : y,
        scale: prefersReducedMotion ? undefined : scale,
        opacity: prefersReducedMotion ? 1 : opacity,
        top: `${index * 4}rem`,
        zIndex: index + 1,
      }}
      className="sticky mb-8 rounded-[20px] border border-white/[0.08] bg-[#141414] px-6 py-10 shadow-[0_24px_80px_rgba(0,0,0,0.45)] md:px-10 md:py-12"
    >
      <blockquote className="text-[1.35rem] font-[Georgia,'Times_New_Roman',serif] leading-[1.35] tracking-[-0.01em] text-[#f5f5f4] sm:text-[1.55rem] md:text-[1.75rem] lg:text-[2rem]">
        &ldquo;{card.quote}&rdquo;
      </blockquote>
      <p className="mt-6 text-[0.875rem] leading-[1.55] text-[#a3a3a3] md:text-[0.9375rem]">
        {card.footer}
      </p>
      {card.wishLine && (
        <motion.p
          style={{ opacity: prefersReducedMotion ? 1 : wishOpacity }}
          className="mt-5 text-[0.8125rem] italic tracking-wide text-[#737373]"
        >
          {card.wishLine}
        </motion.p>
      )}
    </motion.article>
  );
}
