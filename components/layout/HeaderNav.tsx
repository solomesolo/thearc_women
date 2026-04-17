"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { AuthNav } from "@/components/layout/AuthNav";
import { NotificationBell } from "@/components/layout/NotificationBell";

// hasDE: true = page exists in /de/... as well
const LINKS: { href: string; label: string; hasDE?: boolean }[] = [
  { href: "/", label: "Home", hasDE: true },
  { href: "/system2", label: "How The Arc works", hasDE: true },
  { href: "/blog", label: "Knowledge Base" },
  { href: "/knowledge", label: "My Health Dashboard" },
  { href: "/upload", label: "Upload Health Data" },
];

function LanguageSwitcher({ className }: { className?: string }) {
  const pathname = usePathname();
  const isDE = pathname.startsWith("/de");
  const enHref = isDE ? pathname.replace(/^\/de/, "") || "/" : null;
  const deHref = !isDE ? "/de" + (pathname === "/" ? "" : pathname) : null;

  return (
    <div className={clsx("flex items-center gap-1 rounded-[10px] border border-black/[0.1] p-0.5 text-[0.8125rem] font-medium", className)}>
      {enHref ? (
        <Link href={enHref} className="rounded-[8px] px-2.5 py-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          EN
        </Link>
      ) : (
        <span className="rounded-[8px] bg-[var(--foreground)] px-2.5 py-1 text-[var(--background)]">EN</span>
      )}
      {deHref ? (
        <Link href={deHref} className="rounded-[8px] px-2.5 py-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          DE
        </Link>
      ) : (
        <span className="rounded-[8px] bg-[var(--foreground)] px-2.5 py-1 text-[var(--background)]">DE</span>
      )}
    </div>
  );
}

const linkClass =
  "text-sm text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)]";

const mobileLinkClass =
  "-mx-2 block rounded-[12px] px-2 py-3 text-[15px] text-[var(--text-primary)] no-underline hover:bg-black/[0.04]";

const ctaClass =
  "rounded-[14px] border border-[var(--foreground)] bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)] no-underline transition-opacity hover:opacity-90";

export function HeaderNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isDE = pathname.startsWith("/de");

  const resolvedLinks = LINKS.map(({ href, label, hasDE }) => ({
    label,
    href: isDE && hasDE ? "/de" + (href === "/" ? "" : href) : href,
  }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <nav
        className="hidden flex-1 flex-wrap items-center justify-end gap-4 md:flex md:gap-6"
        aria-label="Main"
      >
        {resolvedLinks.map(({ href, label }) => (
          <Link key={href} href={href} className={linkClass}>
            {label}
          </Link>
        ))}
        <LanguageSwitcher />
        <NotificationBell />
        <AuthNav />
        <Link href="/survey" className={ctaClass}>
          Get Started
        </Link>
      </nav>

      <div className="flex flex-1 items-center justify-end gap-1 md:hidden">
        <NotificationBell />
        <button
          type="button"
          className={clsx(
            "flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-[12px] text-[var(--text-primary)] hover:bg-black/[0.06] transition-colors",
            open && "bg-black/[0.06]"
          )}
          aria-expanded={open}
          aria-controls="mobile-main-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span
            className={clsx(
              "block h-0.5 w-5 rounded-full bg-current transition-transform",
              open && "translate-y-2 rotate-45"
            )}
          />
          <span
            className={clsx(
              "block h-0.5 w-5 rounded-full bg-current transition-opacity",
              open && "opacity-0"
            )}
          />
          <span
            className={clsx(
              "block h-0.5 w-5 rounded-full bg-current transition-transform",
              open && "-translate-y-2 -rotate-45"
            )}
          />
        </button>
      </div>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/25 md:hidden"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />

          <div
            id="mobile-main-menu"
            className="fixed left-0 right-0 top-16 z-50 max-h-[min(24rem,calc(100vh-4rem))] overflow-y-auto border-b border-[var(--color-border-hairline)] bg-[var(--background)] shadow-[0_16px_48px_rgba(0,0,0,0.12)] md:hidden"
            role="navigation"
            aria-label="Main"
          >
            <div className="mx-auto w-full max-w-[80rem] px-6 py-4">
              <ul className="flex flex-col gap-0.5">
                {resolvedLinks.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className={mobileLinkClass}
                      onClick={() => setOpen(false)}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-col gap-3 border-t border-black/[0.08] pt-4">
                <LanguageSwitcher className="self-start" />
                <AuthNav
                  className="-mx-2 block w-fit max-w-full rounded-[12px] px-2 py-3 text-[15px] text-[var(--text-primary)] hover:bg-black/[0.04]"
                  onNavigate={() => setOpen(false)}
                />
                <Link
                  href="/survey"
                  className={clsx(ctaClass, "inline-flex w-full justify-center py-3 text-[15px]")}
                  onClick={() => setOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
