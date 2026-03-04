"use client";

import Image from "next/image";
import { clsx } from "clsx";

type Ratio = "4/5" | "3/2" | "1/1" | "16/10";
type Variant = "portrait" | "landscape" | "inline";

type EditorialImageProps = {
  src: string;
  alt: string;
  ratio?: Ratio;
  variant?: Variant;
  grain?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
};

const ratioClasses: Record<Ratio, string> = {
  "4/5": "aspect-[4/5]",
  "3/2": "aspect-[3/2]",
  "1/1": "aspect-square",
  "16/10": "aspect-[16/10]",
};

export function EditorialImage({
  src,
  alt,
  ratio = "4/5",
  variant = "portrait",
  grain = false,
  className,
  priority = false,
  sizes,
}: EditorialImageProps) {
  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-2xl border border-black/5",
        ratioClasses[ratio],
        variant === "inline" && "max-w-md",
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        priority={priority}
        sizes={sizes ?? "(max-width: 768px) 100vw, 420px"}
      />
      {grain && (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
          aria-hidden
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      )}
    </div>
  );
}
