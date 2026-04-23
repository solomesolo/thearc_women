export function isDePrefixedPathSupported(pathname: string): boolean {
  // We only maintain explicit `/de/...` routes for marketing + legal pages.
  if (pathname === "/" || pathname === "/system2") return true;
  if (pathname === "/privacy" || pathname === "/terms" || pathname === "/cookies" || pathname === "/data-request") return true;
  return false;
}

export function shouldStripDePrefix(pathname: string): boolean {
  // If a user ends up on `/de/...` for app/onboarding/results, those routes don't exist under `/de`.
  // We keep the locale selection but navigate to the non-prefixed route.
  const p = pathname.startsWith("/de") ? pathname.slice(3) || "/" : pathname;
  return (
    p.startsWith("/onboarding") ||
    p.startsWith("/results") ||
    p.startsWith("/app") ||
    p.startsWith("/auth") ||
    p.startsWith("/api")
  );
}

