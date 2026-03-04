export const labPage = {
  hero: {
    headline: "Where biological insight becomes practical action.",
    subheadline:
      "Understanding patterns is the first step. Applying them creates measurable change.",
    body: "The Preventive Lab transforms biological interpretation into structured frameworks.",
  },
  protocols: {
    title: "Protocols",
    cards: [
      { id: "energy", title: "Energy Regulation" },
      { id: "sleep", title: "Sleep Architecture" },
      { id: "hormonal", title: "Hormonal Rhythm" },
      { id: "stress", title: "Stress Recovery" },
      { id: "metabolic", title: "Metabolic Stability" },
    ],
    copy: {
      energy:
        "Structured approaches to stabilize energy through timing, nutrition, and recovery. The framework adapts to your cycle phase and training load.",
      sleep:
        "Evidence-based sleep architecture optimization: light, timing, and wind-down. Aligned with hormonal phase for better consistency.",
      hormonal:
        "Cycle-aware protocols for hormone support. Focus on rhythm stability, symptom modulation, and when to involve clinical care.",
      stress:
        "Stress recovery frameworks that integrate load, recovery signals, and nervous system regulation. Practical triggers for when to dial back.",
      metabolic:
        "Metabolic stability protocols: blood sugar, fueling, and body composition. Tied to your biomarker and symptom context.",
    },
  },
  biomarkers: {
    title: "Biomarker Interpretation",
    markers: [
      { id: "ferritin", name: "Ferritin" },
      { id: "tsh", name: "TSH" },
      { id: "vitamin-d", name: "Vitamin D" },
      { id: "glucose", name: "Fasting Glucose" },
      { id: "crp", name: "CRP" },
    ],
    panels: {
      ferritin: {
        reflects: "Iron storage and availability for red blood cell production and energy.",
        influences: "Energy, cognitive function, recovery, thermoregulation.",
        when: "When fatigue persists despite sleep, or when cycle-related blood loss is a factor.",
      },
      tsh: {
        reflects: "Thyroid-stimulating hormone; reflects thyroid gland function.",
        influences: "Metabolism, energy, temperature regulation, heart rate, mood.",
        when: "When energy, weight, or temperature symptoms suggest thyroid involvement.",
      },
      "vitamin-d": {
        reflects: "Vitamin D status; supports bone, immune, and metabolic health.",
        influences: "Bone health, immune function, mood, some metabolic pathways.",
        when: "Routine screening; more often if low sun exposure or relevant symptoms.",
      },
      glucose: {
        reflects: "Fasting blood sugar; snapshot of glucose regulation.",
        influences: "Energy stability, metabolic health, hunger, and longer-term risk markers.",
        when: "When energy crashes, weight changes, or metabolic context warrants it.",
      },
      crp: {
        reflects: "C-reactive protein; marker of systemic inflammation.",
        influences: "Recovery, cardiovascular context, autoimmune and metabolic health.",
        when: "When unexplained fatigue, persistent symptoms, or risk stratification is relevant.",
      },
    },
  },
  tracking: {
    title: "Tracking Frameworks",
    daily: {
      label: "Daily signals",
      items: ["Energy stability", "Sleep patterns"],
    },
    weekly: {
      label: "Weekly signals",
      items: ["Recovery response", "Training load"],
    },
    monthly: {
      label: "Monthly signals",
      items: ["Cycle dynamics", "Biomarker updates"],
    },
  },
  dashboards: {
    title: "Progress Dashboards",
    description: "Your signals over time, in one place.",
    metrics: ["Signal trends", "System stability", "Biomarker evolution"],
  },
  decision: {
    title: "Decision Frameworks",
    question: "When might additional lab testing be useful?",
    branches: [
      "Signal persistence — symptoms or patterns that don’t resolve with lifestyle changes.",
      "Symptom patterns — clusters that suggest a specific system (e.g. thyroid, iron, metabolic).",
      "Clinical thresholds — when screening guidelines or risk factors indicate testing.",
    ],
  },
  closing: {
    line1: "Prevention is structured awareness.",
    line2: "The Preventive Lab turns biological understanding into practical intelligence.",
    ctaLabel: "Explore the Preventive Lab",
    ctaHref: "/assessment",
  },
};
