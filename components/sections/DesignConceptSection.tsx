"use client";

import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { homepageContent } from "@/content/homepage";

const defaultContent = homepageContent.designConcept;

type DesignConceptSectionProps = {
  headline?: string;
  statValue?: string;
  statLabel?: string;
  contextParagraphs?: readonly string[];
  reframeLead?: string;
  reframeLines?: readonly string[];
  transitionLead?: string;
  transitionBody?: string;
  closingLine?: string;
};

export function DesignConceptSection({
  headline = defaultContent.headline,
  statValue = defaultContent.statValue,
  statLabel = defaultContent.statLabel,
  contextParagraphs = defaultContent.contextParagraphs,
  reframeLead = defaultContent.reframeLead,
  reframeLines = defaultContent.reframeLines,
  transitionLead = defaultContent.transitionLead,
  transitionBody = defaultContent.transitionBody,
  closingLine = defaultContent.closingLine,
}: DesignConceptSectionProps) {
  const bodyLines = [...contextParagraphs.filter(Boolean), reframeLead].filter(
    Boolean
  );

  return (
    <Section id="design-concept" variant="default" className="py-20 md:py-24">
      <Container>
        <div className="mx-auto max-w-[42rem] text-center">
          {/* Headline */}
          <p className="text-balance text-[2.5rem] font-medium leading-[1.1] tracking-tight text-[var(--text-primary)] md:text-[2.75rem] lg:text-[3.5rem] xl:text-[4rem]">
            {headline}
          </p>

          {/* Statistic */}
          <p className="mt-3 text-balance text-[2.5rem] font-medium leading-[1.1] tracking-tight text-[var(--text-primary)] md:text-[2.75rem] lg:text-[3.5rem] xl:text-[4rem]">
            {statValue}
          </p>
          <p className="mt-1.5 text-[0.9rem] leading-[1.6] text-[var(--text-secondary)] md:text-[0.95rem]">
            {statLabel}
          </p>

          {/* Body */}
          <div className="mt-5 space-y-2.5 md:mt-6 md:space-y-3">
            {bodyLines.map((line, idx) => (
              <p
                key={idx}
                className="text-[0.98rem] leading-[1.7] text-[var(--text-secondary)] md:text-[1.02rem] md:leading-[1.75]"
              >
                {line}
              </p>
            ))}
          </div>

          {/* Reframe emphasis lines */}
          <div className="mt-6 space-y-2.5 md:mt-7 md:space-y-3">
            {reframeLines.map((line, idx) => (
              <p
                key={idx}
                className="text-[1.02rem] leading-[1.7] text-[var(--text-primary)] md:text-[1.1rem] md:leading-[1.75]"
              >
                {line}
              </p>
            ))}
          </div>

          {/* Final lines */}
          <div className="mt-7 space-y-3 md:mt-9 md:space-y-3.5">
            <p className="text-[0.98rem] leading-[1.7] text-[var(--text-primary)] md:text-[1.02rem] md:leading-[1.75]">
              {transitionLead}
            </p>
            {transitionBody && (
              <p className="text-[0.98rem] leading-[1.7] text-[var(--text-secondary)] md:text-[1.02rem] md:leading-[1.75]">
                {transitionBody}
              </p>
            )}
            <p className="pt-1 text-[1.05rem] leading-[1.7] text-[var(--text-primary)] md:text-[1.15rem] md:leading-[1.8]">
              {closingLine}
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}

