"use client";

import Link from "next/link";
import { clsx } from "clsx";
import { useSession, signOut } from "next-auth/react";
import { clearArcLocalState } from "@/lib/profile-engine-a/frontendClient";
import { useLocale } from "@/lib/i18n/useLocale";

const baseClass =
  "text-sm text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)]";

type AuthNavProps = {
  className?: string;
  /** Called before navigation (e.g. close mobile menu). */
  onNavigate?: () => void;
};

export function AuthNav({ className, onNavigate }: AuthNavProps) {
  const { data: session, status } = useSession();
  const locale = useLocale();
  const isDE = locale === "de";

  if (status === "loading") {
    return (
      <span className={clsx("text-sm text-[var(--text-secondary)]", className)}>
        …
      </span>
    );
  }

  if (session?.user) {
    return (
      <div className={clsx("flex items-center gap-4", !className && "contents")}>
        <Link
          href="/settings"
          onClick={() => onNavigate?.()}
          className={clsx(baseClass, className ?? "text-sm")}
        >
          {isDE ? "Einstellungen" : "Settings"}
        </Link>
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            clearArcLocalState();
            signOut({ callbackUrl: "/" });
          }}
          className={clsx(
            baseClass,
            "cursor-pointer border-0 bg-transparent text-left",
            !className && "p-0",
            className
          )}
        >
          {isDE ? "Abmelden" : "Sign out"}
        </button>
      </div>
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
