import { describe, expect, test } from "vitest";
import { buildProfileFromAnswers } from "@/lib/profile-engine-a/profileEngine";

describe("Engine A — Profile State Engine", () => {
  test("builds deterministic profile with affinities and recency hints", () => {
    const profile = buildProfileFromAnswers("demo@thearc.com", {
      age_range: "30_34",
      life_stage: "reproductive",
      goals: ["general_preventive_health", "more_energy_and_vitality"],
      symptoms: ["fatigue", "heavy_periods", "high_stress"],
      sun_exposure: "rarely",
      known_conditions: ["none"],
      family_history: ["thyroid_disease"],
      last_tests: {
        vitamin_d: "unknown",
        iron_ferritin: "between_6_12m",
        thyroid: "gt_12m",
        hba1c: "unknown",
        lipids: "unknown",
        hormones: "unknown",
      },
    });

    expect(profile.user_name).toBe("demo@thearc.com");
    expect(profile.age_group).toBe("30_34");
    expect(profile.age_group_label).toBe("30–34");
    expect(profile.life_stage).toBe("reproductive");
    expect(profile.life_stage_label).toBe("Regular menstrual cycle");
    expect(profile.goal_flags).toEqual(expect.arrayContaining(["goal_prevention", "goal_energy"]));
    expect(profile.bundle_affinities.iron_status).toBeGreaterThan(0);
    expect(profile.bundle_affinities.vitamin_d).toBeGreaterThan(0);
    expect(profile.last_tests.iron_status).toBe("6_12m");
    expect(profile.recency_hints.thyroid_basic).toBe("stale");
    expect(profile.profile_completeness_percent).toBe(100);
  });
});

