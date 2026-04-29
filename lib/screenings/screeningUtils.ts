export const SCREENING_ALIASES: Record<string, string> = {
  "Chlamydia": "Chlamydia (Urine)",
  "Pap": "Pap Smear",
  "Phys.": "Physical",
  "Palpation": "Breast Palpation",
  "Colonoscopy (2nd)": "Colonoscopy",
};

export const RISK_ADJUSTED_SCREENINGS = new Set([
  "Annual Breast MRI/US (High Risk)",
  "Breast Ultrasound",
  "Genetic counseling if BRCA+",
  "Annual Skin Check",
  "Early Ultrasound (US)",
  "Colposcopy if Pap is abnormal",
  "Start Colonoscopy 10y prior",
  "Yearly Colonoscopy",
  "Biopsy",
]);

const CANONICAL_ORDER = [
  "Chlamydia (Urine)",
  "Pap Smear",
  "HPV+Pap",
  "Genital Exam",
  "Breast Palpation",
  "Skin Check",
  "Dental",
  "Physical",
  "Mammography",
  "Stool Test",
  "Colonoscopy",
];

export function deduplicateScreenings(rawNames: string[]): string[] {
  const seen = new Set<string>();
  const standard: string[] = [];
  for (const name of rawNames) {
    const canonical = SCREENING_ALIASES[name] ?? name;
    if (RISK_ADJUSTED_SCREENINGS.has(canonical)) continue;
    if (seen.has(canonical)) continue;
    seen.add(canonical);
    standard.push(canonical);
  }
  return standard.sort((a, b) => {
    const ai = CANONICAL_ORDER.indexOf(a);
    const bi = CANONICAL_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

export function getRiskAdjustedScreenings(rawNames: string[]): string[] {
  const seen = new Set<string>();
  const risk: string[] = [];
  for (const name of rawNames) {
    const canonical = SCREENING_ALIASES[name] ?? name;
    if (!RISK_ADJUSTED_SCREENINGS.has(canonical)) continue;
    if (seen.has(canonical)) continue;
    seen.add(canonical);
    risk.push(canonical);
  }
  return risk;
}
