import Link from "next/link";
import { Container } from "@/components/ui/Container";

const CONTACT_EMAIL = "info@thearcwomen.com";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--color-border-hairline)] bg-[var(--background)]">
      <Container className="py-10 md:py-12">
        <div className="flex flex-col gap-6">
          <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
            <Link
              href="/blog"
              className="text-sm text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)]"
            >
              Blog
            </Link>
            <Link
              href="/survey"
              className="text-sm text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)]"
            >
              Get My Personalized Health Map
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)]"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)]"
            >
              Terms of Service
            </Link>
            <Link
              href="/cookies"
              className="text-sm text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)]"
            >
              Cookie Policy
            </Link>
            <Link
              href="/data-request"
              className="text-sm text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)]"
            >
              Data Request
            </Link>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-sm text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)]"
            >
              Contact
            </a>
          </nav>
          <p className="text-sm text-[var(--text-secondary)]">
            © {currentYear} The Arc. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
