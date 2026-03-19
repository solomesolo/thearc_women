"use client";

import { useEffect } from "react";

export type ToastKind = "success" | "info";

export function DashboardToast({
  open,
  message,
  kind = "success",
  durationMs = 2200,
  onClose,
}: {
  open: boolean;
  message: string;
  kind?: ToastKind;
  durationMs?: number;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(t);
  }, [open, durationMs, onClose]);

  if (!open) return null;

  return (
    <div className="fixed bottom-5 left-5 z-[100] max-w-[min(420px,calc(100vw-40px))]">
      <div className="rounded-[18px] border border-black/[0.10] bg-[var(--background)] px-4 py-3 shadow-[0_1px_0_rgba(12,12,12,0.05),0_16px_34px_rgba(12,12,12,0.10)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[var(--text-primary)]">
              {kind === "success" ? "Saved" : "Updated"}
            </p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-black/70">
              {message}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/[0.08] bg-black/[0.02] text-[12px] font-semibold text-black/60 hover:bg-black/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

