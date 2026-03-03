import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { TAXONOMY_LABELS } from "../content/taxonomy";

const connectionString = process.env.DATABASE_URL ?? "postgresql://localhost:5432/thearc";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

type TaxonomyType =
  | "lifeStage"
  | "symptom"
  | "bodySystem"
  | "preventiveFocus"
  | "trending"
  | "biomarker"
  | "hormone"
  | "goal"
  | "rootCause"
  | "interventionType"
  | "evidenceLevel"
  | "contentAccess";

const DEMO_ARTICLES: {
  slug: string;
  title: string;
  excerpt: string;
  pillar: string | null;
  category: string | null;
  evidenceLevel: string | null;
  tagSlugs: string[];
  sources: { label: string; url?: string; evidenceNote?: string }[];
}[] = [
  {
    slug: "cortisol-ranges-by-phase",
    title: "Why cortisol ranges differ by phase",
    excerpt:
      "Reference intervals in studies often don't stratify by cycle phase.",
    pillar: "Trending",
    category: "Hormones",
    evidenceLevel: "observational",
    tagSlugs: ["cortisol", "estrogen", "reproductive", "biomarker"],
    sources: [
      {
        label: "Clinical endocrinology literature; cycle-stratified reference studies.",
      },
    ],
  },
  {
    slug: "sleep-architecture-recovery",
    title: "Sleep architecture and recovery metrics",
    excerpt: "How slow-wave sleep and HRV interact in trained women.",
    pillar: "Foundations",
    category: "Recovery",
    evidenceLevel: "observational",
    tagSlugs: ["sleep-disruption", "recovery", "nervous-system", "performance"],
    sources: [
      { label: "Sports medicine and sleep research; female-cohort studies." },
    ],
  },
  {
    slug: "supplement-claims-vs-evidence",
    title: "Supplement claims vs. evidence in women",
    excerpt: "A framework for reading the label and the literature.",
    pillar: "Foundations",
    category: "Supplements",
    evidenceLevel: "expert-opinion",
    tagSlugs: ["vitamin-d", "ferritin", "metabolic", "screening"],
    sources: [{ label: "Systematic reviews; FDA and regulatory guidance." }],
  },
  {
    slug: "longevity-protocols-female-physiology",
    title: "Longevity protocols and female physiology",
    excerpt: "What translates when the trials were mostly male.",
    pillar: "Trending",
    category: "Longevity",
    evidenceLevel: "observational",
    tagSlugs: ["longevity", "cardiometabolic", "perimenopause", "goal"],
    sources: [
      {
        label: "Longevity and aging research; sex-differences reviews.",
      },
    ],
  },
  {
    slug: "bone-density-before-menopause",
    title: "Bone density before menopause",
    excerpt: "Why baseline and timing matter for preventive screening.",
    pillar: "Foundations",
    category: "Preventive Health",
    evidenceLevel: "randomized",
    tagSlugs: ["bone-health", "postmenopause", "screening", "estrogen"],
    sources: [
      {
        label: "Osteoporosis prevention guidelines; female cohort studies.",
      },
    ],
  },
  {
    slug: "glucose-monitors-evidence",
    title: "Continuous glucose monitors: evidence for women",
    excerpt: "What the data actually says about CGM in non-diabetic women.",
    pillar: "Trending",
    category: "Metabolic",
    evidenceLevel: "observational",
    tagSlugs: ["glucose", "metabolic", "energy", "trending"],
    sources: [
      {
        label: "CGM trials; metabolic health in female athletes.",
        url: "https://example.com/cgm-review",
      },
    ],
  },
];

function sectionBody(index: number, title: string): string {
  const intro =
    "This section covers key concepts and evidence. Content is placeholder for demo.";
  if (index <= 5) return `${title}\n\n${intro}`;
  return `[Gated] ${title}\n\n${intro} — This section is gated in the product.`;
}

async function main() {
  const demoEmail = process.env.CREDENTIALS_EMAIL ?? "demo@thearc.com";
  console.log("Seeding subscriber (demo user)...");
  await prisma.subscriber.upsert({
    where: { email: demoEmail },
    create: { email: demoEmail, isActive: true },
    update: { isActive: true },
  });

  console.log("Seeding taxonomy tags...");
  for (const t of TAXONOMY_LABELS) {
    await prisma.taxonomyTag.upsert({
      where: { slug: t.slug },
      create: {
        slug: t.slug,
        label: t.label,
        type: t.type as TaxonomyType,
      },
      update: { label: t.label },
    });
  }

  const tagIds = await prisma.taxonomyTag.findMany().then((tags) =>
    Object.fromEntries(tags.map((tag) => [tag.slug, tag.id]))
  );

  console.log("Seeding demo articles...");
  const now = new Date();
  for (const a of DEMO_ARTICLES) {
    const article = await prisma.article.upsert({
      where: { slug: a.slug },
      create: {
        slug: a.slug,
        title: a.title,
        excerpt: a.excerpt,
        pillar: a.pillar,
        category: a.category,
        evidenceLevel: a.evidenceLevel,
        isPublished: true,
        publishedAt: now,
        updatedAt: now,
      },
      update: {
        title: a.title,
        excerpt: a.excerpt,
        pillar: a.pillar,
        category: a.category,
        evidenceLevel: a.evidenceLevel,
        isPublished: true,
        publishedAt: now,
        updatedAt: now,
      },
    });

    await prisma.articleSection.deleteMany({ where: { articleId: article.id } });
    const sectionTitles = [
      "Context",
      "Why this is trending",
      "What research says",
      "What this means for women",
      "When it might apply",
      "When it might not",
      "Implementation considerations",
    ];
    for (let i = 0; i < 7; i++) {
      const sectionIndex = i + 1;
      const title = sectionTitles[i];
      const isGated = sectionIndex >= 6;
      await prisma.articleSection.create({
        data: {
          articleId: article.id,
          sectionIndex,
          title,
          body: sectionBody(sectionIndex, title),
          isGated,
          updatedAt: now,
        },
      });
    }

    await prisma.articleSource.deleteMany({ where: { articleId: article.id } });
    for (const s of a.sources) {
      await prisma.articleSource.create({
        data: {
          articleId: article.id,
          label: s.label,
          url: s.url ?? null,
          evidenceNote: s.evidenceNote ?? null,
        },
      });
    }

    await prisma.articleTagJoin.deleteMany({ where: { articleId: article.id } });
    for (const slug of a.tagSlugs) {
      const tagId = tagIds[slug];
      if (tagId)
        await prisma.articleTagJoin.create({
          data: { articleId: article.id, tagId },
        });
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
