"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useEarlyAccessModal } from "@/lib/early-access/EarlyAccessContext";

export function InviteCodeModal() {
  const { mode, close, openApply } = useEarlyAccessModal();
  const isOpen = mode === "invite";
  const router = useRouter();

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCode("");
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/early-access/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json();
      if (data.valid) {
        close();
        router.push("/onboarding/start");
      } else {
        setError("This invitation code doesn't look right. Please check it and try again.");
      }
    } catch {
      setError("This invitation code doesn't look right. Please check it and try again.");
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
        className="relative w-full max-w-[420px] rounded-[28px] bg-white shadow-[0_32px_80px_rgba(0,0,0,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
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

        <div className="px-8 pb-8 pt-8">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-[#a3a3a3]">
            Invitation
          </p>
          <h2 className="mt-2 text-[1.5rem] font-medium leading-[1.2] tracking-tight text-[#0c0c0c]">
            I have an invitation
          </h2>
          <p className="mt-2 text-[0.875rem] leading-[1.6] text-[#737373]">
            Enter your invitation code to begin your health arc.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="invite-code" className="text-[0.8125rem] font-medium text-[#404040]">
                Invite code
              </label>
              <input
                id="invite-code"
                ref={inputRef}
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={code}
                onChange={(e) => {
                  const clean = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 9);
                  setCode(clean.length > 3 ? clean.slice(0, 3) + "-" + clean.slice(3) : clean);
                  setError(null);
                }}
                placeholder="ARC-XXXXXX"
                className={`w-full rounded-[12px] border px-4 py-3 font-mono text-[1.0625rem] tracking-widest text-[#0c0c0c] placeholder:font-sans placeholder:tracking-normal placeholder:text-[#a3a3a3] focus:outline-none ${
                  error
                    ? "border-red-400 focus:border-red-500"
                    : "border-black/[0.12] focus:border-black/40"
                }`}
              />
              {error && (
                <p className="text-[0.8125rem] text-red-500">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={code.replace(/-/g, "").length < 9 || submitting}
              className="h-[52px] w-full rounded-[14px] bg-[#0c0c0c] text-[0.9375rem] font-semibold text-white transition-[filter] hover:brightness-[0.88] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? "Checking…" : "Continue Your Arc"}
            </button>
          </form>

          <p className="mt-4 text-center text-[0.8125rem] text-[#a3a3a3]">
            Don't have an invitation?{" "}
            <button
              type="button"
              onClick={openApply}
              className="underline underline-offset-2 hover:text-[#525252]"
            >
              Apply for early access
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
