import { clsx } from "clsx";

type ContainerProps = {
  children: React.ReactNode;
  size?: "wide" | "narrow";
  className?: string;
};

export function Container({
  children,
  size = "wide",
  className,
}: ContainerProps) {
  return (
    <div
      className={clsx(
        "mx-auto w-full px-6 md:px-8",
        size === "wide" && "max-w-[80rem]", // 1280
        size === "narrow" && "max-w-3xl",
        className
      )}
    >
      {children}
    </div>
  );
}
