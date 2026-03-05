"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { ReasoningTrace as Trace } from "@/content/systemPageData";
import { EvidencePill } from "./EvidencePill";

/** "center" = modal (default); "right" = right drawer desktop / bottom sheet mobile */
export type DrawerPlacement = "center" | "right";

type ReasoningTraceDrawerProps = {
  trace: Trace | null;
  onClose: () => void;
  placement?: DrawerPlacement;
};

function focusTrap(container: HTMLElement | null) {
  if (!container) return;
  const focusable = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  };
  container.addEventListener("keydown", handleKeyDown);
  first?.focus();
  return () => container.removeEventListener("keydown", handleKeyDown);
}

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setIsMobile(mq.matches);
    const fn = () => setIsMobile(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [breakpoint]);
  return isMobile;
}

export function ReasoningTraceDrawer({
  trace,
  onClose,
  placement = "center",
}: ReasoningTraceDrawerProps) {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!trace) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const cleanup = focusTrap(panelRef.current);
    return () => {
      cleanup?.();
      previousFocusRef.current?.focus();
    };
  }, [trace?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && trace) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [trace, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleBack = () => {
    router.back();
    onClose();
  };

  if (!trace) return null;

  const isRightPlacement = placement === "right";
  const fromBottom = isRightPlacement && isMobile;
  const fromRight = isRightPlacement && !isMobile;

  const overlayClass = isRightPlacement
    ? "flex items-end justify-center md:items-stretch md:justify-end"
    : "flex items-end justify-center sm:items-center sm:p-4";
  const panelClass = fromRight
    ? "relative w-full max-w-md md:max-h-[100vh] md:h-full overflow-y-auto rounded-t-2xl border-t border-black/10 bg-[var(--background)] shadow-xl md:rounded-l-2xl md:rounded-tr-none md:border-r"
    : fromBottom
      ? "relative w-full max-h-[90vh] overflow-y-auto rounded-t-2xl border-t border-black/10 bg-[var(--background)] shadow-xl"
      : "relative w-full max-h-[90vh] overflow-y-auto rounded-t-2xl border-t border-black/10 bg-[var(--background)] shadow-xl sm:max-w-lg sm:rounded-2xl sm:border";

  const panelInitial = fromRight ? { opacity: 0, x: "100%" } : { opacity: 0, y: 24 };
  const panelAnimate = fromRight ? { opacity: 1, x: 0 } : { opacity: 1, y: 0 };
  const panelExit = fromRight ? { opacity: 0, x: "100%" } : { opacity: 0, y: 24 };

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={`fixed inset-0 z-50 ${overlayClass}`}
        onClick={handleOverlayClick}
        aria-modal="true"
        role="dialog"
        aria-labelledby="drawer-title"
      >
        <div className="absolute inset-0 bg-black/20 sm:bg-black/30" />
        <motion.div
          ref={panelRef}
          initial={panelInitial}
          animate={panelAnimate}
          exit={panelExit}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className={panelClass}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/10 bg-[var(--background)] px-4 py-3">
            <button
              type="button"
              onClick={handleBack}
              className="min-h-[44px] min-w-[44px] -ml-2 rounded-lg text-sm font-medium text-black/70 hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)]/30"
              aria-label="Close"
            >
              Back
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] rounded-lg text-sm font-medium text-black/70 hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)]/30 sm:absolute sm:right-4 sm:top-3"
              aria-label="Close"
            >
              Close
            </button>
          </div>
          <div className="p-4 pb-8">
            <h2 id="drawer-title" className="text-lg font-semibold text-[var(--text-primary)]">
              {trace.title}
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {trace.signals.map((s, i) => (
                <span
                  key={i}
                  className="rounded-md border border-black/10 bg-black/[0.03] px-2 py-0.5 text-xs text-black/75"
                >
                  {s}
                </span>
              ))}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-black/80">
              {trace.interpretation}
            </p>
            <p className="mt-4 text-xs font-medium uppercase tracking-wider text-black/50">
              Cause chain
            </p>
            <ol className="mt-2 space-y-2">
              {trace.chainSteps.map((step, i) => (
                <li key={i} className="flex gap-2 text-sm text-black/80">
                  <span className="text-black/40">{i + 1}.</span>
                  <span>
                    <strong>{step.label}</strong>
                    {step.detail && ` — ${step.detail}`}
                  </span>
                </li>
              ))}
            </ol>
            <div className="mt-4">
              <EvidencePill level={trace.evidence} />
            </div>
            <p className="mt-4 text-xs font-medium uppercase tracking-wider text-black/50">
              What to observe next
            </p>
            <ul className="mt-2 space-y-1 text-sm text-black/80">
              {trace.watchNext.map((w, i) => (
                <li key={i}>• {w}</li>
              ))}
            </ul>
            {trace.relatedLinks && trace.relatedLinks.length > 0 && (
              <div className="mt-6 pt-4 border-t border-black/5">
                <p className="text-xs font-medium uppercase tracking-wider text-black/50">
                  Related
                </p>
                <ul className="mt-2 space-y-1">
                  {trace.relatedLinks.map((link, i) => (
                    <li key={i}>
                      <a
                        href={link.href}
                        className="text-sm text-[var(--text-primary)] underline hover:no-underline"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
