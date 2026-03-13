import { HeroSection } from "@/components/sections/HeroSection";
import { DesignConceptSection } from "@/components/sections/DesignConceptSection";
import { PersonalizationSection } from "@/components/sections/PersonalizationSection";
import { MirrorSection } from "@/components/sections/MirrorSection";
import { ReframeSection } from "@/components/sections/ReframeSection";
import { ProductIntroSection } from "@/components/sections/ProductIntroSection";
import { JourneySection } from "@/components/sections/JourneySection";
import { KnowledgeSection } from "@/components/home/KnowledgeSection";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { IdentitySection } from "@/components/sections/IdentitySection";
import { FinalCTASection } from "@/components/sections/FinalCTASection";
import { FounderMessageSection } from "@/components/sections/FounderMessageSection";
import { homepageContent } from "@/content/homepage";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <DesignConceptSection />
      <MirrorSection />
      <ReframeSection />
      <PersonalizationSection />
      <KnowledgeSection />
      <JourneySection />
      <ProductIntroSection />
      <HowItWorksSection />
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
