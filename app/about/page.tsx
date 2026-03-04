"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ScrollReveal } from "@/components/system/ScrollReveal";
import { PageFrame } from "@/components/layout/PageFrame";
import { Section } from "@/components/layout/Section";
import { EditorialImage } from "@/components/media/EditorialImage";
import { AboutHero } from "@/components/about/AboutHero";
import { AboutNodeDiagram } from "@/components/about/AboutNodeDiagram";
import { aboutPage } from "@/content/about";

type Step = { id: string; label: string; body: string };

function Section3Flow({ steps, closing }: { steps: Step[]; closing: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div ref={ref} className="relative">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4 md:gap-4">
        {steps.map((step, i) => (
          <div key={step.id} className="relative flex flex-col items-center">
            {i > 0 && (
              <motion.div
                className="absolute left-0 right-1/2 top-6 hidden h-[2px] bg-[var(--text-primary)]/20 md:block"
                initial={{ scaleX: 0 }}
                animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
                style={{ originX: 0 }}
              />
            )}
            {i < steps.length - 1 && (
              <motion.div
                className="absolute left-1/2 right-0 top-6 hidden h-[2px] bg-[var(--text-primary)]/20 md:block"
                initial={{ scaleX: 0 }}
                animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
                transition={{ duration: 0.5, delay: 0.25 + i * 0.15 }}
                style={{ originX: 0 }}
              />
            )}
            <ScrollReveal delay={i * 0.1}>
              <div className="relative z-10 w-full rounded-[16px] bg-[var(--background)] p-5">
                <span className="text-xs font-medium uppercase tracking-wider text-black/60">
                  {String(i + 1)}
                </span>
                <h3 className="mt-2 text-lg font-medium text-[var(--text-primary)]">
                  {step.label}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-black/70">
                  {step.body}
                </p>
              </div>
            </ScrollReveal>
          </div>
        ))}
      </div>
      <ScrollReveal>
        <p className="content-reading-col mt-8 text-base leading-relaxed text-black/70 md:text-lg">
          {closing}
        </p>
      </ScrollReveal>
    </div>
  );
}

function HighlightSentence({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0.6 }}
      animate={inView ? { opacity: 1 } : { opacity: 0.6 }}
      transition={{ duration: 0.5 }}
      className={`transition-colors duration-500 ${
        inView ? "border-l-2 border-[var(--text-primary)]/20 pl-4" : "border-l-2 border-transparent pl-4"
      } ${className ?? ""}`}
    >
      {children}
    </motion.div>
  );
}

const FOUNDER_PORTRAIT_SRC = "/images/photo-1696664754572-c8b52a7fa917.avif";

export default function AboutPage() {
  const [aboutNode, setAboutNode] = useState<string | null>(null);
  const [openDiscipline, setOpenDiscipline] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <PageFrame variant="standard">
        {/* Hero: text column (6) + system map (6) */}
        <Section noPadding divider={false}>
          <div className="content-hero-pt py-12 md:py-20 relative overflow-hidden">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.03]"
              aria-hidden
              style={{
                backgroundImage: `radial-gradient(circle at 20% 50%, var(--text-primary) 1px, transparent 1px),
                                 radial-gradient(circle at 80% 30%, var(--text-primary) 1px, transparent 1px),
                                 radial-gradient(circle at 40% 80%, var(--text-primary) 1px, transparent 1px)`,
                backgroundSize: "60px 60px",
              }}
            />
            <AboutHero
              h1={aboutPage.hero.h1}
              lead={aboutPage.hero.lead}
              proofPills={aboutPage.hero.proofPills}
              systemMap={{
                ...aboutPage.hero.systemMap,
                connections: aboutPage.hero.systemMap.connections as [string, string][],
              }}
            />
          </div>
        </Section>

        <Section title={aboutPage.section1.title}>
          <div className="grid grid-cols-12 gap-8 md:gap-12">
            <ScrollReveal className="col-span-12 md:col-span-6">
              <div className="content-reading-col mt-4 space-y-4 text-base leading-relaxed text-black/70 md:mt-6 md:text-lg md:space-y-5">
                {aboutPage.section1.left.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </ScrollReveal>
            <ScrollReveal className="col-span-12 md:col-span-6">
              <AboutNodeDiagram
                hoverPanel={aboutNode}
                onNodeHover={setAboutNode}
                onNodeLeave={() => setAboutNode(null)}
                panels={aboutPage.section1.nodePanels}
              />
            </ScrollReveal>
          </div>
        </Section>

        <Section title={aboutPage.section2.title} subtitle={aboutPage.section2.intro}>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {aboutPage.section2.disciplines.map((d) => {
              const isOpen = openDiscipline === d.id;
              return (
                <ScrollReveal key={d.id}>
                  <motion.button
                    type="button"
                    onClick={() => setOpenDiscipline(isOpen ? null : d.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.99 }}
                    className={`w-full rounded-[20px] border p-6 text-left transition-colors duration-300 ${
                      isOpen
                        ? "border-[var(--text-primary)]/25 bg-[var(--color-surface)]/50"
                        : "border-black/10 bg-[var(--background)] hover:border-black/20"
                    }`}
                  >
                    <h3 className="text-lg font-medium text-[var(--text-primary)]">
                      {d.name}
                    </h3>
                    {isOpen && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-3 text-sm leading-relaxed text-black/70"
                      >
                        {d.body}
                      </motion.p>
                    )}
                  </motion.button>
                </ScrollReveal>
              );
            })}
          </div>
          <ScrollReveal>
            <p className="content-reading-col mt-8 text-base leading-relaxed text-black/70 md:text-lg">
              {aboutPage.section2.closing}
            </p>
          </ScrollReveal>
        </Section>

        <Section title={aboutPage.section3.title} subtitle={aboutPage.section3.intro}>
          <Section3Flow steps={aboutPage.section3.steps} closing={aboutPage.section3.closing} />
        </Section>

        <Section title={aboutPage.section4.title}>
          <div className="content-reading-col mt-4 space-y-4 text-base leading-relaxed text-black/70 md:mt-6 md:text-lg md:space-y-5">
            {aboutPage.section4.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </Section>

        {/* Letter: divider above, portrait left, letter right, signature, divider below */}
        <Section title={aboutPage.letter.title}>
          <div className="border-t border-black/5 pt-8">
            <div className="grid grid-cols-12 gap-8 md:gap-12">
              <ScrollReveal className="col-span-12 md:col-span-6">
                <div className="content-reading-col">
                  <EditorialImage
                    src={FOUNDER_PORTRAIT_SRC}
                    alt={aboutPage.letter.portraitAlt}
                    ratio="4/5"
                    variant="portrait"
                    grain
                    className="max-w-[280px]"
                  />
                </div>
              </ScrollReveal>
              <div className="col-span-12 md:col-span-6">
                <div className="content-reading-col space-y-5 text-base leading-[1.85] text-[var(--text-primary)] md:text-lg">
                  {aboutPage.letter.paragraphs.slice(0, -2).map((p, i) => (
                    <HighlightSentence key={i}>
                      <p>{p}</p>
                    </HighlightSentence>
                  ))}
                </div>
                <div className="content-reading-col mt-8 pt-6 border-t border-black/5">
                  <p className="font-semibold text-[var(--text-primary)]">
                    {aboutPage.letter.paragraphs[aboutPage.letter.paragraphs.length - 2]}
                  </p>
                  <p className="mt-1 text-sm text-black/70">
                    {aboutPage.letter.paragraphs[aboutPage.letter.paragraphs.length - 1]}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-black/5 mt-10" />
        </Section>

        {/* Closing: partOfThis line, optional daughter image, then statement + CTA */}
        <Section divider className="pb-24 text-center md:pb-32">
          <ScrollReveal>
            <p className="content-reading-col text-base leading-relaxed text-black/70 md:text-lg">
              {aboutPage.closing.partOfThis}
            </p>
            <div className="content-reading-col mx-auto mt-8 flex justify-center">
              <EditorialImage
                src="/images/3.avif"
                alt="A small detail"
                ratio="3/2"
                variant="inline"
                grain
                className="w-full max-w-[240px]"
              />
            </div>
            <p className="content-reading-col mt-8 text-xl font-semibold leading-snug text-[var(--text-primary)] md:text-2xl">
              {aboutPage.closing.line1}
            </p>
            <p className="content-reading-col mt-2 text-xl font-semibold leading-snug text-[var(--text-primary)] md:text-2xl">
              {aboutPage.closing.line2}
            </p>
            <Link
              href={aboutPage.closing.ctaHref}
              className="mt-8 inline-block rounded-[14px] border border-[var(--foreground)] bg-transparent px-5 py-2.5 text-sm font-medium text-[var(--text-primary)] no-underline transition-colors hover:bg-black/5"
            >
              {aboutPage.closing.ctaLabel}
            </Link>
          </ScrollReveal>
        </Section>
      </PageFrame>
    </main>
  );
}
