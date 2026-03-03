"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export function AuthNav() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <span className="text-sm text-[var(--text-secondary)]">…</span>;
  }

  if (session?.user) {
    return (
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        Sign out
      </button>
    );
  }

  return (
    <Link
      href="/login"
      className="text-sm text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)]"
    >
      Sign in
    </Link>
  );
}
