"use client";

import { useEffect, useRef, useState } from "react";
import { useEarlyAccessModal } from "@/lib/early-access/EarlyAccessContext";

type Screen = "form" | "confirmed";

export function EarlyAccessModal() {
  const { mode, close } = useEarlyAccessModal();
  const isOpen = mode === "apply";

  const [screen, setScreen] = useState<Screen>("form");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [healthAnswer, setHealthAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setScreen("form");
      setFirstName("");
      setEmail("");
      setHealthAnswer("");
      setError(null);
      setTimeout(() => firstInputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // Keyboard dismiss
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const canSubmit = firstName.trim().length > 0 && email.trim().length > 0 && healthAnswer.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/early-access/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: firstName.trim(), email: email.trim(), healthAnswer: healthAnswer.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setScreen("confirmed");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      onClick={close}
    >
      <div
        className="relative w-full max-w-[480px] rounded-[28px] bg-white shadow-[0_32px_80px_rgba(0,0,0,0.18)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-[#a3a3a3] transition-colors hover:bg-black/[0.06] hover:text-[#0c0c0c]"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {screen === "form" ? (
          <div className="px-8 pb-8 pt-8">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-[#a3a3a3]">
              Early access
            </p>
            <h2 className="mt-2 text-[1.5rem] font-medium leading-[1.2] tracking-tight text-[#0c0c0c]">
              Begin Your Health Arc
            </h2>
            <p className="mt-2 text-[0.875rem] leading-[1.6] text-[#737373]">
              We're opening The Arc in small groups. Tell us a little about yourself.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="ea-first-name" className="text-[0.8125rem] font-medium text-[#404040]">
                  First name
                </label>
                <input
                  id="ea-first-name"
                  ref={firstInputRef}
                  type="text"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Your first name"
                  className="w-full rounded-[12px] border border-black/[0.12] px-4 py-3 text-[0.9375rem] text-[#0c0c0c] placeholder:text-[#a3a3a3] focus:border-black/40 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="ea-email" className="text-[0.8125rem] font-medium text-[#404040]">
                  Email
                </label>
                <input
                  id="ea-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-[12px] border border-black/[0.12] px-4 py-3 text-[0.9375rem] text-[#0c0c0c] placeholder:text-[#a3a3a3] focus:border-black/40 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="ea-health-answer" className="text-[0.8125rem] font-medium text-[#404040]">
                  What made you start thinking about your health more seriously?
                </label>
                <textarea
                  id="ea-health-answer"
                  value={healthAnswer}
                  onChange={(e) => setHealthAnswer(e.target.value)}
                  rows={3}
                  placeholder="Share your story..."
                  className="w-full resize-none rounded-[12px] border border-black/[0.12] px-4 py-3 text-[0.9375rem] text-[#0c0c0c] placeholder:text-[#a3a3a3] focus:border-black/40 focus:outline-none"
                />
              </div>

              {error && (
                <p className="text-[0.8125rem] text-red-500">{error}</p>
              )}

              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="mt-1 h-[52px] w-full rounded-[14px] bg-[#0c0c0c] text-[0.9375rem] font-semibold text-white transition-[filter] hover:brightness-[0.88] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? "Submitting…" : "Begin Your Health Arc"}
              </button>
            </form>
          </div>
        ) : (
          <div className="px-8 pb-10 pt-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#f4f4f2]">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
                <path d="M4 11.5l5 5 9-9" stroke="#0c0c0c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-[1.35rem] font-medium leading-[1.25] tracking-tight text-[#0c0c0c]">
              You're on The Arc path.
            </h2>
            <p className="mx-auto mt-3 max-w-[340px] text-[0.9rem] leading-[1.65] text-[#525252]">
              We're opening The Arc in small groups so we can build the experience with care. We'll let you know when your group opens.
            </p>
            <button
              type="button"
              onClick={close}
              className="mt-7 h-[48px] rounded-[14px] bg-[#0c0c0c] px-8 text-[0.9375rem] font-medium text-white transition-[filter] hover:brightness-[0.88]"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
