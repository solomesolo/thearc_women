/**
 * Types for the Starting Lens v2 rule engine.
 * Deterministic, no AI; inputs → lens score → contributors → modules → assembled plan.
 */

export type Confidence = "low" | "medium" | "high";

export type LensId =
  | "performance_recovery"
  | "energy_metabolic"
  | "hormonal_dynamics"
  | "stress_nervous_system"
  | "body_composition_appetite"
  | "preventive_risk";

export type CycleContext = "regular" | "irregular" | "not_cycling" | "unsure";
export type LifeStage = "under_35" | "35_44" | "45_plus" | "postpartum";
export type TrainingVolume = "low" | "moderate" | "high";
export type Wearable = "none" | "sleep_only" | "full";

export interface StartingLensInput {
  goals: string[];
  symptoms: string[];
  changes: string[];
  cycleContext?: CycleContext;
  lifeStage?: LifeStage;
  trainingVolume?: TrainingVolume;
  wearable?: Wearable;
}

export interface LensResult {
  id: LensId;
  title: string;
  oneLine: string;
}

export interface ContributorResult {
  id: string;
  confidence: Confidence;
  whyThisFits: string;
  checkNext: string[];
}

export interface PlanDayBlock {
  dayRange: string;
  focus: string[];
  details: string[];
}

export interface Next7DaysResult {
  goal: string;
  plan: PlanDayBlock[];
  monitor: {
    noWearable: string[];
    wearable: string[];
  };
}

export interface PredictionResult {
  label: string;
  expected: string;
  confidence: Confidence;
}

export interface StartingLensOutput {
  lens: LensResult;
  contributors: ContributorResult[];
  next7Days: Next7DaysResult;
  predictions: PredictionResult[];
  medicalSafety: {
    notDiagnosis: boolean;
    escalation: string;
  };
  sourcesStyle: {
    evidenceLevel: string;
    notes: string;
  };
}
