/**
 * Basic unit tests for personalization mapping.
 * Run with: npx tsx lib/personalizationRules.test.ts
 * Or add vitest/jest and run as part of test suite.
 */

import { getPersonalizationOutput } from "./personalizationRules";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function runTests() {
  // Empty selection → default output
  const empty = getPersonalizationOutput([], []);
  assert(empty.startingLensTitle === "Your physiology", "empty: default title");
  assert(empty.threeFocusAreas.length === 3, "empty: three focus areas");

  // Goal "Training performance" → Performance & Recovery
  const perf = getPersonalizationOutput(["Training performance"], []);
  assert(perf.startingLensTitle === "Performance & Recovery", "goal: Performance & Recovery");
  assert(perf.threeFocusAreas[0] === "Load and recovery balance", "performance: first focus");

  // Signal "Exhausted despite sleep" → Energy & Stress Load
  const energy = getPersonalizationOutput([], ["Exhausted despite sleep"]);
  assert(energy.startingLensTitle === "Energy & Stress Load", "signal: Energy & Stress Load");

  // Goal "Hormonal transition" → Hormonal Dynamics
  const hormonal = getPersonalizationOutput(["Hormonal transition"], []);
  assert(hormonal.startingLensTitle === "Hormonal Dynamics", "goal: Hormonal Dynamics");

  // Goal "Family history / risk" → Preventive Risk
  const risk = getPersonalizationOutput(["Family history / risk"], []);
  assert(risk.startingLensTitle === "Preventive Risk & Screening Prep", "goal: Preventive Risk");

  // Goal "Skin / hair changes" → Skin Signals
  const skin = getPersonalizationOutput(["Skin / hair changes"], []);
  assert(skin.startingLensTitle === "Skin Signals & Metabolic Context", "goal: Skin Signals");

  // Weekly brief preview structure
  assert("now" in perf.weeklyBriefPreview, "brief has now");
  assert("next" in perf.weeklyBriefPreview, "brief has next");
  assert("preventive" in perf.weeklyBriefPreview, "brief has preventive");

  console.log("All personalizationRules tests passed.");
}

runTests();
