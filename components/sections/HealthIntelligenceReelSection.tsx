"use client";

import * as React from "react";
import { Section } from "@/components/ui/Section";

type Scene = {
  id: string;
  eyebrow?: string;
  headline: React.ReactNode;
  subline?: React.ReactNode;
  quote?: React.ReactNode;
  bgImage: string;
  overlay?: string;
  durationMs: number;
};

const SCENES: Scene[] = [
  {
    id: "hook",
    headline: (
      <>
        Your body is
        <br />
        <em className="not-italic text-[#EDD08E]">incredibly good</em>
        <br />
        at hiding disease.
      </>
    ),
    subline: "Until you look more closely.",
    bgImage:
      "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1800&fit=crop",
    overlay:
      "linear-gradient(160deg, rgba(10,7,4,.42) 0%, rgba(8,5,2,.32) 50%, rgba(12,8,4,.45) 100%)",
    durationMs: 9000,
  },
  {
    id: "imagine",
    eyebrow: "Imagine",
    headline: "The new you.",
    subline: (
      <>
        Energy supercharged · Memory sharper
        <br />
        Body fit · Mind &amp; Spirit{" "}
        <em className="font-[Cormorant] italic text-[#EDD08E]">awakened.</em>
      </>
    ),
    bgImage:
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1800&fit=crop",
    overlay:
      "linear-gradient(160deg, rgba(12,7,2,.58) 0%, rgba(8,4,1,.44) 50%, rgba(14,8,2,.60) 100%)",
    durationMs: 9000,
  },
  {
    id: "concierge",
    eyebrow: "Introducing",
    headline: (
      <>
        <em className="not-italic text-[#EDD08E]">The ARC</em> — your personal
        <br />
        health concierge.
      </>
    ),
    subline: (
      <>
        Built for women who refuse to wait for symptoms.
        <br />
        Because life is{" "}
        <em className="font-[Cormorant] italic text-[#EDD08E]">
          so very precious.
        </em>
      </>
    ),
    bgImage:
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1800&fit=crop",
    overlay: "rgba(10,7,4,.70)",
    durationMs: 9000,
  },
  {
    id: "data",
    eyebrow: "We believe",
    headline: (
      <>
        Better data leads to
        <br />
        <em className="not-italic text-[#EDD08E]">better health.</em>
      </>
    ),
    subline: (
      <>
        The ARC is transforming healthcare
        <br />
        from reactive to{" "}
        <em className="font-[Cormorant] italic text-[#EDD08E]">proactive.</em>
      </>
    ),
    bgImage:
      "https://images.unsplash.com/photo-1576671081837-49000212a370?w=1800&fit=crop",
    overlay: "rgba(10,7,4,.72)",
    durationMs: 9000,
  },
  {
    id: "time",
    eyebrow: "Because —",
    headline: (
      <span className="font-[Cormorant]">
        Time is not measured
        <br />
        in <em className="not-italic text-[#EDD08E]">possessions.</em>
      </span>
    ),
    subline: (
      <>
        It is the quality of life you gain.
        <br />
        The amazing experiences
        <br />
        you can{" "}
        <em className="font-[Cormorant] italic text-[#EDD08E]">create.</em>
      </>
    ),
    bgImage:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1800&fit=crop",
    overlay:
      "linear-gradient(160deg, rgba(12,7,2,.68) 0%, rgba(8,4,1,.52) 50%, rgba(14,8,2,.70) 100%)",
    durationMs: 10000,
  },
  {
    id: "limitless",
    headline: (
      <>
        When you are healthy,
        <br />
        possibility is{" "}
        <em className="not-italic text-[#EDD08E]">limitless.</em>
      </>
    ),
    bgImage:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1800&fit=crop",
    overlay:
      "linear-gradient(160deg, rgba(10,6,2,.62) 0%, rgba(7,4,1,.46) 50%, rgba(12,7,2,.64) 100%)",
    durationMs: 8000,
  },
  {
    id: "investment",
    eyebrow: "The ARC · Health Intelligence",
    headline: (
      <span className="font-[Cormorant]">
        This might be the{" "}
        <em className="not-italic text-[#EDD08E]">smartest investment</em>
        <br />
        you will ever make.
      </span>
    ),
    bgImage:
      "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=1800&fit=crop",
    overlay:
      "linear-gradient(160deg, rgba(12,7,2,.68) 0%, rgba(8,4,1,.52) 50%, rgba(14,8,2,.70) 100%)",
    durationMs: 9000,
  },
  {
    id: "closing",
    eyebrow: "The ARC · Health Intelligence",
    headline: (
      <>
        Designed to help you{" "}
        <em className="not-italic text-[#EDD08E]">thrive.</em>
      </>
    ),
    subline: (
      <>
        Life extended — healthy, happy,{" "}
        <em className="font-[Cormorant] italic text-[#EDD08E]">fully alive.</em>
      </>
    ),
    bgImage:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1800&fit=crop",
    overlay:
      "linear-gradient(160deg, rgba(12,7,2,.58) 0%, rgba(8,4,1,.44) 50%, rgba(14,8,2,.60) 100%)",
    durationMs: 11000,
  },
];

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

export function HealthIntelligenceReelSection() {
  const [idx, setIdx] = React.useState(0);
  const [progress, setProgress] = React.useState(0);
  const scene = SCENES[idx]!;

  React.useEffect(() => {
    let raf = 0;
    let start = performance.now();
    const tick = (t: number) => {
      const p = clamp01((t - start) / scene.durationMs);
      setProgress(p);
      if (p >= 1) {
        setIdx((v) => (v + 1) % SCENES.length);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [idx, scene.durationMs]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setIdx((v) => (v + 1) % SCENES.length);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setIdx((v) => (v - 1 + SCENES.length) % SCENES.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Section id="health-intelligence-reel" variant="default" className="py-0">
      <div className="w-full">
        <div className="overflow-hidden bg-[#0E0B08] shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
          {/* Letterbox bars */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[48px] bg-[#0A0806] z-20" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[48px] bg-[#0A0806] z-20" />

            {/* Brand + founders */}
            <div className="absolute left-6 top-[58px] z-30 hidden sm:flex items-center gap-3">
              <span className="font-[Cormorant] text-[13px] tracking-[0.55em] uppercase text-[#F2EBE0]">
                The ARC
              </span>
              <span className="h-[16px] w-px bg-[#B8894A]/70" aria-hidden />
              <span className="text-[10px] tracking-[0.42em] uppercase text-[#D4A96A] font-light">
                Health Intelligence
              </span>
            </div>

            {/* Counter */}
            <div className="absolute right-6 bottom-[58px] z-30 text-[10px] tracking-[0.32em] text-[#CDB99A] font-light">
              {String(idx + 1).padStart(2, "0")} — {String(SCENES.length).padStart(2, "0")}
            </div>

            {/* Reel body */}
            <div
              className="relative h-[620px] md:h-[720px] lg:h-[820px] cursor-pointer select-none"
              role="button"
              tabIndex={0}
              onClick={() => setIdx((v) => (v + 1) % SCENES.length)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setIdx((v) => (v + 1) % SCENES.length);
              }}
              aria-label="Advance reel"
            >
              {/* Background */}
              <div
                className="absolute -inset-[6%] bg-cover bg-center transition-transform duration-[14000ms] ease-out"
                style={{
                  backgroundImage: `url('${scene.bgImage}')`,
                  transform: "scale(1.02)",
                }}
                aria-hidden
              />

              {/* Overlays */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    scene.overlay ??
                    "linear-gradient(160deg, rgba(14,11,7,.80) 0%, rgba(10,8,5,.68) 50%, rgba(16,12,8,.82) 100%)",
                }}
                aria-hidden
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse at center, transparent 25%, rgba(8,6,3,.62) 100%)",
                }}
                aria-hidden
              />

              {/* Copy */}
              <div className="relative z-10 flex h-full items-center justify-center px-6 md:px-10">
                <div className="w-full max-w-[960px] text-center">
                  {scene.eyebrow && (
                    <div className="text-[12px] tracking-[0.48em] uppercase text-[#D4A96A] font-light">
                      {scene.eyebrow}
                    </div>
                  )}
                  <div
                    className="mx-auto mt-5 h-px"
                    style={{
                      width: "min(220px, 24vw)",
                      background:
                        "linear-gradient(90deg, transparent, #B8894A, transparent)",
                    }}
                    aria-hidden
                  />
                  <div className="mt-7 font-[Cormorant] text-[#F7F0E6] leading-[1.08] tracking-[0.01em] text-[52px] md:text-[78px] lg:text-[96px] drop-shadow-[0_3px_32px_rgba(8,5,2,.85)]">
                    {scene.headline}
                  </div>
                  {scene.subline && (
                    <div className="mt-8 text-[#EDD9BE] font-light leading-[1.85] text-[17px] md:text-[22px] drop-shadow-[0_1px_14px_rgba(8,5,2,.75)]">
                      {scene.subline}
                    </div>
                  )}
                  {scene.quote && (
                    <div className="mt-8 font-[Cormorant] italic font-light text-[#CDB99A] leading-[1.65] text-[18px] md:text-[24px]">
                      {scene.quote}
                    </div>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="absolute inset-x-0 bottom-0 z-30 h-[2px] bg-transparent">
                <div
                  className="h-full opacity-75"
                  style={{
                    width: `${Math.round(progress * 100)}%`,
                    background: "linear-gradient(90deg, #B8894A, #EDD08E)",
                  }}
                  aria-hidden
                />
              </div>

              {/* Help hint */}
              <div className="absolute left-6 bottom-[58px] z-30 hidden sm:block text-[10px] tracking-[0.22em] uppercase text-[#CDB99A]/90 font-light">
                Click to advance · ← / → keys
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

