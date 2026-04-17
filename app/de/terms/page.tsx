import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalPageLayout,
  LegalSection,
  LegalParagraph,
  LegalList,
} from "@/components/legal/LegalPageLayout";
import { termsDeContent } from "@/content/legal/terms.de";

export const metadata: Metadata = {
  title: "Nutzungsbedingungen | The Arc",
  description: "Nutzungsbedingungen von The Arc.",
};

export default function TermsDEPage() {
  const { title, lastUpdated, intro, sections } = termsDeContent;

  return (
    <LegalPageLayout title={title} lastUpdated={`Zuletzt aktualisiert: ${lastUpdated}`}>
      {intro.map((p, i) => (
        <LegalParagraph key={i}>{p}</LegalParagraph>
      ))}
      {sections.map((section) => (
        <LegalSection key={section.id} heading={section.heading}>
          <LegalParagraph>{section.body}</LegalParagraph>
          {"list" in section && section.list && <LegalList items={section.list} />}
        </LegalSection>
      ))}
      <p className="pt-4 text-sm text-[var(--text-secondary)]">
        <Link href="/de" className="underline hover:text-[var(--text-primary)]">
          Zur Startseite
        </Link>
      </p>
    </LegalPageLayout>
  );
}
