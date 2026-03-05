import Link from "next/link";

type Props = { params: Promise<{ id: string }> };

export default async function DashboardFrameworkStubPage({ params }: Props) {
  const { id } = await params;
  return (
    <div className="dashboard-frame dashboard-section">
      <h1 className="text-xl font-semibold text-[var(--text-primary)]">
        Framework
      </h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Detail for framework: {id}. (Stub — wire to real content later.)
      </p>
      <Link
        href="/dashboard"
        className="mt-4 inline-block text-sm font-medium text-[var(--text-primary)] underline"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
