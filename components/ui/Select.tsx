"use client";

import { forwardRef } from "react";
import { clsx } from "clsx";

type SelectOption = { value: string; label: string };

type SelectProps = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "className"
> & {
  className?: string;
  options: SelectOption[];
  placeholder?: string;
  error?: boolean;
};

/** Select — native select with subtle border, no shadow */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    { className, options, placeholder, error, ...props },
    ref
  ) {
    return (
      <select
        ref={ref}
        className={clsx(
          "w-full rounded-[10px] border bg-[var(--background)] px-3.5 py-2.5 text-base text-[var(--text-primary)] transition-colors appearance-none cursor-pointer",
          "focus:outline-none focus:ring-2 focus:ring-[var(--foreground)] focus:ring-offset-0 focus:border-[var(--foreground)]",
          "disabled:cursor-not-allowed disabled:opacity-60",
          error
            ? "border-red-500/60"
            : "border-[var(--color-border-hairline)] hover:border-[var(--text-primary)]/20",
          className
        )}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23525252' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 12px center",
          paddingRight: "2.25rem",
        }}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }
);
