import { clsx } from "clsx";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md";
};

/** Card — container with subtle border, no shadow by default */
export function Card({
  children,
  className,
  padding = "md",
}: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-[14px] border border-[var(--color-border-hairline)] bg-[var(--background)]",
        padding === "sm" && "p-4",
        padding === "md" && "p-5 md:p-6",
        padding === "none" && "p-0",
        className
      )}
    >
      {children}
    </div>
  );
}
