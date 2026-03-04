"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/system/ScrollReveal";
import { PageFrame } from "@/components/layout/PageFrame";
import { Section } from "@/components/layout/Section";
import { labPage } from "@/content/lab";

const easeOut = [0, 0, 0.2, 1] as const;

/** Hero clinical image. Use .jpg when final lab detail asset is in place. */
const LAB_REPORT_DETAIL = "/images/lab-report-detail.svg";

export default function LabPage() {
  const [expandedProtocol, setExpandedProtocol] = useState<string | null>(null);
  const [selectedBiomarker, setSelectedBiomarker] = useState<string | null>(null);
  const [decisionOpen, setDecisionOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <PageFrame variant="standard">
        {/* Hero with clinical credibility image */}
        <Section noPadding divider={false}>
          <div className="content-hero-pt py-16 md:py-24">
            <section className="grid grid-cols-12 gap-16 md:items-center">
              <div className="col-span-12 md:col-span-6">
                <ScrollReveal className="content-reading-col">
                  <h1 className="text-4xl font-semibold tracking-tight text-[var(--text-primary)] md:text-5xl">
                    {labPage.hero.headline}
                  </h1>
                  <p className="mt-4 text-base leading-relaxed text-black/70 md:mt-6 md:text-lg">
                    {labPage.hero.subheadline}
                  </p>
                  <p className="mt-4 text-base leading-relaxed text-black/70 md:text-lg">
                    {labPage.hero.body}
                  </p>
                </ScrollReveal>
              </div>
              <div className="col-span-12 md:col-span-5 md:col-start-8">
                <ScrollReveal delay={0.1}>
                  <div className="transition-all duration-500 hover:-translate-y-[2px] hover:shadow-lg">
                    <Image
                      src={LAB_REPORT_DETAIL}
                      alt="Clinical lab detail"
                      width={520}
                      height={380}
                      className="w-full rounded-xl border border-black/5 object-cover"
                    />
                  </div>
                </ScrollReveal>
              </div>
            </section>
          </div>
        </Section>

        {/* Protocols: accordion (one open at a time) */}
        <Section title={labPage.protocols.title}>
          <div className="space-y-2">
            {labPage.protocols.cards.map((card) => {
              const isOpen = expandedProtocol === card.id;
              const copy = labPage.protocols.copy[card.id as keyof typeof labPage.protocols.copy];
              return (
                <ScrollReveal key={card.id}>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedProtocol(isOpen ? null : card.id)
                    }
                    className="w-full rounded-xl border border-black/10 bg-[var(--background)] px-5 py-4 text-left transition-colors hover:border-black/20"
                  >
                    <h3 className="text-lg font-medium text-[var(--text-primary)]">
                      {card.title}
                    </h3>
                    <motion.div
                      initial={false}
                      animate={{
                        height: isOpen ? "auto" : 0,
                        opacity: isOpen ? 1 : 0,
                      }}
                      transition={{ duration: 0.3, ease: easeOut }}
                      className="overflow-hidden"
                    >
                      <p className="pt-3 text-sm leading-relaxed text-black/70">
                        {copy}
                      </p>
                    </motion.div>
                  </button>
                </ScrollReveal>
              );
            })}
          </div>
          {/* Subscriber preview: locked card */}
          <div className="mt-8 rounded-2xl border border-black/10 bg-[var(--color-surface)]/50 p-6">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Example: Energy Regulation
            </p>
            <p className="mt-2 text-sm leading-relaxed text-black/70">
              Structured approaches to stabilize energy through timing, nutrition, and recovery. The framework adapts to your cycle phase and training load.
            </p>
            <Link
              href="/assessment"
              className="mt-4 inline-block rounded-lg border border-[var(--foreground)] bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)] no-underline transition-opacity hover:opacity-90"
            >
              Unlock implementation
            </Link>
          </div>
        </Section>

        {/* Biomarkers: accordion (one panel at a time) */}
        <Section title={labPage.biomarkers.title}>
          <div className="flex flex-wrap gap-3">
            {labPage.biomarkers.markers.map((m) => (
              <ScrollReveal key={m.id}>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedBiomarker(selectedBiomarker === m.id ? null : m.id)
                  }
                  className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                    selectedBiomarker === m.id
                      ? "border-[var(--text-primary)]/40 bg-[var(--color-surface)] text-[var(--text-primary)]"
                      : "border-black/10 bg-[var(--background)] text-black/70 hover:border-black/20 hover:text-[var(--text-primary)]"
                  }`}
                >
                  {m.name}
                </button>
              </ScrollReveal>
            ))}
          </div>
          {selectedBiomarker && labPage.biomarkers.panels[selectedBiomarker as keyof typeof labPage.biomarkers.panels] && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3, ease: easeOut }}
              className="content-reading-col mt-6 rounded-xl bg-[var(--color-surface)]/40 p-6"
            >
              {(() => {
                const p = labPage.biomarkers.panels[selectedBiomarker as keyof typeof labPage.biomarkers.panels];
                if (!p || typeof p !== "object" || !("reflects" in p)) return null;
                return (
                  <>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      What the marker reflects
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-black/70">
                      {p.reflects}
                    </p>
                    <p className="mt-4 text-sm font-medium text-[var(--text-primary)]">
                      Which systems it influences
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-black/70">
                      {p.influences}
                    </p>
                    <p className="mt-4 text-sm font-medium text-[var(--text-primary)]">
                      When clinicians investigate further
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-black/70">
                      {p.when}
                    </p>
                  </>
                );
              })()}
            </motion.div>
          )}
        </Section>

        {/* Tracking Frameworks: no borders on non-interactive blocks */}
        <Section title={labPage.tracking.title}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              labPage.tracking.daily,
              labPage.tracking.weekly,
              labPage.tracking.monthly,
            ].map((block, i) => (
              <ScrollReveal key={block.label} delay={i * 0.08}>
                <div className="rounded-xl bg-[var(--background)] p-6">
                  <h3 className="text-sm font-medium uppercase tracking-wider text-black/60">
                    {block.label}
                  </h3>
                  <ul className="mt-4 space-y-2">
                    {block.items.map((item) => (
                      <li key={item} className="text-base text-[var(--text-primary)]">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </Section>

        {/* Progress Dashboards: subscriber preview */}
        <Section title={labPage.dashboards.title} subtitle={labPage.dashboards.description}>
          <div className="rounded-2xl border border-black/10 bg-[var(--background)] p-6 md:p-8">
            <div className="space-y-6">
              {labPage.dashboards.metrics.slice(0, 2).map((metric, i) => (
                <div
                  key={metric}
                  className="relative flex h-12 items-center rounded-lg bg-[var(--color-surface)]/40"
                >
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{
                      duration: 0.7,
                      delay: i * 0.12,
                      ease: easeOut,
                    }}
                    style={{ originX: 0 }}
                    className="absolute inset-0 rounded-lg bg-[var(--color-surface)]"
                  />
                  <span className="relative z-10 px-4 text-sm font-medium text-[var(--text-primary)]">
                    {metric}
                  </span>
                </div>
              ))}
            </div>
            <Link
              href="/assessment"
              className="mt-6 inline-block rounded-lg border border-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] no-underline hover:bg-black/5"
            >
              Unlock implementation
            </Link>
          </div>
        </Section>

        {/* Decision Frameworks: accordion */}
        <Section title={labPage.decision.title}>
          <div className="content-reading-col">
            <button
              type="button"
              onClick={() => setDecisionOpen(!decisionOpen)}
              className="w-full rounded-xl border border-black/10 bg-[var(--background)] px-5 py-4 text-left text-base font-medium text-[var(--text-primary)] transition-colors hover:border-black/20"
            >
              {labPage.decision.question}
            </button>
            <motion.ul
              initial={false}
              animate={{
                height: decisionOpen ? "auto" : 0,
                opacity: decisionOpen ? 1 : 0,
              }}
              transition={{ duration: 0.3, ease: easeOut }}
              className="mt-3 overflow-hidden space-y-2 border-l-2 border-black/10 pl-4"
            >
              {labPage.decision.branches.map((branch) => (
                <li
                  key={branch}
                  className="text-sm leading-relaxed text-black/70"
                >
                  {branch}
                </li>
              ))}
            </motion.ul>
          </div>
        </Section>

        <Section divider className="pb-24 text-center md:pb-32">
          <ScrollReveal>
            <p className="text-xl font-semibold leading-snug text-[var(--text-primary)] md:text-2xl">
              {labPage.closing.line1}
            </p>
            <p className="mt-2 text-xl font-semibold leading-snug text-[var(--text-primary)] md:text-2xl">
              {labPage.closing.line2}
            </p>
            <Link
              href={labPage.closing.ctaHref}
              className="mt-8 inline-block rounded-[14px] border border-[var(--foreground)] bg-[var(--foreground)] px-6 py-3 text-sm font-medium text-[var(--background)] no-underline transition-opacity hover:opacity-90"
            >
              {labPage.closing.ctaLabel}
            </Link>
          </ScrollReveal>
        </Section>
      </PageFrame>
    </main>
  );
}
