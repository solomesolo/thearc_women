"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

const NODES = ["Hormones", "Metabolism", "Stress", "Recovery", "Sleep", "Biomarkers"];

const CONNECTIONS: [string, string][] = [
  ["Hormones", "Metabolism"],
  ["Metabolism", "Recovery"],
  ["Stress", "Sleep"],
  ["Recovery", "Stress"],
  ["Sleep", "Hormones"],
  ["Biomarkers", "Metabolism"],
  ["Hormones", "Recovery"],
];

const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  Hormones: { x: 20, y: 15 },
  Metabolism: { x: 50, y: 25 },
  Stress: { x: 80, y: 15 },
  Recovery: { x: 35, y: 55 },
  Sleep: { x: 65, y: 55 },
  Biomarkers: { x: 50, y: 85 },
};

function getConnectedEdges(node: string): Set<string> {
  const set = new Set<string>();
  for (const [a, b] of CONNECTIONS) {
    if (a === node || b === node) set.add(`${a}-${b}`);
  }
  return set;
}

type SystemMapProps = {
  insights: Record<string, string>;
};

export function SystemMap({ insights }: SystemMapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [activeNode, setActiveNode] = useState<string | null>(null);

  const highlightedEdges = activeNode ? getConnectedEdges(activeNode) : new Set<string>();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveNode(null);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative flex flex-col gap-4 md:flex-row md:items-stretch">
      <div
        ref={ref}
        className="relative aspect-square max-h-[340px] w-full min-h-[260px] md:max-w-[320px] md:max-h-[380px]"
      >
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full"
          style={{ overflow: "visible" }}
          aria-label="Biological system map"
        >
          {CONNECTIONS.map(([a, b]) => {
            const pa = NODE_POSITIONS[a];
            const pb = NODE_POSITIONS[b];
            if (!pa || !pb) return null;
            const key = `${a}-${b}`;
            const isHighlighted = activeNode && highlightedEdges.has(key);
            return (
              <motion.line
                key={key}
                x1={pa.x}
                y1={pa.y}
                x2={pb.x}
                y2={pb.y}
                stroke="var(--text-primary)"
                strokeWidth="0.35"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: inView ? (isHighlighted ? 0.45 : 0.15) : 0,
                }}
                transition={{ duration: 0.22, ease: [0, 0, 0.2, 1] }}
              />
            );
          })}
          {NODES.map((node, i) => {
            const pos = NODE_POSITIONS[node];
            if (!pos) return null;
            const isActive = activeNode === node;
            return (
              <g
                key={node}
                onMouseEnter={() => setActiveNode(node)}
                onMouseLeave={() => setActiveNode(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveNode(isActive ? null : node);
                }}
                style={{ cursor: "pointer" }}
                tabIndex={0}
                role="button"
                aria-pressed={isActive}
                aria-label={`${node}. ${insights[node] ?? ""}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveNode(isActive ? null : node);
                  }
                }}
              >
                <circle cx={pos.x} cy={pos.y} r="14" fill="transparent" />
                <motion.circle
                  cx={pos.x}
                  cy={pos.y}
                  r="5.5"
                  fill="var(--background)"
                  stroke="var(--text-primary)"
                  strokeWidth={isActive ? "0.8" : "0.4"}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: inView ? 1 : 0,
                    opacity: inView ? 1 : 0,
                  }}
                  transition={{
                    duration: 0.35,
                    delay: 0.08 + i * 0.04,
                    ease: [0, 0, 0.2, 1],
                  }}
                />
                <motion.text
                  x={pos.x}
                  y={pos.y + 11}
                  textAnchor="middle"
                  fill="var(--text-primary)"
                  fontSize="2.9"
                  fontWeight="500"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: inView ? (isActive ? 1 : 0.85) : 0,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {node}
                </motion.text>
              </g>
            );
          })}
        </svg>
      </div>
      <AnimatePresence mode="wait">
        {activeNode && insights[activeNode] ? (
          <motion.div
            key={activeNode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="min-h-[80px] rounded-xl border border-black/10 bg-[var(--background)] p-4 text-sm leading-relaxed text-black/80 md:min-w-[200px] md:max-w-[240px]"
            role="region"
            aria-live="polite"
            aria-label={`Insight for ${activeNode}`}
          >
            <p className="font-medium text-[var(--text-primary)]">{activeNode}</p>
            <p className="mt-1.5">{insights[activeNode]}</p>
          </motion.div>
        ) : (
          <div
            className="hidden min-h-[80px] min-w-[200px] rounded-xl border border-transparent md:block"
            aria-hidden
          />
        )}
      </AnimatePresence>
    </div>
  );
}
