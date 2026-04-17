"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CONTENT = {
  en: {
    badge: "Early access",
    title: "We're building something\nworth waiting for",
    body: "The Arc is in active development and will be available soon. If you have questions, would like to be among the first to try it, or want to share feedback — we'd love to hear from you.",
    email: "info@thearcme.com",
    cta: "Send us a message",
    close: "Close",
  },
  de: {
    badge: "Early Access",
    title: "Wir bauen etwas,\ndas sich lohnt zu warten",
    body: "The Arc befindet sich in aktiver Entwicklung und wird bald verfügbar sein. Wenn du Fragen hast, zu den Ersten gehören möchtest oder Feedback teilen willst — wir freuen uns von dir zu hören.",
    email: "info@thearcme.com",
    cta: "Nachricht schicken",
    close: "Schließen",
  },
};

type Props = {
  open: boolean;
  lang?: "en" | "de";
  onClose: () => void;
};

export function ComingSoonModal({ open, lang = "en", onClose }: Props) {
  const t = CONTENT[lang];

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[2px]"
            aria-hidden
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-label={t.title.replace("\n", " ")}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
            className="fixed left-1/2 top-1/2 z-[201] w-[calc(100vw-2rem)] max-w-[440px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[24px] border border-black/[0.1] bg-white shadow-[0_24px_64px_rgba(0,0,0,0.18)]"
          >
            {/* Header */}
            <div className="border-b border-black/[0.07] bg-[#fafaf9] px-6 py-5">
              <span className="inline-block rounded-full border border-black/[0.1] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#737373]">
                {t.badge}
              </span>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              <h2 className="whitespace-pre-line text-[1.25rem] font-semibold leading-[1.25] tracking-tight text-[#0c0c0c]">
                {t.title}
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-[1.65] text-[#525252]">
                {t.body}
              </p>

              {/* Email CTA */}
              <a
                href={`mailto:${t.email}`}
                className="mt-5 flex items-center gap-2 rounded-[12px] border border-black/[0.1] bg-[#fafaf9] px-4 py-3 text-[0.875rem] font-medium text-[#0c0c0c] transition-colors hover:bg-[#f0f0ef]"
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden className="shrink-0 text-[#737373]">
                  <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h10A1.5 1.5 0 0 1 14 3.5v8A1.5 1.5 0 0 1 12.5 13h-10A1.5 1.5 0 0 1 1 11.5v-8Z" stroke="currentColor" strokeWidth="1.1"/>
                  <path d="m1 4 6.5 4.5L14 4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                </svg>
                {t.cta} — {t.email}
              </a>
            </div>

            {/* Footer */}
            <div className="border-t border-black/[0.07] px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                className="text-[0.875rem] font-medium text-[#737373] transition-colors hover:text-[#0c0c0c]"
              >
                {t.close}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
