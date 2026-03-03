import { clsx } from "clsx";

type TagProps = {
  children: React.ReactNode;
  variant?: "default" | "muted";
  className?: string;
};

/** Tag — small label/category, no shadow, subtle border */
export function Tag({
  children,
  variant = "default",
  className,
}: TagProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium uppercase tracking-wider",
        variant === "default" &&
          "border-[var(--color-border-hairline)] text-[var(--text-secondary)]",
        variant === "muted" &&
          "border-[var(--color-border-hairline)]/80 text-[var(--text-secondary)]/90",
        className
      )}
    >
      {children}
    </span>
  );
}
