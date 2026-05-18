"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { useLocale } from "@/lib/i18n/useLocale";

const LINKS = [
  { href: "/app/dashboard", labelEn: "Dashboard", labelDe: "Dashboard" },
  { href: "/results/overview", labelEn: "Health Wallet", labelDe: "Gesundheitsakte" },
  { href: "/results/action-plan", labelEn: "Action Plan", labelDe: "Aktionsplan" },
  { href: "/my-health-calendar", labelEn: "My Health Calendar", labelDe: "Mein Gesundheitskalender" },
];

export function AppNav() {
  const pathname = usePathname();
  const locale = useLocale();
  const isDE = locale === "de";

  return (
    <header className="sticky top-16 z-[90] border-b border-black/[0.07] bg-white/[0.92] backdrop-blur-sm md:top-[4.5rem]">
      <div className="mx-auto flex h-12 max-w-[72rem] items-center gap-2 overflow-x-auto px-5 md:gap-4 md:px-8">
        <nav className="flex min-w-0 flex-1 items-center gap-1 md:gap-1" aria-label="App">
          {LINKS.map(({ href, labelEn, labelDe }) => {
            const label = isDE ? labelDe : labelEn;
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "shrink-0 rounded-[10px] px-3 py-1.5 text-[0.8125rem] transition-colors md:text-[0.875rem]",
                  pathname === href
                    ? "bg-black/[0.07] font-medium text-[#0c0c0c]"
                    : "text-[#737373] hover:bg-black/[0.04] hover:text-[#0c0c0c]"
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
