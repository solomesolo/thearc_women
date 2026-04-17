"use client";

import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";

const easeOut = [0, 0, 0.2, 1] as const;

export type PricingPlan = {
  name: string;
  price: string;
  period: string;
  description: string;
  features: readonly string[];
  ctaLabel: string;
  ctaHref: string;
  highlight: boolean;
  badge: string;
};

type PricingSectionProps = {
  label?: string;
  headline?: string;
  subheadline?: string;
  plans: readonly PricingPlan[];
};

export function PricingSection({
  label = "",
  headline,
  subheadline,
  plans,
}: PricingSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <Section
      id="pricing"
      variant="default"
      className="relative scroll-mt-20 border-t border-black/[0.06] bg-[linear-gradient(180deg,#fafaf9_0%,var(--background)_20%)] py-20 md:py-28 lg:py-32"
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
          {subheadline && (
            <p className="mt-4 text-[1rem] leading-[1.65] text-[#525252] md:text-[1.0625rem]">
              {subheadline}
            </p>
          )}
        </motion.div>

        <div className="mx-auto mt-12 grid max-w-[60rem] grid-cols-1 gap-5 md:mt-14 md:grid-cols-3 md:gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.5,
                delay: i * (prefersReducedMotion ? 0.03 : 0.08),
                ease: easeOut,
              }}
              className={[
                "relative flex flex-col rounded-[20px] border p-6 md:p-7",
                plan.highlight
                  ? "border-black/[0.14] bg-[#0c0c0c]"
                  : "border-black/[0.08] bg-white/[0.5]",
              ].join(" ")}
            >
              {/* Badge */}
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#0c0c0c] px-3.5 py-1 text-[0.75rem] font-semibold tracking-[0.08em] text-white shadow-[0_2px_8px_rgba(0,0,0,0.18)]">
                  {plan.badge}
                </span>
              )}

              <p
                className={[
                  "text-[11px] font-semibold uppercase tracking-[0.16em]",
                  plan.highlight ? "text-white/[0.4]" : "text-[#737373]",
                ].join(" ")}
              >
                {plan.name}
              </p>

              <div className="mt-4 flex items-baseline gap-1">
                <span
                  className={[
                    "font-mono text-[2.25rem] font-semibold leading-none tabular-nums",
                    plan.highlight ? "text-white" : "text-[#0c0c0c]",
                  ].join(" ")}
                >
                  {plan.price}
                </span>
                {plan.period && (
                  <span
                    className={[
                      "text-[0.875rem]",
                      plan.highlight ? "text-white/[0.5]" : "text-[#737373]",
                    ].join(" ")}
                  >
                    {plan.period}
                  </span>
                )}
              </div>

              <p
                className={[
                  "mt-1.5 text-[0.8125rem]",
                  plan.highlight ? "text-white/[0.4]" : "text-[#a3a3a3]",
                ].join(" ")}
              >
                {plan.description}
              </p>

              <ul
                className={[
                  "mt-6 flex-1 space-y-3 border-t pt-5",
                  plan.highlight ? "border-white/[0.1]" : "border-black/[0.07]",
                ].join(" ")}
              >
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <span
                      className={[
                        "mt-[0.3em] flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                        plan.highlight ? "bg-white/[0.15]" : "bg-black/[0.06]",
                      ].join(" ")}
                      aria-hidden
                    >
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path
                          d="M1 3l1.8 2L7 1"
                          stroke={plan.highlight ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.45)"}
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span
                      className={[
                        "text-[0.9375rem] leading-[1.55]",
                        plan.highlight ? "text-white/[0.75]" : "text-[#404040]",
                      ].join(" ")}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaHref}
                className={[
                  "mt-7 flex items-center justify-center rounded-[12px] px-5 py-3 text-[0.9375rem] font-medium transition-[filter,background-color] duration-[180ms]",
                  plan.highlight
                    ? "bg-white text-[#0c0c0c] hover:brightness-[0.95]"
                    : "border border-black/[0.12] bg-[#0c0c0c] text-white hover:brightness-[0.9]",
                ].join(" ")}
              >
                {plan.ctaLabel}
              </Link>
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
