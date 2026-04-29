export type HealthInsightCategory =
  | "cardio"
  | "iron"
  | "inflammation"
  | "screening"
  | "womens_health"
  | "general";

interface InsightText {
  category: HealthInsightCategory;
  en: string;
  de: string;
}

export const INSIGHT_TEXTS: InsightText[] = [
  // cardio
  {
    category: "cardio",
    en: "Cholesterol and blood pressure results give you an early picture of cardiovascular health — the earlier you track, the more you can act on.",
    de: "Cholesterin- und Blutdruckwerte geben dir ein frühes Bild deiner Herzgesundheit – je früher du sie verfolgst, desto mehr kannst du handeln.",
  },
  {
    category: "cardio",
    en: "Your cardiovascular markers are now part of your baseline — we'll flag any changes that need attention as you add future results.",
    de: "Deine Herz-Kreislauf-Werte sind jetzt Teil deines Ausgangswerts — wir melden uns, wenn zukünftige Ergebnisse Aufmerksamkeit erfordern.",
  },
  // iron
  {
    category: "iron",
    en: "Iron levels affect energy, focus, and immune resilience. Tracking them over time reveals patterns that single results can miss.",
    de: "Eisenwerte beeinflussen Energie, Konzentration und Immunresistenz. Die zeitliche Verfolgung zeigt Muster, die einzelne Ergebnisse übersehen können.",
  },
  {
    category: "iron",
    en: "Ferritin and haemoglobin together tell the full iron story. Low ferritin often shows up months before anaemia becomes visible in routine tests.",
    de: "Ferritin und Hämoglobin zusammen erzählen die vollständige Eisengeschichte. Niedriges Ferritin zeigt sich oft Monate vor einer Anämie in Routinetests.",
  },
  // inflammation
  {
    category: "inflammation",
    en: "CRP and other inflammatory markers can reveal underlying immune activity — useful context for fatigue, joint symptoms, or unexplained weight changes.",
    de: "CRP und andere Entzündungsmarker können zugrundeliegende Immunaktivität aufdecken — nützlicher Kontext bei Müdigkeit, Gelenkbeschwerden oder unerklärlichen Gewichtsveränderungen.",
  },
  {
    category: "inflammation",
    en: "Chronic low-grade inflammation often has no obvious symptoms. These markers give you visibility before symptoms appear.",
    de: "Chronische niedriggradige Entzündungen haben oft keine offensichtlichen Symptome. Diese Marker geben dir Einblick, bevor Symptome auftreten.",
  },
  // screening
  {
    category: "screening",
    en: "Preventive screenings are most effective when done on schedule. Your results are now tracked so we can remind you when the next one is due.",
    de: "Vorsorgeuntersuchungen sind am effektivsten, wenn sie planmäßig durchgeführt werden. Deine Ergebnisse werden jetzt verfolgt, damit wir dich erinnern können, wenn die nächste fällig ist.",
  },
  {
    category: "screening",
    en: "Adding past screening results builds your baseline — Arc can now show you how long ago each check was done and when to repeat it.",
    de: "Das Hinzufügen früherer Vorsorge-Ergebnisse erstellt deine Baseline — Arc kann dir jetzt zeigen, wie lange jeder Check her ist und wann er wiederholt werden sollte.",
  },
  // womens_health
  {
    category: "womens_health",
    en: "Hormonal data gives context to energy, mood, and cycle patterns that often go unexplained without a complete picture.",
    de: "Hormonelle Daten geben Kontext zu Energie-, Stimmungs- und Zyklusmustern, die ohne ein vollständiges Bild oft unerklärlich bleiben.",
  },
  {
    category: "womens_health",
    en: "Tracking thyroid, oestrogen, and progesterone together creates a hormonal baseline that makes changes easier to spot early.",
    de: "Das gleichzeitige Verfolgen von Schilddrüse, Östrogen und Progesteron erstellt eine hormonelle Basis, die Veränderungen leichter frühzeitig erkennbar macht.",
  },
  // general
  {
    category: "general",
    en: "Every result you add sharpens your health picture. Arc uses your history to surface patterns that single tests can't reveal.",
    de: "Jedes Ergebnis, das du hinzufügst, schärft dein Gesundheitsbild. Arc nutzt deine Geschichte, um Muster aufzudecken, die einzelne Tests nicht zeigen können.",
  },
  {
    category: "general",
    en: "Your Health Wallet is now more complete. The next step is to fill in any gaps — we'll show you what's still missing.",
    de: "Dein Gesundheits-Wallet ist jetzt vollständiger. Der nächste Schritt besteht darin, eventuelle Lücken zu schließen – wir zeigen dir, was noch fehlt.",
  },
  {
    category: "general",
    en: "Understanding your numbers is the first step. Arc will help you interpret trends and know when to act.",
    de: "Deine Zahlen zu verstehen ist der erste Schritt. Arc hilft dir, Trends zu interpretieren und zu wissen, wann du handeln solltest.",
  },
];

const CATEGORY_KEYWORDS: Record<HealthInsightCategory, string[]> = {
  cardio: ["cholesterol", "ldl", "hdl", "triglyceride", "blood pressure", "cardiovascular", "cardiac", "lipid", "heart", "systolic", "diastolic"],
  iron: ["ferritin", "iron", "haemoglobin", "hemoglobin", "transferrin", "mcv", "mch", "mchc", "rbc", "red blood", "anaemia", "anemia"],
  inflammation: ["crp", "c-reactive", "esr", "sed rate", "interleukin", "inflammation", "wbc", "white blood", "neutrophil", "lymphocyte"],
  screening: ["pap", "cervical", "mammogram", "mammography", "colonoscopy", "dexa", "bone density", "screening"],
  womens_health: ["oestrogen", "estrogen", "progesterone", "testosterone", "fsh", "lh", "thyroid", "tsh", "t3", "t4", "prolactin", "dhea", "hormone"],
  general: [],
};

export function categorizeByName(name: string): HealthInsightCategory {
  const lower = name.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [HealthInsightCategory, string[]][]) {
    if (cat === "general") continue;
    if (keywords.some((kw) => lower.includes(kw))) return cat;
  }
  return "general";
}

export function selectInsights(
  categories: HealthInsightCategory[],
  language: "en" | "de" = "en",
): string[] {
  const seen = new Set<HealthInsightCategory>();
  const results: string[] = [];

  // Pick 1-2 category-specific insights (first match per category)
  for (const cat of categories) {
    if (cat === "general" || seen.has(cat)) continue;
    seen.add(cat);
    const pool = INSIGHT_TEXTS.filter((t) => t.category === cat);
    if (pool.length > 0) results.push(pool[0][language]);
    if (results.length >= 2) break;
  }

  // Always append 1 general insight, preferring one not yet shown
  const generalPool = INSIGHT_TEXTS.filter((t) => t.category === "general");
  const unusedGeneral = generalPool.filter((t) => !results.includes(t[language]));
  const generalPick = unusedGeneral.length > 0 ? unusedGeneral[0] : generalPool[0];
  if (generalPick) results.push(generalPick[language]);

  return results.slice(0, 3);
}
