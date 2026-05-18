"use client";

import { useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  AnimatePresence,
  type MotionValue,
} from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { homepageContent } from "@/content/homepage";

const recognition = homepageContent.recognition;
const problem = homepageContent.problem;

const easeOut = [0, 0, 0.2, 1] as const;
const AUTO_CHECK_INDICES = [0, 2, 4, 6, 8];

// ── Icons ─────────────────────────────────────────────────────────────────────

type ProblemIconVariant = "scatter" | "overview" | "unclear" | "followthrough";

function ProblemIcon({ variant }: { variant: ProblemIconVariant }) {
  const cls = "h-7 w-7 text-[#0c0c0c]/[0.28]";
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

// ── Types ─────────────────────────────────────────────────────────────────────

type ChecklistItem = { label: string; microtext: string };

type ProblemCard = {
  icon: "scatter" | "overview" | "unclear" | "followthrough";
  title: string;
  body: string;
};

type ProblemSectionProps = {
  // When all four are provided the section renders the compact card-only layout
  // (used by localised pages). When omitted the full combined recognition + cards section renders.
  label?: string;
  headline?: string;
  cards?: readonly ProblemCard[];
  punchline?: string;
};

// ── Main component ────────────────────────────────────────────────────────────

export function ProblemSection({
  label,
  headline,
  cards,
  punchline,
}: ProblemSectionProps = {}) {
  const isLocalized = !!(label && headline && cards && punchline);
  const prefersReducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const resolvedLabel    = label    ?? problem.label;
  const resolvedHeadline = headline ?? recognition.headline;
  const resolvedCards    = cards    ?? problem.cards;
  const resolvedPunchline = punchline ?? problem.punchline;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  });

  const checkProgress = useTransform(scrollYProgress, [0.08, 0.5], [0, 1]);
  const revelationOpacity = useTransform(scrollYProgress, [0.48, 0.65], [0, 1]);
  const revelationY = useTransform(
    scrollYProgress,
    [0.48, 0.65],
    [prefersReducedMotion ? 0 : 14, 0]
  );

  // ── Localized (cards-only) layout ──────────────────────────────────────────
  if (isLocalized) {
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#737373]">{resolvedLabel}</p>
            <h2 className="mt-3 text-balance text-[1.75rem] font-medium leading-[1.15] tracking-tight text-[#0c0c0c] sm:text-[1.95rem] md:mt-4 md:text-[2.15rem] lg:text-[2.35rem]">
              {resolvedHeadline}
            </h2>
          </motion.div>
          <div className="mx-auto mt-12 grid max-w-[56rem] grid-cols-1 gap-4 sm:grid-cols-2 md:mt-14 lg:grid-cols-4 lg:gap-5">
            {resolvedCards.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.48, delay: i * (prefersReducedMotion ? 0.03 : 0.07), ease: easeOut }}
                className="flex flex-col rounded-[16px] border border-black/[0.07] bg-white/[0.5] p-5 md:p-6"
              >
                <ProblemIcon variant={card.icon} />
                <h3 className="mt-4 text-[0.9375rem] font-semibold leading-snug tracking-tight text-[#0c0c0c]">{card.title}</h3>
                <p className="mt-2 text-[0.875rem] leading-[1.65] text-[#525252]">{card.body}</p>
              </motion.div>
            ))}
          </div>
          <motion.p
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: 0.22, ease: easeOut }}
            className="mx-auto mt-10 max-w-[36rem] text-center text-[1rem] font-medium leading-[1.6] text-[#404040] md:mt-12 md:text-[1.0625rem]"
          >
            {resolvedPunchline}
          </motion.p>
        </Container>
      </Section>
    );
  }

  // ── Full combined layout (EN homepage) ──────────────────────────────────────
  return (
    <Section
      id="problem"
      variant="default"
      className="scroll-mt-20 border-t border-black/[0.06] bg-[linear-gradient(180deg,#fafaf9_0%,var(--background)_24%)] py-24 md:py-32 lg:py-36"
    >
      <div ref={sectionRef}>
        <Container>

          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: easeOut }}
            className="mx-auto max-w-[44rem] text-center"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#737373]">
              {resolvedLabel}
            </p>
            <h2 className="mt-3 text-balance text-[1.85rem] font-medium leading-[1.12] tracking-tight text-[#0c0c0c] sm:text-[2.15rem] md:mt-4 md:text-[2.45rem] lg:text-[2.75rem]">
              {resolvedHeadline}
            </h2>
            <div className="mx-auto mt-5 max-w-[38rem] space-y-1 text-[1rem] leading-[1.65] text-[#525252] md:mt-6 md:text-[1.0625rem]">
              {recognition.subheadline.split("\n").map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </motion.div>

          {/* ── Checklist ── */}
          <div className="mx-auto mt-14 max-w-[34rem] md:mt-20 lg:max-w-[36rem]">
            <ul className="divide-y divide-black/[0.08] border-y border-black/[0.08]">
              {recognition.checklistItems.map((item, i) => (
                <ChecklistRow
                  key={item.label}
                  item={item}
                  index={i}
                  checkProgress={checkProgress}
                  autoCheck={AUTO_CHECK_INDICES.includes(i)}
                  isHovered={hoveredIndex === i}
                  onHover={() => setHoveredIndex(i)}
                  onLeave={() => setHoveredIndex(null)}
                  prefersReducedMotion={!!prefersReducedMotion}
                />
              ))}
            </ul>
          </div>

          {/* ── Revelation ── */}
          <motion.div
            style={{
              opacity: prefersReducedMotion ? 1 : revelationOpacity,
              y: prefersReducedMotion ? 0 : revelationY,
            }}
            className="mx-auto mt-16 max-w-[34rem] text-center md:mt-20"
          >
            <p className="text-[1.0625rem] font-medium leading-[1.55] text-[#404040] md:text-[1.125rem]">
              {recognition.revelationPrimary}
            </p>
            <p className="mt-5 whitespace-pre-line text-[1.0625rem] leading-[1.55] text-[#525252] md:text-[1.125rem]">
              {recognition.revelationSecondary}
            </p>
          </motion.div>

          {/* ── Divider ── */}
          <div className="mx-auto mt-20 max-w-[56rem] md:mt-24">
            <div className="flex items-center gap-5">
              <div className="h-px flex-1 bg-black/[0.07]" />
              <p className="shrink-0 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-[#b0b0b0]">
                Here is what that looks like
              </p>
              <div className="h-px flex-1 bg-black/[0.07]" />
            </div>
          </div>

          {/* ── Problem cards ── */}
          <div className="mx-auto mt-10 grid max-w-[56rem] grid-cols-1 gap-4 sm:grid-cols-2 md:mt-12 lg:grid-cols-4 lg:gap-5">
            {resolvedCards.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: 0.48,
                  delay: i * (prefersReducedMotion ? 0.03 : 0.07),
                  ease: easeOut,
                }}
                className="flex flex-col rounded-[16px] border border-black/[0.07] bg-white/[0.5] p-5 md:p-6"
              >
                <ProblemIcon variant={card.icon} />
                <h3 className="mt-4 text-[0.9375rem] font-semibold leading-snug tracking-tight text-[#0c0c0c]">
                  {card.title}
                </h3>
                <p className="mt-2 text-[0.875rem] leading-[1.65] text-[#525252]">
                  {card.body}
                </p>
              </motion.div>
            ))}
          </div>

          {/* ── Punchline ── */}
          <motion.p
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: 0.22, ease: easeOut }}
            className="mx-auto mt-10 max-w-[36rem] text-center text-[1rem] font-medium leading-[1.6] text-[#404040] md:mt-12 md:text-[1.0625rem]"
          >
            {resolvedPunchline}
          </motion.p>

        </Container>
      </div>
    </Section>
  );
}

// ── ChecklistRow ──────────────────────────────────────────────────────────────

function ChecklistRow({
  item,
  index,
  checkProgress,
  autoCheck,
  isHovered,
  onHover,
  onLeave,
  prefersReducedMotion,
}: {
  item: ChecklistItem;
  index: number;
  checkProgress: MotionValue<number>;
  autoCheck: boolean;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  prefersReducedMotion: boolean;
}) {
  const threshold = 0.12 + index * 0.065;
  const fill = useTransform(checkProgress, (p) =>
    autoCheck && p >= threshold ? 1 : 0
  );
  const markOpacity = useTransform(checkProgress, (p) =>
    autoCheck && p >= threshold ? 1 : 0
  );

  return (
    <motion.li
      className="group relative py-5"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onFocus={onHover}
      onBlur={onLeave}
    >
      <motion.div
        className="flex items-start gap-4"
        animate={{ x: isHovered && !prefersReducedMotion ? 2 : 0 }}
        transition={{ duration: 0.35, ease: easeOut }}
      >
        <span
          className="relative mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center border border-[#0c0c0c]/25 bg-transparent"
          aria-hidden
        >
          <motion.span
            className="absolute inset-0 origin-left bg-[#0c0c0c]"
            style={{ scaleX: fill }}
          />
          <motion.svg
            viewBox="0 0 12 12"
            className="relative z-[1] h-2.5 w-2.5 text-white"
            fill="none"
            style={{ opacity: markOpacity }}
          >
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        </span>

        <motion.div
          className="min-w-0 flex-1"
          animate={{ opacity: isHovered ? 1 : 0.92 }}
          transition={{ duration: 0.3, ease: easeOut }}
        >
          <p className="text-[1.0625rem] font-medium tracking-tight text-[#0c0c0c] md:text-[1.125rem]">
            {item.label}
          </p>
          <AnimatePresence>
            {isHovered && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease: easeOut }}
                className="mt-1.5 overflow-hidden text-[0.875rem] leading-[1.55] text-[#737373]"
              >
                {item.microtext}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </motion.li>
  );
}
