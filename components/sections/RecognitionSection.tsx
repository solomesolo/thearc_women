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

const defaultContent = homepageContent.recognition;
const easeOut = [0, 0, 0.2, 1] as const;
const AUTO_CHECK_INDICES = [0, 2, 4, 6, 8];

type ChecklistItem = { label: string; microtext: string };

type RecognitionSectionProps = {
  headline?: string;
  subheadline?: string;
  checklistItems?: readonly ChecklistItem[];
  revelationPrimary?: string;
  revelationSecondary?: string;
};

export function RecognitionSection({
  headline = defaultContent.headline,
  subheadline = defaultContent.subheadline,
  checklistItems = defaultContent.checklistItems,
  revelationPrimary = defaultContent.revelationPrimary,
  revelationSecondary = defaultContent.revelationSecondary,
}: RecognitionSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  });

  const checkProgress = useTransform(scrollYProgress, [0.15, 0.72], [0, 1]);
  const revelationOpacity = useTransform(scrollYProgress, [0.68, 0.88], [0, 1]);
  const revelationY = useTransform(
    scrollYProgress,
    [0.68, 0.88],
    [prefersReducedMotion ? 0 : 16, 0]
  );

  const subParts = subheadline.split("\n");

  return (
    <Section
      id="recognition"
      variant="default"
      className="scroll-mt-20 border-t border-black/[0.06] bg-[linear-gradient(180deg,#fafaf9_0%,var(--background)_24%)] py-24 md:py-32 lg:py-36"
    >
      <div ref={sectionRef}>
        <Container>
          <motion.div
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: easeOut }}
            className="mx-auto max-w-[44rem] text-center"
          >
            <h2 className="text-balance text-[1.85rem] font-medium leading-[1.12] tracking-tight text-[#0c0c0c] sm:text-[2.15rem] md:text-[2.45rem] lg:text-[2.75rem]">
              {headline}
            </h2>
            <motion.div className="mx-auto mt-6 max-w-[38rem] space-y-1 text-[1rem] leading-[1.65] text-[#525252] md:mt-7 md:text-[1.0625rem]">
              {subParts.map((part) => (
                <p key={part}>{part}</p>
              ))}
            </motion.div>
          </motion.div>

          <div className="mx-auto mt-14 max-w-[34rem] md:mt-20 lg:max-w-[36rem]">
            <ul className="divide-y divide-black/[0.08] border-y border-black/[0.08]">
              {checklistItems.map((item, i) => (
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

          <motion.div
            style={{
              opacity: prefersReducedMotion ? 1 : revelationOpacity,
              y: prefersReducedMotion ? 0 : revelationY,
            }}
            className="mx-auto mt-16 max-w-[34rem] text-center md:mt-20"
          >
            <p className="text-[1.0625rem] font-medium leading-[1.55] text-[#404040] md:text-[1.125rem]">
              {revelationPrimary}
            </p>
            <p className="mt-6 whitespace-pre-line text-[1.0625rem] leading-[1.55] text-[#525252] md:text-[1.125rem]">
              {revelationSecondary}
            </p>
          </motion.div>
        </Container>
      </div>
    </Section>
  );
}

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
      className="group relative py-5 md:py-5"
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
