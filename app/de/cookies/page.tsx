import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalPageLayout,
  LegalSection,
  LegalParagraph,
} from "@/components/legal/LegalPageLayout";
import { cookiesDeContent } from "@/content/legal/cookies.de";

export const metadata: Metadata = {
  title: "Cookie-Richtlinie | The Arc",
  description: "Cookie-Richtlinie von The Arc.",
};

export default function CookiesDEPage() {
  const { title, intro, sections } = cookiesDeContent;

  return (
    <LegalPageLayout title={title}>
      {intro.map((p, i) => (
        <LegalParagraph key={i}>{p}</LegalParagraph>
      ))}
      {sections.map((section, i) => (
        <LegalSection key={i} heading={section.heading}>
          {"subsections" in section && section.subsections ? (
            <div className="space-y-6">
              {section.subsections.map((sub, j) => (
                <div key={j}>
                  <p className="font-medium text-[var(--text-primary)]">{sub.heading}</p>
                  <LegalParagraph>{sub.body}</LegalParagraph>
                </div>
              ))}
            </div>
          ) : (
            "body" in section && <LegalParagraph>{section.body}</LegalParagraph>
          )}
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
