"use client";

import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { homepageContent } from "@/content/homepage";

const defaultContent = homepageContent.coreFeatures;

const easeOut = [0, 0, 0.2, 1] as const;

export type CoreFeatureId =
  | "profile"
  | "research"
  | "protocols"
  | "tracking"
  | "privacy";

export type CoreFeature = {
  id: CoreFeatureId;
  title: string;
  description: string;
  supporting: string;
  learnMore: readonly string[];
};

type CoreFeaturesSectionProps = {
  label?: string;
  headline?: string;
  intro?: string;
  features?: readonly CoreFeature[];
};

function FeatureVisual({ id }: { id: CoreFeatureId }) {
  const stroke = "rgba(12,12,12,0.14)";
  const soft = "rgba(12,12,12,0.06)";
  const text = "rgba(12,12,12,0.45)";
  const strong = "rgba(12,12,12,0.75)";

  switch (id) {
    case "profile":
      return (
        <svg viewBox="0 0 320 124" className="h-auto w-full" fill="none" aria-hidden>
          <rect x="0.5" y="0.5" width="319" height="123" rx="8" stroke={stroke} fill="#fafaf9" />
          <text x="12" y="22" fill={strong} fontSize="11" fontFamily="ui-sans-serif, system-ui, sans-serif">
            Health profile
          </text>
          <rect x="12" y="34" width="296" height="1" fill={soft} />
          {[
            { y: 48, label: "Sleep", w: 68 },
            { y: 68, label: "Cycle", w: 52 },
            { y: 88, label: "Energy", w: 84 },
            { y: 108, label: "Symptoms", w: 44 },
          ].map((row) => (
            <g key={row.label}>
              <text x="12" y={row.y} fill={text} fontSize="10" fontFamily="ui-sans-serif, system-ui, sans-serif">
                {row.label}
              </text>
              <rect x="88" y={row.y - 6} width="200" height="8" rx="2" fill={soft} />
              <rect x="88" y={row.y - 6} width={row.w} height="8" rx="2" fill="rgba(12,12,12,0.18)" />
            </g>
          ))}
        </svg>
      );
    case "research":
      return (
        <svg viewBox="0 0 320 124" className="h-auto w-full" fill="none" aria-hidden>
          <rect x="0.5" y="0.5" width="319" height="123" rx="8" stroke={stroke} fill="#fafaf9" />
          <text x="12" y="22" fill={strong} fontSize="11" fontFamily="ui-sans-serif, system-ui, sans-serif">
            Insights for you
          </text>
          <rect x="12" y="34" width="296" height="1" fill={soft} />
          <g>
            <rect x="12" y="44" width="145" height="66" rx="6" stroke={stroke} fill="#fff" />
            <rect x="12" y="44" width="4" height="66" rx="2" fill="rgba(12,12,12,0.2)" />
            <rect x="24" y="54" width="100" height="5" rx="1" fill={soft} />
            <rect x="24" y="66" width="120" height="4" rx="1" fill={soft} />
            <rect x="24" y="78" width="90" height="4" rx="1" fill={soft} />
          </g>
          <g>
            <rect x="165" y="44" width="143" height="66" rx="6" stroke={stroke} fill="#fff" />
            <rect x="165" y="44" width="4" height="66" rx="2" fill="rgba(12,12,12,0.12)" />
            <rect x="177" y="54" width="90" height="5" rx="1" fill={soft} />
            <rect x="177" y="66" width="115" height="4" rx="1" fill={soft} />
            <rect x="177" y="78" width="70" height="4" rx="1" fill={soft} />
          </g>
        </svg>
      );
    case "protocols":
      return (
        <svg viewBox="0 0 320 124" className="h-auto w-full" fill="none" aria-hidden>
          <rect x="0.5" y="0.5" width="319" height="123" rx="8" stroke={stroke} fill="#fafaf9" />
          <text x="12" y="22" fill={strong} fontSize="11" fontFamily="ui-sans-serif, system-ui, sans-serif">
            Protocols
          </text>
          <rect x="12" y="34" width="296" height="1" fill={soft} />
          <g>
            <rect x="220" y="46" width="80" height="18" rx="6" fill="rgba(12,12,12,0.08)" stroke={stroke} />
            <text x="236" y="58" fill={strong} fontSize="9" fontFamily="ui-sans-serif, system-ui, sans-serif">
              Active
            </text>
          </g>
          {[
            { y: 48, on: true },
            { y: 72, on: true },
            { y: 96, on: false },
          ].map((row, i) => (
            <g key={i}>
              <circle
                cx="22"
                cy={row.y}
                r="5"
                stroke={row.on ? strong : stroke}
                fill={row.on ? "rgba(12,12,12,0.15)" : "none"}
              />
              {row.on && (
                <path
                  d={`M19 ${row.y} l2 2 4-4`}
                  stroke={strong}
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  fill="none"
                />
              )}
              <rect x="36" y={row.y - 5} width={i === 0 ? 140 : i === 1 ? 160 : 120} height="10" rx="2" fill={soft} />
            </g>
          ))}
        </svg>
      );
    case "tracking":
      return (
        <svg viewBox="0 0 320 124" className="h-auto w-full" fill="none" aria-hidden>
          <rect x="0.5" y="0.5" width="319" height="123" rx="8" stroke={stroke} fill="#fafaf9" />
          <text x="12" y="22" fill={strong} fontSize="11" fontFamily="ui-sans-serif, system-ui, sans-serif">
            Tracking
          </text>
          <rect x="12" y="34" width="296" height="1" fill={soft} />
          <path
            d="M24 92 L56 78 L92 86 L124 62 L156 70 L188 52 L220 58 L252 44 L284 50"
            stroke="rgba(12,12,12,0.35)"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {[
            [56, 78],
            [124, 62],
            [188, 52],
            [284, 50],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="3" fill="rgba(12,12,12,0.4)" />
          ))}
          <rect x="24" y="100" width="36" height="4" rx="1" fill={soft} />
          <rect x="68" y="100" width="36" height="4" rx="1" fill={soft} />
          <text
            x="240"
            y="108"
            fill={text}
            fontSize="8"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            14d
          </text>
        </svg>
      );
    case "privacy":
      return (
        <svg viewBox="0 0 320 124" className="h-auto w-full" fill="none" aria-hidden>
          <rect x="0.5" y="0.5" width="319" height="123" rx="8" stroke={stroke} fill="#fafaf9" />
          <text x="12" y="22" fill={strong} fontSize="11" fontFamily="ui-sans-serif, system-ui, sans-serif">
            Privacy
          </text>
          <rect x="12" y="34" width="296" height="1" fill={soft} />
          <g transform="translate(12, 52)">
            <rect x="0" y="4" width="44" height="22" rx="11" fill="rgba(12,12,12,0.2)" />
            <circle cx="33" cy="15" r="9" fill="#fff" stroke={stroke} />
            <text x="56" y="19" fill={strong} fontSize="11" fontFamily="ui-sans-serif, system-ui, sans-serif">
              Private mode
            </text>
          </g>
          <rect x="12" y="88" width="160" height="8" rx="2" fill={soft} />
          <rect x="12" y="104" width="120" height="8" rx="2" fill={soft} />
        </svg>
      );
    default:
      return null;
  }
}

function FeatureCard({
  feature,
  index,
  prefersReducedMotion,
}: {
  feature: CoreFeature;
  index: number;
  prefersReducedMotion: boolean | null;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: easeOut }}
      className={[
        "flex h-full flex-col rounded-[20px] border border-black/[0.08] bg-white/[0.5] p-5 shadow-[0_1px_0_rgba(0,0,0,0.03)] transition-[border-color,box-shadow,transform] duration-200 hover:border-black/[0.14] hover:shadow-[0_12px_40px_rgba(0,0,0,0.07)] md:p-6",
        !prefersReducedMotion && "lg:hover:-translate-y-0.5",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="mb-5 overflow-hidden rounded-[14px] border border-black/[0.06] bg-[#f5f5f4] px-2 py-2 md:px-3 md:py-3">
        <FeatureVisual id={feature.id} />
      </div>

      <h3 className="text-lg font-semibold leading-snug tracking-tight text-[#0c0c0c] md:text-[1.125rem]">
        {feature.title}
      </h3>

      <p className="mt-3 text-[0.9375rem] leading-[1.6] text-[#404040]">{feature.description}</p>

      <p className="mt-2 text-[0.8125rem] leading-[1.55] text-[#737373] md:text-[0.84375rem]">
        {feature.supporting}
      </p>

      <details className="group/details mt-auto border-t border-black/[0.06] pt-4">
        <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 text-left text-sm font-medium text-[#404040] [&::-webkit-details-marker]:hidden">
          <span className="underline decoration-black/25 decoration-dotted underline-offset-4">
            Learn more
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="shrink-0 text-[#737373] transition-transform duration-200 group-open/details:rotate-180"
            aria-hidden
          >
            <path
              d="M4 6l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </summary>
        <ul className="mt-3 space-y-2.5 text-[0.8125rem] leading-[1.5] text-[#525252]">
          {feature.learnMore.map((line) => (
            <li
              key={line}
              className="relative pl-4 before:absolute before:left-0 before:top-[0.5em] before:h-1 before:w-1 before:rounded-full before:bg-[#c4c4c4]"
            >
              {line}
            </li>
          ))}
        </ul>
      </details>
    </motion.article>
  );
}

export function CoreFeaturesSection({
  label = defaultContent.label,
  headline = defaultContent.headline,
  intro = defaultContent.intro,
  features = defaultContent.features,
}: CoreFeaturesSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <Section
      id="core-features"
      variant="default"
      className="scroll-mt-20 py-20 md:py-24 lg:py-28"
    >
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="max-w-[44rem]"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#737373]">
            {label}
          </p>
          <h2 className="mt-3 text-[1.65rem] font-medium leading-[1.15] tracking-tight text-[#0c0c0c] sm:text-[1.85rem] md:mt-4 md:text-[2rem] lg:text-[2.2rem]">
            {headline}
          </h2>
          <p className="mt-6 text-[1rem] leading-[1.65] text-[#404040] md:mt-7 md:text-[1.0625rem]">
            {intro}
          </p>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:mt-14 md:grid-cols-2 md:gap-7 lg:mt-16 lg:gap-8 xl:gap-10">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              index={index}
              prefersReducedMotion={prefersReducedMotion}
            />
          ))}
        </div>
      </Container>
    </Section>
  );
}
