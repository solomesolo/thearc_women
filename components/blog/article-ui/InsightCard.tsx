/**
 * InsightCard — base card shell for article sections.
 * Premium wellness aesthetic: white, rounded, subtle shadow.
 * Variants:
 *   default  — pure white, used for research/context sections
 *   warm     — slightly warm off-white, used for action/protocol sections
 *   flat     — no shadow, lighter border, used for nested callouts
 */
import { clsx } from "clsx";

type InsightCardProps = {
  children: React.ReactNode;
  className?: string;
  id?: string;
  as?: "div" | "section" | "article" | "aside";
  variant?: "default" | "warm" | "flat";
};

export function InsightCard({
  children,
  className,
  id,
  as: As = "div",
  variant = "default",
}: InsightCardProps) {
  return (
    <As
      id={id}
      className={clsx(
        "rounded-[20px] border",
        variant === "default" &&
          "bg-white border-black/[0.07] shadow-[0_1px_0_rgba(12,12,12,0.04),0_6px_24px_rgba(12,12,12,0.04)]",
        variant === "warm" &&
          "bg-[#fdf8f5] border-[#e8ddd6] shadow-[0_1px_0_rgba(12,12,12,0.03),0_4px_16px_rgba(12,12,12,0.04)]",
        variant === "flat" &&
          "bg-[#f8f7f5] border-black/[0.06] shadow-none",
        className
      )}
    >
      {children}
    </As>
  );
}
