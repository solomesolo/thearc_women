export const homepageDeContent = {
  hero: {
    eyebrow: "Dein persönliches Präventions-System",
    headline: "Wissen, welche Gesundheitschecks du brauchst — und sie wirklich erledigen",
    supporting:
      "Behalte den Überblick über deine Vorsorge. Erkenne, was fehlt, verstehe deine Laborwerte und finde direkt den passenden nächsten Schritt.",
    secondarySupport: "In weniger als 2 Minuten starten — Upload optional",
    ctaPrimaryLabel: "Mein Health Arc beginnen",
    ctaPrimaryHref: "/onboarding/start",
    ctaSecondaryLabel: "Ich habe eine Einladung",
    ctaSecondaryHref: "/survey",
    trustLine: "Dauert nur 2 Minuten · Upload optional · Datenschutzorientiert",
    flowTitle: "So funktioniert es",
    flowSteps: [
      { title: "Kurzen Check machen", line: "Erste Einschätzung zu sinnvollen Checks erhalten" },
      { title: "Laborwerte hochladen (optional)", line: "Befunde werden strukturiert eingeordnet" },
      { title: "Nächste Schritte sehen", line: "Direkt erkennen, was fehlt und wie du es erledigen kannst" },
    ],
    whatsIncludedLabel: "Was ist enthalten?",
    whatsIncludedItems: [
      "Persönliche Check-Empfehlungen",
      "Übersicht über vorhandene und fehlende Werte",
      "Laborwert-Auswertung (OCR)",
      "Zeitachse für anstehende Checks",
      "Direkte nächste Schritte und Buchungsmöglichkeiten",
      "Einfaches Fortschritts-Tracking",
    ],
    imageSrc: "/images/Hero.avif",
    imageAlt: "Fokussierte Frau in ruhiger, professioneller Umgebung",
  },
  problem: {
    label: "Das Problem",
    headline: "Wichtige Gesundheitschecks gehen im Alltag oft unter",
    cards: [
      {
        icon: "scatter" as const,
        title: "Verstreute Daten",
        body: "Laborwerte, Arztberichte und Vorsorgeinformationen sind an verschiedenen Orten gespeichert.",
      },
      {
        icon: "overview" as const,
        title: "Kein klarer Überblick",
        body: "Es ist schwer zu erkennen, welche Untersuchungen bereits gemacht wurden und welche noch fehlen.",
      },
      {
        icon: "unclear" as const,
        title: "Unsicherheit bei den nächsten Schritten",
        body: "Oft ist unklar, welcher Check jetzt sinnvoll wäre, wie häufig er gemacht werden sollte und wo man ihn buchen kann.",
      },
      {
        icon: "followthrough" as const,
        title: "Zu viel Aufwand bei der Umsetzung",
        body: "Selbst wenn klar ist, was zu tun wäre, fehlt oft die Zeit oder Orientierung, um es wirklich umzusetzen.",
      },
    ],
    punchline: "Dadurch werden Checks verzögert, vergessen oder nie erledigt.",
  },
  solution: {
    label: "Die Lösung",
    headline: "Ein System, das dir hilft zu verstehen, zu organisieren und zu handeln",
    pillars: [
      {
        num: "1",
        title: "Verstehen",
        subtitle: "Personalisierte Check-Empfehlungen",
        body: "Ein kurzer Fragebogen zeigt dir, welche Vorsorge- und Laborchecks zu deinem Profil passen könnten.",
      },
      {
        num: "2",
        title: "Organisieren",
        subtitle: "Übersicht über vorhandene und fehlende Werte",
        body: "Lade Laborbefunde hoch und erhalte eine strukturierte Übersicht darüber, was bereits abgedeckt ist und was noch fehlt.",
      },
      {
        num: "3",
        title: "Handeln",
        subtitle: "Direkte nächste Schritte für die Umsetzung",
        body: "Finde passende Möglichkeiten: im Labor, als Heimtest oder über Ärztin, Arzt oder Hausarztpraxis.",
      },
    ],
  },
  howItWorksSimple: {
    label: "So funktioniert es",
    headline: "Drei Schritte. Das war's.",
    steps: [
      {
        num: "01",
        title: "Kurzen Gesundheitscheck machen",
        body: "Beantworte ein paar Fragen und erhalte eine erste Einschätzung zu sinnvollen Checks",
      },
      {
        num: "02",
        title: "Laborwerte optional hochladen",
        body: "Vorhandene Befunde werden strukturiert eingeordnet und mit deinen Empfehlungen abgeglichen",
      },
      {
        num: "03",
        title: "Nächste Schritte direkt sehen",
        body: "Du siehst, was fehlt, warum es relevant sein kann und welche Wege es gibt, den Check umzusetzen",
      },
    ],
  },
  productPreview: {
    label: "Produktvorschau",
    headline: "Deine Gesundheit übersichtlich an einem Ort",
    scoreLabel: "Gesundheitsstatus",
    scoreValue: 75,
    missingLabel: "Fehlt aktuell",
    missing: ["Vitamin D", "Ferritin", "Folgekontrolle in 6 Monaten"],
    timelineLabel: "Nächste Schritte",
    timeline: [
      { month: "April", item: "Bluttest" },
      { month: "Juni", item: "Gynäkologische Vorsorge" },
      { month: "September", item: "Verlaufskontrolle" },
    ],
    ctaLabel: "Jetzt ausprobieren",
    ctaHref: "/onboarding/start",
  },
  actionLayer: {
    label: "Deine nächsten Schritte",
    headline: "Wir sagen dir nicht nur, was fehlt — wir zeigen dir auch, wie du es erledigen kannst",
    card: {
      testName: "Vitamin-D-Test",
      statusBadge: "Fehlt",
      sublabel: "Jetzt sinnvoll für dein Profil",
      whyTitle: "Warum das jetzt relevant sein kann",
      whyBody:
        "Basierend auf deinem Profil könnte dieser Test aktuell sinnvoll sein, weil du Müdigkeit angegeben hast, wenig Sonnenexposition hast und in deinen vorhandenen Unterlagen kein aktueller Vitamin-D-Wert zu sehen ist.",
      labsTitle: "Im Labor machen",
      labs: [
        {
          name: "Labor Berlin",
          price: "ca. 25 €",
          address: "Invalidenstraße 115, Berlin",
          note: "Schnelle Option mit professioneller Abnahme",
          mapsHref: "/onboarding/start",
        },
        {
          name: "SYNLAB",
          price: "ca. 30 €",
          address: "Alexanderplatz 3, Berlin",
          note: "",
          mapsHref: "/onboarding/start",
        },
      ],
      homeTitle: "Als Heimtest bestellen",
      homeTests: [
        {
          name: "Cerascreen Vitamin D Test",
          price: "ca. 29 €",
          descriptor: "Probe von zu Hause",
          orderHref: "/onboarding/start",
        },
        {
          name: "Verisana",
          price: "ca. 35 €",
          descriptor: "Heimtest-Kit",
          orderHref: "/onboarding/start",
        },
      ],
      doctorTitle: "Über Hausarzt / Ärztin anfragen",
      doctorLines: [
        "Kann je nach Situation über die Praxis besprochen werden",
        "So kannst du fragen: \u201eKönnen wir Vitamin D bei meinem nächsten Bluttest mit überprüfen?\u201c",
        "Üblicher Abstand: je nach Kontext oft alle 6–12 Monate",
        "Der Test kann in vielen Fällen auch privat / selbst bezahlt durchgeführt werden",
      ],
      mapsLabel: "In Google Maps öffnen",
      orderOnlineLabel: "Online bestellen",
      ctaBook: "Im Labor buchen",
      ctaBookHref: "/onboarding/start",
      ctaOrder: "Heimtest bestellen",
      ctaOrderHref: "/onboarding/start",
      ctaPlanned: "Als geplant markieren",
      ctaDone: "Als erledigt markieren",
    },
    microcopy:
      "Keine medizinische Beratung — strukturierte Informationen zur Unterstützung deiner nächsten Schritte.",
  },
  knowledgeHub: {
    label: "Personalisierte Gesundheits-Insights",
    headline: "Bleib informiert über deine Gesundheit — ohne selbst suchen zu müssen",
    subheadline:
      "Erhalte relevante Forschung, verständliche Einordnung und praktische Empfehlungen — abgestimmt auf dein Profil.",
    blocks: [
      {
        title: "Relevante Forschung, verständlich aufbereitet",
        items: [
          "Aktuelle Erkenntnisse aus Bereichen wie Hormone, Stoffwechsel, Herz-Kreislauf und mentale Gesundheit",
          "Gefiltert nach dem, was für dich wirklich relevant ist",
          "Klar erklärt — ohne unnötige Komplexität",
        ],
      },
      {
        title: "Strukturierte Empfehlungen und Protokolle",
        items: [
          "Verstehe, welche nächsten Schritte häufig auf Basis von Forschung sinnvoll sein können",
          "Überblick über mögliche Testintervalle, Follow-ups und Zusammenhänge",
          "Speichere relevante Inhalte für später",
        ],
      },
      {
        title: "Deine persönliche Wissenssammlung",
        items: [
          "Speichere Artikel und Inhalte, die für dich wichtig sind",
          "Baue dir Schritt für Schritt deine eigene Gesundheitsbasis auf",
          "Alles verbunden mit deinen Werten und deinem Verlauf",
        ],
      },
    ],
    personalizationLabel: "Immer auf dem neuesten Stand — automatisch",
    personalizationBody:
      "Du wirst informiert, wenn neue Erkenntnisse oder Inhalte erscheinen, die zu deinem Profil passen — ohne dass du aktiv danach suchen musst.",
    expertHeadline: "Direkter Austausch mit Ärztinnen, Ärzten und Forschenden",
    expertItems: [
      "Teilnahme an Webinaren mit medizinischen Expertinnen und Experten",
      "Möglichkeit, Fragen anonym zu stellen",
      "Kuratierte Offline-Events rund um Frauengesundheit",
    ],
    ctaLabel: "Jetzt starten",
    ctaHref: "/onboarding/start",
  },
  differentiationNew: {
    label: "Was dieses System anders macht",
    headline: "Mehr als ein Chat oder eine einmalige Erklärung",
    intro: "Generische KI-Tools können Laborwerte erklären. Dieses System hilft dir:",
    left: {
      title: "Generische KI-Tools",
      items: [
        "Erklären einzelne Werte einmalig",
        "Kein Tracking über die Zeit",
        "Keine konkrete Hilfe bei der Umsetzung",
      ],
    },
    right: {
      title: "Dieses System",
      items: [
        "Ordnet deine Gesundheitsdaten strukturiert ein",
        "Zeigt, was fehlt oder veraltet ist",
        "Hilft dir direkt bei der Umsetzung",
      ],
    },
  },
  trust: {
    label: "Datenschutz",
    headline: "Deine Daten bleiben bei dir",
    items: [
      "Du entscheidest selbst, was du hochlädst",
      "Keine Weitergabe sensibler Gesundheitsdaten zu Werbezwecken",
      "Datenschutzorientierter Aufbau",
    ],
    microcopy: "Entwickelt zur Orientierung und Organisation — nicht zur Diagnose.",
  },
  pricing: {
    label: "Preise",
    headline: "Einfache und transparente Preise",
    subheadline: "Starte kostenlos und erweitere nur dann, wenn du mehr Funktionen brauchst.",
    plans: [
      {
        name: "Kostenlos",
        price: "0 €",
        period: "",
        description: "Für den Einstieg",
        features: [
          "Gesundheitsfragebogen",
          "Erste Übersicht zu relevanten Checks",
          "Basis-Empfehlungen",
        ],
        ctaLabel: "Kostenlos starten",
        ctaHref: "/onboarding/start",
        highlight: false,
        badge: "",
      },
      {
        name: "Pro Analyse",
        price: "4 €",
        period: "pro Upload",
        description: "Ohne Abo",
        features: [
          "Laborbefund hochladen",
          "Strukturierte Aufbereitung",
          "Überblick über abgedeckte und fehlende Werte",
        ],
        ctaLabel: "Befund hochladen",
        ctaHref: "/upload",
        highlight: false,
        badge: "",
      },
      {
        name: "Pro",
        price: "9 €",
        period: "/ Monat",
        description: "Für regelmäßige Vorsorge",
        features: [
          "Unbegrenzte Uploads",
          "Verlauf und Zeitachse",
          "Erinnerungen",
          "Vollständigerer Gesundheitsüberblick",
          "Erweiterte nächste Schritte",
        ],
        ctaLabel: "Pro testen",
        ctaHref: "/onboarding/start",
        highlight: true,
        badge: "Am beliebtesten",
      },
    ],
  },
  faq: {
    label: "FAQ",
    headline: "Häufige Fragen",
    items: [
      {
        question: "Ist das medizinische Beratung?",
        answer:
          "Nein. Die Plattform unterstützt bei Organisation, Übersicht und nächsten Schritten, ersetzt aber keine ärztliche Diagnose oder Behandlung.",
      },
      {
        question: "Muss ich meine Laborwerte hochladen?",
        answer:
          "Nein. Du kannst mit dem Fragebogen starten und den Upload nur dann nutzen, wenn du eine tiefere Auswertung möchtest.",
      },
      {
        question: "Sind meine Daten sicher?",
        answer:
          "Die Plattform ist datenschutzorientiert aufgebaut. Du entscheidest selbst, welche Informationen du hinterlegst.",
      },
      {
        question: "Kann ich auch ohne aktuelles Labor starten?",
        answer:
          "Ja. Der Einstieg ist bewusst so gestaltet, dass du auch ohne vorhandene Befunde direkt einen Überblick bekommst.",
      },
    ],
  },
  finalCta: {
    headline: "Behalte den Überblick über deine Vorsorge — bevor etwas übersehen wird",
    supporting:
      "Starte mit einem kurzen Check und finde heraus, welche nächsten Schritte für dich sinnvoll sein könnten.",
    ctaPrimaryLabel: "Mein Health Arc beginnen",
    ctaPrimaryHref: "/onboarding/start",
    ctaSecondaryLabel: "Ich habe eine Einladung",
    ctaSecondaryHref: "/survey",
    primaryMicrocopy: "Early Access — Öffnet in kleinen Gruppen",
    trustSignals: [
      "Keine medizinische Beratung — strukturierte Hinweise",
      "Du behältst die Kontrolle über deine Daten",
      "Zur Orientierung, nicht zur Diagnose",
    ],
    afterStartLabel: "Was passiert nach dem Start?",
    afterStartItems: [
      "Du beantwortest ein paar Fragen zu deiner Gesundheit",
      "Du erhältst eine erste Übersicht zu relevanten Checks",
      "Du kannst optional Laborwerte hochladen",
      "Du siehst, was abgedeckt ist und was noch fehlt",
    ],
  },
  founderMessage: {
    label: "Von der Gründerin",
    headline: "Ich baue das für meine Mutter, meine Tochter — und für mich.",
    paragraphs: [
      "Ich habe zum ersten Mal verstanden, wie sehr Frauengesundheit oft unterschätzt wird, als meine Mutter an Krebs erkrankte — ohne rechtzeitig die richtigen Untersuchungen erhalten zu haben. Die Behandlung danach war härter als sie hätte sein müssen.",
      "Heute kämpft sie zum zweiten Mal gegen Krebs — wieder spät diagnostiziert, wieder geprägt von der Überzeugung, dass Symptome erst ernst genommen werden, wenn sie unerträglich werden.",
      "Ich entwickle dieses Produkt, weil Frauen bessere Vorsorge, bessere Orientierung und bessere Gründe verdienen, früher auf ihren Körper zu achten. Für meine Mutter. Für meine Tochter. Für mich.",
    ],
    founderName: "Anna Solovyova",
    founderTitle: "Gründerin",
    imageSrc: "/images/IMG_8091-modified.JPG",
    imageAlt: "Porträt von Anna Solovyova",
  },
} as const;
