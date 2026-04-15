import { HeroSection } from "@/components/sections/HeroSection";
import { WhatThisIsSection } from "@/components/sections/WhatThisIsSection";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { CoreFeaturesSection } from "@/components/sections/CoreFeaturesSection";
import { WhyThisMattersSection } from "@/components/sections/WhyThisMattersSection";
import { MentalModelSection } from "@/components/sections/MentalModelSection";
import { ReframeSection } from "@/components/sections/ReframeSection";
import { HealthIntelligenceReelSection } from "@/components/sections/HealthIntelligenceReelSection";
import { KnowledgeSection } from "@/components/home/KnowledgeSection";
import { IdentitySection } from "@/components/sections/IdentitySection";
import { FinalCTASection } from "@/components/sections/FinalCTASection";
import { FounderMessageSection } from "@/components/sections/FounderMessageSection";
import { homepageContent } from "@/content/homepage";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <WhatThisIsSection />
      <HowItWorksSection />
      <CoreFeaturesSection />
      <WhyThisMattersSection />
      <MentalModelSection />
      <ReframeSection />
      <KnowledgeSection />
      <HealthIntelligenceReelSection />
      <IdentitySection />
      <FounderMessageSection
        label={homepageContent.founderMessage.label}
        headline={homepageContent.founderMessage.headline}
        paragraphs={homepageContent.founderMessage.paragraphs}
        founderName={homepageContent.founderMessage.founderName}
        founderTitle={homepageContent.founderMessage.founderTitle}
        imageSrc={homepageContent.founderMessage.imageSrc}
        imageAlt={homepageContent.founderMessage.imageAlt}
      />
      <FinalCTASection />
    </main>
  );
}
