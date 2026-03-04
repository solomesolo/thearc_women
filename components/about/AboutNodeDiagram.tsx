"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const NODES = ["Hormones", "Metabolism", "Sleep", "Stress", "Recovery"];

type AboutNodeDiagramProps = {
  hoverPanel: string | null;
  onNodeHover: (node: string) => void;
  onNodeLeave: () => void;
  panels: Record<string, string>;
};

export function AboutNodeDiagram({
  hoverPanel,
  onNodeHover,
  onNodeLeave,
  panels,
}: AboutNodeDiagramProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  const positions: Record<string, { x: number; y: number }> = {
    Hormones: { x: 50, y: 15 },
    Metabolism: { x: 80, y: 35 },
    Sleep: { x: 20, y: 50 },
    Stress: { x: 50, y: 75 },
    Recovery: { x: 80, y: 55 },
  };

  const pairs: [string, string][] = [
    ["Hormones", "Metabolism"],
    ["Hormones", "Sleep"],
    ["Metabolism", "Recovery"],
    ["Stress", "Recovery"],
    ["Sleep", "Stress"],
  ];

  return (
    <div ref={ref} className="relative aspect-square max-h-[320px] w-full min-h-[240px]">
      <svg viewBox="0 0 100 100" className="h-full w-full" style={{ overflow: "visible" }}>
        {pairs.map(([a, b], i) => {
          const pa = positions[a];
          const pb = positions[b];
          if (!pa || !pb) return null;
          return (
            <motion.line
              key={`${a}-${b}`}
              x1={pa.x}
              y1={pa.y}
              x2={pb.x}
              y2={pb.y}
              stroke="var(--text-primary)"
              strokeWidth="0.35"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 0.18 } : { opacity: 0 }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
            />
          );
        })}
        {NODES.map((node, i) => {
          const pos = positions[node];
          if (!pos) return null;
          return (
            <g
              key={node}
              onMouseEnter={() => onNodeHover(node)}
              onMouseLeave={onNodeLeave}
              style={{ cursor: "pointer" }}
            >
              <circle cx={pos.x} cy={pos.y} r="12" fill="transparent" />
              <motion.circle
                cx={pos.x}
                cy={pos.y}
                r="5"
                fill="var(--background)"
                stroke="var(--text-primary)"
                strokeWidth="0.5"
                initial={{ scale: 0, opacity: 0 }}
                animate={inView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                transition={{ duration: 0.35, delay: 0.15 + i * 0.05 }}
              />
              <motion.text
                x={pos.x}
                y={pos.y + 10}
                textAnchor="middle"
                fill="var(--text-primary)"
                fontSize="2.8"
                fontWeight="500"
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + i * 0.04 }}
              >
                {node}
              </motion.text>
            </g>
          );
        })}
      </svg>
      {hoverPanel && panels[hoverPanel] && (
        <div className="absolute bottom-0 left-0 right-0 rounded-lg border border-[var(--color-border-hairline)] bg-[var(--background)] p-3 text-sm text-[var(--text-secondary)]">
          {panels[hoverPanel]}
        </div>
      )}
    </div>
  );
}
