import { describe, expect, test } from "vitest";
import { runEngineBOnSnapshot } from "@/lib/recommendations/engine";

describe("Engine B — deterministic recommendations", () => {
  test("demo-like profile ranks vitamin_d, iron_status, thyroid_basic highly with correct statuses", () => {
    const results = runEngineBOnSnapshot({
      userEmail: "demo@thearc.com",
      ageGroup: "30_34",
      lifeStage: "reproductive",
      goalFlags: ["goal_prevention", "goal_energy"],
      riskFlags: ["fatigue", "heavy_periods", "high_stress", "low_sun_exposure"],
      conditionFlags: [],
      medicationFlags: [],
      familyHistoryFlags: ["fh_thyroid"],
      lifestyleFlags: ["low_sun_exposure", "high_stress"],
      lastTests: {
        vitamin_d: null,
        iron_status: "6_12m",
        thyroid_basic: "gt_12m",
        glucose_metabolic: null,
        lipid_panel: null,
        female_hormone_balance: null,
      },
    } as any);

    const top = results.slice(0, 5).map((r) => r.bundle_key);
    expect(top).toContain("vitamin_d");
    expect(top).toContain("iron_status");
    expect(top).toContain("thyroid_basic");

    const vitd = results.find((r) => r.bundle_key === "vitamin_d")!;
    expect(vitd.status).toBe("missing");
    expect(vitd.reasons).toEqual(expect.arrayContaining(["fatigue", "low_sun_exposure", "no_recent_test"]));

    const iron = results.find((r) => r.bundle_key === "iron_status")!;
    expect(["outdated", "missing"].includes(iron.status)).toBe(true);
    expect(iron.reasons).toEqual(expect.arrayContaining(["heavy_periods", "fatigue"]));

    const tsh = results.find((r) => r.bundle_key === "thyroid_basic")!;
    expect(["outdated", "missing"].includes(tsh.status)).toBe(true);
    expect(tsh.reasons).toEqual(expect.arrayContaining(["fh_thyroid"]));
  });
});

