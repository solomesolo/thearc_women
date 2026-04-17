"use client";

import Image from "next/image";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";

const easeOut = [0, 0, 0.2, 1] as const;

function fadeUp(delay = 0, reduced: boolean) {
  return {
    initial: { opacity: 0, y: reduced ? 0 : 12 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-50px" },
    transition: { duration: 0.55, delay, ease: easeOut },
  };
}

export default function HowArcWorksPage() {
  const reduced = useReducedMotion() ?? false;

  return (
    <main className="min-h-screen bg-[var(--background)]">

      {/* ── 1. HERO ──────────────────────────────────────────────────────── */}
      <section className="border-b border-black/[0.06] py-16 md:py-24 lg:py-28">
        <Container>
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
            {/* Mobile: text first */}
            <motion.div
              {...fadeUp(0, reduced)}
              className="order-1 lg:order-2"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#737373]">
                Transparency
              </p>
              <h1 className="mt-3 text-balance text-[2rem] font-medium leading-[1.1] tracking-tight text-[#0c0c0c] sm:text-[2.25rem] md:text-[2.5rem] lg:text-[2.75rem]">
                How The Arc works
              </h1>
              <p className="mt-5 max-w-[36rem] text-[1.0625rem] leading-[1.7] text-[#404040]">
                Understand how your health data is structured, how insights are generated, and how your privacy is protected.
              </p>
              <div className="mt-8">
                <Link
                  href="/survey"
                  className="inline-flex rounded-[14px] bg-[#0c0c0c] px-5 py-2.5 text-[0.9375rem] font-medium text-white transition-[filter] duration-[180ms] hover:brightness-[0.9]"
                >
                  Explore your health overview
                </Link>
              </div>
            </motion.div>

            {/* Image */}
            <motion.div
              {...fadeUp(0.06, reduced)}
              className="order-2 lg:order-1"
            >
              <div className="overflow-hidden rounded-[24px] border border-black/[0.08] bg-[#f5f5f3]">
                <Image
                  src="/images/background_image.avif"
                  alt="Health data structure and privacy — The Arc"
                  width={720}
                  height={540}
                  className="h-auto w-full object-cover"
                  priority
                />
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* ── 2. INTRO ─────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 lg:py-24">
        <Container>
          <motion.div
            {...fadeUp(0, reduced)}
            className="mx-auto max-w-[42rem] text-center"
          >
            <h2 className="text-balance text-[1.5rem] font-medium leading-[1.2] tracking-tight text-[#0c0c0c] sm:text-[1.625rem] md:text-[1.75rem]">
              The Arc helps you understand, organize, and act on your health data — in a structured and transparent way.
            </h2>
            <p className="mt-5 text-[1rem] leading-[1.7] text-[#525252] md:text-[1.0625rem]">
              It is designed to support awareness and decision-making, not to replace medical care.
            </p>
          </motion.div>
        </Container>
      </section>

      {/* ── 3. SCIENTIFIC FOUNDATION ─────────────────────────────────────── */}
      <section className="border-t border-black/[0.06] bg-[#fafaf9] py-16 md:py-20 lg:py-24">
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
            {/* Left */}
            <motion.div {...fadeUp(0, reduced)}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#737373]">
                Scientific foundation
              </p>
              <h2 className="mt-3 text-balance text-[1.625rem] font-medium leading-[1.15] tracking-tight text-[#0c0c0c] md:text-[1.875rem]">
                Built on publicly available medical guidelines
              </h2>
              <p className="mt-4 text-[0.9375rem] leading-[1.7] text-[#525252]">
                The Arc is built on publicly available medical guidelines, preventive care recommendations, and peer-reviewed research.
              </p>
              <p className="mt-3 text-[0.9375rem] leading-[1.7] text-[#525252]">
                We combine established screening recommendations, commonly monitored biomarkers, and structured interpretation frameworks.
              </p>
            </motion.div>

            {/* Right */}
            <motion.div {...fadeUp(0.08, reduced)} className="space-y-4">
              {[
                {
                  title: "What has already been checked",
                  body: "The Arc maps your existing data against known screening benchmarks to show what is already covered.",
                },
                {
                  title: "What may be missing or outdated",
                  body: "Gaps and overdue checks are surfaced clearly so nothing important is overlooked.",
                },
                {
                  title: "What could be worth discussing",
                  body: "Findings that may warrant a conversation with a healthcare professional are highlighted — not prescribed.",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  {...fadeUp(i * 0.06, reduced)}
                  className="rounded-[16px] border border-black/[0.08] bg-white p-5"
                >
                  <p className="text-[0.9375rem] font-semibold text-[#0c0c0c]">{item.title}</p>
                  <p className="mt-1.5 text-[0.875rem] leading-[1.65] text-[#525252]">{item.body}</p>
                </motion.div>
              ))}
              <p className="pt-1 text-[0.8125rem] leading-[1.55] text-[#a3a3a3]">
                All insights are presented in a simplified, structured format to support understanding.
              </p>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* ── 4. GUIDANCE — NOT DIAGNOSIS ──────────────────────────────────── */}
      <section className="py-16 md:py-20 lg:py-24">
        <Container>
          <motion.div {...fadeUp(0, reduced)} className="mx-auto max-w-[44rem] text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#737373]">
              Guidance, not diagnosis
            </p>
            <h2 className="mt-3 text-balance text-[1.625rem] font-medium leading-[1.15] tracking-tight text-[#0c0c0c] md:text-[1.875rem]">
              The Arc does not diagnose, treat, or provide medical advice
            </h2>
          </motion.div>

          <div className="mx-auto mt-10 grid max-w-[52rem] grid-cols-1 gap-5 sm:grid-cols-2 md:mt-12">
            {/* What The Arc does */}
            <motion.div
              {...fadeUp(0.04, reduced)}
              className="rounded-[20px] border border-black/[0.08] bg-white/[0.55] p-6 md:p-7"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                What The Arc does
              </p>
              <ul className="mt-5 space-y-3.5">
                {[
                  "Organizes your health information",
                  "Identifies potential gaps",
                  "Helps you understand possible next steps",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span
                      className="mt-[0.2em] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0c0c0c]/[0.06]"
                      aria-hidden
                    >
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none" className="text-[#0c0c0c]/[0.5]">
                        <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="text-[0.9375rem] leading-[1.6] text-[#404040]">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* What The Arc is not */}
            <motion.div
              {...fadeUp(0.1, reduced)}
              className="rounded-[20px] border border-black/[0.07] bg-[#fafaf9] p-6 md:p-7"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a3a3a3]">
                What The Arc is not
              </p>
              <ul className="mt-5 space-y-3.5">
                {[
                  "No diagnosis",
                  "No treatment recommendations",
                  "No replacement for a qualified healthcare professional",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span
                      className="mt-[0.2em] flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-black/[0.12]"
                      aria-hidden
                    >
                      <span className="h-px w-2.5 bg-black/[0.2]" />
                    </span>
                    <span className="text-[0.9375rem] leading-[1.6] text-[#737373]">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-[0.8125rem] leading-[1.55] text-[#a3a3a3]">
                Any medical decisions should always be made together with a qualified healthcare professional.
              </p>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* ── 5. DATA USAGE ────────────────────────────────────────────────── */}
      <section className="border-t border-black/[0.06] bg-[#fafaf9] py-16 md:py-20 lg:py-24">
        <Container>
          <motion.div {...fadeUp(0, reduced)} className="mx-auto max-w-[44rem]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#737373]">
              How your data is used
            </p>
            <h2 className="mt-3 text-balance text-[1.625rem] font-medium leading-[1.15] tracking-tight text-[#0c0c0c] md:text-[1.875rem]">
              You stay in control of your data at all times
            </h2>

            <ul className="mt-8 space-y-5">
              {[
                {
                  title: "Uploading documents is optional",
                  body: "You choose what to share. The Arc works without any uploads — they only add more context if you want.",
                },
                {
                  title: "Used only for your personal overview",
                  body: "Your data is used only to generate the insights and overview shown to you.",
                },
                {
                  title: "No selling or sharing for advertising",
                  body: "We do not sell or share your personal health data for advertising or commercial purposes.",
                },
              ].map((item, i) => (
                <motion.li
                  key={item.title}
                  {...fadeUp(i * 0.06, reduced)}
                  className="flex gap-4"
                >
                  <span
                    className="mt-[0.35em] h-2 w-2 shrink-0 rounded-full bg-[#0c0c0c]/[0.2]"
                    aria-hidden
                  />
                  <div>
                    <p className="text-[0.9375rem] font-semibold text-[#0c0c0c]">{item.title}</p>
                    <p className="mt-1 text-[0.9375rem] leading-[1.65] text-[#525252]">{item.body}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
            <p className="mt-7 text-[0.8125rem] leading-[1.55] text-[#a3a3a3]">
              We aim to process only what is necessary to provide the service.
            </p>
          </motion.div>
        </Container>
      </section>

      {/* ── 6. DATA SECURITY ─────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 lg:py-24">
        <Container>
          <motion.div {...fadeUp(0, reduced)} className="mx-auto max-w-[44rem] text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#737373]">
              Data security and privacy
            </p>
            <h2 className="mt-3 text-balance text-[1.625rem] font-medium leading-[1.15] tracking-tight text-[#0c0c0c] md:text-[1.875rem]">
              Protecting your data is a core priority
            </h2>
            <p className="mt-4 text-[0.9375rem] leading-[1.7] text-[#525252]">
              The Arc is designed with privacy-first principles from the ground up.
            </p>
          </motion.div>

          <div className="mx-auto mt-10 grid max-w-[56rem] grid-cols-1 gap-5 sm:grid-cols-3 md:mt-12 md:gap-6">
            {[
              {
                title: "Secure storage",
                body: "Data is stored securely with restricted access at every level.",
              },
              {
                title: "Restricted access",
                body: "Only the minimum necessary access is granted to internal systems and personnel.",
              },
              {
                title: "GDPR principles",
                body: "Systems are built with GDPR requirements in mind and continuously improved.",
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                {...fadeUp(i * 0.07, reduced)}
                className="rounded-[20px] border border-black/[0.08] bg-white/[0.55] p-6 shadow-[0_1px_0_rgba(0,0,0,0.03)]"
              >
                <p className="text-[0.9375rem] font-semibold text-[#0c0c0c]">{card.title}</p>
                <p className="mt-2 text-[0.9375rem] leading-[1.65] text-[#525252]">{card.body}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── 7. TRANSPARENCY ──────────────────────────────────────────────── */}
      <section className="border-t border-black/[0.06] bg-[#fafaf9] py-16 md:py-20 lg:py-24">
        <Container>
          <motion.div {...fadeUp(0, reduced)} className="mx-auto max-w-[44rem] text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#737373]">
              Transparency
            </p>
            <h2 className="mt-3 text-balance text-[1.625rem] font-medium leading-[1.15] tracking-tight text-[#0c0c0c] md:text-[1.875rem]">
              We believe that trust comes from clarity
            </h2>
          </motion.div>

          <ul className="mx-auto mt-10 max-w-[38rem] space-y-4">
            {[
              "Clearly explain how insights are generated",
              "Avoid hidden logic or opaque decision-making",
              "Communicate limitations openly",
            ].map((item, i) => (
              <motion.li
                key={item}
                {...fadeUp(i * 0.07, reduced)}
                className="flex items-start gap-4 rounded-[16px] border border-black/[0.08] bg-white p-5"
              >
                <span
                  className="mt-[0.2em] h-2 w-2 shrink-0 rounded-full bg-[#0c0c0c]/[0.25]"
                  aria-hidden
                />
                <span className="text-[0.9375rem] leading-[1.6] text-[#404040]">{item}</span>
              </motion.li>
            ))}
          </ul>
        </Container>
      </section>

      {/* ── 8. CLOSING CTA ───────────────────────────────────────────────── */}
      <section className="border-t border-black/[0.06] py-20 md:py-28 lg:py-32">
        <Container>
          <motion.div
            {...fadeUp(0, reduced)}
            className="mx-auto max-w-[40rem] text-center"
          >
            <h2 className="text-balance text-[1.75rem] font-medium leading-[1.15] tracking-tight text-[#0c0c0c] sm:text-[1.95rem] md:text-[2.1rem]">
              The Arc is here to help you stay informed, organized, and proactive
            </h2>
            <p className="mt-4 text-[1rem] leading-[1.7] text-[#525252] md:text-[1.0625rem]">
              So you can have more meaningful conversations about your health.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/survey"
                className="rounded-[14px] bg-[#0c0c0c] px-6 py-3 text-[0.9375rem] font-medium text-white transition-[filter] duration-[180ms] hover:brightness-[0.9]"
              >
                Get started
              </Link>
              <Link
                href="/"
                className="rounded-[14px] border border-black/[0.14] px-6 py-3 text-[0.9375rem] font-medium text-[#404040] transition-colors hover:bg-[#f5f5f4]"
              >
                Back to home
              </Link>
            </div>
          </motion.div>
        </Container>
      </section>

    </main>
  );
}
