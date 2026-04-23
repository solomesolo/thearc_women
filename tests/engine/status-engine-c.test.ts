import { describe, expect, test } from "vitest";
import { effectiveIntervalMonths } from "@/lib/status-engine/intervalPolicies";
import { classifyRecency } from "@/lib/status-engine/recencyClassifier";
import { resolveFinalStatus } from "@/lib/status-engine/finalStatusResolver";

describe("Engine C — interval + status precedence", () => {
  test("shortens vitamin_d interval for low sun + fatigue", () => {
    const months = effectiveIntervalMonths("vitamin_d", {
      age_group: "30_34",
      life_stage: "reproductive",
      goal_flags: [],
      risk_flags: ["fatigue", "low_sun_exposure"],
      condition_flags: [],
      medication_flags: [],
      family_history_flags: [],
      lifestyle_flags: ["low_sun_exposure"],
    });
    expect(months).toBe(6);
  });

  test("classifies missing/current/outdated based on interval", () => {
    const now = new Date("2026-04-20T00:00:00Z");
    expect(classifyRecency(null, 6, now)).toBe("missing");
    expect(classifyRecency(new Date("2026-02-20T00:00:00Z"), 6, now)).toBe("current");
    expect(classifyRecency(new Date("2025-02-20T00:00:00Z"), 6, now)).toBe("outdated");
  });

  test("final status precedence completed > planned > recency", () => {
    expect(resolveFinalStatus("missing", "planned").final_status).toBe("planned");
    expect(resolveFinalStatus("outdated", "completed").final_status).toBe("completed");
    expect(resolveFinalStatus("current", "none").final_status).toBe("current");
  });
});

