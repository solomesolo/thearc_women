import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalPageLayout,
  LegalSection,
  LegalParagraph,
  LegalList,
} from "@/components/legal/LegalPageLayout";
import { privacyContent } from "@/content/legal/privacy";

export const metadata: Metadata = {
  title: "Privacy Policy | The Arc",
  description:
    "Privacy Policy for The Arc. How we collect, use, and protect your personal information.",
};

function PrivacySection({
  section,
}: {
  section: (typeof privacyContent.sections)[number];
}) {
  const hasSubsections = "subsections" in section && section.subsections;

  if (hasSubsections && section.subsections) {
    return (
      <LegalSection heading={section.heading}>
        <LegalParagraph>{section.body}</LegalParagraph>
        <div className="mt-6 space-y-6">
          {section.subsections.map((sub, j) => (
            <div key={j}>
              <p className="font-medium text-[var(--text-primary)]">
                {sub.heading}
              </p>
              <LegalParagraph>{sub.body}</LegalParagraph>
              {sub.list && <LegalList items={sub.list} />}
              {sub.footer && <LegalParagraph>{sub.footer}</LegalParagraph>}
            </div>
          ))}
        </div>
      </LegalSection>
    );
  }

  return (
    <LegalSection heading={section.heading}>
      <LegalParagraph>
        {"body" in section ? section.body : ""}
      </LegalParagraph>
      {"list" in section && section.list && (
        <LegalList items={section.list} />
      )}
      {"footer" in section && section.footer && (
        <LegalParagraph>{section.footer}</LegalParagraph>
      )}
    </LegalSection>
  );
}

export default function PrivacyPage() {
  const { title, lastUpdated, intro, sections } = privacyContent;

  return (
    <LegalPageLayout title={title} lastUpdated={lastUpdated}>
      {intro.map((p, i) => (
        <LegalParagraph key={i}>{p}</LegalParagraph>
      ))}

      {sections.map((section) => (
        <PrivacySection key={section.id} section={section} />
      ))}

      <p className="pt-4 text-sm text-[var(--text-secondary)]">
        <Link href="/" className="underline hover:text-[var(--text-primary)]">
          Back to home
        </Link>
      </p>
    </LegalPageLayout>
  );
}
