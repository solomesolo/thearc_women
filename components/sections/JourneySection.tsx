"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useReducedMotion } from "framer-motion";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { homepageContent } from "@/content/homepage";

const defaultContent = homepageContent.journey;

const easeOut = [0, 0, 0.2, 1] as const;

export type JourneyStage = {
  stageLabel: string;
  stageTitle: string;
  stageNarrative: readonly string[];
  stageTriggers?: readonly string[];
  stageExamples?: readonly string[];
  stageFooter?: string;
};

type JourneySectionProps = {
  headline?: string;
  subline?: string;
  stages?: readonly JourneyStage[];
};

const WHEEL_THROTTLE_MS = 800;

export function JourneySection({
  headline = defaultContent.headline,
  subline = defaultContent.subline,
  stages = defaultContent.stages,
}: JourneySectionProps) {
  const [activeStage, setActiveStage] = useState(0);
  const [hasHinted, setHasHinted] = useState(false);
  const [arcVisible, setArcVisible] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLDivElement>(null);
  const lastWheelTime = useRef(0);

  const transitionDuration = prefersReducedMotion ? 0.2 : 0.95;
  const stageVariants = prefersReducedMotion
    ? { enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        enter: { opacity: 0, y: 4 },
        center: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -4 },
      };
  const stageTransition = {
    duration: transitionDuration,
    ease: easeOut,
  };

  const goTo = useCallback(
    (index: number) => {
      const next = Math.max(0, Math.min(index, (stages?.length ?? 1) - 1));
      setActiveStage(next);
    },
    [stages?.length]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (typeof window === "undefined") return;
      const isDesktop = window.matchMedia("(min-width: 768px)").matches;
      if (!isDesktop || !canvasRef.current || !stages?.length) return;

      const now = Date.now();
      if (now - lastWheelTime.current < WHEEL_THROTTLE_MS) return;

      const atLast = activeStage >= stages.length - 1;
      const atFirst = activeStage <= 0;

      if (e.deltaY > 0) {
        if (atLast) return;
        e.preventDefault();
        lastWheelTime.current = now;
        setActiveStage((prev) => Math.min(prev + 1, stages.length - 1));
      } else {
        if (atFirst) return;
        e.preventDefault();
        lastWheelTime.current = now;
        setActiveStage((prev) => Math.max(prev - 1, 0));
      }
    },
    [activeStage, stages?.length]
  );

  useEffect(() => {
    if (hasHinted || prefersReducedMotion) return;
    const t = setTimeout(() => setHasHinted(true), 200);
    return () => clearTimeout(t);
  }, [hasHinted, prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) {
      setArcVisible(true);
      return;
    }
    const t = setTimeout(() => setArcVisible(true), 50);
    return () => clearTimeout(t);
  }, [prefersReducedMotion]);

  if (!stages?.length) return null;

  const current = stages[activeStage];

  return (
    <Section id="journey" variant="default" className="py-20 md:py-28">
      <Container>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-10 lg:gap-12 md:items-start">
          {/* Left zone: 5 cols, sticky on desktop */}
          <div className="md:col-span-5 md:sticky md:top-[120px]">
            <h2 className="text-left text-[1.875rem] font-medium leading-[1.2] tracking-tight text-[var(--text-primary)] md:text-[2.25rem] md:leading-[1.18] lg:text-[2.5rem]">
              {headline}
            </h2>
            {subline && (
              <p className="mt-5 text-left text-base leading-[1.65] text-[var(--text-secondary)] md:mt-6 md:text-lg md:leading-[1.7]">
                {subline}
              </p>
            )}
          </div>

          {/* Right zone: 7 cols — Arc Canvas, max-width for balance */}
          <div className="md:col-span-7 md:col-start-6 max-md:max-w-full md:max-w-[90%] lg:max-w-[85%]">
            <div
              ref={canvasRef}
              onWheel={handleWheel}
              className="journey-canvas relative min-h-[420px] overflow-hidden rounded-[22px] border border-[#e6e4e2] px-5 py-6 md:min-h-[520px] md:px-8 md:py-9"
              style={{
                background:
                  "linear-gradient(168deg, #fcfcfb 0%, #fafaf9 35%, #f8f7f6 100%)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
              }}
            >
              {/* Faint noise overlay — opacity 0.03–0.06 */}
              <div
                className="pointer-events-none absolute inset-0 rounded-[22px] opacity-[0.045]"
                aria-hidden
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                }}
              />

              {/* Arc path: lower left → upper right; one-time fade-in 1.2s */}
              <svg
                className="pointer-events-none absolute left-0 top-0 h-full w-full md:left-[200px] md:w-[calc(100%-200px)]"
                aria-hidden
              >
                <path
                  d="M 0 85 Q 35% 25%, 70% 40% T 100% 20%"
                  fill="none"
                  stroke="var(--text-primary, #0c0c0c)"
                  strokeWidth="1"
                  style={{
                    strokeOpacity: arcVisible ? 0.08 : 0,
                    transition: prefersReducedMotion ? "none" : "stroke-opacity 1.2s ease-out",
                  }}
                />
                {/* Faint nodes along curve */}
                <circle cx="18%" cy="58%" r="1.5" fill="var(--text-primary)" style={{ opacity: arcVisible ? 0.05 : 0, transition: prefersReducedMotion ? "none" : "opacity 1s ease-out" }} />
                <circle cx="45%" cy="38%" r="1.5" fill="var(--text-primary)" style={{ opacity: arcVisible ? 0.05 : 0, transition: prefersReducedMotion ? "none" : "opacity 1.1s ease-out" }} />
                <circle cx="78%" cy="28%" r="1.5" fill="var(--text-primary)" style={{ opacity: arcVisible ? 0.05 : 0, transition: prefersReducedMotion ? "none" : "opacity 1.2s ease-out" }} />
              </svg>

              <div className="relative flex min-h-[360px] flex-col md:min-h-[460px] md:flex-row">
                {/* Stage Index — scrolls inside canvas so page scroll is independent; all stages reachable */}
                <nav
                  className="journey-index mb-6 flex shrink-0 flex-col md:mb-0 md:w-[200px] md:flex-col md:pb-0"
                  aria-label="Journey stages"
                >
                  <p className="mb-3 shrink-0 text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--text-secondary)] md:mb-4">
                    The Arc Stages
                  </p>
                  <div className="flex gap-3 overflow-x-auto pb-2 md:max-h-[380px] md:min-h-0 md:flex-col md:gap-2.5 md:overflow-y-auto md:overflow-x-hidden md:pb-2 md:pr-1">
                    {stages.map((stage, i) => {
                      const isActive = activeStage === i;
                      const showHint = !hasHinted && isActive;
                      return (
                        <button
                          key={stage.stageLabel}
                          type="button"
                          onClick={() => goTo(i)}
                          aria-current={isActive ? "step" : undefined}
                          aria-label={`Show stage: ${stage.stageLabel}`}
                          className={`
                            journey-stage-btn shrink-0 text-left text-[12px] tracking-[0.04em]
                            md:text-[13px] md:leading-[1.35]
                            ${isActive ? "journey-stage-btn-active pl-3 md:pl-3" : "journey-stage-btn-inactive pl-0"}
                            ${showHint ? "journey-stage-btn-hint" : ""}
                          `}
                        >
                          {stage.stageLabel}
                        </button>
                      );
                    })}
                  </div>
                </nav>

                {/* Stage Card — reserved min-height to avoid layout jump */}
                <div className="relative min-h-[280px] min-w-0 flex-1 pl-0 md:min-h-[320px] md:pl-8">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={activeStage}
                      variants={stageVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={stageTransition}
                      className="text-left"
                    >
                      <p
                        className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--text-secondary)] md:text-[12px]"
                        style={{ letterSpacing: "0.1em" }}
                      >
                        {current.stageLabel}
                      </p>
                      <h3 className="mt-4 text-[22px] font-medium leading-[1.15] tracking-tight text-[var(--text-primary)] md:mt-5 md:text-[28px] md:leading-[1.12] lg:text-[30px]">
                        {current.stageTitle}
                      </h3>
                      <div className="mt-5 space-y-4 md:mt-6 md:space-y-5">
                        {current.stageNarrative.map((line, i) => (
                          <p
                            key={i}
                            className={`text-base leading-[1.7] md:text-[17px] md:leading-[1.75] ${
                              i === 0
                                ? "text-[var(--text-primary)]"
                                : "text-[var(--text-secondary)]"
                            }`}
                          >
                            {line}
                          </p>
                        ))}
                      </div>
                      {current.stageTriggers && current.stageTriggers.length > 0 && (
                        <div className="mt-6 space-y-2 md:mt-7">
                          {current.stageTriggers.map((t, i) => (
                            <p
                              key={i}
                              className="text-sm leading-[1.5] text-[var(--text-secondary)]"
                            >
                              {t}
                            </p>
                          ))}
                        </div>
                      )}
                      {current.stageExamples &&
                        current.stageExamples.length > 0 && (
                          <div className="mt-6 space-y-2 md:mt-7">
                            {current.stageExamples.map((ex, i) => (
                              <p
                                key={i}
                                className="text-sm leading-[1.5] text-[var(--text-secondary)]"
                              >
                                {ex}
                              </p>
                            ))}
                          </div>
                        )}
                      {current.stageFooter && (
                        <p className="mt-6 text-base leading-[1.7] text-[var(--text-primary)] md:mt-8 md:text-lg md:leading-[1.75]">
                          {current.stageFooter}
                        </p>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
