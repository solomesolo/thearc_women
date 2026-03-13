"use client";

import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { homepageContent } from "@/content/homepage";

const defaultContent = (homepageContent as any).founderNote ?? {
  headline: "A note from the founder",
  paragraphs: [
    "The Arc was built out of frustration with how little existing systems explained the reality of women who are expected to perform at a high level, every day.",
    "I wanted a platform that treats female physiology as a performance system – something you can understand, anticipate, and work with, not around.",
    "This is not about chasing optimization for its own sake. It is about giving you a grounded, medically literate way to see what your body is doing, so your effort is matched by clarity.",
  ],
  signature: "Founder, The Arc",
};

type FounderNoteSectionProps = {
  headline?: string;
  paragraphs?: readonly string[];
  signature?: string;
};

export function FounderNoteSection({
  headline = defaultContent.headline,
  paragraphs = defaultContent.paragraphs,
  signature = defaultContent.signature,
}: FounderNoteSectionProps) {
  return (
    <Section id="founder-note" variant="default" className="py-16 md:py-20">
      <Container>
        <div className="mx-auto max-w-[40rem] rounded-[20px] border border-[var(--color-border-hairline)] bg-[var(--color-surface)]/70 px-6 py-7 md:rounded-[24px] md:px-8 md:py-9">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--text-secondary)]">
            {headline}
          </p>
          <div className="mt-3 space-y-2.5 md:mt-4 md:space-y-3">
            {paragraphs.map((line, i) => (
              <p
                key={i}
                className="text-sm leading-[1.7] text-[var(--text-primary)] md:text-[0.98rem]"
              >
                {line}
              </p>
            ))}
          </div>
          {signature && (
            <p className="mt-4 text-sm font-medium text-[var(--text-secondary)] md:mt-5">
              {signature}
            </p>
          )}
        </div>
      </Container>
    </Section>
  );
}

