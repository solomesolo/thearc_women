import { HeroSection } from "@/components/sections/HeroSection";
import { ProblemSection } from "@/components/sections/ProblemSection";
import { SolutionSection } from "@/components/sections/SolutionSection";
import { HowItWorksSimpleSection } from "@/components/sections/HowItWorksSimpleSection";
import { ProductPreviewSection } from "@/components/sections/ProductPreviewSection";
import { ActionLayerSection } from "@/components/sections/ActionLayerSection";
import { KnowledgeHubSection } from "@/components/sections/KnowledgeHubSection";
import { DifferentiationNewSection } from "@/components/sections/DifferentiationNewSection";
import { FounderMessageSection } from "@/components/sections/FounderMessageSection";
import { TrustSection } from "@/components/sections/TrustSection";
import { PricingSection } from "@/components/sections/PricingSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { FinalCTASection } from "@/components/sections/FinalCTASection";
import { homepageDeContent as c } from "@/content/homepage.de";

export default function HomeDE() {
  return (
    <main lang="de">
      <HeroSection
        eyebrow={c.hero.eyebrow}
        headline={c.hero.headline}
        supporting={c.hero.supporting}
        secondarySupport={c.hero.secondarySupport}
        ctaPrimaryLabel={c.hero.ctaPrimaryLabel}
        ctaPrimaryHref={c.hero.ctaPrimaryHref}
        ctaSecondaryLabel={c.hero.ctaSecondaryLabel}
        ctaSecondaryHref={c.hero.ctaSecondaryHref}
        trustLine={c.hero.trustLine}
        flowTitle={c.hero.flowTitle}
        flowSteps={c.hero.flowSteps}
        whatsIncludedLabel={c.hero.whatsIncludedLabel}
        whatsIncludedItems={c.hero.whatsIncludedItems}
        imageSrc={c.hero.imageSrc}
        imageAlt={c.hero.imageAlt}
      />

      <ProblemSection
        label={c.problem.label}
        headline={c.problem.headline}
        cards={c.problem.cards}
        punchline={c.problem.punchline}
      />

      <SolutionSection
        label={c.solution.label}
        headline={c.solution.headline}
        pillars={c.solution.pillars}
      />

      <HowItWorksSimpleSection
        label={c.howItWorksSimple.label}
        headline={c.howItWorksSimple.headline}
        steps={c.howItWorksSimple.steps}
      />

      <ProductPreviewSection
        label={c.productPreview.label}
        headline={c.productPreview.headline}
        scoreLabel={c.productPreview.scoreLabel}
        scoreValue={c.productPreview.scoreValue}
        missingLabel={c.productPreview.missingLabel}
        missing={c.productPreview.missing}
        timelineLabel={c.productPreview.timelineLabel}
        timeline={c.productPreview.timeline}
        ctaLabel={c.productPreview.ctaLabel}
        ctaHref={c.productPreview.ctaHref}
      />

      <ActionLayerSection
        label={c.actionLayer.label}
        headline={c.actionLayer.headline}
        card={c.actionLayer.card}
        microcopy={c.actionLayer.microcopy}
      />

      <KnowledgeHubSection
        label={c.knowledgeHub.label}
        headline={c.knowledgeHub.headline}
        subheadline={c.knowledgeHub.subheadline}
        blocks={c.knowledgeHub.blocks}
        personalizationLabel={c.knowledgeHub.personalizationLabel}
        personalizationBody={c.knowledgeHub.personalizationBody}
        expertHeadline={c.knowledgeHub.expertHeadline}
        expertItems={c.knowledgeHub.expertItems}
        ctaLabel={c.knowledgeHub.ctaLabel}
        ctaHref={c.knowledgeHub.ctaHref}
      />

      <DifferentiationNewSection
        label={c.differentiationNew.label}
        headline={c.differentiationNew.headline}
        intro={c.differentiationNew.intro}
        left={c.differentiationNew.left}
        right={c.differentiationNew.right}
      />

      <FounderMessageSection
        label={c.founderMessage.label}
        headline={c.founderMessage.headline}
        paragraphs={c.founderMessage.paragraphs}
        founderName={c.founderMessage.founderName}
        founderTitle={c.founderMessage.founderTitle}
        imageSrc={c.founderMessage.imageSrc}
        imageAlt={c.founderMessage.imageAlt}
        secondary={undefined}
      />

      <TrustSection
        label={c.trust.label}
        headline={c.trust.headline}
        items={c.trust.items}
        microcopy={c.trust.microcopy}
      />

      <PricingSection
        label={c.pricing.label}
        headline={c.pricing.headline}
        subheadline={c.pricing.subheadline}
        plans={c.pricing.plans}
      />

      <FAQSection
        label={c.faq.label}
        headline={c.faq.headline}
        items={c.faq.items}
      />

      <FinalCTASection
        headline={c.finalCta.headline}
        supporting={c.finalCta.supporting}
        ctaPrimaryLabel={c.finalCta.ctaPrimaryLabel}
        ctaPrimaryHref={c.finalCta.ctaPrimaryHref}
        ctaSecondaryLabel={c.finalCta.ctaSecondaryLabel}
        ctaSecondaryHref={c.finalCta.ctaSecondaryHref}
        primaryMicrocopy={c.finalCta.primaryMicrocopy}
        trustSignals={c.finalCta.trustSignals}
        afterStartLabel={c.finalCta.afterStartLabel}
        afterStartItems={c.finalCta.afterStartItems}
      />
    </main>
  );
}
