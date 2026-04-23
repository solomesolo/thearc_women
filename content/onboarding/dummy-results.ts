export const DUMMY_USER = {
  name: "Anna",
  ageGroup: "30–34",
  lifeStage: "Regular menstrual cycle",
  goals: ["General preventive health", "More energy and vitality"],
  riskFlags: ["Fatigue or low energy", "Very little — mostly indoors", "Irregular or heavy periods", "High stress levels"],
  conditions: [],
  familyHistory: ["Thyroid disease"],
  lastTests: {
    vitaminD: "Never / not sure",
    ironFerritin: "6–12 months ago",
    thyroid: "More than 12 months ago",
    hba1c: "Never / not sure",
    lipids: "Never / not sure",
    hormones: "Never / not sure",
  },
  healthScore: 32,
  openActions: 3,
};

export const DUMMY_RECOMMENDATIONS = [
  {
    id: "vitamin-d",
    testName: "Vitamin D",
    statusBadge: "Missing" as const,
    priority: 1,
    whyTitle: "Why this matters now",
    whyBody:
      "Based on your profile, a Vitamin D check may be worth considering. You reported fatigue and low sun exposure — two factors commonly associated with low Vitamin D levels. This is one of the most frequently deficient nutrients in women your age.",
    labsTitle: "Book at a lab",
    labs: [
      { name: "Synlab Berlin Mitte", price: "~€18", address: "Friedrichstr. 71, 10117 Berlin", note: "Walk-in available", mapsHref: "#" },
      { name: "Labor Berlin", price: "~€22", address: "Sylter Str. 2, 13353 Berlin", note: "Appointment recommended", mapsHref: "#" },
    ],
    homeTitle: "Home test",
    homeTests: [
      { name: "Cerascreen Vitamin D Test", price: "~€29", descriptor: "Finger-prick test, results in 5–7 days", orderHref: "#" },
      { name: "Lykon myDNA Vital", price: "~€39", descriptor: "Includes vitamin D + iron panel", orderHref: "#" },
    ],
    doctorTitle: "Through your doctor",
    doctorLines: [
      "Can be added to a routine blood test",
      "Ask: \"Can we include Vitamin D in my next blood panel?\"",
      "May be covered by insurance if deficiency is suspected",
    ],
    ctaBook: "Book at lab",
    ctaBookHref: "#",
    ctaOrder: "Order home test",
    ctaOrderHref: "#",
    ctaPlanned: "Mark as planned",
    ctaDone: "Mark as done",
  },
  {
    id: "iron-ferritin",
    testName: "Iron / Ferritin",
    statusBadge: "Outdated" as const,
    priority: 2,
    whyTitle: "Why this matters now",
    whyBody:
      "You reported heavy periods and fatigue — both common indicators that iron levels may be worth checking. Ferritin (stored iron) can be low even when hemoglobin is normal. Your last check was 6–12 months ago.",
    labsTitle: "Book at a lab",
    labs: [
      { name: "Synlab Berlin Mitte", price: "~€14", address: "Friedrichstr. 71, 10117 Berlin", note: "Walk-in available", mapsHref: "#" },
    ],
    homeTitle: "Home test",
    homeTests: [
      { name: "Cerascreen Iron Test", price: "~€35", descriptor: "Tests ferritin + transferrin, finger-prick", orderHref: "#" },
    ],
    doctorTitle: "Through your doctor",
    doctorLines: [
      "Routinely included in general blood panels",
      "Ask specifically for ferritin — not just hemoglobin",
      "Likely covered if you report fatigue or heavy periods",
    ],
    ctaBook: "Book at lab",
    ctaBookHref: "#",
    ctaOrder: "Order home test",
    ctaOrderHref: "#",
    ctaPlanned: "Mark as planned",
    ctaDone: "Mark as done",
  },
  {
    id: "thyroid",
    testName: "Thyroid (TSH)",
    statusBadge: "Outdated" as const,
    priority: 3,
    whyTitle: "Why this matters now",
    whyBody:
      "Your family history includes thyroid disease and your last TSH test was over 12 months ago. Thyroid function can affect energy, weight, mood, and cycle regularity — all areas you flagged as relevant.",
    labsTitle: "Book at a lab",
    labs: [
      { name: "Labor Berlin", price: "~€16", address: "Sylter Str. 2, 13353 Berlin", note: "Appointment recommended", mapsHref: "#" },
    ],
    homeTitle: "Home test",
    homeTests: [
      { name: "Cerascreen Thyroid Test", price: "~€39", descriptor: "TSH + fT3 + fT4, finger-prick sample", orderHref: "#" },
    ],
    doctorTitle: "Through your doctor",
    doctorLines: [
      "Standard part of many annual check-ups",
      "Mention family history of thyroid disease",
      "Usually covered by insurance with relevant symptoms",
    ],
    ctaBook: "Book at lab",
    ctaBookHref: "#",
    ctaOrder: "Order home test",
    ctaOrderHref: "#",
    ctaPlanned: "Mark as planned",
    ctaDone: "Mark as done",
  },
];

export const DUMMY_TIMELINE = [
  { month: "This month", item: "Vitamin D blood test" },
  { month: "Next month", item: "Iron / Ferritin check" },
  { month: "In 6 weeks", item: "Thyroid (TSH) check" },
  { month: "In 3 months", item: "Follow-up — review results with GP" },
];

export const DUMMY_MISSING = [
  "Vitamin D — never checked",
  "Thyroid — last checked 12+ months ago",
  "Blood sugar — never checked",
];

export const DUMMY_WHY_THESE = [
  "Fatigue and low energy",
  "Low sun exposure",
  "Heavy or irregular periods",
  "Family history of thyroid disease",
];

export const DUMMY_SAVED_INSIGHTS = [
  { title: "Hormones and fatigue", tag: "Hormones" },
  { title: "Vitamin D and mood in women", tag: "Micronutrients" },
];
