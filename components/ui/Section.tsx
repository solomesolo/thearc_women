import { clsx } from "clsx";

type SectionProps = {
  id?: string;
  children: React.ReactNode;
  variant?: "default" | "inverted";
  className?: string;
};

export function Section({
  id,
  children,
  variant = "default",
  className,
}: SectionProps) {
  return (
    <section
      id={id}
      className={clsx(
        "overflow-hidden py-16 md:py-24",
        variant === "default" && "bg-[var(--background)]",
        variant === "inverted" && "bg-[var(--color-surface)]",
        className
      )}
    >
      {children}
    </section>
  );
}
