"use client";

import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { homepageContent } from "@/content/homepage";

const defaultContent = homepageContent.identity;

const easeOut = [0, 0, 0.2, 1] as const;

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY0Ii8+PC9zdmc+";

type ImageItem = { src: string; alt: string };

type IdentitySectionProps = {
  headline?: string;
  profiles?: readonly string[];
  closingLine?: string;
  images?: readonly ImageItem[];
  layoutVariant?: "grid" | "crossfade";
};

export function IdentitySection({
  headline = defaultContent.headline,
  profiles = defaultContent.profiles,
  closingLine = defaultContent.closingLine,
  images = defaultContent.images,
  layoutVariant = defaultContent.layoutVariant,
}: IdentitySectionProps) {
  const prefersReducedMotion = useReducedMotion();

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: prefersReducedMotion ? 0.06 : 0.12,
        delayChildren: 0,
      },
    },
  };

  const itemVariants = prefersReducedMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.26 } },
      }
    : {
        hidden: { opacity: 0, y: 8 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.55, ease: easeOut },
        },
      };

  const imageVariants = prefersReducedMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.28 } },
      }
    : {
        hidden: { opacity: 0, y: 6 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: easeOut },
        },
      };

  const useGrid = layoutVariant === "grid";

  return (
    <Section id="identity" variant="default">
      <Container>
        <div className="grid grid-cols-1 gap-7 md:grid-cols-12 md:gap-8 md:items-center lg:gap-12 xl:gap-16">
          {/* Left column: text — spans 5 on desktop */}
          <motion.div
            className="flex flex-col md:col-span-5"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.45 }}
            variants={containerVariants}
          >
            <motion.h2
              variants={itemVariants}
              className="text-left text-[1.875rem] font-medium leading-[1.2] tracking-tight text-[var(--text-primary)] md:text-[2.5rem] md:leading-[1.15] lg:text-[3rem]"
            >
              {headline}
            </motion.h2>

            {/* Profiles — 24–32px below headline, 14–18px between, first two primary, later two muted */}
            <div className="mt-6 space-y-3.5 md:mt-8 md:space-y-4">
              {profiles.map((line, i) => (
                <motion.p
                  key={i}
                  variants={itemVariants}
                  className={
                    i < 2
                      ? "text-left text-base font-normal leading-[1.65] text-[var(--text-primary)] md:text-lg md:leading-[1.7]"
                      : "text-left text-base font-normal leading-[1.65] text-[var(--text-secondary)] md:text-lg md:leading-[1.7]"
                  }
                >
                  {line}
                </motion.p>
              ))}
            </div>

            {/* Closing line — 22–28px below profiles, decisive */}
            <motion.p
              variants={itemVariants}
              className="mt-6 text-left text-base font-medium leading-[1.65] text-[var(--text-primary)] md:mt-7 md:text-lg md:leading-[1.7]"
            >
              {closingLine}
            </motion.p>
          </motion.div>

          {/* Right column: portrait grid — spans 7 on desktop */}
          <motion.div
            className="grid grid-cols-2 gap-2.5 md:col-span-7 md:col-start-6 md:gap-3 lg:gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.45 }}
            variants={containerVariants}
          >
            {useGrid &&
              images.map((img, i) => (
                <motion.div
                  key={i}
                  variants={imageVariants}
                  className="relative aspect-[3/4] min-h-0 w-full overflow-hidden rounded-[24px] border border-[var(--color-border-hairline)] bg-[var(--color-surface)]"
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 768px) 50vw, 35vw"
                    placeholder="blur"
                    blurDataURL={BLUR_PLACEHOLDER}
                  />
                </motion.div>
              ))}
          </motion.div>
        </div>
      </Container>
    </Section>
  );
}
