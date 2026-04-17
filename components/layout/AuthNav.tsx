"use client";

import Link from "next/link";
import { clsx } from "clsx";
import { useSession, signOut } from "next-auth/react";

const baseClass =
  "text-sm text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)]";

type AuthNavProps = {
  className?: string;
  /** Called before navigation (e.g. close mobile menu). */
  onNavigate?: () => void;
};

export function AuthNav({ className, onNavigate }: AuthNavProps) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <span className={clsx("text-sm text-[var(--text-secondary)]", className)}>
        …
      </span>
    );
  }

  if (session?.user) {
    return (
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          signOut({ callbackUrl: "/" });
        }}
        className={clsx(
          baseClass,
          "cursor-pointer border-0 bg-transparent text-left",
          !className && "p-0",
          className
        )}
      >
        Sign out
      </button>
    );
  }

  return (
    <Link
      href="/login"
      className={clsx(baseClass, !className && "inline-block", className)}
      onClick={() => onNavigate?.()}
    >
      Log in
    </Link>
  );
}
