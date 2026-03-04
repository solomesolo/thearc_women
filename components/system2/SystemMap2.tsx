"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Domain } from "@/content/systemPageData";

const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  Hormones: { x: 50, y: 12 },
  Metabolism: { x: 82, y: 32 },
  Stress: { x: 18, y: 50 },
  Sleep: { x: 50, y: 88 },
  Recovery: { x: 82, y: 68 },
  Biomarkers: { x: 18, y: 28 },
};

type NodeInsight = { sentence: string; signals: string[]; traceId: string };

type SystemMap2Props = {
  domains: Domain[];
  connections: [string, string][];
  getNodeInsight: (domainId: string) => NodeInsight | null;
  selectedNodeId: string | null;
  onNodeHover: (id: string | null) => void;
  onNodeClick: (id: string) => void;
  onOpenTrace: (traceId: string) => void;
};

export function SystemMap2({
  domains,
  connections,
  getNodeInsight,
  selectedNodeId,
  onNodeHover,
  onNodeClick,
  onOpenTrace,
}: SystemMap2Props) {
  const [hoverNode, setHoverNode] = useState<string | null>(null);
  const activeId = hoverNode ?? selectedNodeId;

  const activeSet = useMemo(() => {
    if (!activeId) return new Set<string>();
    const set = new Set<string>([activeId]);
    connections.forEach(([a, b]) => {
      if (a === activeId || b === activeId) {
        set.add(a);
        set.add(b);
      }
    });
    return set;
  }, [activeId, connections]);

  const activeInsight = activeId ? getNodeInsight(activeId) : null;

  return (
    <div className="relative flex flex-col gap-4">
      <div className="relative aspect-square w-full min-h-[220px] max-w-[340px] mx-auto md:max-w-none">
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full"
          style={{ overflow: "visible" }}
          aria-hidden
        >
          {connections.map(([a, b]) => {
            const pa = NODE_POSITIONS[a];
            const pb = NODE_POSITIONS[b];
            if (!pa || !pb) return null;
            const isActive = activeSet.has(a) && activeSet.has(b);
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
          {domains.map((node) => {
            const pos = NODE_POSITIONS[node.id];
            if (!pos) return null;
            const isActive = activeSet.has(node.id);
            const isHovered = hoverNode === node.id;
            const isSelected = selectedNodeId === node.id;
            return (
              <g
                key={node.id}
                onMouseEnter={() => setHoverNode(node.id)}
                onMouseLeave={() => setHoverNode(null)}
                onClick={() => onNodeClick(node.id)}
                style={{ cursor: "pointer" }}
              >
                <circle cx={pos.x} cy={pos.y} r="14" fill="transparent" />
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="6"
                  fill="var(--background)"
                  stroke="var(--text-primary)"
                  strokeOpacity={isActive ? 0.7 : 0.25}
                  strokeWidth={isHovered || isSelected ? 0.8 : 0.45}
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
        {activeInsight ? (
          <motion.div
            key={activeId}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border border-black/[0.06] bg-[var(--color-surface)]/40 p-4"
          >
            <p className="text-sm font-medium leading-snug text-[var(--text-primary)]">
              {activeInsight.sentence}
            </p>
            {activeInsight.signals.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {activeInsight.signals.slice(0, 3).map((s, i) => (
                  <span
                    key={i}
                    className="rounded-md border border-black/10 bg-black/[0.03] px-2 py-0.5 text-xs text-black/75"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => onOpenTrace(activeInsight.traceId)}
              className="mt-3 text-sm font-medium text-[var(--text-primary)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)]/30 rounded"
            >
              Show reasoning
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex min-h-[80px] items-center justify-center rounded-xl border border-dashed border-black/10 text-center text-sm text-black/45"
          >
            Select a node to see how systems connect
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
