"use client";

import { useReducedMotion } from "framer-motion";
import { motion, type Variants } from "framer-motion";

type RevealProps = {
  children: React.ReactNode;
  delay?: number;
  duration?: "fast" | "base" | "slow";
  once?: boolean;
  className?: string;
};

const durations = {
  fast: 0.18,
  base: 0.32,
  slow: 0.65,
} as const;

const ease = [0, 0, 0.2, 1] as const;

export function Reveal({
  children,
  delay = 0,
  duration = "base",
  once = true,
  className,
}: RevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const durationSec = durations[duration];

  const variants: Variants = prefersReducedMotion
    ? {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            duration: durationSec,
            delay,
            ease,
          },
        },
      }
    : {
        hidden: { opacity: 0, y: 8 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: durationSec,
            delay,
            ease,
          },
        },
      };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-40px" }}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}
