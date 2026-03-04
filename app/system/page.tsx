"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/system/ScrollReveal";
import { PageFrame } from "@/components/layout/PageFrame";
import { Section } from "@/components/layout/Section";
import { OnThisPageNav } from "@/components/layout/OnThisPageNav";
import { SystemMap } from "@/components/system/SystemMap";
import { MappingSteps } from "@/components/system/MappingSteps";
import { MicroDemo } from "@/components/system/MicroDemo";
import { LensExplorer } from "@/components/system/LensExplorer";
import { HealthMemoryTimeline } from "@/components/system/HealthMemoryTimeline";
import { WeeklyBriefPreview } from "@/components/system/WeeklyBriefPreview";
import { PreventiveRadar } from "@/components/system/PreventiveRadar";
import { DataInterpretationDemo } from "@/components/system/DataInterpretationDemo";
import { systemPage } from "@/content/system";

const SYSTEM_NAV_ITEMS = [
  { id: "biological-mapping", label: "Biological Mapping" },
  { id: "micro-demo", label: "How it interprets" },
  { id: "biological-lens", label: "Your Biological Lens" },
  { id: "health-memory", label: "The Health Memory" },
  { id: "weekly-brief", label: "Weekly Brief" },
  { id: "preventive-planning", label: "Preventive Planning" },
  { id: "data-interpretation", label: "Data Interpretation" },
];

/** Hero background texture (min 1600px, desaturated). Use .jpg when final asset is in place. */
const SYSTEM_BIO_TEXTURE = "/images/system-bio-texture.svg";
export default function SystemPage() {
  const [expandedPill, setExpandedPill] = useState<string | null>(null);
  const pillsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pillsRef.current && !pillsRef.current.contains(e.target as Node)) {
        setExpandedPill(null);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <PageFrame variant="standard">
        <div className="lg:grid lg:grid-cols-[1fr_200px] lg:gap-12">
          <div>
            {/* Hero: 3-line narrative + proof pills, right SystemMap with texture */}
            <Section noPadding divider={false}>
              <div className="content-hero-pt py-16 md:py-24 relative">
                <div className="grid grid-cols-12 gap-12 md:items-center">
                  <div className="col-span-12 md:col-span-6">
                    <ScrollReveal>
                      <div className="max-w-[680px]">
                        <h1 className="text-4xl font-semibold tracking-tight text-[var(--text-primary)] md:text-5xl">
                          {systemPage.hero.headline}
                        </h1>
                        <p className="mt-4 text-base leading-relaxed text-black/70 md:mt-6 md:text-lg">
                          {systemPage.hero.bodyLine1}
                        </p>
                        <p className="mt-2 text-base leading-relaxed text-black/70 md:text-lg">
                          {systemPage.hero.bodyLine2}
                        </p>
                        <p className="mt-2 text-base leading-relaxed text-black/70 md:text-lg">
                          {systemPage.hero.bodyLine3}
                        </p>
                        <div ref={pillsRef} className="mt-6 flex flex-wrap gap-2">
                          {systemPage.hero.proofPills.map((pill) => {
                            const isOpen = expandedPill === pill.id;
                            return (
                              <div key={pill.id} className="relative">
                                <button
                                  type="button"
                                  onClick={() => setExpandedPill(isOpen ? null : pill.id)}
                                  onMouseEnter={() => setExpandedPill(pill.id)}
                                  onMouseLeave={() => setExpandedPill(null)}
                                  aria-expanded={isOpen}
                                  aria-describedby={isOpen ? `pill-${pill.id}` : undefined}
                                  className="rounded-full border border-black/10 bg-[var(--background)] px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-black/20"
                                >
                                  {pill.label}
                                </button>
                                {isOpen && (
                                  <div
                                    id={`pill-${pill.id}`}
                                    role="tooltip"
                                    className="absolute left-0 top-full z-10 mt-1.5 max-w-[280px] rounded-lg border border-black/10 bg-[var(--background)] p-3 shadow-lg md:max-w-[320px]"
                                  >
                                    <p className="text-xs leading-relaxed text-black/80">
                                      {pill.tooltip}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </ScrollReveal>
                  </div>
                  <div className="relative col-span-12 md:col-span-6">
                    <div
                      className="absolute inset-0 -z-10 overflow-hidden rounded-2xl opacity-[0.08] pointer-events-none"
                      aria-hidden
                    >
                      <Image
                        src={SYSTEM_BIO_TEXTURE}
                        alt=""
                        fill
                        className="object-cover blur-sm scale-[1.15]"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                    <ScrollReveal delay={0.15}>
                      <SystemMap insights={systemPage.systemMapInsights} />
                    </ScrollReveal>
                  </div>
                </div>
              </div>
            </Section>

            <Section
              id="biological-mapping"
              title={systemPage.biologicalMapping.title}
            >
              <ScrollReveal>
                <MappingSteps
                  intro={systemPage.biologicalMapping.intro}
                  steps={systemPage.biologicalMapping.steps}
                  tabs={systemPage.biologicalMapping.tabs}
                />
              </ScrollReveal>
            </Section>

            <Section id="micro-demo" title={systemPage.microDemo.title}>
              <ScrollReveal>
                <MicroDemo
                  signals={systemPage.microDemo.signals}
                  outputs={systemPage.microDemo.outputs}
                />
              </ScrollReveal>
            </Section>

            <Section id="biological-lens" title={systemPage.lens.title}>
              <ScrollReveal>
                <LensExplorer
                  shortIntro={systemPage.lens.shortIntro}
                  lenses={systemPage.lens.lenses}
                />
              </ScrollReveal>
            </Section>

            <Section id="health-memory" title={systemPage.healthMemory.title}>
              <ScrollReveal>
                <HealthMemoryTimeline
                  shortIntro={systemPage.healthMemory.shortIntro}
                  timelineEvents={systemPage.healthMemory.timelineEvents}
                />
              </ScrollReveal>
            </Section>

            <Section id="weekly-brief" title={systemPage.weeklyBrief.title}>
              <ScrollReveal>
                <WeeklyBriefPreview
                  shortIntro={systemPage.weeklyBrief.shortIntro}
                  tabs={systemPage.weeklyBrief.tabs}
                  patterns={systemPage.weeklyBrief.patterns}
                  interactions={systemPage.weeklyBrief.interactions}
                  research={systemPage.weeklyBrief.research}
                />
              </ScrollReveal>
            </Section>

            <Section id="preventive-planning" title={systemPage.preventive.title}>
              <ScrollReveal>
                <PreventiveRadar
                  shortIntro={systemPage.preventive.shortIntro}
                  domains={systemPage.preventive.domains}
                />
              </ScrollReveal>
            </Section>

            <Section id="data-interpretation" title={systemPage.dataInterpretation.title}>
              <div className="mt-4 md:mt-6">
                <DataInterpretationDemo
                  narrative={systemPage.dataInterpretation.narrative}
                  signalTypes={systemPage.dataInterpretation.signalTypes as { id: "wearable" | "labs" | "symptoms" | "research"; label: string }[]}
                  interpretationData={systemPage.dataInterpretation.interpretationData}
                />
              </div>
            </Section>

            <Section divider className="pb-24 text-center md:pb-32">
              <ScrollReveal>
                <p className="text-xl font-semibold leading-snug text-[var(--text-primary)] md:text-2xl">
                  {systemPage.closing.line1}
                </p>
                <p className="mt-2 text-xl font-semibold leading-snug text-[var(--text-primary)] md:text-2xl">
                  {systemPage.closing.line2}
                </p>
                <Link
                  href={systemPage.closing.ctaHref}
                  className="mt-8 inline-block rounded-[14px] border border-[var(--foreground)] bg-[var(--foreground)] px-6 py-3 text-sm font-medium text-[var(--background)] no-underline transition-opacity hover:opacity-90"
                >
                  {systemPage.closing.ctaLabel}
                </Link>
              </ScrollReveal>
            </Section>
          </div>

          <OnThisPageNav items={SYSTEM_NAV_ITEMS} className="lg:pt-[7rem]" />
        </div>
      </PageFrame>
    </main>
  );
}
