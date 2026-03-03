import { clsx } from "clsx";

const baseClass = "text-[var(--text-primary)]";

type TypographyProps = {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "p" | "span";
};

/** H1 — site typography token (responsive size) */
export function H1({
  children,
  className,
  as: Component = "h1",
}: TypographyProps) {
  return (
    <Component
      className={clsx(
        baseClass,
        "text-[1.875rem] font-medium leading-[1.2] tracking-tight md:text-[2.5rem] lg:text-[3rem]",
        className
      )}
    >
      {children}
    </Component>
  );
}

/** H2 — section heading */
export function H2({
  children,
  className,
  as: Component = "h2",
}: TypographyProps) {
  return (
    <Component
      className={clsx(
        baseClass,
        "text-[1.5rem] font-medium leading-[1.25] tracking-tight md:text-[1.875rem] lg:text-[2.25rem]",
        className
      )}
    >
      {children}
    </Component>
  );
}

/** Body — default body text */
export function Body({
  children,
  className,
  as: Component = "p",
}: TypographyProps) {
  return (
    <Component
      className={clsx(
        baseClass,
        "text-base leading-[1.6]",
        className
      )}
    >
      {children}
    </Component>
  );
}

/** BodyMuted — secondary body */
export function BodyMuted({
  children,
  className,
  as: Component = "p",
}: TypographyProps) {
  return (
    <Component
      className={clsx(
        "text-[var(--text-secondary)]",
        "text-base leading-[1.6]",
        className
      )}
    >
      {children}
    </Component>
  );
}

/** Small — caption / small text */
export function Small({
  children,
  className,
  as: Component = "span",
}: TypographyProps) {
  return (
    <Component
      className={clsx(
        "text-[var(--text-secondary)]",
        "text-[0.8125rem] leading-[1.5]",
        className
      )}
    >
      {children}
    </Component>
  );
}
