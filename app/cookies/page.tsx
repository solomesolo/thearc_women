import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalPageLayout,
  LegalSection,
  LegalParagraph,
} from "@/components/legal/LegalPageLayout";
import { cookiesContent } from "@/content/legal/cookies";

export const metadata: Metadata = {
  title: "Cookie Policy | The Arc",
  description: "Cookie Policy for The Arc.",
};

export default function CookiesPage() {
  const { title, intro, sections } = cookiesContent;

  return (
    <LegalPageLayout title={title}>
      {intro.map((p, i) => (
        <LegalParagraph key={i}>{p}</LegalParagraph>
      ))}

      {sections.map((section, i) => (
        <LegalSection key={i} heading={section.heading}>
          {"subsections" in section && section.subsections ? (
            <div className="space-y-4">
              {section.subsections.map((sub, j) => (
                <div key={j}>
                  <p className="font-medium text-[var(--text-primary)]">{sub.heading}</p>
                  <LegalParagraph>{sub.body}</LegalParagraph>
                </div>
              ))}
            </div>
          ) : (
            <LegalParagraph>{section.body}</LegalParagraph>
          )}
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
