// Pure logic — no React, no "use client"

import type { CheckRecommendation } from "@/lib/recommendations-engine/types";
import type { BiomarkerResultStatus, BiomarkerWalletEntry } from "@/components/app/BiomarkerActionRow";

// ── Domain types ──────────────────────────────────────────────────────────────

export type WomensHealthDomainId =
  | "cardiovascular"
  | "cancer_prevention"
  | "metabolic"
  | "respiratory"
  | "brain_cognitive"
  | "hormonal_reproductive";

export type DomainSignalStatus =
  | "in_range"
  | "watch"
  | "needs_attention"
  | "not_enough_data"
  | "no_current_action";

export interface AttentionItem {
  id: string;
  name: string;
  type: "biomarker" | "screening";
  reason: string;
}

export interface SupportingItem {
  id: string;
  name: string;
  type: "biomarker" | "screening";
  value?: string;
  unit?: string;
  status?: BiomarkerResultStatus;
  date?: string;
}

export interface WomensHealthDomain {
  id: WomensHealthDomainId;
  label: string;
  dataConfidencePercent: number;
  status: DomainSignalStatus;
  completedItems: number;
  recommendedItems: number;
  attentionItems: AttentionItem[];
  supportingItems: SupportingItem[];
  summary: string;
  nextAction?: { label: string; href: string };
}

// ── Trend types (used by TrendsSection + dashboard page) ─────────────────────

export type TrendDirection = "up" | "down" | "stable" | "not_enough_data";

export interface TrendItem {
  id: string;
  domainId: WomensHealthDomainId;
  name: string;
  latestValue?: string;
  unit?: string;
  trend: TrendDirection;
  summary: string;
}

// ── Domain label maps ─────────────────────────────────────────────────────────

const DOMAIN_LABELS_EN: Record<WomensHealthDomainId, string> = {
  cardiovascular: "Cardiovascular health",
  cancer_prevention: "Cancer prevention",
  metabolic: "Metabolic health",
  respiratory: "Respiratory health",
  brain_cognitive: "Brain & cognitive health",
  hormonal_reproductive: "Hormonal & reproductive health",
};

const DOMAIN_LABELS_DE: Record<WomensHealthDomainId, string> = {
  cardiovascular: "Herz-Kreislauf-Gesundheit",
  cancer_prevention: "Krebsvorsorge",
  metabolic: "Stoffwechselgesundheit",
  respiratory: "Atemwegsgesundheit",
  brain_cognitive: "Gehirn & kognitive Gesundheit",
  hormonal_reproductive: "Hormonelle & reproduktive Gesundheit",
};

// ── Domain assignment: checkKey matching ──────────────────────────────────────

const DOMAIN_CHECKKEY_PATTERNS: Array<{ domainId: WomensHealthDomainId; keywords: string[] }> = [
  {
    domainId: "cardiovascular",
    keywords: ["cardiovascular", "lipid", "cholesterol", "blood_pressure", "heart", "hs_crp", "hscrp"],
  },
  {
    domainId: "cancer_prevention",
    keywords: [
      "cervical", "breast", "colonoscopy", "colorectal", "dermatology", "skin",
      "mammography", "pap", "hpv", "stool", "genital", "bowel",
    ],
  },
  {
    domainId: "metabolic",
    keywords: ["metabolic", "hba1c", "diabetes", "glucose", "insulin"],
  },
  {
    domainId: "respiratory",
    keywords: ["respiratory", "smoking", "lung", "pulmonary"],
  },
  {
    domainId: "brain_cognitive",
    keywords: ["cognitive", "mental_health", "memory", "brain"],
  },
  {
    domainId: "hormonal_reproductive",
    keywords: [
      "hormone", "thyroid", "iron", "ferritin", "std", "sti", "fertility",
      "reproductive", "cycle", "pcos", "menopause", "fsh", "amh", "estrogen", "progest",
    ],
  },
];

function assignDomainByCheckKey(checkKey: string): WomensHealthDomainId {
  const norm = checkKey.trim().toLowerCase();
  for (const { domainId, keywords } of DOMAIN_CHECKKEY_PATTERNS) {
    if (keywords.some((kw) => norm.includes(kw))) return domainId;
  }
  // fall-through default
  return "metabolic";
}

// ── Biomarker name → domain (for broad panels) ────────────────────────────────

const BIOMARKER_NAME_PATTERNS: Array<{ domainId: WomensHealthDomainId; keywords: string[] }> = [
  {
    domainId: "cardiovascular",
    keywords: ["ldl", "hdl", "cholesterol", "triglyceride", "apob", "lipoprotein", "crp"],
  },
  {
    domainId: "metabolic",
    keywords: ["hba1c", "hemoglobin a1c", "glycated", "glucose", "insulin", "c-peptide", "homa"],
  },
  {
    domainId: "hormonal_reproductive",
    keywords: [
      "tsh", "thyroid", "t3", "t4", "estradiol", "estrogen", "progesterone",
      "fsh", "lh", "amh", "cortisol", "dhea", "ferritin", "iron",
    ],
  },
];

// Broad check keys where we re-classify per biomarker name
const BROAD_CHECK_KEYS = ["preventive_baseline", "bone_density_scan", "comprehensive_metabolic_panel"];

function isBroadCheck(checkKey: string): boolean {
  const norm = checkKey.trim().toLowerCase();
  return BROAD_CHECK_KEYS.some((k) => norm.includes(k));
}

function assignDomainByBiomarkerName(name: string, fallback: WomensHealthDomainId): WomensHealthDomainId {
  const norm = name.trim().toLowerCase();
  for (const { domainId, keywords } of BIOMARKER_NAME_PATTERNS) {
    if (keywords.some((kw) => norm.includes(kw))) return domainId;
  }
  return fallback;
}

function normBiomarkerKey(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

// ── Status derivation ─────────────────────────────────────────────────────────

function deriveDomainStatus(
  recommendedItems: number,
  completedItems: number,
  walletStatuses: BiomarkerResultStatus[],
): DomainSignalStatus {
  if (recommendedItems === 0) return "no_current_action";
  if (completedItems === 0) return "not_enough_data";
  if (walletStatuses.includes("out_of_range")) return "needs_attention";
  if (walletStatuses.includes("borderline")) return "watch";
  if (walletStatuses.length > 0 && walletStatuses.every((s) => s === "in_range")) return "in_range";
  return "not_enough_data";
}

// ── Summary copy ──────────────────────────────────────────────────────────────

function buildSummary(
  domainId: WomensHealthDomainId,
  status: DomainSignalStatus,
  isDE: boolean,
): string {
  type SummaryMap = Partial<Record<DomainSignalStatus, string>>;
  type DomainCopy = { en: SummaryMap; de: SummaryMap; defaultEn: string; defaultDe: string };

  const copies: Record<WomensHealthDomainId, DomainCopy> = {
    cardiovascular: {
      en: {
        in_range: "Cardiovascular markers currently in range. Continue monitoring at recommended intervals.",
        watch: "One or more cardiovascular markers are borderline. Review the values and consider discussing with your doctor.",
        needs_attention: "One or more cardiovascular markers are outside range. Review and follow up with your healthcare provider.",
        not_enough_data: "Add cardiovascular marker results to see how this area looks for you.",
        no_current_action: "No cardiovascular action is currently recommended based on your profile.",
      },
      de: {
        in_range: "Herz-Kreislauf-Werte aktuell im Normbereich. Weiter im empfohlenen Rhythmus beobachten.",
        watch: "Ein oder mehrere Herz-Kreislauf-Werte sind grenzwertig. Überprüfen Sie die Werte und sprechen Sie ggf. mit Ihrer Ärztin.",
        needs_attention: "Ein oder mehrere Herz-Kreislauf-Werte liegen außerhalb des Normbereichs. Bitte nehmen Sie Kontakt zu Ihrer Ärztin auf.",
        not_enough_data: "Fügen Sie Herz-Kreislauf-Werte hinzu, um ein vollständigeres Bild zu erhalten.",
        no_current_action: "Basierend auf Ihrem Profil sind derzeit keine Herz-Kreislauf-Maßnahmen empfohlen.",
      },
      defaultEn: "Cardiovascular area — add results to see your status.",
      defaultDe: "Herz-Kreislauf-Bereich — Ergebnisse hinzufügen, um Ihren Status zu sehen.",
    },
    cancer_prevention: {
      en: {
        in_range: "Preventive screenings are up to date. Keep to the recommended schedule.",
        watch: "A screening result is borderline or a follow-up may be needed. Review with your doctor.",
        needs_attention: "One or more screening results may need follow-up. Speak with your healthcare provider.",
        not_enough_data: "Record your screening history to track your cancer prevention status.",
        no_current_action: "No cancer prevention screenings are currently recommended based on your profile.",
      },
      de: {
        in_range: "Vorsorgeuntersuchungen sind aktuell. Halten Sie den empfohlenen Zeitplan ein.",
        watch: "Ein Vorsorgebefund ist grenzwertig oder erfordert eine Verlaufskontrolle. Bitte sprechen Sie mit Ihrer Ärztin.",
        needs_attention: "Einer oder mehrere Befunde können eine Nachsorge erfordern. Wenden Sie sich an Ihre Ärztin.",
        not_enough_data: "Erfassen Sie Ihre Vorsorgegeschichte, um Ihren Krebsvorsorge-Status zu sehen.",
        no_current_action: "Basierend auf Ihrem Profil sind derzeit keine Krebsvorsorge-Untersuchungen empfohlen.",
      },
      defaultEn: "Cancer prevention — add screening records to track this area.",
      defaultDe: "Krebsvorsorge — Vorsorgeergebnisse hinzufügen, um diesen Bereich zu verfolgen.",
    },
    metabolic: {
      en: {
        in_range: "Metabolic markers currently in range. Continue monitoring at recommended intervals.",
        watch: "One or more metabolic markers are borderline. Review the values and consider a follow-up.",
        needs_attention: "One or more metabolic markers are outside range. Review and follow up with your healthcare provider.",
        not_enough_data: "Add metabolic results such as HbA1c or glucose to see your status.",
        no_current_action: "No metabolic action is currently recommended based on your profile.",
      },
      de: {
        in_range: "Stoffwechselwerte aktuell im Normbereich. Weiter im empfohlenen Rhythmus beobachten.",
        watch: "Ein oder mehrere Stoffwechselwerte sind grenzwertig. Überprüfen und ggf. nachverfolgen.",
        needs_attention: "Ein oder mehrere Stoffwechselwerte liegen außerhalb des Normbereichs. Bitte wenden Sie sich an Ihre Ärztin.",
        not_enough_data: "Fügen Sie Stoffwechselwerte wie HbA1c oder Glukose hinzu, um Ihren Status zu sehen.",
        no_current_action: "Basierend auf Ihrem Profil sind derzeit keine Stoffwechsel-Maßnahmen empfohlen.",
      },
      defaultEn: "Metabolic area — add results to see your status.",
      defaultDe: "Stoffwechselbereich — Ergebnisse hinzufügen, um Ihren Status zu sehen.",
    },
    respiratory: {
      en: {
        in_range: "Respiratory indicators are in a healthy range.",
        watch: "One or more respiratory indicators are borderline. Consider discussing with your doctor.",
        needs_attention: "A respiratory check may need follow-up. Speak with your healthcare provider.",
        not_enough_data: "Add respiratory data to see your status in this area.",
        no_current_action: "No respiratory action is currently recommended based on your profile.",
      },
      de: {
        in_range: "Atemwegsindikatoren im gesunden Bereich.",
        watch: "Ein oder mehrere Atemwegsindikatoren sind grenzwertig. Sprechen Sie ggf. mit Ihrer Ärztin.",
        needs_attention: "Eine Atemwegskontrolle könnte eine Nachsorge erfordern. Wenden Sie sich an Ihre Ärztin.",
        not_enough_data: "Fügen Sie Atemwegsdaten hinzu, um Ihren Status in diesem Bereich zu sehen.",
        no_current_action: "Basierend auf Ihrem Profil sind derzeit keine Atemwegsmaßnahmen empfohlen.",
      },
      defaultEn: "Respiratory area — no data yet.",
      defaultDe: "Atemwegsbereich — noch keine Daten.",
    },
    brain_cognitive: {
      en: {
        in_range: "Brain health indicators look good based on available data.",
        watch: "Some indicators relevant to brain health are borderline. Add more data for a fuller picture.",
        needs_attention: "Some indicators relevant to brain health need follow-up.",
        not_enough_data:
          "Brain health insights build on cardiovascular and metabolic data. Add results in those areas to get a fuller picture.",
        no_current_action: "No cognitive health action is currently recommended based on your profile.",
      },
      de: {
        in_range: "Gehirn-Gesundheitsindikatoren sehen basierend auf vorhandenen Daten gut aus.",
        watch: "Einige für die Gehirngesundheit relevante Werte sind grenzwertig. Fügen Sie mehr Daten hinzu.",
        needs_attention: "Einige für die Gehirngesundheit relevante Werte erfordern Nachsorge.",
        not_enough_data:
          "Gehirn-Gesundheitseinblicke basieren auf Herz-Kreislauf- und Stoffwechseldaten. Fügen Sie dort Ergebnisse hinzu, um ein vollständigeres Bild zu erhalten.",
        no_current_action: "Basierend auf Ihrem Profil sind derzeit keine Maßnahmen für die kognitive Gesundheit empfohlen.",
      },
      defaultEn: "Brain health — add cardiovascular and metabolic data to see insights.",
      defaultDe: "Gehirngesundheit — Herz- und Stoffwechseldaten hinzufügen, um Einblicke zu erhalten.",
    },
    hormonal_reproductive: {
      en: {
        in_range: "Hormonal markers currently in range. Continue at recommended intervals.",
        watch: "One or more hormonal markers are borderline. Consider a follow-up.",
        needs_attention: "One or more hormonal markers are outside range. Discuss with your healthcare provider.",
        not_enough_data: "Add hormonal results such as thyroid or iron markers to see your status.",
        no_current_action: "No hormonal or reproductive action is currently recommended based on your profile.",
      },
      de: {
        in_range: "Hormonelle Werte aktuell im Normbereich. Weiter im empfohlenen Rhythmus beobachten.",
        watch: "Ein oder mehrere Hormonwerte sind grenzwertig. Eine Verlaufskontrolle ist empfehlenswert.",
        needs_attention: "Ein oder mehrere Hormonwerte liegen außerhalb des Normbereichs. Bitte wenden Sie sich an Ihre Ärztin.",
        not_enough_data: "Fügen Sie Hormonwerte wie Schilddrüse oder Eisenwerte hinzu, um Ihren Status zu sehen.",
        no_current_action: "Basierend auf Ihrem Profil sind derzeit keine hormonellen oder reproduktiven Maßnahmen empfohlen.",
      },
      defaultEn: "Hormonal & reproductive area — add results to see your status.",
      defaultDe: "Hormoneller & reproduktiver Bereich — Ergebnisse hinzufügen, um Ihren Status zu sehen.",
    },
  };

  const copy = copies[domainId];
  const map = isDE ? copy.de : copy.en;
  return map[status] ?? (isDE ? copy.defaultDe : copy.defaultEn);
}

// ── nextAction builder ────────────────────────────────────────────────────────

function buildNextAction(
  domainId: WomensHealthDomainId,
  status: DomainSignalStatus,
  isDE: boolean,
): { label: string; href: string } | undefined {
  if (domainId === "brain_cognitive" && status === "not_enough_data") {
    return {
      label: isDE ? "Biomarker ansehen" : "View biomarkers",
      href: "/results/overview",
    };
  }
  if (domainId === "respiratory" && status === "no_current_action") {
    return undefined;
  }
  if (status === "no_current_action") {
    return undefined;
  }
  // For all other domains with missing items
  const actionDomains: WomensHealthDomainId[] = [
    "cardiovascular", "metabolic", "hormonal_reproductive", "cancer_prevention",
  ];
  if (actionDomains.includes(domainId)) {
    return {
      label: isDE ? "Aktionsplan öffnen" : "Open action plan",
      href: "/results/action-plan",
    };
  }
  return undefined;
}

// ── Internal working structure ────────────────────────────────────────────────

interface DomainWorkItem {
  name: string;
  type: "biomarker" | "screening";
  checkKey: string;
  checkStatus: string;
  isCompleted: boolean;
  walletEntries: BiomarkerWalletEntry[];
}

type DomainBuckets = Record<WomensHealthDomainId, DomainWorkItem[]>;

// ── Main export ───────────────────────────────────────────────────────────────

export function buildDomains(
  allChecks: CheckRecommendation[],
  isDE: boolean,
  loadWalletHistory: (key: string) => BiomarkerWalletEntry[],
): WomensHealthDomain[] {
  const ALL_DOMAIN_IDS: WomensHealthDomainId[] = [
    "cardiovascular",
    "cancer_prevention",
    "metabolic",
    "respiratory",
    "brain_cognitive",
    "hormonal_reproductive",
  ];

  // Initialize buckets for each domain
  const buckets: DomainBuckets = {
    cardiovascular: [],
    cancer_prevention: [],
    metabolic: [],
    respiratory: [],
    brain_cognitive: [],
    hormonal_reproductive: [],
  };

  // De-duplicate tracker (name + domain)
  const seen = new Set<string>();

  for (const check of allChecks) {
    const checkDomain = assignDomainByCheckKey(check.checkKey);
    const isCompleted =
      check.status === "completed" || check.status === "result_uploaded";
    const isBroad = isBroadCheck(check.checkKey);

    const allTestNames = check.includedTestsByCategory.flatMap((c) => c.tests);

    if (allTestNames.length === 0) {
      // No individual tests listed — treat the whole check as one item
      const itemName = check.checkName;
      const itemType: "biomarker" | "screening" = check.isScreening ? "screening" : "biomarker";
      const dedupeKey = `${checkDomain}::${itemName.toLowerCase()}`;
      if (!seen.has(dedupeKey)) {
        seen.add(dedupeKey);
        const walletKey = normBiomarkerKey(itemName);
        buckets[checkDomain].push({
          name: itemName,
          type: itemType,
          checkKey: check.checkKey,
          checkStatus: check.status,
          isCompleted,
          walletEntries: check.isScreening ? [] : loadWalletHistory(walletKey),
        });
      }
    } else {
      for (const testName of allTestNames) {
        const itemType: "biomarker" | "screening" = check.isScreening ? "screening" : "biomarker";
        // Re-classify per test name for broad checks; keep parent domain for cancer_prevention
        let targetDomain: WomensHealthDomainId;
        if (check.isScreening) {
          // Screenings always stay in the check's domain
          targetDomain = checkDomain;
        } else if (isBroad) {
          targetDomain = assignDomainByBiomarkerName(testName, checkDomain);
        } else {
          targetDomain = checkDomain;
        }

        const dedupeKey = `${targetDomain}::${testName.toLowerCase()}`;
        if (!seen.has(dedupeKey)) {
          seen.add(dedupeKey);
          const walletKey = normBiomarkerKey(testName);
          const walletEntries = itemType === "biomarker" ? loadWalletHistory(walletKey) : [];
          buckets[targetDomain].push({
            name: testName,
            type: itemType,
            checkKey: check.checkKey,
            checkStatus: check.status,
            isCompleted: itemType === "biomarker"
              ? walletEntries.length > 0
              : isCompleted,
            walletEntries,
          });
        }
      }
    }
  }

  // Build domain objects
  return ALL_DOMAIN_IDS.map((domainId): WomensHealthDomain => {
    const items = buckets[domainId];
    const labels = isDE ? DOMAIN_LABELS_DE : DOMAIN_LABELS_EN;

    // brain_cognitive and respiratory: if no items, no_current_action
    if (items.length === 0) {
      const status: DomainSignalStatus =
        domainId === "brain_cognitive" || domainId === "respiratory"
          ? "no_current_action"
          : "no_current_action";
      return {
        id: domainId,
        label: labels[domainId],
        dataConfidencePercent: 0,
        status,
        completedItems: 0,
        recommendedItems: 0,
        attentionItems: [],
        supportingItems: [],
        summary: buildSummary(domainId, status, isDE),
        nextAction: buildNextAction(domainId, status, isDE),
      };
    }

    const recommendedItems = items.length;
    const completedItems = items.filter((i) => i.isCompleted).length;
    const walletStatuses: BiomarkerResultStatus[] = items
      .filter((i) => i.type === "biomarker")
      .flatMap((i) => i.walletEntries.map((e) => e.status));

    // brain_cognitive: always not_enough_data unless we have explicit cognitive checks
    let status: DomainSignalStatus;
    if (domainId === "brain_cognitive") {
      status = recommendedItems > 0
        ? deriveDomainStatus(recommendedItems, completedItems, walletStatuses)
        : "not_enough_data";
    } else {
      status = deriveDomainStatus(recommendedItems, completedItems, walletStatuses);
    }

    const dataConfidencePercent =
      recommendedItems > 0 ? Math.round((completedItems / recommendedItems) * 100) : 0;

    // Build attention items: incomplete items where wallet has out_of_range / borderline, or not completed
    const attentionItems: AttentionItem[] = [];
    const supportingItems: SupportingItem[] = [];

    for (const item of items) {
      const latestEntry = item.walletEntries.length > 0
        ? item.walletEntries[item.walletEntries.length - 1]
        : null;

      if (
        latestEntry &&
        (latestEntry.status === "out_of_range" || latestEntry.status === "borderline")
      ) {
        const reason = isDE
          ? latestEntry.status === "out_of_range"
            ? "Wert außerhalb des Normbereichs"
            : "Grenzwertiger Befund"
          : latestEntry.status === "out_of_range"
            ? "Value outside normal range"
            : "Borderline result";
        attentionItems.push({
          id: normBiomarkerKey(item.name),
          name: item.name,
          type: item.type,
          reason,
        });
      } else if (item.isCompleted || latestEntry) {
        supportingItems.push({
          id: normBiomarkerKey(item.name),
          name: item.name,
          type: item.type,
          value: latestEntry?.value,
          status: latestEntry?.status,
          date: latestEntry?.date,
        });
      }
    }

    return {
      id: domainId,
      label: labels[domainId],
      dataConfidencePercent,
      status,
      completedItems,
      recommendedItems,
      attentionItems,
      supportingItems,
      summary: buildSummary(domainId, status, isDE),
      nextAction: buildNextAction(domainId, status, isDE),
    };
  });
}
