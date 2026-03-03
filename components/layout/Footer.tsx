import Link from "next/link";
import { Container } from "@/components/ui/Container";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--color-border-hairline)] bg-[var(--background)]">
      <Container className="py-10 md:py-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-[var(--text-secondary)]">
            © {currentYear} The Arc. All rights reserved.
          </p>
          <nav className="flex flex-wrap gap-6" aria-label="Footer">
            <Link
              href="/knowledge"
              className="text-sm text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)]"
            >
              Knowledge Hub
            </Link>
            <Link
              href="/assessment"
              className="text-sm text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)]"
            >
              Assessment
            </Link>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
