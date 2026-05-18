import { HeroSection } from "@/components/sections/HeroSection";
import { WhatWomenMissSection } from "@/components/sections/WhatWomenMissSection";
import { ProblemSection } from "@/components/sections/ProblemSection";
import { SolutionSection } from "@/components/sections/SolutionSection";
import { HowItWorksSimpleSection } from "@/components/sections/HowItWorksSimpleSection";
import { ProductPreviewSection } from "@/components/sections/ProductPreviewSection";
import { ActionLayerSection } from "@/components/sections/ActionLayerSection";
import { KnowledgeHubSection } from "@/components/sections/KnowledgeHubSection";
import { DifferentiationNewSection } from "@/components/sections/DifferentiationNewSection";
import { FounderMessageSection } from "@/components/sections/FounderMessageSection";
import { TrustSection } from "@/components/sections/TrustSection";
import { FinalCTASection } from "@/components/sections/FinalCTASection";
import { homepageContent } from "@/content/homepage";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <ProblemSection />
      <WhatWomenMissSection />
      <SolutionSection />
      <HowItWorksSimpleSection />
      <ProductPreviewSection />
      <ActionLayerSection />
      <KnowledgeHubSection />
      <DifferentiationNewSection />
      <FounderMessageSection
        label={homepageContent.founderMessage.label}
        headline={homepageContent.founderMessage.headline}
        paragraphs={homepageContent.founderMessage.paragraphs}
        founderName={homepageContent.founderMessage.founderName}
        founderTitle={homepageContent.founderMessage.founderTitle}
        imageSrc={homepageContent.founderMessage.imageSrc}
        imageAlt={homepageContent.founderMessage.imageAlt}
        secondary={undefined}
      />
      <TrustSection />
      <FinalCTASection />
    </main>
  );
}
