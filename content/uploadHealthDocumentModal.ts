export type UploadHealthDocumentLocale = "en" | "de";

export type UploadDocumentKind = "lab" | "screening";

export function getUploadHealthDocumentTexts(locale: UploadHealthDocumentLocale) {
  return locale === "de" ? TEXTS.de : TEXTS.en;
}

const TEXTS = {
  en: {
    chooseKind: {
      eyebrow: "Add to your health record",
      title: "What are you uploading?",
      subtitle: "Choose one so we can show the right tips before you upload.",
      labTitle: "Lab report",
      labBody:
        "Blood tests, panels, or lab PDFs — including files you download from your lab’s patient portal or receive by email.",
      screeningTitle: "Screening results",
      screeningBody:
        "Letters or summaries from preventive screening (e.g. mammography, cervical screening, bowel screening) — invitation, result, or recall letters.",
      cancel: "Cancel",
    },
    upload: {
      lab: {
        eyebrow: "Upload document",
        title: "Add your lab results",
        policyTitle: "Best results from these documents:",
        policyBullets: [
          "Blood test panel (PDF or photo)",
          "Official lab report in any language",
          "PDF from your lab’s patient portal or the file your practice emailed you",
        ],
        policyFootnote: "Supported formats: PDF, JPG, PNG · Max 20 MB per file",
        consent:
          "I consent to Arc Woman processing my lab document to extract biomarker values and store them securely in my personal health record.",
        dropTitle: "Drop file here or tap to choose",
        dropSubtitle: "PDF, JPG or PNG",
        back: "Back",
        cancel: "Cancel",
        consentError: "Please confirm your consent before uploading.",
      },
      screening: {
        eyebrow: "Upload document",
        title: "Add your screening results",
        policyTitle: "Best results from these documents:",
        policyBullets: [
          "Screening invitation or appointment letter (PDF or photo)",
          "Written screening result or summary from your clinic or national programme",
          "GP letter that states screening type, date, and outcome (if applicable)",
        ],
        policyFootnote: "Supported formats: PDF, JPG, PNG · Max 20 MB per file",
        consent:
          "I consent to Arc Woman processing my screening document to extract relevant findings and dates and store them securely in my personal health record.",
        dropTitle: "Drop file here or tap to choose",
        dropSubtitle: "PDF, JPG or PNG",
        back: "Back",
        cancel: "Cancel",
        consentError: "Please confirm your consent before uploading.",
      },
    },
    processing: {
      eyebrow: "Analysing document",
      readingVerb: "Reading",
      readingPlaceholder: "your document",
      estimatedTime: "Usually 1–3 min · Normalerweise 1–3 Min.",
    },
    done: {
      eyebrow: "Results",
      title: "Health Wallet updated",
    },
    review: {
      eyebrow: "Review results",
      noValuesTitle: "No values extracted",
      noValuesBody:
        "The document may not contain structured lab values. Add results manually below.",
      hint: "Check values below — correct any errors before saving, or add missing ones manually.",
    },
    screeningReview: {
      title: "Review screening letter",
      hint: "We extracted the screening date and narrative findings (Befunde) from the document text — not lab values. Edit if needed, then save to your Health Wallet.",
      ocrUnreadableHint:
        "Automatic reading of this file was unclear (common with scanned PDFs). Please copy the findings from your original document and paste them below, then set the screening date if needed.",
      dateLabel: "Screening date",
      findingsLabel: "Findings",
      findingsPlaceholder: "Paste or edit the findings text from your letter…",
      save: "Save to Screenings",
      doneTitle: "Screening saved",
      doneBody: "You can view and edit it anytime under Health Wallet → Screenings.",
    },
    reviewFooter: {
      cancel: "Cancel",
      saving: "Saving…",
      saveNone: "Save (no values)",
      saveOne: "Save 1 value",
      saveManyPrefix: "Save ",
      saveManySuffix: " values",
    },
    processingFooter: {
      background: "Run in background",
    },
    pipeline: {
      ocr: "Reading document",
      classify: "Identifying document type",
      extract: "Extracting health data",
      bin_map: "Categorising results",
      normalize: "Normalising values",
      longitudinal: "Saving to your health record",
      interventions: "Updating care plan",
    },
    errors: {
      processingIssue: "Processing issue",
      processingFallback:
        "We had trouble reading the document. Any values found will still appear below.",
    },
    doneEmpty: {
      title: "Nothing saved",
      body: "No values were extracted or added. Try uploading a clearer document.",
    },
    saveWalletError: "Failed to save results. Please try again.",
    uploading: "Uploading…",
  },
  de: {
    chooseKind: {
      eyebrow: "Zur Gesundheitsakte hinzufügen",
      title: "Was möchten Sie hochladen?",
      subtitle: "Bitte wählen Sie — dann zeigen wir passende Hinweise vor dem Upload.",
      labTitle: "Laborbefund",
      labBody:
        "Blutwerte, Laborblätter oder Labor-PDFs — z. B. aus dem Patientenportal Ihres Labors oder als Datei aus der E-Mail Ihrer Praxis.",
      screeningTitle: "Vorsorge-Ergebnisse",
      screeningBody:
        "Schreiben oder Zusammenfassungen aus der Vorsorge (z. B. Mammographie, Zervix-Vorsorge, Darmkrebs-Vorsorge) — Einladung, Ergebnis oder Wiedervorlage.",
      cancel: "Abbrechen",
    },
    upload: {
      lab: {
        eyebrow: "Dokument hochladen",
        title: "Laborergebnisse hinzufügen",
        policyTitle: "Beste Ergebnisse mit diesen Unterlagen:",
        policyBullets: [
          "Blutbild / Laborpanel (PDF oder Foto)",
          "Offizieller Laborbefund (jede Sprache)",
          "PDF aus dem Labor-Patientenportal oder die Datei aus der Praxis-E-Mail",
        ],
        policyFootnote: "Formate: PDF, JPG, PNG · max. 20 MB pro Datei",
        consent:
          "Ich willige ein, dass The Arc Woman mein Labor-Dokument verarbeitet, Biomarker-Werte extrahiert und sicher in meiner persönlichen Gesundheitsakte speichert.",
        dropTitle: "Datei hier ablegen oder tippen zur Auswahl",
        dropSubtitle: "PDF, JPG oder PNG",
        back: "Zurück",
        cancel: "Abbrechen",
        consentError: "Bitte bestätigen Sie die Einwilligung vor dem Upload.",
      },
      screening: {
        eyebrow: "Dokument hochladen",
        title: "Vorsorge-Ergebnisse hinzufügen",
        policyTitle: "Beste Ergebnisse mit diesen Unterlagen:",
        policyBullets: [
          "Einladung oder Terminschreiben zur Vorsorgeuntersuchung (PDF oder Foto)",
          "Schriftliches Vorsorge-Ergebnis oder Kurzbrief aus Praxis oder Programm",
          "Arztbrief mit Vorsorge-Art, Datum und Ergebnis (falls vorhanden)",
        ],
        policyFootnote: "Formate: PDF, JPG, PNG · max. 20 MB pro Datei",
        consent:
          "Ich willige ein, dass The Arc Woman mein Vorsorge-Dokument verarbeitet, relevante Befunde und Termine extrahiert und sicher in meiner persönlichen Gesundheitsakte speichert.",
        dropTitle: "Datei hier ablegen oder tippen zur Auswahl",
        dropSubtitle: "PDF, JPG oder PNG",
        back: "Zurück",
        cancel: "Abbrechen",
        consentError: "Bitte bestätigen Sie die Einwilligung vor dem Upload.",
      },
    },
    processing: {
      eyebrow: "Dokument wird analysiert",
      readingVerb: "Lese",
      readingPlaceholder: "Ihr Dokument",
      estimatedTime: "Usually 1–3 min · Normalerweise 1–3 Min.",
    },
    done: {
      eyebrow: "Ergebnis",
      title: "Gesundheitsakte aktualisiert",
    },
    review: {
      eyebrow: "Ergebnisse prüfen",
      noValuesTitle: "Keine Werte erkannt",
      noValuesBody:
        "Das Dokument enthält möglicherweise keine strukturierten Laborwerte. Sie können unten manuell Werte ergänzen.",
      hint: "Bitte prüfen Sie die Werte unten — korrigieren Sie Fehler vor dem Speichern oder ergänzen Sie fehlende Werte manuell.",
    },
    screeningReview: {
      title: "Vorsorge-Brief prüfen",
      hint: "Wir haben Datum und Befundtext aus dem Dokument gelesen — keine Laborwerte. Bitte prüfen und bei Bedarf anpassen, dann in der Health Wallet speichern.",
      ocrUnreadableHint:
        "Die automatische Texterkennung war bei dieser Datei unklar (häufig bei gescannten PDFs). Bitte kopieren Sie die Befunde aus dem Originaldokument und fügen Sie sie unten ein, und tragen Sie bei Bedarf das Vorsorge-Datum ein.",
      dateLabel: "Datum der Vorsorge",
      findingsLabel: "Befunde",
      findingsPlaceholder: "Befundtext aus Ihrem Schreiben einfügen oder bearbeiten…",
      save: "Unter Vorsorge speichern",
      doneTitle: "Vorsorge gespeichert",
      doneBody: "Sie finden den Eintrag jederzeit unter Health Wallet → Screenings.",
    },
    reviewFooter: {
      cancel: "Abbrechen",
      saving: "Speichern…",
      saveNone: "Speichern (keine Werte)",
      saveOne: "1 Wert speichern",
      saveManyPrefix: "",
      saveManySuffix: " Werte speichern",
    },
    processingFooter: {
      background: "Im Hintergrund fortfahren",
    },
    pipeline: {
      ocr: "Dokument wird gelesen",
      classify: "Dokumenttyp wird erkannt",
      extract: "Gesundheitsdaten werden extrahiert",
      bin_map: "Ergebnisse werden eingeordnet",
      normalize: "Werte werden normalisiert",
      longitudinal: "In Ihrer Gesundheitsakte gespeichert",
      interventions: "Versorgungsplan wird aktualisiert",
    },
    errors: {
      processingIssue: "Problem bei der Verarbeitung",
      processingFallback:
        "Beim Lesen des Dokuments gab es Schwierigkeiten. Gefundene Werte erscheinen dennoch unten.",
    },
    doneEmpty: {
      title: "Nichts gespeichert",
      body: "Es wurden keine Werte erkannt oder hinzugefügt. Versuchen Sie es mit einem klareren Dokument.",
    },
    saveWalletError: "Speichern fehlgeschlagen. Bitte erneut versuchen.",
    uploading: "Wird hochgeladen…",
  },
} as const;
