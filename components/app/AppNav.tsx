"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { clearArcLocalState } from "@/lib/profile-engine-a/frontendClient";
import { clsx } from "clsx";

const LINKS = [
  { href: "/app/dashboard", label: "Dashboard" },
  { href: "/results/overview", label: "Health Wallet" },
  { href: "/results/action-plan", label: "Action Plan" },
  { href: "/my-health-calendar", label: "My Health Calendar" },
];

export function AppNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b border-black/[0.07] bg-white/[0.85] backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-[72rem] items-center justify-between gap-6 px-5 md:px-8">
        <Link href="/app/dashboard" className="text-[0.9375rem] font-semibold tracking-tight text-[#0c0c0c]">
          The Arc
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                "rounded-[10px] px-3 py-1.5 text-[0.875rem] transition-colors",
                pathname === href
                  ? "bg-black/[0.06] font-medium text-[#0c0c0c]"
                  : "text-[#737373] hover:bg-black/[0.04] hover:text-[#0c0c0c]"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {session?.user?.email && (
            <span className="hidden text-[0.8125rem] text-[#a3a3a3] md:block">
              {session.user.email}
            </span>
          )}
          <button
            type="button"
            onClick={() => { clearArcLocalState(); signOut({ callbackUrl: "/" }); }}
            className="text-[0.8125rem] text-[#737373] hover:text-[#0c0c0c]"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
