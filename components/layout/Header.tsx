import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { AuthNav } from "@/components/layout/AuthNav";
import { NotificationBell } from "@/components/layout/NotificationBell";

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
        <nav className="flex flex-1 flex-wrap items-center justify-end gap-4 md:gap-6" aria-label="Main">
          <Link
            href="/"
            className="text-sm text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)]"
          >
            Home
          </Link>
          <Link
            href="/system2"
            className="text-sm text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)]"
          >
            How The Arc works
          </Link>
          <Link
            href="/blog"
            className="text-sm text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)]"
          >
            Knowledge Base
          </Link>
          <Link
            href="/knowledge"
            className="text-sm text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)]"
          >
            My Health Dashboard
          </Link>
          <Link
            href="/plan"
            className="text-sm text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)]"
          >
            My Plan
          </Link>
          <NotificationBell />
          <AuthNav />
          <Link
            href="/survey"
            className="rounded-[14px] border border-[var(--foreground)] bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)] no-underline transition-opacity hover:opacity-90"
          >
            Get Started
          </Link>
        </nav>
      </Container>
    </header>
  );
}
