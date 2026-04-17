"use client";

import { useState } from "react";
import { useReducedMotion } from "framer-motion";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";

const easeOut = [0, 0, 0.2, 1] as const;

export type FAQItem = {
  question: string;
  answer: string;
};

type FAQSectionProps = {
  label?: string;
  headline?: string;
  items: readonly FAQItem[];
};

function FAQRow({
  item,
  index,
  prefersReducedMotion,
}: {
  item: FAQItem;
  index: number;
  prefersReducedMotion: boolean | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{
        duration: 0.42,
        delay: index * (prefersReducedMotion ? 0.02 : 0.05),
        ease: easeOut,
      }}
      className="border-b border-black/[0.07] last:border-b-0"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-[1rem] font-medium leading-snug text-[#0c0c0c] md:text-[1.0625rem]">
          {item.question}
        </span>
        <span
          className={[
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-black/[0.12] transition-transform duration-200",
            open ? "rotate-45" : "",
          ].join(" ")}
          aria-hidden
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M5 1v8M1 5h8"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.1 : 0.22, ease: easeOut }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-[0.9375rem] leading-[1.65] text-[#525252]">
              {item.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FAQSection({
  label = "",
  headline,
  items,
}: FAQSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <Section
      id="faq"
      variant="default"
      className="relative scroll-mt-20 py-20 md:py-28 lg:py-32"
    >
      <Container>
        <motion.div
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="mx-auto max-w-[44rem] text-center"
        >
          {label && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#737373]">
              {label}
            </p>
          )}
          {headline && (
            <h2 className="mt-3 text-balance text-[1.75rem] font-medium leading-[1.15] tracking-tight text-[#0c0c0c] sm:text-[1.95rem] md:mt-4 md:text-[2.15rem] lg:text-[2.35rem]">
              {headline}
            </h2>
          )}
        </motion.div>

        <div className="mx-auto mt-12 max-w-[44rem] rounded-[20px] border border-black/[0.08] bg-white/[0.5] px-6 md:mt-14 md:px-8">
          {items.map((item, i) => (
            <FAQRow
              key={item.question}
              item={item}
              index={i}
              prefersReducedMotion={prefersReducedMotion}
            />
          ))}
        </div>
      </Container>
    </Section>
  );
}
