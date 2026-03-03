import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <aside className="border-b border-[var(--color-border-hairline)] bg-[var(--color-surface)]/50">
        <div className="mx-auto flex max-w-6xl items-center gap-8 px-4 py-4">
          <Link
            href="/admin/articles"
            className="text-sm font-medium text-[var(--text-primary)] no-underline hover:underline"
          >
            Articles
          </Link>
          <Link
            href="/"
            className="text-sm text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)]"
          >
            ← Site
          </Link>
        </div>
      </aside>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
