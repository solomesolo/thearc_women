"use client";

import { forwardRef } from "react";
import { clsx } from "clsx";

type TextareaProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "className"
> & {
  className?: string;
  error?: boolean;
};

/** Textarea — multi-line input, subtle border, no shadow */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, error, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={clsx(
          "w-full min-h-[100px] rounded-[10px] border bg-[var(--background)] px-3.5 py-2.5 text-base text-[var(--text-primary)] transition-colors placeholder:text-[var(--text-secondary)]/70 resize-y",
          "focus:outline-none focus:ring-2 focus:ring-[var(--foreground)] focus:ring-offset-0 focus:border-[var(--foreground)]",
          "disabled:cursor-not-allowed disabled:opacity-60",
          error
            ? "border-red-500/60"
            : "border-[var(--color-border-hairline)] hover:border-[var(--text-primary)]/20",
          className
        )}
        {...props}
      />
    );
  }
);
