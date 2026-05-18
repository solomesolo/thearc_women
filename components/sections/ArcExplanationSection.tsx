"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { homepageContent } from "@/content/homepage";

const defaultContent = homepageContent.arcExplanation;
const easeOut = [0, 0, 0.2, 1] as const;

const NODES = [
  { id: "cycle", label: "Cycle", x: 12, y: 18 },
  { id: "labs", label: "Uploaded records", x: 72, y: 12 },
  { id: "hormones", label: "Hormones", x: 88, y: 42 },
  { id: "timeline", label: "Timeline", x: 78, y: 72 },
  { id: "gaps", label: "Unresolved areas", x: 38, y: 82 },
  { id: "recs", label: "Recommendations", x: 8, y: 58 },
] as const;

const EDGES: [string, string][] = [
  ["cycle", "recs"],
  ["recs", "gaps"],
  ["gaps", "timeline"],
  ["timeline", "hormones"],
  ["hormones", "labs"],
  ["labs", "cycle"],
];

const nodeById = Object.fromEntries(NODES.map((n) => [n.id, n]));

type ArcExplanationSectionProps = {
  headline?: string;
  bodyLead?: string;
  bodyPoints?: readonly string[];
  bodyClosing?: string;
};

export function ArcExplanationSection({
  headline = defaultContent.headline,
  bodyLead = defaultContent.bodyLead,
  bodyPoints = defaultContent.bodyPoints,
  bodyClosing = defaultContent.bodyClosing,
}: ArcExplanationSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start end", "end start"],
  });

  const connectProgress = useTransform(scrollYProgress, [0.2, 0.75], [0, 1]);
  const nodeOpacity = useTransform(connectProgress, (p) => 0.35 + p * 0.65);
  const hubOpacity = useTransform(connectProgress, (p) => p * 0.35);

  return (
    <Section
      id="arc-explanation"
      variant="default"
      className="scroll-mt-20 py-24 md:py-32 lg:py-36"
    >
      <Container>
        <div
          ref={wrapRef}
          className="grid grid-cols-1 items-center gap-12 md:grid-cols-12 md:gap-10 lg:gap-14"
        >
          <motion.div
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.65, ease: easeOut }}
            className="md:col-span-5"
          >
            <h2 className="max-w-[18ch] text-[1.75rem] font-medium leading-[1.14] tracking-tight text-[#0c0c0c] sm:text-[2rem] md:text-[2.25rem] lg:text-[2.5rem]">
              {headline}
            </h2>
            <p className="mt-8 text-[0.9375rem] font-medium uppercase tracking-[0.14em] text-[#737373]">
              {bodyLead}
            </p>
            <ul className="mt-4 space-y-2.5 border-l border-black/[0.1] pl-5">
              {bodyPoints.map((point) => (
                <li
                  key={point}
                  className="text-[1rem] leading-[1.6] text-[#404040] md:text-[1.0625rem]"
                >
                  {point}
                </li>
              ))}
            </ul>
            <p className="mt-8 max-w-[28rem] text-[0.9375rem] leading-[1.65] text-[#525252] md:text-base">
              {bodyClosing}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.7, delay: 0.08, ease: easeOut }}
            className="relative md:col-span-7"
          >
            <motion.div
              className="relative aspect-[5/4] w-full overflow-hidden rounded-[20px] border border-black/[0.08] bg-[linear-gradient(160deg,#f5f4f2_0%,#fafaf9_45%,#f0eeeb_100%)] p-6 md:p-8"
              style={{ opacity: nodeOpacity }}
            >
              <svg
                viewBox="0 0 100 100"
                className="h-full w-full"
                aria-hidden
                role="presentation"
              >
                {EDGES.map(([a, b]) => {
                  const na = nodeById[a];
                  const nb = nodeById[b];
                  return (
                    <motion.line
                      key={`${a}-${b}`}
                      x1={na.x}
                      y1={na.y}
                      x2={nb.x}
                      y2={nb.y}
                      stroke="#0c0c0c"
                      strokeWidth="0.35"
                      style={{
                        pathLength: connectProgress,
                        opacity: connectProgress,
                      }}
                    />
                  );
                })}
                {NODES.map((node) => (
                  <g key={node.id}>
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="3.2"
                      fill="#fafaf9"
                      stroke="#0c0c0c"
                      strokeWidth="0.5"
                    />
                    <text
                      x={node.x}
                      y={node.y + 7}
                      textAnchor="middle"
                      className="fill-[#525252] text-[3.2px] font-medium"
                      style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
                    >
                      {node.label}
                    </text>
                  </g>
                ))}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="14"
                  fill="none"
                  stroke="#0c0c0c"
                  strokeWidth="0.25"
                  strokeDasharray="1 2"
                  style={{ opacity: hubOpacity }}
                />
              </svg>
            </motion.div>
            <p className="mt-5 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-[#a3a3a3] md:text-left">
              Your health, finally connected
            </p>
          </motion.div>
        </div>
      </Container>
    </Section>
  );
}
