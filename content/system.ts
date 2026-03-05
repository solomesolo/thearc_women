export const systemPage = {
  hero: {
    headline: "A biological intelligence system designed for women.",
    bodyLine1:
      "Most health tools store data. The Arc interprets it in female context.",
    bodyLine2:
      "It connects hormones, metabolism, stress, sleep, recovery, and biomarkers into one model.",
    bodyLine3: "You get clarity, not noise.",
    proofPills: [
      {
        id: "mapping",
        label: "Personal biology mapping",
        tooltip:
          "Mapping means the system understands your baseline before it interprets change.",
      },
      {
        id: "brief",
        label: "Weekly intelligence brief",
        tooltip:
          "Each week you get a contextual interpretation of your signals, not generic advice.",
      },
      {
        id: "timeline",
        label: "Health memory timeline",
        tooltip:
          "Your data becomes a living timeline so patterns emerge over weeks and months.",
      },
    ],
    nodes: ["Hormones", "Metabolism", "Stress", "Recovery", "Sleep", "Biomarkers"],
  },
  systemMapInsights: {
    Hormones:
      "Modulate sleep, recovery, metabolism, and cognitive variability across phases.",
    Metabolism: "Shapes energy stability and influences recovery and mood.",
    Stress: "Changes sensitivity and sleep quality. Impacts recovery capacity.",
    Sleep: "Amplifies or buffers fatigue patterns and emotional regulation.",
    Recovery: "Reflects total load. Moves with stress, fueling, and cycle context.",
    Biomarkers: "Offer snapshots that become meaningful in timelines.",
  },
  biologicalMapping: {
    title: "Biological Mapping",
    intro: "Before interpretation, the system builds your baseline.",
    steps: [
      {
        id: "context",
        label: "Context",
        body: "Life stage, cycle status, environment",
      },
      {
        id: "signals",
        label: "Signals",
        body: "Energy, sleep, recovery, training response",
      },
      {
        id: "history",
        label: "History",
        body: "Labs, symptoms, family patterns, medications",
      },
    ],
    tabs: {
      context: {
        items: [
          { label: "life stage", detail: "Where you are in reproductive and metabolic life." },
          { label: "cycle patterns", detail: "Regularity, length, and phase-dependent patterns." },
          { label: "stress exposure", detail: "Load and recovery balance over time." },
          { label: "sleep schedule", detail: "Timing and consistency, not just duration." },
          { label: "training load", detail: "Volume and intensity relative to recovery." },
        ],
        whyItMatters:
          "Context explains why the same routine can feel different.",
      },
      signals: {
        items: [
          { label: "energy stability", detail: "How steady or variable your energy is day to day." },
          { label: "sleep quality", detail: "Restoration and consistency, not just hours." },
          { label: "recovery time", detail: "How quickly you bounce back from load." },
          { label: "mood focus shifts", detail: "Patterns in focus and emotional baseline." },
          { label: "appetite cravings", detail: "Hunger and craving patterns by context." },
        ],
        whyItMatters: "Signals show how your system responds in real life.",
      },
      history: {
        items: [
          { label: "biomarker results", detail: "Labs you add for context over time." },
          { label: "diagnoses (user entered)", detail: "Conditions that shape interpretation." },
          { label: "medications supplements", detail: "What you take that may affect signals." },
          { label: "family history", detail: "Relevant background for prevention." },
          { label: "major events travel illness", detail: "One-off factors that shift baseline." },
        ],
        whyItMatters:
          "History prevents repeating the same story in every clinic.",
      },
    },
    hoverPanels: {
      Hormones:
        "Hormonal rhythms influence metabolism, sleep quality, and recovery patterns.",
      Metabolism: "Metabolic signals interact with hormones, stress, and recovery.",
      Stress: "Stress response shapes sleep, recovery, and hormonal patterns.",
      Recovery: "Recovery capacity influences stress resilience and performance.",
      Sleep: "Sleep architecture affects hormones, metabolism, and recovery.",
      Biomarkers: "Biomarkers provide objective context for signal interpretation.",
    },
  },
  microDemo: {
    title: "How the system interprets",
    signals: [
      { id: "training", label: "Training feels off" },
      { id: "exhausted", label: "Exhausted despite sleep" },
      { id: "sleep", label: "Sleep disruption" },
      { id: "cycle", label: "Cycle changes" },
      { id: "mood", label: "Mood focus shifts" },
    ],
    outputs: {
      training: {
        checksFirst: [
          "recovery load vs. capacity",
          "cycle phase and training response",
          "sleep quality trend",
        ],
        interacting: ["Recovery", "Sleep", "Metabolism"],
        track: [
          "Training load and perceived effort",
          "Next-day recovery 1–5",
        ],
      },
      exhausted: {
        checksFirst: [
          "stress load trend",
          "fueling consistency",
          "cycle context",
        ],
        interacting: ["Stress", "Metabolism", "Sleep"],
        track: [
          "Morning energy 1–5",
          "Sleep timing consistency",
        ],
      },
      sleep: {
        checksFirst: [
          "stress and wind-down",
          "cycle phase and sleep architecture",
          "caffeine and timing",
        ],
        interacting: ["Stress", "Hormones", "Recovery"],
        track: [
          "Bedtime and wake time",
          "Sleep quality 1–5",
        ],
      },
      cycle: {
        checksFirst: [
          "cycle phase and length",
          "symptom pattern by phase",
          "stress and cycle interaction",
        ],
        interacting: ["Hormones", "Stress", "Metabolism"],
        track: [
          "Cycle start and key symptoms",
          "Energy and mood by phase",
        ],
      },
      mood: {
        checksFirst: [
          "cycle phase and mood pattern",
          "sleep and stress load",
          "fueling and blood sugar",
        ],
        interacting: ["Hormones", "Sleep", "Metabolism"],
        track: [
          "Mood and focus 1–5",
          "Correlation with sleep and cycle",
        ],
      },
    },
  },
  lens: {
    title: "Your Biological Lens",
    shortIntro:
      "Your body expresses patterns through systems that are more active at certain times.",
    lenses: {
      energy: {
        label: "Energy Regulation",
        signalsDetected: [
          "unstable energy across the day",
          "fatigue after training",
          "sleep recovery changes",
        ],
        observesNext: [
          "glucose stability patterns",
          "cortisol rhythm",
          "micronutrient signals",
        ],
        commonPatterns: [
          "afternoon crashes",
          "delayed recovery",
          "appetite shifts",
        ],
      },
      stress: {
        label: "Stress Response",
        signalsDetected: [
          "elevated stress load",
          "recovery lag",
          "sleep disruption",
        ],
        observesNext: [
          "cortisol and nervous system markers",
          "recovery capacity trend",
          "sleep architecture",
        ],
        commonPatterns: [
          "tension and restlessness",
          "shallow sleep",
          "longer recovery windows",
        ],
      },
      hormonal: {
        label: "Hormonal Rhythm",
        signalsDetected: [
          "cycle-driven symptom patterns",
          "phase-dependent energy",
          "mood and focus shifts by phase",
        ],
        observesNext: [
          "cycle phase and length",
          "symptom pattern by phase",
          "hormone-sensitive signals",
        ],
        commonPatterns: [
          "premenstrual shifts",
          "mid-cycle energy peaks",
          "phase-specific cravings",
        ],
      },
      recovery: {
        label: "Recovery Capacity",
        signalsDetected: [
          "slower bounce-back from load",
          "persistent fatigue",
          "training response changes",
        ],
        observesNext: [
          "load vs. recovery balance",
          "sleep quality and timing",
          "stress and fueling",
        ],
        commonPatterns: [
          "extended soreness",
          "energy debt",
          "need for more rest days",
        ],
      },
    },
  },
  healthMemory: {
    title: "The Health Memory",
    shortIntro:
      "The Arc builds a living timeline of how your signals evolve. Patterns emerge over months, not days.",
    timelineEvents: [
      { month: 1, signals: ["energy stable", "baseline forming"] },
      { month: 2, signals: ["sleep pattern visible", "recovery trend"] },
      {
        month: 3,
        signals: [
          "cycle variability increases",
          "sleep quality decreases",
          "training recovery slows",
        ],
      },
      { month: 4, signals: ["phase-dependent patterns", "stress-recovery link"] },
      { month: 5, signals: ["luteal vs follicular contrast", "energy rhythm"] },
      { month: 6, signals: ["long-term trends", "seasonal and cycle overlay"] },
    ],
  },
  weeklyBrief: {
    title: "Weekly Biological Intelligence",
    shortIntro:
      "Each week you get a contextual interpretation of your signals—not generic advice.",
    tabs: [
      { id: "patterns", label: "Patterns" },
      { id: "interactions", label: "System Interactions" },
      { id: "research", label: "Research Insight" },
    ],
    patterns: {
      notice: "This week the system notices:",
      bullets: [
        "sleep variability increased",
        "recovery signals slower after training",
        "luteal phase approaching",
      ],
      interpretation: "Energy demand may increase.",
    },
    interactions: {
      pairs: [
        { a: "Stress", b: "Sleep" },
        { a: "Hormones", b: "Recovery" },
        { a: "Metabolism", b: "Energy" },
      ],
    },
    research: {
      example:
        "Sleep variability increases during luteal phase in many women due to thermoregulation changes.",
      whatItMeans: "Earlier sleep window may improve recovery.",
    },
  },
  preventive: {
    title: "Preventive Planning",
    shortIntro:
      "The system highlights domains that benefit from attention—before symptoms dominate.",
    // Order: clockwise from top — Hormonal, Cardiovascular, Bone, Micronutrient, Stress, Metabolic
    domains: [
      {
        id: "hormonal",
        label: "Hormonal Stability",
        whyItMatters:
          "Hormonal rhythms influence sleep, metabolism, mood, and recovery.",
        signals: [
          "cycle regularity",
          "luteal phase symptoms",
          "sleep variability",
          "stress sensitivity",
        ],
        patterns:
          "Cycle variability, mood shifts, delayed recovery.",
      },
      {
        id: "cardiovascular",
        label: "Cardiovascular Health",
        whyItMatters:
          "Cardiovascular markers shape long term metabolic and inflammatory stability.",
        signals: [
          "blood pressure trends",
          "lipid markers",
          "inflammation indicators",
        ],
        patterns:
          "Reduced recovery capacity, persistent fatigue.",
      },
      {
        id: "bone",
        label: "Bone Integrity",
        whyItMatters:
          "Bone health is strongly influenced by hormonal patterns and mechanical loading.",
        signals: [
          "menstrual regularity",
          "strength training exposure",
          "vitamin D and calcium",
        ],
        patterns:
          "Reduced training resilience, stress injury risk.",
      },
      {
        id: "micronutrient",
        label: "Micronutrient Reserves",
        whyItMatters:
          "Low micronutrient reserves quietly affect energy, immunity, and recovery.",
        signals: [
          "ferritin levels",
          "vitamin D status",
          "magnesium related sleep patterns",
        ],
        patterns:
          "Persistent fatigue, slower recovery, cold sensitivity.",
      },
      {
        id: "stress",
        label: "Stress & Recovery Balance",
        whyItMatters:
          "Chronic stress reshapes sleep, metabolism, and hormonal stability.",
        signals: [
          "sleep variability",
          "resting heart rate trends",
          "recovery scores",
        ],
        patterns:
          "Fragmented sleep, mental fatigue, slow training adaptation.",
      },
      {
        id: "metabolic",
        label: "Metabolic Resilience",
        whyItMatters:
          "Metabolism shapes energy stability, recovery, and cognitive performance.",
        signals: [
          "energy fluctuations",
          "post training recovery",
          "appetite variability",
          "glucose stability patterns",
        ],
        patterns:
          "Afternoon fatigue, unstable training response, sugar cravings.",
      },
    ],
  },
  dataInterpretation: {
    title: "Data Interpretation",
    narrative: [
      "Modern health produces endless signals.",
      "Wearables. Lab results. Symptoms. Research updates.",
      "Most people are left to interpret them alone.",
      "The Arc connects these signals into a biological system.",
      "Not more data.",
      "Clear meaning.",
    ],
    signalTypes: [
      { id: "wearable", label: "Wearable data" },
      { id: "labs", label: "Lab results" },
      { id: "symptoms", label: "Symptoms" },
      { id: "research", label: "Research insight" },
    ],
    interpretationData: {
      wearable: {
        inputs: [
          "Sleep variability",
          "Resting heart rate increase",
          "Recovery score drop",
        ],
        systems: [
          "stress load rising",
          "hormonal phase shift",
          "incomplete recovery",
        ],
        systemsLabel: "Possible system interactions",
        observation:
          "Track sleep timing consistency and energy stability this week.",
      },
      labs: {
        inputs: ["Ferritin slightly low", "Vitamin D borderline", "CRP normal"],
        systems: ["energy regulation", "recovery capacity"],
        systemsLabel: "Systems influenced",
        context:
          "Interpretation changes with training load and cycle phase.",
      },
      symptoms: {
        inputs: [
          "Fatigue despite sleep",
          "Afternoon energy drop",
          "Mood fluctuation",
        ],
        systems: [
          "metabolic regulation",
          "cortisol rhythm",
          "hormonal phase transition",
        ],
        systemsLabel: "Possible systems interacting",
        observation:
          "Consider tracking energy 1–5 and sleep quality to see patterns.",
      },
      research: {
        inputs: [
          "New study on sleep variability across menstrual phases",
        ],
        systems: [],
        observation:
          "Sleep fragmentation can increase during luteal phase due to thermoregulation shifts.",
        observationLabel: "What it might mean for you",
      },
    },
  },
  closing: {
    line1: "Your biology already follows patterns.",
    line2: "The Arc helps you see them.",
    ctaLabel: "Begin your biological mapping",
    ctaHref: "/survey",
  },
};
