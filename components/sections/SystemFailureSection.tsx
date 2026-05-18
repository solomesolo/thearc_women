"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { homepageContent } from "@/content/homepage";

const defaultContent = homepageContent.systemFailure;
const easeOut = [0, 0, 0.2, 1] as const;

const FRAGMENTS = [
  { label: "Lab PDF", x: 8, y: 14, rot: -4 },
  { label: "Portal login", x: 58, y: 8, rot: 6 },
  { label: "Missed screening", x: 72, y: 38, rot: -2 },
  { label: "Symptom note", x: 18, y: 48, rot: 5 },
  { label: "Old results", x: 42, y: 62, rot: -6 },
  { label: "Calendar reminder", x: 78, y: 68, rot: 3 },
] as const;

type SystemFailureSectionProps = {
  headline?: string;
  copyParagraphs?: readonly string[];
  closing?: string;
};

export function SystemFailureSection({
  headline = defaultContent.headline,
  copyParagraphs = defaultContent.copyParagraphs,
  closing = defaultContent.closing,
}: SystemFailureSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const visualRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: visualRef,
    offset: ["start end", "end center"],
  });

  const alignProgress = useTransform(scrollYProgress, [0.15, 0.8], [0, 1]);

  return (
    <Section
      id="system-failure"
      variant="default"
      className="scroll-mt-20 border-t border-black/[0.06] py-24 md:py-32 lg:py-36"
    >
      <Container>
        <motion.div
          className="grid grid-cols-1 items-center gap-12 md:grid-cols-12 md:gap-10 lg:gap-16"
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.65, ease: easeOut }}
        >
          <div className="md:col-span-5">
            <h2 className="text-[1.75rem] font-medium leading-[1.14] tracking-tight text-[#0c0c0c] sm:text-[2rem] md:text-[2.25rem] lg:text-[2.5rem]">
              {headline}
            </h2>
            <div className="mt-8 space-y-3">
              {copyParagraphs.map((line) => (
                <p
                  key={line}
                  className="text-[1rem] leading-[1.6] text-[#404040] md:text-[1.0625rem]"
                >
                  {line}
                </p>
              ))}
            </div>
            <p className="mt-8 max-w-[28rem] text-[0.9375rem] leading-[1.65] text-[#525252] md:text-base">
              {closing}
            </p>
          </div>

          <div ref={visualRef} className="relative md:col-span-7">
            <div className="relative aspect-[5/4] w-full overflow-hidden rounded-[20px] border border-black/[0.08] bg-[#f5f4f2]">
              {FRAGMENTS.map((frag, i) => (
                <FragmentTile
                  key={frag.label}
                  frag={frag}
                  index={i}
                  alignProgress={alignProgress}
                  prefersReducedMotion={!!prefersReducedMotion}
                />
              ))}
              <StructuredMapOverlay alignProgress={alignProgress} />
            </div>
          </div>
        </motion.div>
      </Container>
    </Section>
  );
}

function FragmentTile({
  frag,
  index,
  alignProgress,
  prefersReducedMotion,
}: {
  frag: (typeof FRAGMENTS)[number];
  index: number;
  alignProgress: ReturnType<typeof useTransform<number, number>>;
  prefersReducedMotion: boolean;
}) {
  const targetX = 12 + (index % 3) * 28;
  const targetY = 18 + Math.floor(index / 3) * 28;

  const left = useTransform(alignProgress, (p) => {
    const x = prefersReducedMotion ? targetX : frag.x + (targetX - frag.x) * p;
    return `${x}%`;
  });
  const top = useTransform(alignProgress, (p) => {
    const y = prefersReducedMotion ? targetY : frag.y + (targetY - frag.y) * p;
    return `${y}%`;
  });
  const rotate = useTransform(alignProgress, (p) =>
    prefersReducedMotion ? 0 : frag.rot * (1 - p)
  );
  const opacity = useTransform(alignProgress, [0, 0.85, 1], [1, 1, 0.35]);

  return (
    <motion.div
      style={{
        left,
        top,
        rotate,
        opacity,
      }}
      className="absolute w-[28%] max-w-[9rem] rounded-md border border-black/[0.1] bg-white px-2.5 py-2 text-[9px] font-medium leading-tight text-[#525252] shadow-sm md:text-[10px]"
    >
      {frag.label}
    </motion.div>
  );
}

function StructuredMapOverlay({
  alignProgress,
}: {
  alignProgress: ReturnType<typeof useTransform<number, number>>;
}) {
  const opacity = useTransform(alignProgress, [0.55, 0.95], [0, 1]);
  const scale = useTransform(alignProgress, [0.55, 0.95], [0.96, 1]);

  return (
    <motion.div
      style={{ opacity, scale }}
      className="pointer-events-none absolute inset-6 rounded-[14px] border border-[#0c0c0c]/15 bg-white/40 backdrop-blur-[2px]"
    >
      <svg viewBox="0 0 100 100" className="h-full w-full p-4" aria-hidden>
        <rect x="8" y="12" width="84" height="76" rx="4" fill="none" stroke="#0c0c0c" strokeWidth="0.4" strokeOpacity="0.25" />
        <line x1="8" y1="32" x2="92" y2="32" stroke="#0c0c0c" strokeWidth="0.3" strokeOpacity="0.2" />
        <line x1="8" y1="52" x2="92" y2="52" stroke="#0c0c0c" strokeWidth="0.3" strokeOpacity="0.2" />
        <line x1="8" y1="72" x2="92" y2="72" stroke="#0c0c0c" strokeWidth="0.3" strokeOpacity="0.2" />
        <text x="50" y="24" textAnchor="middle" fill="#404040" fontSize="4" fontFamily="ui-sans-serif, system-ui, sans-serif">
          Health map
        </text>
      </svg>
    </motion.div>
  );
}
