import { Container } from "@/components/ui/Container";

type LegalPageLayoutProps = {
  children: React.ReactNode;
  title: string;
  lastUpdated?: string;
};

export function LegalPageLayout({
  children,
  title,
  lastUpdated,
}: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--background)] pt-[120px] pb-[160px]">
      <Container className="!max-w-[720px] px-6 md:px-8">
        <h1 className="text-[32px] font-medium leading-tight tracking-tight text-[var(--text-primary)]">
          {title}
        </h1>
        {lastUpdated && (
          <p className="mt-2 text-base text-[var(--text-secondary)]">
            Last updated: {lastUpdated}
          </p>
        )}
        <div className="mt-10 space-y-10">{children}</div>
      </Container>
    </div>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-[var(--color-border-hairline)] pb-8 last:border-0">
      <h2 className="text-[20px] font-medium leading-snug text-[var(--text-primary)]">
        {heading}
      </h2>
      <div className="mt-4 text-base leading-[1.6] text-[var(--text-primary)]">
        {children}
      </div>
    </section>
  );
}

export function LegalParagraph({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-[var(--text-secondary)]">{children}</p>;
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 list-inside list-disc space-y-1 text-[var(--text-secondary)]">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
