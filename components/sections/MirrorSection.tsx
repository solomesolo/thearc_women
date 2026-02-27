"use client";

import { useState } from "react";
import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { homepageContent } from "@/content/homepage";

const defaultContent = homepageContent.mirror;

const easeOut = [0, 0, 0.2, 1] as const;

type MirrorColumn = {
  header: string;
  paragraphs: readonly string[];
};

type MirrorSlide = {
  id: string;
  tag: string;
  leftLabel: string;
  experience: string;
  columns: readonly MirrorColumn[];
};

type MirrorSectionProps = {
  headline?: string;
  slides?: readonly MirrorSlide[];
};

export function MirrorSection({
  headline = defaultContent.headline,
  slides = defaultContent.slides,
}: MirrorSectionProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const prefersReducedMotion = useReducedMotion();

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const collapseDuration = prefersReducedMotion ? 0.2 : 0.35;

  return (
    <Section id="mirror" variant="default">
      <Container>
        <div className="w-full text-left">
          <h2 className="max-w-[18em] text-balance text-[1.875rem] font-medium leading-[1.2] tracking-tight text-[var(--text-primary)] md:text-[2.5rem] md:leading-[1.15] lg:text-[3rem]">
            {headline}
          </h2>

          <div className="mt-10 space-y-0 md:mt-12">
            {slides.map((slide) => {
              const isOpen = openIds.has(slide.id);
              return (
                <section
                  key={slide.id}
                  className="border-t border-[rgba(12,12,12,0.06)]"
                >
                  <button
                    type="button"
                    onClick={() => toggle(slide.id)}
                    aria-expanded={isOpen}
                    aria-controls={`mirror-content-${slide.id}`}
                    id={`mirror-trigger-${slide.id}`}
                    className="flex w-full cursor-pointer items-baseline justify-between gap-4 py-6 text-left transition-colors hover:bg-[rgba(12,12,12,0.02)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)] md:py-8"
                  >
                    <p className="text-[0.85rem] font-medium tracking-[0.04em] text-[var(--text-primary)] md:text-[0.9rem]">
                      {slide.leftLabel}
                    </p>
                    <p className="text-[0.75rem] font-medium tracking-[0.12em] text-[var(--text-secondary)]">
                      {slide.tag}
                    </p>
                  </button>

                  <motion.div
                    id={`mirror-content-${slide.id}`}
                    role="region"
                    aria-labelledby={`mirror-trigger-${slide.id}`}
                    initial={false}
                    animate={{
                      height: isOpen ? "auto" : 0,
                      opacity: isOpen ? 1 : 0,
                    }}
                    transition={{
                      duration: collapseDuration,
                      ease: easeOut,
                    }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 gap-x-10 gap-y-8 pb-10 md:grid-cols-4 md:gap-x-10 md:pb-14 lg:gap-x-14">
                      <div className="md:col-span-1">
                        <p className="whitespace-pre-line text-[1rem] leading-[1.6] text-[var(--text-primary)] md:text-[1.0625rem] md:leading-[1.65]">
                          {slide.experience}
                        </p>
                      </div>
                      {slide.columns.map((column, idx) => (
                        <div
                          key={column.header}
                          className={`md:col-span-1 md:pl-6 ${
                            idx > 0
                              ? "md:border-l md:border-[rgba(12,12,12,0.08)]"
                              : ""
                          }`}
                        >
                          <h3 className="text-[0.78rem] font-medium uppercase tracking-[0.16em] text-[rgba(12,12,12,0.82)] md:text-[0.8rem]">
                            {column.header}
                          </h3>
                          <div className="mt-4 space-y-3.5 md:mt-5 md:space-y-4">
                            {column.paragraphs.map((para, i) => (
                              <p
                                key={i}
                                className="text-[0.95rem] leading-[1.7] text-[var(--text-secondary)] md:text-[1rem] md:leading-[1.75]"
                              >
                                {para}
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </section>
              );
            })}
          </div>
        </div>
      </Container>
    </Section>
  );
}
