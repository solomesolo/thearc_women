#!/usr/bin/env tsx
// Seed biomarker_coverage_ui_content and biomarker_doctor_script_templates
// for Germany (locale='de') and UK (locale='en-gb').
// Safe to re-run — upserts on composite key (biomarker_name_normalized, locale).

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { COVERAGE_SEED, SCRIPT_SEED, COVERAGE_SEED_UK, SCRIPT_SEED_UK } from "../lib/doctor-guidance/seedData";

const connectionString = process.env.DATABASE_URL ?? "postgresql://localhost:5432/thearc";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function upsertCoverage(rows: typeof COVERAGE_SEED) {
  let n = 0;
  for (const row of rows) {
    await (prisma as any).biomarkerCoverageUiContent.upsert({
      where: {
        biomarker_coverage_locale_unique: {
          biomarkerNameNormalized: row.biomarker_name_normalized,
          locale: row.locale,
        },
      },
      update: {
        sourceBiomarkerName:  row.source_biomarker_name,
        sourceCategory:       row.source_category,
        sourceSampleType:     row.source_sample_type,
        gkvRawCoverage:       row.gkv_raw_coverage,
        pkvRawCoverage:       row.pkv_raw_coverage,
        gkvRawFrequency:      row.gkv_raw_frequency,
        gkvStatusLabel:       row.gkv_status_label,
        gkvUserText:          row.gkv_user_text,
        gkvFrequencyUserText: row.gkv_frequency_user_text,
        gkvExtraNote:         row.gkv_extra_note,
        pkvStatusLabel:       row.pkv_status_label,
        pkvUserText:          row.pkv_user_text,
        pkvExtraNote:         row.pkv_extra_note,
        selfPayNote:          row.self_pay_note,
      },
      create: {
        biomarkerNameNormalized: row.biomarker_name_normalized,
        locale:                  row.locale,
        sourceBiomarkerName:     row.source_biomarker_name,
        sourceCategory:          row.source_category,
        sourceSampleType:        row.source_sample_type,
        gkvRawCoverage:          row.gkv_raw_coverage,
        pkvRawCoverage:          row.pkv_raw_coverage,
        gkvRawFrequency:         row.gkv_raw_frequency,
        gkvStatusLabel:          row.gkv_status_label,
        gkvUserText:             row.gkv_user_text,
        gkvFrequencyUserText:    row.gkv_frequency_user_text,
        gkvExtraNote:            row.gkv_extra_note,
        pkvStatusLabel:          row.pkv_status_label,
        pkvUserText:             row.pkv_user_text,
        pkvExtraNote:            row.pkv_extra_note,
        selfPayNote:             row.self_pay_note,
      },
    });
    n++;
  }
  return n;
}

async function upsertScripts(rows: typeof SCRIPT_SEED) {
  let n = 0;
  for (const row of rows) {
    await (prisma as any).biomarkerDoctorScriptTemplate.upsert({
      where: {
        biomarker_doctor_script_locale_unique: {
          biomarkerNameNormalized: row.biomarker_name_normalized,
          locale: row.locale,
        },
      },
      update: {
        sourceBiomarkerName:      row.source_biomarker_name,
        sourceCategory:           row.source_category,
        sourceSampleType:         row.source_sample_type,
        introTemplate:            row.intro_template,
        symptomTemplate:          row.symptom_template,
        coverageQuestionTemplate: row.coverage_question_template,
        followupTemplate:         row.followup_template,
        whyThisMattersTemplate:   row.why_this_matters_template,
        privateOptionTemplate:    row.private_option_template,
      },
      create: {
        biomarkerNameNormalized:  row.biomarker_name_normalized,
        locale:                   row.locale,
        sourceBiomarkerName:      row.source_biomarker_name,
        sourceCategory:           row.source_category,
        sourceSampleType:         row.source_sample_type,
        introTemplate:            row.intro_template,
        symptomTemplate:          row.symptom_template,
        coverageQuestionTemplate: row.coverage_question_template,
        followupTemplate:         row.followup_template,
        whyThisMattersTemplate:   row.why_this_matters_template,
        privateOptionTemplate:    row.private_option_template,
      },
    });
    n++;
  }
  return n;
}

async function main() {
  console.log("Seeding Germany (de) coverage records…");
  const deCov = await upsertCoverage(COVERAGE_SEED);
  console.log(`  ✓ ${deCov} DE coverage records upserted`);

  console.log("Seeding Germany (de) doctor script templates…");
  const deScript = await upsertScripts(SCRIPT_SEED);
  console.log(`  ✓ ${deScript} DE script templates upserted`);

  console.log("Seeding UK (en-gb) coverage records…");
  const gbCov = await upsertCoverage(COVERAGE_SEED_UK);
  console.log(`  ✓ ${gbCov} UK coverage records upserted`);

  console.log("Seeding UK (en-gb) doctor script templates…");
  const gbScript = await upsertScripts(SCRIPT_SEED_UK);
  console.log(`  ✓ ${gbScript} UK script templates upserted`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
