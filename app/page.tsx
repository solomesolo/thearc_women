import { HeroSection } from "@/components/sections/HeroSection";
import { DesignConceptSection } from "@/components/sections/DesignConceptSection";
import { PersonalizationSection } from "@/components/sections/PersonalizationSection";
import { MirrorSection } from "@/components/sections/MirrorSection";
import { ReframeSection } from "@/components/sections/ReframeSection";
import { ProductIntroSection } from "@/components/sections/ProductIntroSection";
import { JourneySection } from "@/components/sections/JourneySection";
import { KnowledgeSection } from "@/components/sections/KnowledgeSection";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { IdentitySection } from "@/components/sections/IdentitySection";
import { DifferentiationSection } from "@/components/sections/DifferentiationSection";
import { FinalCTASection } from "@/components/sections/FinalCTASection";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <DesignConceptSection />
      <PersonalizationSection />
      <MirrorSection />
      <ReframeSection />
      <JourneySection />
      <ProductIntroSection />
      <KnowledgeSection />
      <HowItWorksSection />
      <IdentitySection />
      <DifferentiationSection />
      <FinalCTASection />
    </main>
  );
}
