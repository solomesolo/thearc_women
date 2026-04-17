"use client";

import { Fragment } from "react";
import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { homepageContent } from "@/content/homepage";

const defaultContent = homepageContent.mentalModel;

const easeOut = [0, 0, 0.2, 1] as const;

export type MentalModelPillar = {
  title: string;
  sublabel: string;
};

type MentalModelSectionProps = {
  label?: string;
  headline?: string;
  positioningIntro?: string;
  positioningEmphasis?: string;
  shorthand?: string;
  shorthandNote?: string;
  supportingLead?: string;
  supportingActions?: readonly string[];
  supportingClosing?: string;
  pillarsCaption?: string;
  pillars?: readonly MentalModelPillar[];
};

function PillarCard({
  pillar,
  prefersReducedMotion,
}: {
  pillar: MentalModelPillar;
  prefersReducedMotion: boolean | null;
}) {
  const hover =
    !prefersReducedMotion &&
    "hover:border-black/[0.14] hover:bg-white/[0.85] hover:shadow-[0_10px_36px_rgba(0,0,0,0.06)]";
  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.48, ease: easeOut }}
      className={[
        "flex h-full flex-col rounded-[18px] border border-black/[0.08] bg-white/[0.6] px-5 py-5 shadow-[0_1px_0_rgba(0,0,0,0.03)] transition-[border-color,background-color,box-shadow] duration-200 md:px-6 md:py-6",
        hover || "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <p className="text-[0.9375rem] font-semibold leading-snug tracking-tight text-[#0c0c0c] md:text-base">
        {pillar.title}
      </p>
      <p className="mt-2 text-[0.8125rem] leading-[1.45] text-[#737373] md:text-[0.84375rem]">
        {pillar.sublabel}
      </p>
    </motion.div>
  );
}

export function MentalModelSection({
  label = defaultContent.label,
  headline = defaultContent.headline,
  positioningIntro = defaultContent.positioningIntro,
  positioningEmphasis = defaultContent.positioningEmphasis,
  shorthand = defaultContent.shorthand,
  shorthandNote = defaultContent.shorthandNote,
  supportingLead = defaultContent.supportingLead,
  supportingActions = defaultContent.supportingActions,
  supportingClosing = defaultContent.supportingClosing,
  pillarsCaption = defaultContent.pillarsCaption,
  pillars = defaultContent.pillars,
}: MentalModelSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const pillarsList = pillars;

  return (
    <Section
      id="mental-model"
      variant="default"
      className="scroll-mt-20 border-t border-black/[0.05] bg-[linear-gradient(180deg,var(--background)_0%,#fafaf9_45%,var(--background)_100%)] py-20 md:py-24 lg:py-28"
    >
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: easeOut }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#737373]">
              {label}
            </p>
            <h2 className="mt-3 text-[1.65rem] font-medium leading-[1.15] tracking-tight text-[#0c0c0c] sm:text-[1.85rem] md:mt-4 md:text-[2rem] lg:text-[2.15rem]">
              {headline}
            </h2>
          </motion.div>

          <motion.div
            className="mt-8 md:mt-10"
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.06, ease: easeOut }}
          >
            <div className="rounded-[20px] border border-black/[0.08] bg-white/[0.65] px-6 py-6 text-left shadow-[0_1px_0_rgba(0,0,0,0.03)] md:px-8 md:py-8">
              <p className="text-[0.9375rem] font-medium text-[#525252] md:text-[0.96875rem]">
                {positioningIntro}
              </p>
              <p className="mt-4 text-[1.1rem] font-medium leading-[1.45] tracking-tight text-[#0c0c0c] md:text-[1.2rem] md:leading-[1.4]">
                {positioningEmphasis}
              </p>
              <p className="mt-4 text-center text-[0.75rem] leading-[1.4] text-[#a3a3a3] md:text-[0.8125rem]">
                <span className="font-medium text-[#737373]">{shorthandNote}</span>
                <span className="mx-2 text-black/20" aria-hidden>
                  ·
                </span>
                <span className="text-[#525252]">{shorthand}</span>
              </p>
            </div>
          </motion.div>

          <motion.div
            className="mt-9 text-left md:mt-10"
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.48, delay: 0.1, ease: easeOut }}
          >
            <p className="text-[1rem] leading-[1.65] text-[#404040] md:text-[1.0625rem]">
              {supportingLead}
            </p>
            <ul className="mt-4 space-y-2.5 text-[0.9375rem] leading-[1.55] text-[#404040] md:text-[0.96875rem]">
              {supportingActions.map((item) => (
                <li
                  key={item}
                  className="relative pl-5 before:absolute before:left-0 before:top-[0.55em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#d4d4d4]"
                >
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm font-medium text-[#525252] md:mt-7 md:text-[0.9375rem]">
              {supportingClosing}
            </p>
          </motion.div>
        </div>

        <motion.div
          className="mx-auto mt-14 max-w-5xl md:mt-16 lg:mt-20"
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.52, delay: 0.06, ease: easeOut }}
        >
          <p className="mb-5 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#737373] md:mb-6">
            {pillarsCaption}
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:flex xl:items-stretch xl:gap-0">
            {pillarsList.map((pillar, i) => (
              <Fragment key={pillar.title}>
                <div
                  className={
                    i === pillarsList.length - 1
                      ? "min-w-0 md:col-span-2 md:mx-auto md:max-w-md xl:mx-0 xl:max-w-none xl:flex-1"
                      : "min-w-0 xl:flex-1"
                  }
                >
                  <PillarCard pillar={pillar} prefersReducedMotion={prefersReducedMotion} />
                </div>
                {i < pillarsList.length - 1 && (
                  <div
                    className="hidden shrink-0 items-center justify-center xl:flex xl:w-12"
                    aria-hidden
                  >
                    <span className="select-none text-2xl font-light leading-none text-black/[0.12] xl:translate-y-1">
                      +
                    </span>
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        </motion.div>
      </Container>
    </Section>
  );
}
