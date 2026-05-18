import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { HeaderNav } from "@/components/layout/HeaderNav";

export function Header() {
  return (
    <header className="sticky top-0 z-[100] border-b border-[var(--color-border-hairline)] bg-[var(--background)]">
      <Container className="flex h-16 min-w-0 items-center justify-between gap-4 md:h-18">
        <Link
          href="/"
          className="shrink-0 text-lg font-medium tracking-tight text-[var(--text-primary)] no-underline hover:text-[var(--text-primary)]"
        >
          The Arc
        </Link>
        <div className="min-w-0 flex-1">
          <HeaderNav />
        </div>
      </Container>
    </header>
  );
}
