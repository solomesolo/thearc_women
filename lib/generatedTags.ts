/**
 * Rule-based generated tags from survey fields (simple first pass).
 * Maps life stage, goals, symptoms, risk factors, training volume, stress level
 * to taxonomy tag slugs for recommendation scoring.
 */

export function generateTagsFromProfile(profile: {
  lifeStage?: string | null;
  goals?: string[];
  symptoms?: string[];
  riskFactors?: string[];
  trainingVolume?: string | null;
  stressLevel?: string | null;
}): string[] {
  const tags: Set<string> = new Set();

  const lower = (s: string) => s.toLowerCase().trim();

  if (profile.lifeStage) {
    const ls = lower(profile.lifeStage);
    if (ls.includes("perimenopause") || ls.includes("peri")) tags.add("perimenopause");
    if (ls.includes("postmenopause") || ls.includes("menopause")) tags.add("postmenopause");
    if (ls.includes("reproductive")) tags.add("reproductive");
  }

  (profile.goals ?? []).forEach((g) => {
    const gx = lower(g);
    if (gx.includes("performance") || gx.includes("training")) tags.add("performance").add("recovery");
    if (gx.includes("energy")) tags.add("energy");
    if (gx.includes("sleep")) tags.add("sleep-disruption");
    if (gx.includes("stress")) tags.add("stress-resilience");
    if (gx.includes("hormone") || gx.includes("cycle")) tags.add("estrogen").add("reproductive");
    if (gx.includes("risk") || gx.includes("prevent")) tags.add("cardiometabolic").add("screening");
  });

  (profile.symptoms ?? []).forEach((s) => {
    const sx = lower(s);
    if (sx.includes("sleep")) tags.add("sleep-disruption");
    if (sx.includes("fatigue") || sx.includes("tired")) tags.add("fatigue");
    if (sx.includes("mood")) tags.add("mood-shifts");
    if (sx.includes("cycle")) tags.add("estrogen");
  });

  (profile.riskFactors ?? []).forEach((r) => {
    const rx = lower(r);
    if (rx.includes("bone")) tags.add("bone-health");
    if (rx.includes("cardio") || rx.includes("heart")) tags.add("cardiometabolic");
    if (rx.includes("screen")) tags.add("screening");
  });

  if (profile.trainingVolume) {
    const tv = lower(profile.trainingVolume);
    if (tv.includes("high") || tv.includes("heavy")) tags.add("performance").add("recovery");
  }

  if (profile.stressLevel) {
    const sl = lower(profile.stressLevel);
    if (sl.includes("high") || sl.includes("elevated")) tags.add("stress-resilience").add("nervous-system");
  }

  return Array.from(tags);
}
