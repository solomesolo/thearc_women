"use client";

import { useEffect, useState } from "react";

type CompletionScreenProps = {
  onComplete: () => void;
  delayMs?: number;
};

export function CompletionScreen({ onComplete, delayMs = 2000 }: CompletionScreenProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const t = setTimeout(onComplete, delayMs);
    return () => clearTimeout(t);
  }, [onComplete, delayMs]);

  if (!mounted) return null;

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-black/20 border-t-black/60"
        aria-hidden
      />
      <p className="text-[18px] font-medium text-[var(--text-primary)]">
        Analyzing your biological signals
      </p>
      <p className="text-[14px] text-black/60">
        Redirecting to your dashboard…
      </p>
    </div>
  );
}
