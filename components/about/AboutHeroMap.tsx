"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type SystemMapNode = {
  id: string;
  label: string;
  insight: { title: string; signals: string[] };
};

type AboutHeroMapProps = {
  nodes: SystemMapNode[];
  connections: [string, string][];
};

const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  Hormones: { x: 50, y: 12 },
  Metabolism: { x: 82, y: 32 },
  Stress: { x: 18, y: 50 },
  Sleep: { x: 50, y: 88 },
  Recovery: { x: 82, y: 68 },
  Biomarkers: { x: 18, y: 28 },
};

export function AboutHeroMap({ nodes, connections }: AboutHeroMapProps) {
  const [hoverNode, setHoverNode] = useState<string | null>(null);

  const activeSet = useMemo(() => {
    if (!hoverNode) return new Set<string>();
    const set = new Set<string>([hoverNode]);
    connections.forEach(([a, b]) => {
      if (a === hoverNode || b === hoverNode) {
        set.add(a);
        set.add(b);
      }
    });
    return set;
  }, [hoverNode, connections]);

  const activeNode = hoverNode ? nodes.find((n) => n.id === hoverNode) : null;

  return (
    <div className="relative flex flex-col gap-4">
      <div className="relative aspect-square w-full min-h-[220px] max-w-[340px] mx-auto md:mx-0 md:max-w-none">
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full"
          style={{ overflow: "visible" }}
          aria-hidden
        >
          {/* Edges */}
          {connections.map(([a, b]) => {
            const pa = NODE_POSITIONS[a];
            const pb = NODE_POSITIONS[b];
            if (!pa || !pb) return null;
            const isActive =
              activeSet.size > 0 && (activeSet.has(a) && activeSet.has(b));
            return (
              <line
                key={`${a}-${b}`}
                x1={pa.x}
                y1={pa.y}
                x2={pb.x}
                y2={pb.y}
                stroke="var(--text-primary)"
                strokeOpacity={isActive ? 0.35 : 0.12}
                strokeWidth={isActive ? 0.5 : 0.35}
              />
            );
          })}
          {/* Nodes */}
          {nodes.map((node) => {
            const pos = NODE_POSITIONS[node.id];
            if (!pos) return null;
            const isActive = activeSet.has(node.id);
            const isHovered = hoverNode === node.id;
            return (
              <g
                key={node.id}
                onMouseEnter={() => setHoverNode(node.id)}
                onMouseLeave={() => setHoverNode(null)}
                style={{ cursor: "pointer" }}
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="14"
                  fill="transparent"
                />
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="6"
                  fill="var(--background)"
                  stroke="var(--text-primary)"
                  strokeOpacity={isActive ? 0.7 : 0.25}
                  strokeWidth={isHovered ? 0.8 : 0.45}
                />
                <text
                  x={pos.x}
                  y={pos.y + 11}
                  textAnchor="middle"
                  fill="var(--text-primary)"
                  fillOpacity={isActive ? 1 : 0.6}
                  fontSize="2.6"
                  fontWeight="500"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <AnimatePresence mode="wait">
        {activeNode ? (
          <motion.div
            key={activeNode.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="rounded-xl border border-black/[0.06] bg-[var(--color-surface)]/40 p-4"
          >
            <p className="text-sm font-medium leading-snug text-[var(--text-primary)]">
              {activeNode.insight.title}
            </p>
            <p className="mt-2 text-xs font-medium uppercase tracking-wider text-black/50">
              Signals
            </p>
            <ul className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-sm text-black/75">
              {activeNode.insight.signals.map((s, i) => (
                <li key={i}>• {s}</li>
              ))}
            </ul>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex min-h-[80px] items-center justify-center rounded-xl border border-dashed border-black/10 text-center text-sm text-black/45"
          >
            Hover a node to see how systems connect
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
