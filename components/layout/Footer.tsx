"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "@/components/ui/Container";

const CONTACT_EMAIL = "info@thearcwomen.com";

// Legal links that have DE equivalents
const LEGAL_LINKS = [
  { href: "/privacy",      label: "Privacy Policy",    labelDE: "Datenschutz"        },
  { href: "/terms",        label: "Terms of Service",  labelDE: "Nutzungsbedingungen" },
  { href: "/cookies",      label: "Cookie Policy",     labelDE: "Cookie-Richtlinie"  },
  { href: "/data-request", label: "Data Request",      labelDE: "Datenschutzanfrage" },
];

const linkClass =
  "text-sm text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)]";

export function Footer() {
  const pathname = usePathname();
  const isDE = pathname.startsWith("/de");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--color-border-hairline)] bg-[var(--background)]">
      <Container className="py-10 md:py-12">
        <div className="flex flex-col gap-6">
          <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
            {/* Blog — always English */}
            <Link href="/blog" className={linkClass}>
              {isDE ? "Knowledge Base" : "Blog"}
            </Link>

            {/* Legal links — language-aware */}
            {LEGAL_LINKS.map(({ href, label, labelDE }) => (
              <Link
                key={href}
                href={isDE ? `/de${href}` : href}
                className={linkClass}
              >
                {isDE ? labelDE : label}
              </Link>
            ))}

            {/* Contact — same email, label translates */}
            <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
              {isDE ? "Kontakt" : "Contact"}
            </a>
          </nav>

          <p className="text-sm text-[var(--text-secondary)]">
            {isDE
              ? `© ${currentYear} The Arc. Alle Rechte vorbehalten.`
              : `© ${currentYear} The Arc. All rights reserved.`}
          </p>
        </div>
      </Container>
    </footer>
  );
}
