import { clsx } from "clsx";

type DividerProps = {
  className?: string;
  orientation?: "horizontal" | "vertical";
};

/** Divider — 1px line using hairline border color */
export function Divider({
  className,
  orientation = "horizontal",
}: DividerProps) {
  return (
    <hr
      className={clsx(
        "border-0 border-[var(--color-border-hairline)]",
        orientation === "horizontal" && "w-full border-t",
        orientation === "vertical" && "h-full border-l self-stretch",
        className
      )}
      aria-hidden
    />
  );
}
