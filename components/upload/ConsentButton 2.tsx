"use client";

import { useRouter } from "next/navigation";

export function ConsentButton() {
  const router = useRouter();

  function handleConsent() {
    // Set a session-scoped consent cookie (cleared when browser closes)
    document.cookie = "arc_upload_consent=1; path=/; SameSite=Strict";
    router.push("/upload/files");
  }

  return (
    <button
      type="button"
      onClick={handleConsent}
      className="inline-flex h-[52px] w-full items-center justify-center rounded-[14px] bg-[var(--foreground)] px-6 text-[15px] font-medium text-[var(--background)] transition-opacity hover:opacity-90 sm:w-auto sm:px-8"
    >
      I Consent to Upload My Data
    </button>
  );
}
