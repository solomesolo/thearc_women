import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalPageLayout,
  LegalSection,
  LegalParagraph,
  LegalList,
} from "@/components/legal/LegalPageLayout";
import { termsContent } from "@/content/legal/terms";

export const metadata: Metadata = {
  title: "Terms of Service | The Arc",
  description: "Terms of Service for The Arc.",
};

export default function TermsPage() {
  const { title, lastUpdated, intro, sections } = termsContent;

  return (
    <LegalPageLayout title={title} lastUpdated={lastUpdated}>
      {intro.map((p, i) => (
        <LegalParagraph key={i}>{p}</LegalParagraph>
      ))}

      {sections.map((section) => (
        <LegalSection key={section.id} heading={section.heading}>
          <LegalParagraph>{section.body}</LegalParagraph>
          {section.list && <LegalList items={section.list} />}
        </LegalSection>
      ))}

      <p className="pt-4 text-sm text-[var(--text-secondary)]">
        <Link href="/" className="underline hover:text-[var(--text-primary)]">
          ← Back to home
        </Link>
      </p>
    </LegalPageLayout>
  );
}
