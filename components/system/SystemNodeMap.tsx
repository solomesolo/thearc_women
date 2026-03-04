"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const NODES = ["Hormones", "Metabolism", "Stress", "Recovery", "Sleep", "Biomarkers"];
const EASE_OUT = [0, 0, 0.2, 1] as const;

type SystemNodeMapProps = {
  hoverPanel?: string | null;
  onNodeHover?: (node: string) => void;
  onNodeLeave?: () => void;
  animateOnScroll?: boolean;
};

export function SystemNodeMap({
  hoverPanel,
  onNodeHover,
  onNodeLeave,
  animateOnScroll = true,
}: SystemNodeMapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const show = !animateOnScroll || inView;

  const nodePositions: Record<string, { x: number; y: number }> = {
    Hormones: { x: 20, y: 15 },
    Metabolism: { x: 50, y: 25 },
    Stress: { x: 80, y: 15 },
    Recovery: { x: 35, y: 55 },
    Sleep: { x: 65, y: 55 },
    Biomarkers: { x: 50, y: 85 },
  };

  const connections: [string, string][] = [
    ["Hormones", "Metabolism"],
    ["Metabolism", "Recovery"],
    ["Stress", "Sleep"],
    ["Recovery", "Stress"],
    ["Sleep", "Hormones"],
    ["Biomarkers", "Metabolism"],
    ["Hormones", "Recovery"],
  ];

  return (
    <div ref={ref} className="relative aspect-square max-h-[380px] w-full min-h-[280px] md:max-h-[420px]">
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full"
        style={{ overflow: "visible" }}
      >
        {connections.map(([a, b], i) => {
          const pa = nodePositions[a];
          const pb = nodePositions[b];
          if (!pa || !pb) return null;
          return (
            <motion.line
              key={`${a}-${b}`}
              x1={pa.x}
              y1={pa.y}
              x2={pb.x}
              y2={pb.y}
              stroke="var(--text-primary)"
              strokeWidth="0.4"
              initial={{ opacity: 0 }}
              animate={show ? { opacity: 0.2 } : { opacity: 0 }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: EASE_OUT }}
            />
          );
        })}
        {NODES.map((node, i) => {
          const pos = nodePositions[node];
          if (!pos) return null;
          return (
            <g
              key={node}
              onMouseEnter={() => onNodeHover?.(node)}
              onMouseLeave={() => onNodeLeave?.()}
              style={{ cursor: onNodeHover ? "pointer" : "default" }}
            >
              <circle
                cx={pos.x}
                cy={pos.y}
                r="14"
                fill="transparent"
              />
              <motion.circle
                cx={pos.x}
                cy={pos.y}
                r="6"
                fill="var(--background)"
                stroke="var(--text-primary)"
                strokeWidth="0.6"
                initial={{ scale: 0, opacity: 0 }}
                animate={show ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                transition={{
                  duration: 0.4,
                  delay: 0.2 + i * 0.06,
                  ease: EASE_OUT,
                }}
              />
              <motion.text
                x={pos.x}
                y={pos.y + 12}
                textAnchor="middle"
                fill="var(--text-primary)"
                fontSize="3.2"
                fontWeight="500"
                initial={{ opacity: 0 }}
                animate={show ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + i * 0.05 }}
              >
                {node}
              </motion.text>
            </g>
          );
        })}
      </svg>
      {hoverPanel && (
        <div className="absolute bottom-0 left-0 right-0 rounded-lg border border-[var(--color-border-hairline)] bg-[var(--background)] p-3 text-sm text-[var(--text-secondary)]">
          {hoverPanel}
        </div>
      )}
    </div>
  );
}
