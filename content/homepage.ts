export const homepageContent = {
  hero: {
    eyebrow: "Personalized women’s health",
    headline: "Design your health around your biology",
    supporting:
      "Take a guided survey to understand your health patterns, predispositions, and priorities. Explore research-backed insights, discover protocols you may want to try, and track how your body responds over time — all in one private workspace designed for women’s health self-navigation.",
    secondarySupport:
      "For women who want more than generic advice: a clearer way to learn, decide, test, and track.",
    ctaPrimaryLabel: "Start your health profile",
    ctaPrimaryHref: "/survey",
    ctaSecondaryLabel: "See how it works",
    ctaSecondaryHref: "/system2",
    trustLine:
      "Research-guided, privacy-aware, and built for personal experimentation.",
    flowTitle: "How it works",
    flowSteps: [
      { title: "Survey", line: "Build your baseline" },
      { title: "Insights", line: "Understand what matters" },
      { title: "Protocols", line: "Explore what to try" },
      { title: "Tracking", line: "Monitor your response" },
      { title: "Results", line: "Learn what works" },
    ],
    whatsIncludedLabel: "What’s included?",
    whatsIncludedItems: [
      "A guided survey across symptoms, habits, life stage, and health priorities",
      "Research-connected insights translated into practical understanding",
      "A personal dashboard to test, track, and refine protocols over time",
    ],
    imageSrc: "/images/Hero.avif",
    imageAlt:
      "Premium editorial visual showing focus and calm competence",
  },
  whatThisIs: {
    label: "What this is",
    headline: "Not another wellness app. A system for self-directed health.",
    main:
      "Most health advice is generic, fragmented, or not built around female biology.\n\nThis platform helps you understand your own patterns, explore relevant research, and make informed decisions about what to try — without relying on one-size-fits-all recommendations.",
    supporting:
      "Instead of passively consuming advice, you build your own approach: guided by data, informed by science, and adapted to how your body responds over time.",
    secondaryLine:
      "A more structured way to navigate complex health information — without losing personal context.",
    differentLabel: "How is this different?",
    differentItems: [
      "You don’t just read content — you apply it to your own health profile",
      "Insights are connected to your inputs, not generic recommendations",
      "You choose what to test, instead of following fixed programs",
      "You track outcomes and adjust based on your own data",
    ],
  },
  personalization: {
    headline: "Your starting lens, in 30 seconds.",
    explanation: [
      "Choose what you’re optimizing for, what’s showing up, and what changed recently.",
      "We’ll suggest a focus lens, likely contributors, and a 7-day plan.",
    ],
    stepA: "Goals (max 2)",
    goals: [
      "Training performance",
      "Energy stability",
      "Hormonal transition (peri/meno)",
      "Family history / risk",
      "Sleep quality",
      "Stress resilience",
      "Skin / hair changes",
      "Body composition",
    ],
    stepB: "What’s showing up (max 2)",
    symptoms: [
      "Exhausted despite sleep",
      "Training feels off",
      "Sleep disruption",
      "Cycle changes",
      "Mood / focus shifts",
      "Bloating / inflammation",
      "Hair shedding / skin flare",
      "Weight shifts / cravings",
    ],
    stepC: "What changed recently (max 2)",
    changes: [
      "Increased training load",
      "Reduced fueling / dieting",
      "Higher work stress",
      "Travel / jet lag",
      "Illness / antibiotics",
      "Alcohol ↑ / social load ↑",
      "New contraception / stopped contraception",
      "Entering peri/meno symptoms",
      "Nothing significant",
    ],
    stepD: "System context (optional)",
    cycleContextLabel: "Cycle context",
    cycleContextOptions: [
      { value: "regular", label: "Regular cycle" },
      { value: "irregular", label: "Irregular" },
      { value: "not_cycling", label: "Not cycling" },
      { value: "unsure", label: "Unsure" },
    ],
    lifeStageLabel: "Life stage",
    lifeStageOptions: [
      { value: "under_35", label: "<35" },
      { value: "35_44", label: "35–44" },
      { value: "45_plus", label: "45+" },
      { value: "postpartum", label: "Postpartum (0–12 months)" },
    ],
    trainingVolumeLabel: "Training volume",
    trainingVolumeOptions: [
      { value: "low", label: "Low" },
      { value: "moderate", label: "Moderate" },
      { value: "high", label: "High" },
    ],
    wearableLabel: "Wearable",
    wearableOptions: [
      { value: "none", label: "None" },
      { value: "sleep_only", label: "Sleep only" },
      { value: "full", label: "Full (sleep + HR/HRV)" },
    ],
    resetLabel: "Reset",
    ctaLabel: "Get My Personalized Health Map",
  },
  designConcept: {
    headline: "Preventive medicine was built on male data.",
    statValue: "70%",
    statLabel: "of clinical trials historically excluded women.",
    contextParagraphs: [
      "What we call “normal” was calibrated around male physiology.",
      "Female biology was treated as a variable to control for, not a system to understand.",
    ],
    reframeLead: "",
    reframeLines: [],
    transitionLead: "",
    transitionBody: "",
    closingLine: "",
  },
  mirror: {
    headline:
      "Your Body Changes. Even When Your Effort Doesn't.",
    slides: [
      {
        id: "cognition",
        tag: "01 — Cognition",
        leftLabel: "Focus and mental sharpness",
        experience:
          "Your focus and mental sharpness feel different\nat different stages of life.",
        columns: [
          {
            header: "Across the menstrual cycle",
            paragraphs: [
              "Cognitive performance varies within the same woman, with effect sizes typically up to 0.3.",
              "Memory and attention show subtle phase-related shifts.",
              "Differences are measurable but small in magnitude.",
              "Variation reflects modulation, not decline.",
            ],
          },
          {
            header: "During late pregnancy",
            paragraphs: [
              "General cognition measures 0.3 to 1.3 standard deviations lower than non-pregnant controls.",
              "Memory differences range from 0.3 to 1.5 standard deviations.",
              "Changes are present but not universal.",
              "Temporary recalibration is not impairment.",
            ],
          },
          {
            header: "Across menopause",
            paragraphs: [
              "Average cognitive change across domains is often near zero.",
              "Effect sizes commonly range from 0.05 to 0.2.",
              "The transition is more variable than uniformly negative.",
              "Context shapes experience more than stage alone.",
            ],
          },
        ],
      },
      {
        id: "energy-hunger",
        tag: "02 — Energy & Hunger",
        leftLabel: "Body adaptability",
        experience:
          "Some weeks you feel hungrier or more drained,\neven when your routine has not changed.",
        columns: [
          {
            header: "Across the menstrual cycle",
            paragraphs: [
              "Energy intake rises 150 to 500 kcal per day in the luteal phase.",
              "This represents roughly 10 to 30 percent more than earlier phases.",
              "Exercise volume often remains stable.",
              "Increased hunger reflects metabolic demand.",
            ],
          },
          {
            header: "During late pregnancy",
            paragraphs: [
              "Resting metabolic rate rises 10 to 20 percent.",
              "Daily needs increase approximately 300 to 500 kcal.",
              "Schedules and activity may appear unchanged.",
              "Fatigue mirrors elevated baseline load.",
            ],
          },
          {
            header: "Across menopause",
            paragraphs: [
              "Resting energy expenditure declines 3 to 5 percent.",
              "This equals roughly 40 to 80 kcal per day.",
              "Diet and activity frequently remain similar.",
              "Metabolism shifts independent of effort.",
            ],
          },
        ],
      },
      {
        id: "training-recovery",
        tag: "03 — Training Recovery",
        leftLabel: "Recover",
        experience:
          "Some workouts feel productive.\nOthers feel harder to recover from.",
        columns: [
          {
            header: "Across the menstrual cycle",
            paragraphs: [
              "Resting heart rate averages 1 to 2 beats higher in the mid-luteal phase.",
              "Inflammatory markers may differ 20 to 40 percent post-training.",
              "Recovery typically returns to baseline within 48 to 72 hours.",
              "Variation is phase-dependent, not effort-dependent.",
            ],
          },
          {
            header: "During pregnancy",
            paragraphs: [
              "Baseline metabolic load rises progressively across trimesters.",
              "Perceived exertion increases 1 to 2 points for identical sessions.",
              "Recovery from intense effort may extend by one additional day.",
              "The system carries higher underlying demand.",
            ],
          },
          {
            header: "Across menopause",
            paragraphs: [
              "Resting expenditure declines 3 to 5 percent.",
              "Some cohorts report 5 to 10 percentage points more persistent soreness.",
              "Most trained women still recover within 48 to 72 hours.",
              "Differences are modest and load-sensitive.",
            ],
          },
        ],
      },
      {
        id: "stress-response",
        tag: "04 — Stress Response",
        leftLabel: "Emotional or physical stress",
        experience:
          "The same situation sometimes feels manageable.\nOther times, it lands harder.",
        columns: [
          {
            header: "Across the menstrual cycle",
            paragraphs: [
              "Under identical stressors, 73 percent in the follicular phase show marked cortisol spikes versus 32 percent in luteal phase.",
              "Basal cortisol may be 25 percent higher in follicular phase.",
              "Higher spikes correlate with stronger emotional memory encoding.",
              "The stressor is constant. Amplification differs.",
            ],
          },
          {
            header: "During late pregnancy",
            paragraphs: [
              "Basal cortisol levels reach 200 to 300 percent of non-pregnant levels.",
              "Relative stress spikes may appear smaller.",
              "The system operates from an elevated baseline.",
              "Absolute load remains high.",
            ],
          },
          {
            header: "Across menopause",
            paragraphs: [
              "Average cortisol differences range 10 to 15 percent.",
              "Effect sizes are typically around 0.2 to 0.3.",
              "Differences are smaller than lifestyle stress variability.",
              "Change reflects modulation, not instability.",
            ],
          },
        ],
      },
      {
        id: "performance-output",
        tag: "05 — Performance Output",
        leftLabel: "Physical Activity",
        experience:
          "One week, training feels powerful.\nAnother week, it feels heavier.",
        columns: [
          {
            header: "Across the menstrual cycle",
            paragraphs: [
              "Objective performance differences are typically 0 to 3 percent.",
              "Sprint and power outputs may differ 2 to 5 percent between phases.",
              "Exercise time often varies less than one minute per day.",
              "Perceived cost can shift without workload change.",
            ],
          },
          {
            header: "During late pregnancy",
            paragraphs: [
              "Resting metabolic rate increases 10 to 20 percent.",
              "Perceived exertion rises 1 to 2 points for identical loads.",
              "Recovery from intense sessions may require an extra day.",
              "Baseline demand elevates session cost.",
            ],
          },
          {
            header: "Across menopause",
            paragraphs: [
              "Resting energy expenditure declines 3 to 5 percent.",
              "Some data show 5 to 10 percentage points more overuse complaints.",
              "Age-appropriate programming preserves 48 to 72 hour recovery.",
              "Context determines magnitude of change.",
            ],
          },
        ],
      },
      {
        id: "sleep",
        tag: "06 — Sleep",
        leftLabel: "Sleep",
        experience:
          "You sleep the same hours,\nbut wake up feeling different.",
        columns: [
          {
            header: "Across the menstrual cycle",
            paragraphs: [
              "Sleep efficiency drops about 3 percent in the late luteal phase.",
              "Wake time after sleep onset increases roughly 15 minutes.",
              "Sleep duration may shorten 10 to 20 minutes.",
              "Architecture shifts alter perceived rest.",
            ],
          },
          {
            header: "During late pregnancy",
            paragraphs: [
              "Slow-wave sleep decreases 20 to 30 percent.",
              "Total sleep time often declines 1 to 2 hours.",
              "Sleep efficiency averages 75 to 80 percent.",
              "Depth changes, not just duration.",
            ],
          },
          {
            header: "Across menopause",
            paragraphs: [
              "Sleep efficiency may decline 5 to 10 percent.",
              "Deep sleep decreases 10 to 15 percent post menopause.",
              "Forty to sixty percent report frequent disruption.",
              "Structure shifts despite stable habits.",
            ],
          },
        ],
      },
      {
        id: "lab-results",
        tag: "07 — Lab Results",
        leftLabel: "Blood biomarkers",
        experience:
          "Your labs look normal,\nbut you do not feel optimal.",
        columns: [
          {
            header: "Across the menstrual cycle",
            paragraphs: [
              "LDL cholesterol fluctuates 7 to 17 percent.",
              "HDL can rise 7 to 9 percent between phases.",
              "Plasma volume shifts 2 to 3 percent.",
              "Values move within reference ranges.",
            ],
          },
          {
            header: "During pregnancy",
            paragraphs: [
              "Plasma volume increases 40 to 50 percent.",
              "Hematocrit drops 3 to 5 percent.",
              "Cortisol rises 2 to 3 times baseline.",
              "Reference ranges shift with physiology.",
            ],
          },
          {
            header: "Across menopause",
            paragraphs: [
              "Estradiol declines below 20 to 30 pg/mL post menopause.",
              "LDL may increase 5 to 10 percent.",
              "Ferritin commonly rises after menses cease.",
              "Numbers remain measurable. Context evolves.",
            ],
          },
        ],
      },
      {
        id: "genetic-risk",
        tag: "08 — Genetic Risk",
        leftLabel: "Genetic risks",
        experience:
          "You wonder what risks are written\ninto your biology.",
        columns: [
          {
            header: "Across the menstrual cycle",
            paragraphs: [
              "About 32 percent of endometrial genes shift expression across phases.",
              "Menstrual symptoms show 35 to 39 percent heritability.",
              "Specific variants can lengthen cycle length by roughly one day per allele.",
              "Predisposition shapes probability, not certainty.",
            ],
          },
          {
            header: "During pregnancy",
            paragraphs: [
              "Factor V Leiden carriers show 5 to 8 percent VTE risk versus ~0.1 percent baseline.",
              "TCF7L2 variants increase gestational diabetes risk 1.5 to 2 times.",
              "Prevalence in carriers reaches 7 to 10 percent.",
              "Genetics interact with physiological state.",
            ],
          },
          {
            header: "Across menopause",
            paragraphs: [
              "APOE4 carriers may show 10 to 15 percent faster LDL increases.",
              "Autoimmune relapse rates can rise 20 to 30 percent peri-menopause.",
              "Rheumatoid arthritis onset risk peaks around threefold in predisposed groups.",
              "These are layered risks, not destinies.",
            ],
          },
        ],
      },
      {
        id: "differential-response",
        tag: "09 — Differential Response",
        leftLabel: "Body reaction",
        experience:
          "Your body reacts differently\nto stress, caffeine, training, or medication.",
        columns: [
          {
            header: "Across the menstrual cycle",
            paragraphs: [
              "Cortisol spikes occur in 73 percent follicular versus 32 percent luteal under identical stress.",
              "Caffeine metabolism slows 20 to 30 percent in luteal phase.",
              "Objective performance differences remain 1 to 3 percent.",
              "Input stays constant. Output shifts.",
            ],
          },
          {
            header: "During pregnancy",
            paragraphs: [
              "Basal cortisol rises to 2 to 3 times baseline.",
              "Caffeine half-life extends up to 15 hours.",
              "Drug clearance may reduce 30 to 50 percent.",
              "Physiology alters response curves.",
            ],
          },
          {
            header: "Across menopause",
            paragraphs: [
              "Evening cortisol may rise 10 to 15 percent post menopause.",
              "Caffeine half-life may extend 30 to 50 percent.",
              "Some antidepressant response shows 20 to 30 percent reduced efficacy.",
              "Baseline shifts change stimulus impact.",
            ],
          },
        ],
      },
    ] as const,
  },
  reframe: {
    headline:
      "Women are taught to override signals they were never shown how to interpret.",
    paragraphs: [
      "Conventional health frameworks assume stability.",
      "Female biology is rhythmic.",
      "Adaptive.",
      "Phase responsive.",
      "Without visibility, even highly disciplined women operate with incomplete information.",
    ],
    backgroundVariant: "abstract",
    backgroundImageSrc: "/images/background_image.avif",
    backgroundImageAlt: "Abstract system visual",
  },
  journey: {
    headline: "Your Journey with The Arc",
    subline:
      "A structured path from understanding to action. No dashboards. No noise.",
    stages: [
      {
        stageLabel: "Entry",
        stageTitle: "Begin with intention",
        stageNarrative: [
          "Your journey starts with a structured assessment designed to map how your body actually operates.",
          "No generic questionnaires. No assumptions. You provide the signals; the system learns your baseline.",
        ],
        stageTriggers: [
          "Deep physiological and behavioral intake",
          "Clarity on goals and constraints",
          "Consent and data ownership from day one",
        ],
      },
      {
        stageLabel: "Intelligent Mapping",
        stageTitle: "Your biology, modeled",
        stageNarrative: [
          "The platform builds a personal model of your physiology—energy, recovery, stress response, and cycles.",
          "This is not a snapshot. It is a dynamic map that refines as more context is added.",
        ],
      },
      {
        stageLabel: "First Interpretation",
        stageTitle: "Patterns emerge",
        stageNarrative: [
          "Once the model has enough data, you see the first interpretations.",
          "Rhythms, not single data points. Variability explained, not averaged away.",
        ],
      },
      {
        stageLabel: "Contextual Awareness",
        stageTitle: "Context completes the picture",
        stageNarrative: [
          "Training load, sleep, nutrition, and life stress are integrated into one view.",
          "You understand why today feels different from yesterday—with evidence, not guesswork.",
        ],
      },
      {
        stageLabel: "Question Driven Model",
        stageTitle: "Ask. Get answers.",
        stageNarrative: [
          "The system is built to answer the questions that matter to you.",
          "Not dashboards. Not alerts. Interpretations that support decisions.",
        ],
        stageExamples: [
          "When can I push intensity?",
          "Why did recovery lag this week?",
          "How do I adjust for this phase?",
        ],
      },
      {
        stageLabel: "Health Memory",
        stageTitle: "Continuity over time",
        stageNarrative: [
          "Your history is retained and referenced. Patterns over months, not days.",
          "The system learns from your trajectory so recommendations stay relevant.",
        ],
      },
      {
        stageLabel: "Preparation Layer",
        stageTitle: "Anticipate, then act",
        stageNarrative: [
          "Before key events—competition, travel, deadlines—the model helps you prepare.",
          "Adjust load, recovery, and expectations so you show up ready.",
        ],
      },
      {
        stageLabel: "Continuous Intelligence",
        stageTitle: "A living system",
        stageNarrative: [
          "The Arc does not stop after one report. It keeps learning, refining, and interpreting.",
          "Your biology changes. The model changes with you.",
        ],
        stageFooter:
          "This is ongoing intelligence built for how you actually live and perform.",
      },
    ],
  },
  founderNote: {
    headline: "A note from the founder",
    paragraphs: [
      "The Arc was created because too many high-performing women were being asked to push through signals they were never taught how to interpret.",
      "I wanted a system that treats female physiology as a performance asset — something you can understand, anticipate, and work with, instead of a variable that keeps getting in the way.",
      "Everything you see here is built to give you medically literate, context-aware interpretations so your effort is matched by clarity, not guesswork.",
    ],
    signature: "Founder, The Arc",
  },
  productIntro: {
    headline:
      "A biological intelligence layer designed for female performance.",
    lead: "The platform models how physiology influences",
    items: [
      "Energy and cognitive clarity",
      "Recovery capacity",
      "Stress sensitivity",
      "Training response",
      "Hormonal transitions",
    ],
    closingLines: [
      "Not passive tracking.",
      "Not symptom logging.",
      "Dynamic interpretation of patterns your body already follows.",
    ],
    uiImageSrc: "/images/IMG_2900-modified.JPG",
    uiImageAlt: "Portrait of a woman in motion, representing focused female performance",
  },
  knowledge: {
    sectionName: "Your health starts with better knowledge.",
    headline: "Health trends move faster than evidence.",
    subline:
      "Most information isn't wrong. It's just not filtered for you.",
    trendChips: [
      "Cold plunges",
      "Hormone optimization",
      "Peptide protocols",
      "Longevity stacks",
      "Glucose monitors",
      'Cortisol "hacks"',
    ],
    problemLine: "The problem isn't exposure. It's interpretation.",
    pivotLine:
      "You don't need more information. You need filtration.",
    coreValueIntro: "Every week, we:",
    coreValueBullets: [
      "review emerging research",
      "assess evidence strength",
      "translate findings for female physiology",
      "filter what aligns with your profile",
    ],
    coreValueClosing: [
      "Not everything deserves your attention.",
      "Not every protocol is designed for your biology.",
      "Preventive care requires discernment — not volume.",
    ],
    feedTitleDefault: "Latest from the Knowledge Base",
    feedTitlePersonalized: "My Health Dashboard — picks for you",
    feedSublinePersonalized: "Curated for your current focus:",
    ctaLabel: "Get My Personalized Health Map",
    ctaHref: "/survey",
  },
  _drop: {
    _: [
      "Health advice moves faster than research.",
      "Social feeds amplify trends before evidence catches up.",
      "Cold plunges. Continuous glucose monitors. Hormone protocols. Longevity stacks. “Optimal” routines.",
      "The result isn’t empowerment. It’s cognitive overload.",
      "And the quiet pressure to constantly optimize.",
      "Our system does not chase trends. We filter them.",
      "Every week, we analyze emerging research, medical publications, and clinical guidelines — then translate what is relevant to women, and even more specifically, to your profile.",
      "Not everything is worth your attention. Not everything is meant for your physiology.",
      "We help you understand:",
    ],
    bulletPoints: [
      "What is evidence-based",
      "What is early-stage speculation",
      "What is marketing",
      "What might actually apply to you",
    ],
    bodyAfterBullets: "Because preventive care requires discernment, not volume.",
    whatYouReceive: [
      "Weekly knowledge brief — curated for your health priorities",
      "Research breakdowns in plain language",
      "Implementation guidance (if relevant to you)",
      "Context for supplements, protocols, and testing",
      "Invitations to online and offline conversations",
      "Conversations with experts, not influencers",
    ],
    closingLine: "Better knowledge reduces anxiety. Personalized knowledge creates confidence.",
    problemStatements: [
      "Too many trends.",
      "Too little context.",
      "Too much pressure to optimize.",
    ],
    solutionStatements: [
      "Curated research.",
      "Female-specific context.",
      "Personalized relevance.",
    ],
    articles: [
      {
        slug: "cortisol-ranges-by-phase",
        title: "Why cortisol ranges differ by phase",
        summary: "Reference intervals in studies often don’t stratify by cycle phase.",
        category: "Hormones",
        readTime: "4 min",
      },
      {
        slug: "sleep-architecture-recovery",
        title: "Sleep architecture and recovery metrics",
        summary: "How slow-wave sleep and HRV interact in trained women.",
        category: "Recovery",
        readTime: "6 min",
      },
      {
        slug: "supplement-claims-vs-evidence",
        title: "Supplement claims vs. evidence in women",
        summary: "A framework for reading the label and the literature.",
        category: "Supplements",
        readTime: "5 min",
      },
      {
        slug: "longevity-protocols-female-physiology",
        title: "Longevity protocols and female physiology",
        summary: "What translates when the trials were mostly male.",
        category: "Longevity",
        readTime: "7 min",
      },
    ],
    ctaLabel: "Get My Personalized Health Map",
    ctaHref: "/survey",
  },
  howItWorks: {
    label: "How it works",
    headline: "A guided process — built around your body",
    intro:
      "Start with your own data, explore what may be relevant for you, and build a system that evolves as you learn what works.",
    steps: [
      {
        phase: "Survey",
        title: "Understand your baseline",
        description:
          "Complete a guided survey covering symptoms, lifestyle, life stage, and health priorities.",
        supporting:
          "This creates your personal starting point — not a generic profile, but a structured view of your current state.",
        hint: "survey" as const,
        learnMore: [
          "Covers cycle, energy, sleep, nutrition, symptoms, and family history",
          "Adapts based on your responses as you go",
          "Builds a structured baseline you can return to and refine",
        ],
      },
      {
        phase: "Insights",
        title: "See what may matter for you",
        description:
          "Your inputs are translated into structured insights connected to relevant research and patterns.",
        supporting:
          "Instead of broad advice, you get areas to explore based on your own data.",
        hint: "insights" as const,
        learnMore: [
          "Connects your inputs to research themes and pattern libraries",
          "Highlights possible areas of attention worth exploring next",
          "Avoids deterministic conclusions — insight, not diagnosis",
        ],
      },
      {
        phase: "Protocols",
        title: "Choose what to try",
        description:
          "Explore potential interventions and approaches derived from research and tailored to your context.",
        supporting:
          "You decide what to test — from lifestyle adjustments to structured protocols.",
        hint: "protocols" as const,
        learnMore: [
          "Options are framed with evidence and your profile in mind",
          "You choose priorities, pace, and what feels realistic to test",
          "Protocols can be adjusted as you learn from your own data",
        ],
      },
      {
        phase: "Tracking",
        title: "Monitor your response",
        description:
          "Track symptoms, habits, and changes over time in your personal dashboard.",
        supporting:
          "This helps you understand how your body reacts, not just what you are doing.",
        hint: "tracking" as const,
        learnMore: [
          "Log the signals and habits you decide matter for your questions",
          "See trends over time next to the plans you are running",
          "Keeps context on what changed, when, and how you felt",
        ],
      },
      {
        phase: "Results",
        title: "Learn what works for your body",
        description:
          "Identify patterns, refine your approach, and build a system that evolves with you.",
        supporting:
          "Your health becomes something you actively understand and shape over time.",
        hint: "results" as const,
        learnMore: [
          "Compare what you tried to what you observed in your own data",
          "Refine protocols based on patterns that show up for you",
          "Your workspace becomes a living record of what works",
        ],
      },
    ],
  },
  coreFeatures: {
    label: "Core features",
    headline: "Everything you need to understand and navigate your health",
    intro:
      "A structured environment to explore, test, and track — without losing personal context.",
    features: [
      {
        id: "profile" as const,
        title: "Your health profile",
        description:
          "A dynamic overview of your inputs, patterns, and potential areas of attention.",
        supporting:
          "Not static — it evolves as you add data and learn more about your body.",
        learnMore: [
          "Integrates survey inputs and ongoing tracking in one view",
          "Updates as you log new data and refine priorities",
          "Highlights areas worth monitoring next",
        ],
      },
      {
        id: "research" as const,
        title: "Research, translated",
        description:
          "Access scientific insights connected to your profile without needing to interpret raw studies.",
        supporting: "Relevant, contextual, and continuously expandable.",
        learnMore: [
          "Curated themes and findings tied to your context",
          "Plain-language framing with room to go deeper",
          "Grows as your profile and questions evolve",
        ],
      },
      {
        id: "protocols" as const,
        title: "Protocol exploration",
        description:
          "Turn insights into action by selecting and testing approaches that fit your goals and context.",
        supporting: "Flexible, not prescriptive — you decide what to try.",
        learnMore: [
          "Shape protocols around goals you choose",
          "Mark what’s active, paused, or done as you learn",
          "Adjust over time instead of fixed programs",
        ],
      },
      {
        id: "tracking" as const,
        title: "Personal tracking system",
        description:
          "Monitor symptoms, habits, and outcomes in one place to understand what changes over time.",
        supporting: "See patterns, not just isolated data points.",
        learnMore: [
          "Symptom, habit, and experiment logging in one workspace",
          "Helps correlate actions with how you feel",
          "Supports iterative refinement, not one-off check-ins",
        ],
      },
      {
        id: "privacy" as const,
        title: "Private by design",
        description:
          "Explore sensitive topics and personal data with full control, including optional incognito usage.",
        supporting: "Your data remains yours — exploration without exposure.",
        learnMore: [
          "You choose what to keep in your workspace",
          "Optional private modes where available for sensitive exploration",
          "Nothing is shared unless you take a clear action to do so",
        ],
      },
    ],
  },
  whyThisMatters: {
    label: "Why this matters",
    headline: "Women’s health is not one-size-fits-all",
    main:
      "Most medical research and health recommendations are not built around female biology or individual variation. As a result, many women are left navigating fragmented information, unclear guidance, and generic advice that doesn’t reflect their reality.",
    supporting:
      "This platform is designed to bridge that gap — not by replacing medical care, but by giving you a structured way to understand your body, explore relevant knowledge, and make more informed decisions over time.",
    secondaryLine: "A shift from passive advice to active understanding.",
    credibilityTitle: "Built around how women actually experience health",
    credibilityBullets: [
      "Accounts for life stages, hormonal patterns, and changing conditions",
      "Supports ongoing learning, not one-time recommendations",
      "Connects personal data with evolving research",
      "Encourages careful experimentation, not blind optimization",
    ],
    researchGuidedLabel: "What does “research-guided” mean?",
    researchGuidedItems: [
      "Insights are informed by existing scientific literature, not trends",
      "Information is translated into understandable, contextual guidance",
      "No deterministic claims — only areas to explore and evaluate",
      "Users remain in control of decisions and interpretation",
    ],
  },
  mentalModel: {
    label: "How to think about it",
    headline: "A personal health system — not just an app",
    positioningIntro: "Think of it as a combination of:",
    positioningEmphasis:
      "An intelligent guide, a structured workspace, and a personal health lab — designed for your body.",
    shorthand:
      "Jasper × Notion × a personal health lab",
    shorthandNote: "An optional shorthand — not the full story, but a quick mental map.",
    supportingLead: "Instead of following fixed programs or consuming generic advice, you:",
    supportingActions: [
      "Explore what may be relevant for you",
      "Organize and apply what you learn",
      "Test approaches in a structured way",
      "Track and refine based on real outcomes",
    ],
    supportingClosing:
      "You don’t just follow recommendations — you build your own system.",
    pillarsCaption: "Three layers, one system",
    pillars: [
      {
        title: "Intelligent guidance",
        sublabel: "Insights, research, interpretation",
      },
      {
        title: "Structured workspace",
        sublabel: "Profile, protocols, organization",
      },
      {
        title: "Personal experimentation",
        sublabel: "Tracking, iteration, results",
      },
    ],
  },
  identity: {
    headline:
      "Designed for women whose lives demand consistent performance.",
    profiles: [
      "Women leading and deciding.",
      "Women training with intent.",
      "Women navigating physiological transitions.",
      "Women managing complexity across careers, time zones, and responsibilities.",
    ],
    closingLine: "Ambition does not pause for biology.",
    images: [
      {
        src: "/images/photo-1696664754572-c8b52a7fa917.avif",
        alt: "Composed portrait of a woman, focused and calm.",
      },
      {
        src: "/images/1.avif",
        alt: "Professional woman in motion, suggesting performance and intent.",
      },
      {
        src: "/images/2.avif",
        alt: "Woman training with intent in a neutral, focused environment.",
      },
      {
        src: "/images/3.avif",
        alt: "Woman working across contexts, representing complex responsibilities.",
      },
    ],
    layoutVariant: "grid",
  },
  differentiation: {
    // Legacy differentiation section replaced by FounderMessageSection on the homepage.
    headline: "",
    paragraphs: [],
    themeVariant: "inverted",
  },
  founderMessage: {
    label: "FOUNDER'S NOTE",
    headline: "I’m building this for my mother, my daughter, and myself.",
    paragraphs: [
      "I first understood how much women’s health is dismissed when my mother developed cancer and did not get the right checkups in time. The treatment that followed was harder than it should have been.",
      "Now she is fighting cancer for the second time — again diagnosed late, again shaped by the belief that symptoms are only serious when they become unbearable.",
      "I’m building this product because women deserve better prevention, better context, and better reasons to pay attention earlier. That belief has shaped my work across healthtech, diagnostics, preventive medicine, and women’s health product development. For my mother. For my daughter. For me.",
    ],
    founderName: "Anna Solovyova",
    founderTitle: "Founder",
    imageSrc: "/images/IMG_8091-modified.JPG",
    imageAlt: "Portrait of Anna Solovyova",
    secondary: {
      label: "FOUNDER'S NOTE",
      headline: "Health restored. Spaces humanized. Midlife redefined.",
      paragraphs: [
        "For over two decades, I moved through the high-octane worlds of L'Oréal, McKinsey, and Bertelsmann. I understood the language of strategy, leadership, and relentless drive.",
        "But along the way, I rediscovered a fundamental truth we often overlook in our pursuit of “success”: we are 100% sensory beings. Our wellbeing is not just a matter of nutrition or movement; it is shaped by the invisible architecture of our lives—the light, the scent, the sound, and the very spaces we inhabit.",
        "My work now sits at the intersection of longevity science, female health, and this “invisible architecture”. I believe midlife is not a decline to be managed, but a threshold to be crossed with intention. It is a time to redefine what it means to thrive.",
        "My journey from the boardroom to the yoga mat—and through the rigorous training of the Institute for Integrative Nutrition—has led me to a singular mission. I want to contribute to a world where preventive health is the new normal and where the spaces we occupy quietly support our longevity.",
        "Whether through my private practice or my research into the wellness dimension of spaces, I am here to help you return to yourself. Let’s stop forgetting how much our environment shapes us and start building a life that feels genuinely aligned.",
        "With warmth and curiosity,",
      ],
      founderName: "Babette Frommeyer",
      founderTitle: "Founder",
      imageSrc: "/images/babette-frommeyer.png",
      imageAlt: "Portrait of Babette Frommeyer",
    },
  },
  finalCta: {
    headline: "Start understanding your body — in a more structured way",
    supporting:
      "Build your health profile, explore what may be relevant for you, and begin tracking what actually works — all in one place designed for personal, research-guided exploration.",
    ctaPrimaryLabel: "Start your health profile",
    ctaPrimaryHref: "/survey",
    ctaSecondaryLabel: "See example dashboard",
    ctaSecondaryHref: "/dashboard",
    primaryMicrocopy: "Takes a few minutes to get started",
    trustSignals: [
      "No medical claims or fixed prescriptions",
      "Private by design and fully controlled by you",
      "Built to support exploration, not replace care",
    ],
    afterStartLabel: "What happens after I start?",
    afterStartItems: [
      "You complete a guided health survey",
      "You receive structured insights based on your inputs",
      "You can explore protocols and decide what to try",
      "You begin tracking and refining over time",
    ],
  },
} as const;
