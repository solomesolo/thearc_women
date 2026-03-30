"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { homepageContent } from "@/content/homepage";

type FounderMessageSectionProps = {
  label: string;
  headline: string;
  paragraphs: readonly string[];
  founderName: string;
  founderTitle: string;
  imageSrc: string;
  imageAlt: string;
};

const defaultContent = (homepageContent as any).founderMessage ?? {
  label: "FOUNDER'S NOTE",
  headline: "I’m building this for my mother, my daughter, and myself.",
  paragraphs: [
    "I first understood how much women’s health is dismissed when my mother developed cancer and did not get the right checkups in time. The treatment that followed was harder than it should have been.",
    "Now she is fighting cancer for the second time — again diagnosed late, again shaped by the belief that symptoms are only serious when they become unbearable.",
    "I’m building this product because women deserve better prevention, better context, and better reasons to pay attention earlier. That belief has shaped my work across healthtech, diagnostics, preventive medicine, and women’s health product development. For my mother. For my daughter. For me.",
  ],
  founderName: "Anna Solovyova",
  founderTitle: "Founder",
  // TODO: replace with final founder portrait asset
  imageSrc: "/images/founder-anna.jpg",
  imageAlt: "Portrait of Anna Solovyova",
};

export function FounderMessageSection({
  label = defaultContent.label,
  headline = defaultContent.headline,
  paragraphs = defaultContent.paragraphs,
  founderName = defaultContent.founderName,
  founderTitle = defaultContent.founderTitle,
  imageSrc = defaultContent.imageSrc,
  imageAlt = defaultContent.imageAlt,
}: FounderMessageSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  const easeOut = [0, 0, 0.2, 1] as const;

  const containerVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: prefersReducedMotion
        ? { duration: 0.4 }
        : { duration: 0.5, ease: easeOut },
    },
  };

  return (
    <Section id="founder" variant="default" className="py-20 md:py-24 lg:py-28">
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
        >
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-14 lg:gap-16 md:items-center">
            {/* Image left on desktop, top on mobile */}
            <div className="md:col-span-5">
              <div className="overflow-hidden rounded-[22px] md:rounded-[24px]">
                <Image
                  src={imageSrc}
                  alt={imageAlt}
                  width={700}
                  height={880}
                  className="h-full w-full object-cover"
                  priority={false}
                />
              </div>
            </div>

            {/* Text right */}
            <div className="md:col-span-7">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[rgba(0,0,0,0.55)]">
                {label}
              </p>
              <h2 className="mt-3 text-[1.9rem] font-semibold leading-[1.1] tracking-tight text-[var(--text-primary)] md:text-[2.25rem] lg:text-[2.5rem]">
                {headline}
              </h2>
              <div className="mt-6 space-y-4 md:space-y-4.5 max-w-[38.75rem]">
                {paragraphs.map((p, i) => (
                  <p
                    key={i}
                    className="text-[0.98rem] leading-[1.75] text-[rgba(0,0,0,0.78)] md:text-[1.05rem]"
                  >
                    {p}
                  </p>
                ))}
              </div>
              <div className="mt-6">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {founderName}
                </p>
                <p className="mt-0.5 text-[0.9rem] text-[rgba(0,0,0,0.6)]">
                  {founderTitle}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </Container>
    </Section>
  );
}

