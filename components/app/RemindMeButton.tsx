"use client";
import { useState } from "react";
import { RemindMeModal } from "./RemindMeModal";

export interface RemindMeButtonProps {
  checkKey: string;
  checkName: string;
  isDE?: boolean;
  variant?: "pill" | "icon" | "text" | "raw";
  className?: string;
}

export function RemindMeButton({
  checkKey,
  checkName,
  isDE,
  variant = "pill",
  className = "",
}: RemindMeButtonProps) {
  const [open, setOpen] = useState(false);

  const label = isDE ? "Erinnere mich" : "Remind me";

  const baseClass =
    variant === "raw"
      ? ""
      : variant === "icon"
      ? "flex items-center gap-1 text-[#888] hover:text-[#0c0c0c] text-[13px] transition-colors"
      : variant === "text"
      ? "text-[13px] font-medium text-[#0c0c0c] underline underline-offset-2 hover:opacity-70 transition-opacity"
      : "inline-flex items-center gap-1.5 rounded-full border border-[#e5e5e5] bg-white px-3 py-1.5 text-[12px] font-medium text-[#0c0c0c] shadow-sm hover:border-[#0c0c0c] transition-colors";

  return (
    <>
      <button onClick={() => setOpen(true)} className={`${baseClass} ${className}`.trim()}>
        <span>🔔</span>
        <span>{label}</span>
      </button>

      {open && (
        <RemindMeModal
          checkKey={checkKey}
          checkName={checkName}
          isDE={isDE}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
