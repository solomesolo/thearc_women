import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { AuthNav } from "@/components/layout/AuthNav";

export function Header() {
  return (
    <header className="border-b border-[var(--color-border-hairline)] bg-[var(--background)]">
      <Container className="flex h-16 items-center justify-between md:h-18">
        <Link
          href="/"
          className="text-lg font-medium tracking-tight text-[var(--text-primary)] no-underline hover:text-[var(--text-primary)]"
        >
          The Arc
        </Link>
        <nav className="flex items-center gap-6" aria-label="Main">
          <AuthNav />
          <Link
            href="/blog"
            className="text-sm text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)]"
          >
            Blog
          </Link>
          <Link
            href="/knowledge"
            className="text-sm text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)]"
          >
            Knowledge
          </Link>
          <Link
            href="/admin"
            className="text-sm text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)]"
          >
            Admin
          </Link>
          <Link
            href="/survey"
            className="text-sm text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)]"
          >
            Survey
          </Link>
          <Link
            href="/assessment"
            className="rounded-[14px] border border-[var(--foreground)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--text-primary)] no-underline transition-colors hover:bg-[var(--foreground)]/0.06"
          >
            Begin assessment
          </Link>
        </nav>
      </Container>
    </header>
  );
}
