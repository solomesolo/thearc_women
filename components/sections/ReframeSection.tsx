"use client";

import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { homepageContent } from "@/content/homepage";

const defaultContent = homepageContent.reframe;

const easeOut = [0, 0, 0.2, 1] as const;

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4MCIgaGVpZ2h0PSI4MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2Y1ZjVmNCIvPjwvc3ZnPg==";

type ReframeSectionProps = {
  headline?: string;
  paragraphs?: readonly string[];
  backgroundVariant?: "none" | "abstract";
  backgroundImageSrc?: string;
  backgroundImageAlt?: string;
};

export function ReframeSection({
  headline = defaultContent.headline,
  paragraphs = defaultContent.paragraphs,
  backgroundVariant = defaultContent.backgroundVariant,
  backgroundImageSrc = defaultContent.backgroundImageSrc,
  backgroundImageAlt = defaultContent.backgroundImageAlt,
}: ReframeSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  const getDelay = (group: "headline" | "intro" | "emphasis" | "conclusion", index: number) => {
    if (prefersReducedMotion) {
      if (group === "headline") return 0;
      if (group === "intro") return 0.08;
      if (group === "emphasis") return 0.16 + index * 0.05;
      return 0.35;
    }
    if (group === "headline") return 0;
    if (group === "intro") return 0.14;
    if (group === "emphasis") return 0.28 + index * 0.1;
    return 0.72;
  };

  const itemVariants = prefersReducedMotion
    ? {
        hidden: { opacity: 0 },
        visible: ({ delay }: { delay: number }) => ({
          opacity: 1,
          transition: { duration: 0.24, delay },
        }),
      }
    : {
        hidden: { opacity: 0, y: 7 },
        visible: ({ delay }: { delay: number }) => ({
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.58,
            delay,
            ease: easeOut,
          },
        }),
      };

  const showBackground =
    (backgroundVariant === "abstract" || backgroundImageSrc) && backgroundImageSrc;
  const animateBackground =
    showBackground && !prefersReducedMotion;

  const [firstPara, ...emphasisLines] = paragraphs.slice(0, 4);
  const finalPara = paragraphs[4];

  return (
    <Section
      id="reframe"
      variant="default"
      className="relative overflow-hidden py-28 md:py-40"
    >
      {/* Full-bleed background image (replaces solid background) */}
      {showBackground && (
        <div
          className="pointer-events-none absolute inset-0 z-0"
          aria-hidden
        >
          <div
            className={clsx(
              "relative h-full w-full",
              animateBackground && "animate-reframe-bg-drift"
            )}
          >
            <Image
              src={backgroundImageSrc}
              alt={backgroundImageAlt ?? ""}
              fill
              className="object-cover object-center"
              sizes="100vw"
              quality={90}
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
            />
          </div>
        </div>
      )}

      <Container className="relative z-10">
        <div className="flex justify-end">
          <div className="min-w-0 max-w-[45rem] text-right lg:max-w-[51.25rem]">
            {/* Headline — max-width 13–15em, text-balance */}
            <motion.h2
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={itemVariants}
              custom={{ delay: getDelay("headline", 0) }}
              className="max-w-[14em] ml-auto text-balance text-[1.875rem] font-medium leading-[1.2] tracking-tight text-[var(--text-primary)] md:text-[2.5rem] md:leading-[1.15] lg:text-[3rem]"
            >
              {headline}
            </motion.h2>

            {/* Intro sentence — 34–46px below headline; 82–88% intensity */}
            <motion.p
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={itemVariants}
              custom={{ delay: getDelay("intro", 0) }}
              className="mt-9 text-base leading-[1.65] md:mt-10 md:text-lg md:leading-[1.7]"
              style={{ color: "rgba(12, 12, 12, 0.86)" }}
            >
              {firstPara}
            </motion.p>

            {/* Emphasis block — 18–24px below intro; 10–14px between lines; stronger typography */}
            <div className="mt-5 space-y-2.5 md:mt-6 md:space-y-3">
              {emphasisLines.map((text, i) => (
                <motion.p
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.5 }}
                  variants={itemVariants}
                  custom={{ delay: getDelay("emphasis", i) }}
                  className="text-[1.125rem] font-semibold leading-[1.28] tracking-tight text-[var(--text-primary)] md:text-[1.25rem] md:leading-[1.3] lg:text-[1.375rem] lg:leading-[1.32]"
                >
                  {text}
                </motion.p>
              ))}
            </div>

            {/* Concluding paragraph — 28–40px above; max-width 620–720px; primary */}
            <motion.p
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={itemVariants}
              custom={{ delay: getDelay("conclusion", 0) }}
              className="mt-8 max-w-[43rem] text-base leading-[1.65] text-[var(--text-primary)] md:mt-10 md:text-lg md:leading-[1.7] lg:max-w-[45rem]"
            >
              {finalPara}
            </motion.p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
