"use client";

import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { homepageContent } from "@/content/homepage";

const defaultContent = homepageContent.actionLayer;
const easeOut = [0, 0, 0.2, 1] as const;

/* ── tiny SVG icons ──────────────────────────────────────────────────────── */
function IconPin() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className="shrink-0 text-[#737373]">
      <path d="M6 1a3 3 0 0 1 3 3c0 2-3 7-3 7S3 6 3 4a3 3 0 0 1 3-3Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
      <circle cx="6" cy="4" r="1" fill="currentColor" opacity="0.5"/>
    </svg>
  );
}
function IconHome() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className="shrink-0 text-[#737373]">
      <path d="M1 6l5-5 5 5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2.5 5v5.5h7V5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconDoc() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className="shrink-0 text-[#737373]">
      <rect x="2" y="1" width="8" height="10" rx="1.2" stroke="currentColor" strokeWidth="1.1"/>
      <path d="M4 4h4M4 6.5h4M4 9h2" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  );
}

type LabEntry = { name: string; price: string; address: string; note: string; mapsHref: string };
type HomeTestEntry = { name: string; price: string; descriptor: string; orderHref: string };

type ActionCard = {
  testName: string;
  statusBadge: string;
  sublabel: string;
  whyTitle: string;
  whyBody: string;
  labsTitle: string;
  labs: readonly LabEntry[];
  homeTitle: string;
  homeTests: readonly HomeTestEntry[];
  doctorTitle: string;
  doctorLines: readonly string[];
  mapsLabel: string;
  orderOnlineLabel: string;
  ctaBook: string;
  ctaBookHref: string;
  ctaOrder: string;
  ctaOrderHref: string;
  ctaPlanned: string;
  ctaDone: string;
};

type ActionLayerSectionProps = {
  label?: string;
  headline?: string;
  card?: ActionCard;
  microcopy?: string;
};

export function ActionLayerSection({
  label = defaultContent.label,
  headline = defaultContent.headline,
  card = defaultContent.card,
  microcopy = defaultContent.microcopy,
}: ActionLayerSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <Section
      id="action-layer"
      variant="default"
      className="relative scroll-mt-20 border-t border-black/[0.06] bg-[linear-gradient(180deg,#fafaf9_0%,var(--background)_18%)] py-20 md:py-28 lg:py-32"
    >
      <Container>
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="mx-auto max-w-[44rem] text-center"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#737373]">
            {label}
          </p>
          <h2 className="mt-3 text-balance text-[1.75rem] font-medium leading-[1.15] tracking-tight text-[#0c0c0c] sm:text-[1.95rem] md:mt-4 md:text-[2.15rem] lg:text-[2.35rem]">
            {headline}
          </h2>
        </motion.div>

        {/* Featured card */}
        <motion.div
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.08, ease: easeOut }}
          className="mx-auto mt-12 max-w-[56rem] overflow-hidden rounded-[24px] border border-black/[0.1] bg-white shadow-[0_4px_48px_rgba(0,0,0,0.08)] md:mt-14"
        >

          {/* ── Card header ─────────────────────────────────────────────── */}
          <div className="flex items-start justify-between gap-4 border-b border-black/[0.07] px-6 py-5 md:px-8 md:py-6">
            <div className="min-w-0">
              <h3 className="text-[1.25rem] font-semibold leading-snug tracking-tight text-[#0c0c0c] md:text-[1.375rem]">
                {card.testName}
              </h3>
              <p className="mt-1 text-[0.875rem] text-[#737373]">
                {card.sublabel}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-[#0c0c0c] px-3 py-1 text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-white">
              {card.statusBadge}
            </span>
          </div>

          {/* ── Why this matters now ─────────────────────────────────────── */}
          <div className="border-b border-black/[0.07] bg-[#fafaf9] px-6 py-5 md:px-8 md:py-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
              {card.whyTitle}
            </p>
            <p className="mt-2.5 max-w-[44rem] text-[0.9375rem] leading-[1.65] text-[#404040]">
              {card.whyBody}
            </p>
          </div>

          {/* ── Action columns ───────────────────────────────────────────── */}
          <div className="grid grid-cols-1 divide-y divide-black/[0.07] md:grid-cols-3 md:divide-x md:divide-y-0">

            {/* A: Book at a lab */}
            <div className="px-6 py-5 md:px-7 md:py-6">
              <div className="mb-4 flex items-center gap-2">
                <IconPin />
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                  {card.labsTitle}
                </p>
              </div>
              <div className="space-y-4">
                {card.labs.map((lab) => (
                  <div key={lab.name} className="rounded-[12px] border border-black/[0.07] bg-[#fafaf9] p-3.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[0.9375rem] font-semibold text-[#0c0c0c]">
                        {lab.name}
                      </span>
                      <span className="shrink-0 text-[0.9375rem] font-semibold text-[#0c0c0c]">
                        {lab.price}
                      </span>
                    </div>
                    <p className="mt-1 text-[0.8125rem] leading-snug text-[#737373]">
                      {lab.address}
                    </p>
                    {lab.note && (
                      <p className="mt-1 text-[0.75rem] font-medium text-[#a3a3a3]">
                        {lab.note}
                      </p>
                    )}
                    <Link
                      href={lab.mapsHref}
                      className="mt-2.5 inline-flex items-center gap-1 rounded-[8px] border border-black/[0.1] bg-white px-3 py-1.5 text-[0.8125rem] font-medium text-[#404040] transition-colors hover:bg-[#f0f0ef]"
                    >
                      {card.mapsLabel}
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* B: Home test */}
            <div className="px-6 py-5 md:px-7 md:py-6">
              <div className="mb-4 flex items-center gap-2">
                <IconHome />
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                  {card.homeTitle}
                </p>
              </div>
              <div className="space-y-4">
                {card.homeTests.map((test) => (
                  <div key={test.name} className="rounded-[12px] border border-black/[0.07] bg-[#fafaf9] p-3.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[0.9375rem] font-semibold text-[#0c0c0c]">
                        {test.name}
                      </span>
                      <span className="shrink-0 text-[0.9375rem] font-semibold text-[#0c0c0c]">
                        {test.price}
                      </span>
                    </div>
                    <p className="mt-1 text-[0.8125rem] leading-snug text-[#737373]">
                      {test.descriptor}
                    </p>
                    <Link
                      href={test.orderHref}
                      className="mt-2.5 inline-flex items-center gap-1 rounded-[8px] border border-black/[0.1] bg-white px-3 py-1.5 text-[0.8125rem] font-medium text-[#404040] transition-colors hover:bg-[#f0f0ef]"
                    >
                      {card.orderOnlineLabel}
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* C: Doctor / insurance */}
            <div className="px-6 py-5 md:px-7 md:py-6">
              <div className="mb-4 flex items-center gap-2">
                <IconDoc />
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                  {card.doctorTitle}
                </p>
              </div>
              <ul className="space-y-3">
                {card.doctorLines.map((line, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span
                      className="mt-[0.35em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#c4c4c4]"
                      aria-hidden
                    />
                    <span className="text-[0.9375rem] leading-[1.6] text-[#404040]">
                      {line}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── CTA row ─────────────────────────────────────────────────── */}
          <div className="border-t border-black/[0.07] bg-[#fafaf9] px-6 py-4 md:px-8">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={card.ctaBookHref}
                className="rounded-[10px] bg-[#0c0c0c] px-4 py-2.5 text-[0.875rem] font-medium text-white transition-[filter] duration-[180ms] hover:brightness-[0.9]"
              >
                {card.ctaBook}
              </Link>
              <Link
                href={card.ctaOrderHref}
                className="rounded-[10px] border border-black/[0.14] bg-white px-4 py-2.5 text-[0.875rem] font-medium text-[#0c0c0c] transition-colors hover:bg-[#f5f5f4]"
              >
                {card.ctaOrder}
              </Link>
              <button
                type="button"
                className="rounded-[10px] border border-black/[0.1] bg-white px-4 py-2.5 text-[0.875rem] text-[#737373] transition-colors hover:bg-[#f5f5f4] hover:text-[#404040]"
              >
                {card.ctaPlanned}
              </button>
              <button
                type="button"
                className="rounded-[10px] border border-black/[0.1] bg-white px-4 py-2.5 text-[0.875rem] text-[#737373] transition-colors hover:bg-[#f5f5f4] hover:text-[#404040]"
              >
                {card.ctaDone}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Compliance note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-20px" }}
          transition={{ duration: 0.4, delay: 0.15, ease: easeOut }}
          className="mx-auto mt-7 max-w-[44rem] text-center text-[0.8125rem] leading-[1.55] text-[#a3a3a3]"
        >
          {microcopy}
        </motion.p>
      </Container>
    </Section>
  );
}
