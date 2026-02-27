"use client";

import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { homepageContent } from "@/content/homepage";

const defaultContent = homepageContent.productIntro;

const easeOut = [0, 0, 0.2, 1] as const;

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZThlNmU0Ii8+PC9zdmc+";

type ProductIntroSectionProps = {
  headline?: string;
  lead?: string;
  items?: readonly string[];
  closingLines?: readonly string[];
  uiImageSrc?: string;
  uiImageAlt?: string;
};

export function ProductIntroSection({
  headline = defaultContent.headline,
  lead = defaultContent.lead,
  items = defaultContent.items,
  closingLines = defaultContent.closingLines,
  uiImageSrc = defaultContent.uiImageSrc,
  uiImageAlt = defaultContent.uiImageAlt,
}: ProductIntroSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: prefersReducedMotion ? 0.06 : 0.1,
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
          transition: { duration: 0.5, ease: easeOut },
        },
      };

  const uiPreviewVariants = prefersReducedMotion
    ? {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { duration: 0.26, delay: 0.2 },
        },
      }
    : {
        hidden: { opacity: 0, y: 5 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.92,
            delay: 0.38,
            ease: easeOut,
          },
        },
      };

  return (
    <Section id="product" variant="default">
      <Container>
        <div className="grid grid-cols-1 gap-7 md:grid-cols-12 md:gap-8 md:items-start lg:gap-12 xl:gap-16">
          {/* Left column: copy — spans 6 */}
          <motion.div
            className="flex flex-col md:col-span-6"
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

            {/* Lead — 26–34px below headline */}
            <motion.p
              variants={itemVariants}
              className="mt-7 text-left text-base leading-[1.65] text-[var(--text-secondary)] md:mt-8 md:text-lg md:leading-[1.7]"
            >
              {lead}
            </motion.p>

            {/* Capability list — 18–24px below lead; 12–16px between; weight 500, primary */}
            <div className="mt-5 space-y-3 md:mt-6 md:space-y-4">
              {items.map((item, i) => (
                <motion.p
                  key={i}
                  variants={itemVariants}
                  className="text-left text-base font-medium leading-[1.52] text-[var(--text-primary)] md:text-lg md:leading-[1.55]"
                >
                  {item}
                </motion.p>
              ))}
            </div>

            {/* Negation block — 26–36px below list; 10–14px between; primary, decisive */}
            <div className="mt-7 space-y-2.5 md:mt-9 md:space-y-3">
              {closingLines.slice(0, 2).map((line, i) => (
                <motion.p
                  key={i}
                  variants={itemVariants}
                  className="text-left text-base font-medium leading-[1.55] tracking-tight text-[var(--text-primary)] md:text-lg md:leading-[1.6]"
                >
                  {line}
                </motion.p>
              ))}
            </div>

            {/* Final resolution line — 22–30px above; elevated */}
            {closingLines[2] && (
              <motion.p
                variants={itemVariants}
                className="mt-6 text-left text-base font-medium leading-[1.6] text-[var(--text-primary)] md:mt-8 md:text-lg md:leading-[1.65]"
              >
                {closingLines[2]}
              </motion.p>
            )}
          </motion.div>

          {/* Right column: visual — larger, vertically centered */}
          <div className="relative flex items-center md:col-span-6 md:col-start-7">
            {/* Optional: very faint tonal separation behind UI block only */}
            <div
              className="pointer-events-none absolute -inset-4 rounded-[26px] opacity-[0.04]"
              aria-hidden
              style={{
                background:
                  "radial-gradient(ellipse 70% 80% at 50% 50%, var(--foreground) 0%, transparent 70%)",
              }}
            />
            <motion.div
              className="relative min-h-[300px] w-full overflow-hidden rounded-[22px] border border-[#e6e4e2] md:min-h-[420px] lg:min-h-[460px]"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.45 }}
              variants={uiPreviewVariants}
              style={{
                background:
                  "linear-gradient(160deg, #ebe9e7 0%, #e4e2e0 50%, #e0dddb 100%)",
                boxShadow: "inset 0 1px 2px rgba(255,255,255,0.6), inset 0 -1px 1px rgba(0,0,0,0.04)",
              }}
            >
              <div className="relative h-full min-h-[300px] w-full md:min-h-[420px] lg:min-h-[460px]">
                <Image
                  src={uiImageSrc}
                  alt={uiImageAlt}
                  fill
                  className="object-cover object-center grayscale"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  placeholder="blur"
                  blurDataURL={BLUR_PLACEHOLDER}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
