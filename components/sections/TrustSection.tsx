"use client";

import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { homepageContent } from "@/content/homepage";

const defaultContent = homepageContent.trust;
const easeOut = [0, 0, 0.2, 1] as const;

type TrustSectionProps = {
  label?: string;
  headline?: string;
  items?: readonly string[];
  microcopy?: string;
};

export function TrustSection({
  label = defaultContent.label,
  headline = defaultContent.headline,
  items = defaultContent.items,
  microcopy = defaultContent.microcopy,
}: TrustSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <Section
      id="trust"
      variant="default"
      className="relative scroll-mt-20 border-t border-black/[0.06] bg-[linear-gradient(180deg,#fafaf9_0%,var(--background)_20%)] py-20 md:py-28 lg:py-32"
    >
      <Container>
        <motion.div
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="mx-auto max-w-[36rem] text-center"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#737373]">
            {label}
          </p>
          <h2 className="mt-3 text-balance text-[1.75rem] font-medium leading-[1.15] tracking-tight text-[#0c0c0c] sm:text-[1.95rem] md:mt-4 md:text-[2.15rem] lg:text-[2.35rem]">
            {headline}
          </h2>

          <ul className="mx-auto mt-10 max-w-[28rem] space-y-4 text-left md:mt-12">
            {items.map((item, i) => (
              <motion.li
                key={item}
                initial={{ opacity: 0, x: prefersReducedMotion ? 0 : -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{
                  duration: 0.42,
                  delay: i * (prefersReducedMotion ? 0.03 : 0.07),
                  ease: easeOut,
                }}
                className="flex items-center gap-3.5"
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0c0c0c]"
                  aria-hidden
                >
                  <svg
                    width="10"
                    height="8"
                    viewBox="0 0 10 8"
                    fill="none"
                    className="text-white"
                  >
                    <path
                      d="M1 4l2.5 2.5L9 1"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="text-[1rem] leading-[1.6] text-[#404040]">
                  {item}
                </span>
              </motion.li>
            ))}
          </ul>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-20px" }}
            transition={{ duration: 0.45, delay: 0.25, ease: easeOut }}
            className="mt-8 text-[0.875rem] leading-[1.55] text-[#737373] md:mt-10"
          >
            {microcopy}
          </motion.p>
        </motion.div>
      </Container>
    </Section>
  );
}
