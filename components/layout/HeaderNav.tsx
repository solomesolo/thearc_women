"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { AuthNav } from "@/components/layout/AuthNav";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { setStoredLocale } from "@/lib/i18n/locale";
import { isDePrefixedPathSupported, shouldStripDePrefix } from "@/lib/i18n/deRouting";
import { useLocale } from "@/lib/i18n/useLocale";
import { useEarlyAccessModal } from "@/lib/early-access/EarlyAccessContext";

// hasDE: true = page exists in /de/... as well
const LINKS: { href: string; label: string; hasDE?: boolean }[] = [
  { href: "/", label: "Home", hasDE: true },
  { href: "/system2", label: "How The Arc works", hasDE: true },
  { href: "/blog", label: "Knowledge Base" },
  { href: "/knowledge", label: "My Health Dashboard" },
  { href: "/upload", label: "Upload Health Data" },
];

function appShellBarePath(pathname: string) {
  return pathname.startsWith("/de") ? pathname.slice(3) || "/" : pathname;
}

function isAppShellPath(pathname: string) {
  const bare = appShellBarePath(pathname);
  return (
    bare.startsWith("/results") ||
    bare.startsWith("/app") ||
    bare.startsWith("/onboarding")
  );
}

function LanguageSwitcher({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const isDE = pathname.startsWith("/de");
  const locale = useLocale();

  // Compute "base" path without /de prefix.
  const basePath = isDE ? pathname.replace(/^\/de/, "") || "/" : pathname;
  const supportsDePrefix = useMemo(() => isDePrefixedPathSupported(basePath), [basePath]);

  const enHref = isDE ? basePath : null;
  const deHref = !isDE && supportsDePrefix ? "/de" + (basePath === "/" ? "" : basePath) : null;

  const activeClass = "rounded-[8px] bg-[var(--foreground)] px-2.5 py-1 text-[var(--background)]";
  const inactiveClass =
    "rounded-[8px] px-2.5 py-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors";

  return (
    <div className={clsx("flex items-center gap-1 rounded-[10px] border border-black/[0.1] p-0.5 text-[0.8125rem] font-medium", className)}>
      {enHref ? (
        <Link
          href={enHref}
          onClick={() => setStoredLocale("en")}
          className={locale === "en" ? activeClass : inactiveClass}
        >
          EN
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => {
            setStoredLocale("en");
            if (isDE) router.replace(basePath);
          }}
          className={locale === "en" ? activeClass : inactiveClass}
        >
          EN
        </button>
      )}

      {deHref ? (
        <Link
          href={deHref}
          onClick={() => setStoredLocale("de")}
          className={locale === "de" ? activeClass : inactiveClass}
        >
          DE
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => {
            setStoredLocale("de");
            // For non-prefixed app/onboarding/results routes: keep URL, just change locale.
            // For DE-prefixed pages: if already on /de we might be on an unsupported route → hop back.
            if (isDE) router.replace(basePath);
          }}
          className={locale === "de" ? activeClass : inactiveClass}
        >
          DE
        </button>
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
  const router = useRouter();
  const pathname = usePathname();
  const isDE = pathname.startsWith("/de");
  const locale = useLocale();
  const isAppShell = isAppShellPath(pathname);
  const { openApply, openInvite } = useEarlyAccessModal();

  // If we ever land on `/de/...` for app/onboarding/results routes, strip the prefix to avoid 404s.
  useEffect(() => {
    if (!pathname.startsWith("/de")) return;
    if (!shouldStripDePrefix(pathname)) return;
    const base = pathname.replace(/^\/de/, "") || "/";
    router.replace(base);
  }, [pathname, router]);

  const resolvedLinks = LINKS.map(({ href, label, hasDE }) => ({
    label,
    href: isDE && hasDE ? "/de" + (href === "/" ? "" : href) : href,
  }));

  const exploreLabel = locale === "de" ? "Entdecken" : "Explore";

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
        className="hidden min-w-0 flex-1 flex-wrap items-center justify-end gap-x-4 gap-y-2 md:flex md:gap-x-5"
        aria-label="Main"
      >
        {isAppShell ? (
          <details className="group relative">
            <summary
              className="cursor-pointer list-none rounded-[10px] border border-black/[0.1] bg-black/[0.02] px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] hover:bg-black/[0.05] [&::-webkit-details-marker]:hidden"
            >
              {exploreLabel}
              <span className="ml-1 text-[var(--text-secondary)]">▾</span>
            </summary>
            <div className="absolute left-0 top-[calc(100%+6px)] z-[120] min-w-[12rem] rounded-[14px] border border-black/[0.08] bg-[var(--background)] py-2 shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
              {resolvedLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="block px-4 py-2.5 text-sm text-[var(--text-secondary)] no-underline hover:bg-black/[0.04] hover:text-[var(--text-primary)]"
                >
                  {label}
                </Link>
              ))}
            </div>
          </details>
        ) : (
          resolvedLinks.map(({ href, label }) => (
            <Link key={href} href={href} className={linkClass}>
              {label}
            </Link>
          ))
        )}
        <LanguageSwitcher />
        <NotificationBell />
        <AuthNav />
        {!isAppShell && (
          <>
            <button
              type="button"
              onClick={openInvite}
              className="shrink-0 rounded-[14px] border border-black/[0.15] bg-transparent px-3 py-2 text-sm font-medium text-[#404040] no-underline transition-colors hover:bg-black/[0.04] md:px-4"
            >
              {locale === "de" ? "Ich habe eine Einladung" : "I have an invitation"}
            </button>
            <button type="button" onClick={openApply} className={clsx(ctaClass, "shrink-0 px-3 md:px-4")}>
              {locale === "de" ? "Mein Health Arc beginnen" : "Begin Your Health Arc"}
            </button>
          </>
        )}
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
                {!isAppShell && (
                  <>
                    <button
                      type="button"
                      onClick={() => { setOpen(false); openInvite(); }}
                      className="w-full rounded-[14px] border border-black/[0.15] bg-transparent px-6 py-3 text-center text-[15px] font-medium text-[#404040] transition-colors hover:bg-black/[0.04]"
                    >
                      {locale === "de" ? "Ich habe eine Einladung" : "I have an invitation"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOpen(false); openApply(); }}
                      className={clsx(ctaClass, "inline-flex w-full justify-center py-3 text-[15px]")}
                    >
                      {locale === "de" ? "Mein Health Arc beginnen" : "Begin Your Health Arc"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
