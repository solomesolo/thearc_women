import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { HeaderNav } from "@/components/layout/HeaderNav";

export function Header() {
  return (
    <header className="border-b border-[var(--color-border-hairline)] bg-[var(--background)]">
      <Container className="flex h-16 items-center justify-between gap-4 md:h-18">
        <Link
          href="/"
          className="shrink-0 text-lg font-medium tracking-tight text-[var(--text-primary)] no-underline hover:text-[var(--text-primary)]"
        >
          The Arc
        </Link>
        <HeaderNav />
      </Container>
    </header>
  );
}
