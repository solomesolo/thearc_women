export const KNOWLEDGE_FILTERS = [
  "Energy & Performance",
  "Hormones",
  "Training & Recovery",
  "Longevity",
  "Preventive Health",
  "Supplements",
  "Beauty & Skin",
  "Mental Resilience",
] as const;

export type KnowledgeCategory = (typeof KNOWLEDGE_FILTERS)[number];

export type KnowledgeArticle = {
  slug: string;
  title: string;
  abstract: string;
  category: KnowledgeCategory;
  readTime: string;
  date: string;
  whyItMattersForWomen?: string;
  // Article page content
  contextParagraph?: string;
  whyTrending?: string;
  whatResearchSays?: string;
  whatItMeansForWomen?: string;
  whenItApplies?: string;
  whenItDoesNot?: string;
  implementationConsiderations?: string;
  sources?: string[];
};

export const KNOWLEDGE_ARTICLES: KnowledgeArticle[] = [
  {
    slug: "cortisol-ranges-by-phase",
    title: "Why cortisol ranges differ by phase",
    abstract:
      "Reference intervals in studies often don't stratify by cycle phase.",
    category: "Hormones",
    readTime: "4 min",
    date: "2025-02-20",
    whyItMattersForWomen: "Lab 'normal' may not match your phase.",
    contextParagraph:
      "Cortisol reference ranges in routine labs are typically derived from mixed populations and single time points. For women, phase matters.",
    whyTrending:
      "More women are tracking cycle and asking why their 'normal' labs don't match how they feel.",
    whatResearchSays:
      "Cortisol shows measurable variation across the menstrual cycle; follicular phase often shows higher basal levels and different stress reactivity than luteal.",
    whatItMeansForWomen:
      "A result flagged 'high' or 'low' may be phase-appropriate. Context from your cycle improves interpretation.",
    whenItApplies:
      "When you're comparing labs over time or interpreting stress or adrenal markers.",
    whenItDoesNot:
      "When the clinical question is acute (e.g., ruling out pathology) rather than optimization.",
    implementationConsiderations:
      "Note cycle day and phase on lab requisitions; consider repeating borderline values in another phase.",
    sources: ["Clinical endocrinology literature; cycle-stratified reference studies."],
  },
  {
    slug: "sleep-architecture-recovery",
    title: "Sleep architecture and recovery metrics",
    abstract: "How slow-wave sleep and HRV interact in trained women.",
    category: "Training & Recovery",
    readTime: "6 min",
    date: "2025-02-18",
    whyItMattersForWomen: "Recovery norms are often built on male athletes.",
    contextParagraph:
      "Sleep structure and heart-rate variability are both used as recovery proxies. How they relate in women is under-studied.",
    whyTrending:
      "Wearables report HRV and sleep stages; women want to know what to do with the numbers.",
    whatResearchSays:
      "Slow-wave sleep and HRV show phase-dependent patterns in some studies; absolute thresholds from male cohorts may not transfer.",
    whatItMeansForWomen:
      "Use trends and context (cycle, load, life stress) rather than single-number targets.",
    whenItApplies:
      "When you're adjusting training load or judging readiness.",
    whenItDoesNot:
      "When diagnosing sleep or cardiac conditions — that requires clinical evaluation.",
    implementationConsiderations:
      "Track sleep and HRV alongside cycle and training; look for patterns over weeks.",
    sources: ["Sports medicine and sleep research; female-cohort studies."],
  },
  {
    slug: "supplement-claims-vs-evidence",
    title: "Supplement claims vs. evidence in women",
    abstract: "A framework for reading the label and the literature.",
    category: "Supplements",
    readTime: "5 min",
    date: "2025-02-15",
    whyItMattersForWomen: "Many trials under-enroll or don't stratify by sex.",
    contextParagraph:
      "Supplement marketing runs ahead of evidence. For women, the gap is wider because many studies don't report outcomes by sex.",
    whyTrending:
      "Longevity and performance stacks are everywhere; women want to know what actually applies.",
    whatResearchSays:
      "Sex-specific data exists for some compounds (e.g., iron, folate, vitamin D); for others, extrapolation from male-heavy trials is weak.",
    whatItMeansForWomen:
      "Prioritize supplements with female-inclusive or stratified data; treat the rest as speculative.",
    whenItApplies:
      "When considering a new supplement or stack.",
    whenItDoesNot:
      "When a clinician has recommended something for a defined deficiency or condition.",
    implementationConsiderations:
      "Check whether the cited studies included women and reported outcomes by sex.",
    sources: ["Systematic reviews; FDA and regulatory guidance."],
  },
  {
    slug: "longevity-protocols-female-physiology",
    title: "Longevity protocols and female physiology",
    abstract: "What translates when the trials were mostly male.",
    category: "Longevity",
    readTime: "7 min",
    date: "2025-02-12",
    whyItMattersForWomen: "Longevity research has been male-dominated.",
    contextParagraph:
      "Popular longevity interventions — from fasting to metformin — often rest on male-heavy or animal data. Translation to women is not guaranteed.",
    whyTrending:
      "Interest in 'biohacking' and longevity is high; women are asking what's evidence-based for them.",
    whatResearchSays:
      "Some interventions show sex-specific effects or different optimal dosing; others lack female-stratified outcomes.",
    whatItMeansForWomen:
      "Treat male-derived protocols as hypotheses, not prescriptions. Look for female-specific or stratified evidence.",
    whenItApplies:
      "When exploring fasting, supplementation, or other longevity-oriented interventions.",
    whenItDoesNot:
      "When you have a condition that requires a specific medical or nutritional protocol.",
    implementationConsiderations:
      "Prefer interventions with at least some female-inclusive data; start conservative and observe.",
    sources: ["Longevity and aging research; sex-differences reviews."],
  },
  {
    slug: "energy-stability-cycle",
    title: "Energy stability across the cycle",
    abstract: "Why some weeks feel effortless and others don't.",
    category: "Energy & Performance",
    readTime: "5 min",
    date: "2025-02-10",
    whyItMattersForWomen: "Productivity culture ignores physiological variation.",
  },
  {
    slug: "preventive-screening-timing",
    title: "When to schedule preventive screening",
    abstract: "Timing screenings around cycle and life stage.",
    category: "Preventive Health",
    readTime: "4 min",
    date: "2025-02-08",
    whyItMattersForWomen: "Cycle and hormones can affect some biomarkers.",
  },
  {
    slug: "skin-barrier-hormones",
    title: "Skin barrier and hormonal shifts",
    abstract: "What the evidence says about cycle and skin sensitivity.",
    category: "Beauty & Skin",
    readTime: "4 min",
    date: "2025-02-05",
    whyItMattersForWomen: "Many skin protocols assume a static baseline.",
  },
  {
    slug: "stress-resilience-context",
    title: "Stress resilience in context",
    abstract: "Why 'just reduce stress' isn't enough — and what is.",
    category: "Mental Resilience",
    readTime: "6 min",
    date: "2025-02-02",
    whyItMattersForWomen: "Stress load interacts with cycle and life stage.",
  },
];

export function getArticleBySlug(slug: string): KnowledgeArticle | undefined {
  return KNOWLEDGE_ARTICLES.find((a) => a.slug === slug);
}

export function getArticlesByCategory(
  category: KnowledgeCategory | "All"
): KnowledgeArticle[] {
  if (category === "All") return [...KNOWLEDGE_ARTICLES];
  return KNOWLEDGE_ARTICLES.filter((a) => a.category === category);
}

/** Map personalization focus lens title → categories for article filtering */
const FOCUS_LENS_TO_CATEGORIES: Record<string, KnowledgeCategory[]> = {
  "Energy & Stress Load": [
    "Energy & Performance",
    "Mental Resilience",
    "Hormones",
    "Training & Recovery",
  ],
  "Energy & Metabolic Load": [
    "Energy & Performance",
    "Mental Resilience",
    "Training & Recovery",
  ],
  "Performance & Recovery": ["Training & Recovery", "Energy & Performance"],
  "Hormonal Dynamics": ["Hormones"],
  "Stress & Nervous System": ["Mental Resilience", "Training & Recovery"],
  "Body Composition & Appetite Regulation": [
    "Energy & Performance",
    "Beauty & Skin",
  ],
  "Preventive Risk & Screening Prep": ["Longevity", "Preventive Health"],
  "Preventive Risk & Medical Memory": ["Longevity", "Preventive Health"],
  "Skin Signals & Metabolic Context": ["Beauty & Skin", "Supplements"],
};

/** Return up to 4 articles aligned to the user's focus lens (from personalization). */
export function getArticlesForFocusLens(lensTitle: string): KnowledgeArticle[] {
  const categories = FOCUS_LENS_TO_CATEGORIES[lensTitle];
  if (!categories?.length) return KNOWLEDGE_ARTICLES.slice(0, 4);
  const seen = new Set<string>();
  const out: KnowledgeArticle[] = [];
  for (const cat of categories) {
    for (const a of KNOWLEDGE_ARTICLES) {
      if (a.category === cat && !seen.has(a.slug) && out.length < 4) {
        seen.add(a.slug);
        out.push(a);
      }
    }
  }
  return out.length ? out : KNOWLEDGE_ARTICLES.slice(0, 4);
}
