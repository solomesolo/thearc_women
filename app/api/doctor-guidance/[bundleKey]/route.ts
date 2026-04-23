import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getBiomarkerKey } from "@/lib/doctor-guidance/bundleBiomarkerMap";
import type { DoctorGuidancePayload } from "@/lib/doctor-guidance/types";

// Maps ISO country code → locale key used in coverage tables.
function countryToLocale(country: string | null): string {
  if (country === "GB") return "en-gb";
  return "de"; // default: Germany
}

const GENERIC_FALLBACK_LINES = [
  "I would like to discuss whether this test makes sense in my case.",
  "Could this be added to my next blood test?",
  "If it is not routinely covered, what would the private or self-pay option be?",
];

function buildFallback(biomarkerName: string): DoctorGuidancePayload {
  return {
    biomarker_name: biomarkerName,
    gkv: {
      status_label: "Ask your doctor",
      user_text: `Coverage for ${biomarkerName} depends on the medical context and should be clarified with your doctor or GP.`,
      frequency_text: null,
      extra_note: null,
    },
    pkv: {
      status_label: "Check your plan",
      user_text: `Private coverage for ${biomarkerName} depends on your plan or tariff and should be confirmed if you want certainty.`,
      extra_note: null,
    },
    how_to_ask: {
      why_this_matters: "This check is prioritized based on your current status and profile signals.",
      suggested_lines: GENERIC_FALLBACK_LINES,
      self_pay_note: "If coverage is unclear, ask your practice or insurer whether a private or self-pay route is available.",
    },
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bundleKey: string }> },
) {
  const { bundleKey } = await params;
  const country = req.nextUrl.searchParams.get("country") ?? null;
  const locale = countryToLocale(country);

  const biomarkerKey = getBiomarkerKey(bundleKey);
  if (!biomarkerKey) {
    return NextResponse.json(buildFallback(bundleKey), { status: 200 });
  }

  const [coverage, script] = await Promise.all([
    (prisma as any).biomarkerCoverageUiContent.findFirst({
      where: { biomarkerNameNormalized: biomarkerKey, locale },
    }),
    (prisma as any).biomarkerDoctorScriptTemplate.findFirst({
      where: { biomarkerNameNormalized: biomarkerKey, locale },
    }),
  ]);

  if (!coverage) {
    return NextResponse.json(buildFallback(biomarkerKey), { status: 200 });
  }

  const suggestedLines: string[] = [];
  if (script?.introTemplate) suggestedLines.push(script.introTemplate);
  if (script?.symptomTemplate) suggestedLines.push(script.symptomTemplate);
  if (script?.coverageQuestionTemplate) suggestedLines.push(script.coverageQuestionTemplate);
  if (suggestedLines.length === 0) suggestedLines.push(...GENERIC_FALLBACK_LINES);

  const payload: DoctorGuidancePayload = {
    biomarker_name: coverage.sourceBiomarkerName,
    gkv: {
      status_label: coverage.gkvStatusLabel,
      user_text: coverage.gkvUserText,
      frequency_text: coverage.gkvFrequencyUserText ?? null,
      extra_note: coverage.gkvExtraNote ?? null,
    },
    pkv: {
      status_label: coverage.pkvStatusLabel,
      user_text: coverage.pkvUserText,
      extra_note: coverage.pkvExtraNote ?? null,
    },
    how_to_ask: {
      why_this_matters: script?.whyThisMattersTemplate ?? "This check is prioritized based on your current status and profile signals.",
      suggested_lines: suggestedLines,
      self_pay_note: coverage.selfPayNote ?? null,
    },
  };

  return NextResponse.json(payload, { status: 200 });
}
