import type { BundleKey, Evidence, EvidenceSource } from "@/lib/status-engine/statusTypes";

export const EVIDENCE_PRIORITY: EvidenceSource[] = [
  "lab_result_verified",
  "ocr_parsed_result",
  "manual_result_entry",
  "questionnaire_last_test",
  "self_reported_completion",
  "user_marked_planned",
];

export function pickLatestTrustedEvidence(bundle: BundleKey, evidence: Evidence[]): Evidence | null {
  const candidates = evidence.filter((e) => e.bundle_key === bundle && e.evidence_date != null);
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    const pa = EVIDENCE_PRIORITY.indexOf(a.evidence_source);
    const pb = EVIDENCE_PRIORITY.indexOf(b.evidence_source);
    if (pa !== pb) return pa - pb; // higher trust first
    // if same source priority, use most recent date
    return (b.evidence_date?.getTime() ?? 0) - (a.evidence_date?.getTime() ?? 0);
  });
  return candidates[0] ?? null;
}

