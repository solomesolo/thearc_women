import type { Locale } from "@/lib/i18n/locale";

type Dict = Record<string, string>;

const en: Dict = {
  // Onboarding start
  "onboarding.start.eyebrow": "Personalized health analysis",
  "onboarding.start.title": "Understand what your body actually needs",
  "onboarding.start.body":
    "Answer a few questions about your health, lifestyle, and history. We'll show you which tests are worth running — and why.",
  "onboarding.start.expect": "What to expect",
  "onboarding.start.expect.1.t": "4 short sections",
  "onboarding.start.expect.1.d": "Age, lifestyle, health history, and past tests",
  "onboarding.start.expect.2.t": "About 3–5 minutes",
  "onboarding.start.expect.2.d": "No long forms or medical jargon",
  "onboarding.start.expect.3.t": "Personalized results",
  "onboarding.start.expect.3.d": "Specific to your profile and life stage",
  "onboarding.start.expect.4.t": "No account needed yet",
  "onboarding.start.expect.4.d": "We'll ask at the end if you want to save them",
  "common.continue": "Continue",
  "common.back": "Back",
  "common.retry": "Retry",
  "common.loading": "Loading…",

  // Onboarding steps
  "onboarding.basics.h": "A bit about you",
  "onboarding.basics.p": "This helps us give you age- and stage-appropriate guidance.",
  "onboarding.basics.q.age": "How old are you?",
  "onboarding.basics.q.stage": "Which best describes your current life stage?",
  "onboarding.basics.q.goals": "What are you most hoping to understand or improve?",
  "onboarding.basics.q.multi": "Select all that apply",

  "onboarding.lifestyle.h": "Symptoms and lifestyle",
  "onboarding.lifestyle.p": "These signals help us understand what might be affecting your energy and wellbeing.",
  "onboarding.lifestyle.q.symptoms": "Are you currently noticing any of these?",
  "onboarding.lifestyle.q.symptoms.help": "Select all that apply — or none if everything feels fine",
  "onboarding.lifestyle.q.cycle": "How would you describe your cycle right now?",
  "onboarding.lifestyle.q.sun": "How much sun exposure do you typically get?",
  "onboarding.lifestyle.q.diet": "Do you follow any particular eating pattern?",
  "onboarding.lifestyle.q.context": "Anything else that applies to your daily life?",

  "onboarding.health.h": "Health context",
  "onboarding.health.p": "This context allows us to refine our suggestions and avoid recommendations that may not be relevant.",
  "onboarding.health.q.conditions": "Do you have any diagnosed conditions?",
  "onboarding.health.q.meds": "Are you currently taking any of the following?",
  "onboarding.health.q.family": "Any notable health conditions in your immediate family?",
  "onboarding.health.q.family.help": "Parents, siblings — select all that apply",

  "onboarding.tests.h": "Your recent tests",
  "onboarding.tests.p": "When did you last have each of these checked? This is the most important input for your recommendations.",
  "onboarding.tests.help": "You can skip any you're unsure about — we'll mark them as unknown.",
  "onboarding.tests.cta": "See my results",
  "onboarding.tests.cta.loading": "Creating your health overview…",
  "onboarding.tests.skip": "Skip this step",

  // Results bootstrap
  "results.bootstrap.eyebrow": "Preparing your results",
  "results.bootstrap.title": "One moment",
  "results.bootstrap.tip": "Tip: You can keep this tab open — we’ll redirect automatically once your results are ready.",

  // Results overview
  "results.overview.eyebrow": "Your personalized results",
  "results.overview.title": "Here's what we found for you",
  "results.overview.basedOn": "Based on your profile — {age}, {stage}",
  "results.overview.topPriorities": "Top priorities",
  "results.overview.topPriorities.p": "These are your highest-impact checks to action next, based on your current status and score gaps.",
  "results.overview.actionPlanCta": "See your action plan",
  "results.overview.actionPlanCta.p": "Step-by-step — labs, home tests, doctor",

  // Action plan
  "results.action.eyebrow": "Your action plan",
  "results.action.title": "Your action plan",
  "results.action.p": "Your next steps — mark items planned/done, choose lab vs home test, and watch your score update.",
  "results.action.tip": "Tip: start with the “High impact” items — they move your completeness score the most.",
  "results.action.loading": "Loading your action plan…",
};

const de: Dict = {
  // Onboarding start
  "onboarding.start.eyebrow": "Personalisierte Gesundheitsanalyse",
  "onboarding.start.title": "Verstehe, was dein Körper wirklich braucht",
  "onboarding.start.body":
    "Beantworte ein paar Fragen zu deiner Gesundheit, deinem Lifestyle und deiner Vorgeschichte. Wir zeigen dir, welche Tests sich lohnen — und warum.",
  "onboarding.start.expect": "Was dich erwartet",
  "onboarding.start.expect.1.t": "4 kurze Abschnitte",
  "onboarding.start.expect.1.d": "Alter, Lifestyle, Gesundheitshistorie und frühere Tests",
  "onboarding.start.expect.2.t": "Etwa 3–5 Minuten",
  "onboarding.start.expect.2.d": "Keine langen Formulare oder Fachjargon",
  "onboarding.start.expect.3.t": "Personalisierte Ergebnisse",
  "onboarding.start.expect.3.d": "Passend zu deinem Profil und deiner Lebensphase",
  "onboarding.start.expect.4.t": "Noch kein Konto nötig",
  "onboarding.start.expect.4.d": "Am Ende fragen wir, ob du alles speichern möchtest",
  "common.continue": "Weiter",
  "common.back": "Zurück",
  "common.retry": "Erneut versuchen",
  "common.loading": "Lädt…",

  // Onboarding steps
  "onboarding.basics.h": "Ein bisschen über dich",
  "onboarding.basics.p": "So können wir Empfehlungen passend zu Alter und Lebensphase geben.",
  "onboarding.basics.q.age": "Wie alt bist du?",
  "onboarding.basics.q.stage": "Welche Lebensphase beschreibt dich am besten?",
  "onboarding.basics.q.goals": "Was möchtest du vor allem verstehen oder verbessern?",
  "onboarding.basics.q.multi": "Mehrfachauswahl möglich",

  "onboarding.lifestyle.h": "Symptome & Lifestyle",
  "onboarding.lifestyle.p": "Diese Signale helfen uns zu verstehen, was deine Energie und dein Wohlbefinden beeinflussen könnte.",
  "onboarding.lifestyle.q.symptoms": "Bemerkst du aktuell eines davon?",
  "onboarding.lifestyle.q.symptoms.help": "Wähle alles aus, was zutrifft — oder „Keine“, wenn alles ok ist",
  "onboarding.lifestyle.q.cycle": "Wie würdest du deinen Zyklus aktuell beschreiben?",
  "onboarding.lifestyle.q.sun": "Wie viel Sonne bekommst du typischerweise ab?",
  "onboarding.lifestyle.q.diet": "Folgst du einem bestimmten Ernährungsstil?",
  "onboarding.lifestyle.q.context": "Trifft sonst etwas auf deinen Alltag zu?",

  "onboarding.health.h": "Gesundheitskontext",
  "onboarding.health.p": "Dieser Kontext hilft uns, Vorschläge zu verfeinern und Unpassendes zu vermeiden.",
  "onboarding.health.q.conditions": "Hast du diagnostizierte Erkrankungen?",
  "onboarding.health.q.meds": "Nimmst du aktuell etwas davon ein?",
  "onboarding.health.q.family": "Gibt es relevante Erkrankungen in deiner direkten Familie?",
  "onboarding.health.q.family.help": "Eltern, Geschwister — wähle alles aus, was zutrifft",

  "onboarding.tests.h": "Deine letzten Tests",
  "onboarding.tests.p": "Wann wurde das zuletzt geprüft? Das ist der wichtigste Input für deine Empfehlungen.",
  "onboarding.tests.help": "Du kannst alles überspringen, bei dem du unsicher bist — wir markieren es als „unbekannt“.",
  "onboarding.tests.cta": "Ergebnisse anzeigen",
  "onboarding.tests.cta.loading": "Dein Überblick wird erstellt…",
  "onboarding.tests.skip": "Diesen Schritt überspringen",

  // Results bootstrap
  "results.bootstrap.eyebrow": "Deine Ergebnisse werden vorbereitet",
  "results.bootstrap.title": "Einen Moment",
  "results.bootstrap.tip": "Tipp: Lass diesen Tab offen — wir leiten dich automatisch weiter, sobald alles bereit ist.",

  // Results overview
  "results.overview.eyebrow": "Deine personalisierten Ergebnisse",
  "results.overview.title": "Das haben wir für dich gefunden",
  "results.overview.basedOn": "Basierend auf deinem Profil — {age}, {stage}",
  "results.overview.topPriorities": "Top-Prioritäten",
  "results.overview.topPriorities.p": "Die wichtigsten Checks als Nächstes — basierend auf Status und Score-Lücken.",
  "results.overview.actionPlanCta": "Zum Aktionsplan",
  "results.overview.actionPlanCta.p": "Schritt für Schritt — Labor, Heimtest, Ärztin/Arzt",

  // Action plan
  "results.action.eyebrow": "Dein Aktionsplan",
  "results.action.title": "Dein Aktionsplan",
  "results.action.p": "Deine nächsten Schritte — plane/markiere erledigt, wähle Labor vs. Heimtest und sieh, wie sich dein Score verändert.",
  "results.action.tip": "Tipp: Starte mit „Hoher Impact“ — das verbessert deinen Score am stärksten.",
  "results.action.loading": "Aktionsplan wird geladen…",
};

export function t(locale: Locale, key: string, vars?: Record<string, string | number>): string {
  const dict = locale === "de" ? de : en;
  const template = dict[key] ?? en[key] ?? key;
  if (!vars) return template;
  return Object.keys(vars).reduce((acc, k) => acc.replaceAll(`{${k}}`, String(vars[k])), template);
}

