/**
 * Document type classifier — pure keyword scoring.
 * Ported from workers/document_classifier.py (rule-based, no API).
 */

export type DocumentType =
  | "lab_report"
  | "imaging_report"
  | "pathology_report"
  | "screening_result"
  | "consultation_note"
  | "procedure_summary"
  | "medication_treatment_summary"
  | "unknown";

export interface ClassificationResult {
  documentType: DocumentType;
  confidence: number;
  allScores: Record<DocumentType, number>;
}

interface Rule {
  pattern: RegExp;
  weight: number;
}

const RULES: Record<DocumentType, Rule[]> = {
  lab_report: [
    { pattern: /reference\s+range/gi, weight: 3.5 },
    { pattern: /\b(H|L|HIGH|LOW|CRITICAL|ABNORMAL|FLAG)\b/g, weight: 2.5 },
    { pattern: /accession\s*(number|#|no\.?)/gi, weight: 2.5 },
    { pattern: /collection\s+date|specimen\s+(type|collected|received)/gi, weight: 2.5 },
    { pattern: /lab(?:oratory)?\s+(report|result|test|panel)/gi, weight: 3.0 },
    { pattern: /\bCBC\b|complete\s+blood\s+count/gi, weight: 3.5 },
    { pattern: /\bCMP\b|\bBMP\b|comprehensive\s+metabolic|basic\s+metabolic/gi, weight: 3.5 },
    { pattern: /lipid\s+panel|cholesterol|triglyceride/gi, weight: 2.5 },
    { pattern: /\bHbA1c\b|hemoglobin\s+A1c|glycated\s+h[ae]moglobin/gi, weight: 2.5 },
    { pattern: /thyroid\s+(panel|function)|\bTSH\b|\bfT[34]\b|free\s+T[34]/gi, weight: 2.5 },
    { pattern: /\bWBC\b|\bRBC\b|\bhematocrit\b|\bhemoglobin\b/gi, weight: 2.0 },
    { pattern: /\bplatelet\b|\bneutrophil\b|\blymphocyte\b/gi, weight: 2.0 },
    { pattern: /\bcreatinine\b|\bBUN\b|\beGFR\b/gi, weight: 2.0 },
    { pattern: /\bALT\b|\bAST\b|\bALP\b|\bGGT\b|\bbilirubin\b|\balbumin\b/gi, weight: 2.0 },
    { pattern: /\bferritin\b|\bserum\s+iron\b|\bTIBC\b/gi, weight: 2.0 },
    { pattern: /\bvitamin\s+D\b|\bvitamin\s+B12\b|\bfolate\b/gi, weight: 1.5 },
    { pattern: /\bCRP\b|C.reactive\s+protein|\bESR\b/gi, weight: 1.5 },
    { pattern: /\bglucose\b|\binsulin\b/gi, weight: 1.5 },
    { pattern: /Leukozyten|Erythrozyten|Thrombozyten|Leukozyten|Befundtext/gi, weight: 3.0 },
    { pattern: /Serum\s+\w+|Plasma\s+\w+|Blutbild|Laborwerte/gi, weight: 2.0 },
  ],

  imaging_report: [
    { pattern: /^IMPRESSION\s*:/gim, weight: 5.0 },
    { pattern: /^FINDINGS\s*:/gim, weight: 4.5 },
    { pattern: /^TECHNIQUE\s*:/gim, weight: 4.0 },
    { pattern: /^INDICATION\s*:/gim, weight: 3.0 },
    { pattern: /radiol(?:ogist|ogy)/gi, weight: 3.5 },
    { pattern: /\bMRI\b|magnetic\s+resonance\s+imaging|\bMRT\b/gi, weight: 3.5 },
    { pattern: /\bCT\b\s+(scan|chest|abdomen|head|brain|pelvis)|computed\s+tomography/gi, weight: 3.0 },
    { pattern: /\bX-?ray\b|radiograph|plain\s+film|R[oö]ntgen/gi, weight: 3.0 },
    { pattern: /\bultrasound\b|sonograph|sonography|\bUS\b\s+(of|showing)|Ultraschall/gi, weight: 3.0 },
    { pattern: /\bPET\b\s*(scan|CT)|positron\s+emission/gi, weight: 3.0 },
    { pattern: /\bechocardiograph|\bechocardiogram/gi, weight: 2.5 },
    { pattern: /\bnuclear\s+medicine\b|\bscintigraphy\b|\bDEXA\s+scan\b|\bDXA\b/gi, weight: 2.5 },
    { pattern: /\bmammograph|\bmammogram\b|Mammographie/gi, weight: 2.5 },
    { pattern: /no\s+acute\s+(finding|abnormality|cardiopulmonary)/gi, weight: 3.0 },
    { pattern: /without\s+contrast|with\s+(?:and\s+without\s+)?contrast/gi, weight: 2.5 },
    { pattern: /parenchym|opacity|density|attenuation|effusion/gi, weight: 2.0 },
    { pattern: /Befund(?:e)?\s*:|Beurteilung\s*:|Ergebnis\s*:/gi, weight: 2.5 },
  ],

  pathology_report: [
    { pattern: /pathol(?:ogy|ogist)/gi, weight: 4.0 },
    { pattern: /\bbiopsy\b|\bbiopsied\b|\bcore\s+biopsy\b/gi, weight: 4.0 },
    { pattern: /^DIAGNOSIS\s*:|^FINAL\s+DIAGNOSIS\s*:|^PATHOLOGIC\s+DIAGNOSIS\s*:/gim, weight: 5.0 },
    { pattern: /^GROSS\s+DESCRIPTION\s*:/gim, weight: 4.0 },
    { pattern: /^MICROSCOPIC\s+(?:DESCRIPTION|EXAMINATION)\s*:/gim, weight: 4.5 },
    { pattern: /histol(?:ogy|ogic)|cytol(?:ogy|ogic)/gi, weight: 3.5 },
    { pattern: /\bmalignant\b|\bmalignancy\b|\bcarcinoma\b|\badenoma\b/gi, weight: 3.5 },
    { pattern: /\bmargins\b\s+(are\s+)?(clear|negative|positive|involved)/gi, weight: 3.0 },
    { pattern: /\bstage\s+[IVX]+\b|\bTNM\b|\bpT[0-4]\b/gi, weight: 3.5 },
    { pattern: /immunohistochem|\bIHC\b|immunostain/gi, weight: 3.0 },
    { pattern: /\bER\b\s*(positive|negative|\+|\-)|\bPR\b|\bHER2\b/gi, weight: 3.0 },
  ],

  screening_result: [
    { pattern: /screening\s+(result|report|exam|test|summary)/gi, weight: 4.5 },
    { pattern: /\bBI.?RADS\b|\bbirads\b/gi, weight: 4.0 },
    { pattern: /\bBI.?RADS\s+(category\s+)?[0-6]\b/gi, weight: 4.5 },
    { pattern: /Pap\s+(smear|test)|cervical\s+(cancer\s+)?screening|Pap-Abstrich/gi, weight: 4.0 },
    { pattern: /colon(?:oscopy)?\s+screening|colorectal\s+cancer\s+screening|Koloskopie|Darmspiegelung/gi, weight: 3.5 },
    { pattern: /bone\s+density|\bDEXA\b|\bDXA\b|\bosteoporosis\s+screening\b|Knochendichte/gi, weight: 3.5 },
    { pattern: /annual\s+(exam|check|visit|wellness)|routine\s+(exam|check|visit)/gi, weight: 3.0 },
    { pattern: /preventive\s+(care|medicine|health|screen)|Vorsorge/gi, weight: 3.5 },
    { pattern: /next\s+screening\s+(due|recommended|in)|recommended\s+(interval|follow.?up)/gi, weight: 3.0 },
    { pattern: /no\s+evidence\s+of\s+(malignancy|cancer|abnormality)|negative\s+for\s+malignancy/gi, weight: 2.5 },
    { pattern: /lung\s+cancer\s+screening|\bLDCT\b/gi, weight: 2.5 },
    { pattern: /prostate\s+cancer\s+screening|\bPSA\s+screen/gi, weight: 2.5 },
    { pattern: /\bGynäkolog|\bFrauenheilkunde\b|\bFrauenarzt\b/gi, weight: 2.0 },
  ],

  consultation_note: [
    { pattern: /consult(?:ation)?\s+(note|request|report|letter)/gi, weight: 4.5 },
    { pattern: /referred\s+(by|from|to)|referral\s+(from|by|for)/gi, weight: 3.5 },
    { pattern: /\bHPI\b|history\s+of\s+present\s+illness/gi, weight: 3.5 },
    { pattern: /assessment\s+and\s+plan\b|\bA\s*&\s*P\b/gi, weight: 3.5 },
    { pattern: /review\s+of\s+systems\b|\bROS\b/gi, weight: 3.0 },
    { pattern: /^SUBJECTIVE\s*:|^OBJECTIVE\s*:|^ASSESSMENT\s*:|^PLAN\s*:/gim, weight: 3.0 },
    { pattern: /physical\s+(exam|examination)\b/gi, weight: 2.5 },
    { pattern: /vital\s+signs?\b|\bBP\b\s*\d|\bHR\b\s*\d/gi, weight: 2.5 },
    { pattern: /family\s+history\b|social\s+history\b/gi, weight: 2.5 },
    { pattern: /\bICD.?10\b|\bICD.?9\b/gi, weight: 2.0 },
  ],

  procedure_summary: [
    { pattern: /procedure\s+(performed|note|summary|report)/gi, weight: 4.0 },
    { pattern: /operative\s+(report|note)|operation\s+(report|record)/gi, weight: 4.0 },
    { pattern: /\bsurgeon\b|\boperating\s+surgeon\b/gi, weight: 3.5 },
    { pattern: /anesthes(?:ia|iology)/gi, weight: 3.5 },
    { pattern: /pre.?operative|post.?operative/gi, weight: 3.5 },
    { pattern: /\bincision\b|\bsuture[sd]?\b|\bclosure\b/gi, weight: 3.0 },
    { pattern: /\blaparoscop\w+\b|laparotom\w+\b/gi, weight: 3.0 },
    { pattern: /\bendoscop\w+\b|gastroscop\w+\b/gi, weight: 2.5 },
    { pattern: /\bEBL\b|estimated\s+blood\s+loss/gi, weight: 3.0 },
    { pattern: /patient\s+tolerated\s+(the\s+)?procedure/gi, weight: 2.5 },
  ],

  medication_treatment_summary: [
    { pattern: /medication\s+(list|summary|reconciliation|record)/gi, weight: 4.5 },
    { pattern: /treatment\s+(plan|summary|protocol|record)/gi, weight: 4.0 },
    { pattern: /\bprescription\b|\bRx\b|\bdrug\s+order\b/gi, weight: 3.5 },
    { pattern: /\bSig\s*:|\bBID\b|\bQD\b|\bTID\b|\bQID\b|\bPRN\b/gi, weight: 3.0 },
    { pattern: /\brefill[s]?\b|\bpharmac\w+\b/gi, weight: 3.0 },
    { pattern: /tablet[s]?\b|\bcapsule[s]?\b|\binjection\b|\binhaler\b/gi, weight: 2.5 },
    { pattern: /chemotherapy\s+(regimen|protocol)/gi, weight: 3.5 },
    { pattern: /\bradiation\s+therapy\b|\bradiotherapy\b/gi, weight: 3.0 },
    { pattern: /hormone\s+(therapy|replacement)|\bHRT\b/gi, weight: 2.5 },
    { pattern: /active\s+medication[s]?|current\s+medication[s]?/gi, weight: 3.0 },
  ],

  unknown: [],
};

// Maximum theoretical score per type (sum of weights)
const MAX_SCORES: Record<DocumentType, number> = Object.fromEntries(
  (Object.keys(RULES) as DocumentType[]).map((t) => [
    t,
    RULES[t].reduce((s, r) => s + r.weight, 0),
  ])
) as Record<DocumentType, number>;

// At what normalised fraction (of max) confidence saturates to 1.0
const CONFIDENCE_CALIBRATION = 0.28;

export function classifyDocument(text: string): ClassificationResult {
  if (!text?.trim()) {
    return {
      documentType: "unknown",
      confidence: 0,
      allScores: Object.fromEntries(
        (Object.keys(RULES) as DocumentType[]).map((t) => [t, 0])
      ) as Record<DocumentType, number>,
    };
  }

  const scores: Record<DocumentType, number> = {} as Record<DocumentType, number>;

  for (const [docType, rules] of Object.entries(RULES) as [DocumentType, Rule[]][]) {
    let raw = 0;
    for (const { pattern, weight } of rules) {
      // Reset lastIndex since we use /g flag
      pattern.lastIndex = 0;
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        raw += weight * (1 + Math.log(matches.length));
      }
    }
    const maxScore = MAX_SCORES[docType] || 1;
    scores[docType] = Math.min(raw / maxScore, 1.0);
  }

  const primary = (Object.keys(scores) as DocumentType[]).reduce(
    (best, t) => (scores[t] > scores[best] ? t : best),
    "unknown" as DocumentType
  );

  const confidence = Math.min(scores[primary] / CONFIDENCE_CALIBRATION, 1.0);

  return {
    documentType: primary,
    confidence: Math.round(confidence * 1000) / 1000,
    allScores: scores,
  };
}

/** Returns true when the document is likely a lab/blood test report (not imaging/screening) */
export function isLabReport(text: string): boolean {
  const result = classifyDocument(text);
  return result.documentType === "lab_report";
}
