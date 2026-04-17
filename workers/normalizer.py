#!/usr/bin/env python3.10
"""
Medical data normalisation layer — The Arc Woman
=================================================
Converts structured extraction entities into a consistent internal observation
schema.  Entirely rule-based — no external API or model weights required.

What it normalises
------------------
  test_name     Synonym variants → canonical label (e.g. "Hgb", "Hb", "Haemoglobin"
                → "Hemoglobin")
  units         Converts to canonical unit where a conversion factor exists
                (e.g. mmol/L glucose → mg/dL; µmol/L creatinine → mg/dL)
  value         Applies conversion factor; keeps original for audit trail
  dates         Any common format → ISO 8601 (YYYY-MM-DD / YYYY-MM / YYYY)
  duplicates    Multiple observations with the same canonical name + date are
                collapsed; highest-confidence one wins, others become superseded

Output per observation
----------------------
  observation_id          deterministic UUID-v5 (document + canonical_name + date)
  canonical_test_name     normalised label
  display_name            human-friendly label
  category                metabolic | lipids | haematology | thyroid | iron |
                          vitamins | inflammation | cardiac | hormones | oncology |
                          mental_health | respiratory | gastroenterology |
                          musculoskeletal | imaging_score | other
  original_test_name      raw name from extraction
  normalized_value        converted numeric or cleaned text
  normalized_unit         canonical unit
  original_value          as extracted (preserved for audit)
  original_unit           as extracted
  conversion_applied      bool
  conversion_factor       numeric multiplier applied (null if none)
  reference_range_normalized  range converted to same canonical unit
  flag                    H | L | CRITICAL | PANIC | null
  interpretation          free text from extraction
  observation_date        ISO 8601 string
  source_entity_index     index in structured_entities array
  confidence              extraction confidence

Usage (CLI)
-----------
  python3.10 workers/normalizer.py <document_id>
  python3.10 workers/normalizer.py --json '{"structured_entities":[...],"report_date":"..."}'
"""
from __future__ import annotations

import hashlib
import json
import logging
import re
import sys
from dataclasses import asdict, dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any

_root = Path(__file__).resolve().parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [NORMALIZE] %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)


# ══════════════════════════════════════════════════════════════════════════════
# 1. TEST-NAME SYNONYM DICTIONARY
# ══════════════════════════════════════════════════════════════════════════════
# Format: "canonical_name": (display_name, category, [regex patterns])
# Patterns are matched case-insensitively against the raw test_name /
# result_name / score_name fields.

_TEST_MAP: list[tuple[str, str, str, list[str]]] = [

    # ── HbA1c first — must beat plain "hemoglobin" matches ───────────────────
    ("HbA1c",            "Hemoglobin A1c",              "metabolic",
     [r"\bhba1c\b", r"hemoglobin\s+a1c", r"haemoglobin\s+a1c",
      r"glycated\s+h[ae]moglobin", r"glyco(?:sylated)?\s+h[ae]moglobin",
      r"\ba1c\b", r"\bglycoh[ae]moglobin\b"]),

    # ── Haematology ───────────────────────────────────────────────────────────
    ("WBC",              "White Blood Cell Count",      "haematology",
     [r"\bwbc\b", r"white\s+blood\s+cell\s+count", r"leukocyte\s+count", r"\bleuco?cytes?\b"]),
    ("RBC",              "Red Blood Cell Count",        "haematology",
     [r"\brbc\b", r"red\s+blood\s+cell\s+count", r"erythrocyte\s+count"]),
    ("Hemoglobin",       "Hemoglobin",                  "haematology",
     [r"\bhemoglobin\b(?!\s+a1c)(?!.*glycat)", r"\bhaemoglobin\b(?!\s+a1c)(?!.*glycat)",
      r"\bhgb\b", r"\bhb\b(?!\s*a1c)", r"\bhgbn\b"]),
    ("Hematocrit",       "Hematocrit",                  "haematology",
     [r"\bhematocrit\b", r"\bhaematocrit\b", r"\bhct\b", r"\bpacked\s+cell\s+volume\b", r"\bpcv\b"]),
    ("MCV",              "Mean Corpuscular Volume",     "haematology",
     [r"\bmcv\b", r"mean\s+corp(?:uscular)?\s+vol"]),
    ("MCH",              "Mean Corpuscular Hemoglobin", "haematology",
     [r"\bmch\b(?!c)", r"mean\s+corp(?:uscular)?\s+hemo?globin(?!\s+conc)"]),
    ("MCHC",             "Mean Corpuscular Hemoglobin Concentration", "haematology",
     [r"\bmchc\b", r"mean\s+corp(?:uscular)?\s+hemo?globin\s+conc"]),
    ("RDW",              "Red Cell Distribution Width", "haematology",
     [r"\brdw\b", r"red\s+(?:cell|blood\s+cell)\s+distribution\s+width"]),
    ("Platelet",         "Platelet Count",              "haematology",
     [r"\bplatelet\b", r"\bplt\b", r"thrombocyte\s+count"]),
    ("MPV",              "Mean Platelet Volume",        "haematology",
     [r"\bmpv\b", r"mean\s+platelet\s+vol"]),
    ("Neutrophils",      "Neutrophils",                 "haematology",
     [r"\bneutrophil\b", r"\bneutrophils?\b", r"\bpmn\b", r"\bneuts?\b"]),
    ("Lymphocytes",      "Lymphocytes",                 "haematology",
     [r"\blymphocyte\b", r"\blymphocytes?\b", r"\blymph\b"]),
    ("Monocytes",        "Monocytes",                   "haematology",
     [r"\bmonocyte\b", r"\bmonocytes?\b", r"\bmono\b"]),
    ("Eosinophils",      "Eosinophils",                 "haematology",
     [r"\beosinophil\b", r"\beosinophils?\b", r"\beos\b"]),
    ("Basophils",        "Basophils",                   "haematology",
     [r"\bbasophil\b", r"\bbasophils?\b", r"\bbaso\b"]),

    # ── Metabolic / CMP ───────────────────────────────────────────────────────
    ("Glucose",          "Glucose",                     "metabolic",
     [r"\bglucose\b", r"\bblood\s+sugar\b", r"\bfasting\s+glucose\b", r"\bplasma\s+glucose\b",
      r"\bserum\s+glucose\b", r"\bdextrose\b"]),
    ("Creatinine",       "Creatinine",                  "metabolic",
     [r"\bcreatinine\b", r"\bserum\s+creatinine\b", r"\bcrea\b"]),
    ("BUN",              "Blood Urea Nitrogen",         "metabolic",
     [r"\bbun\b", r"blood\s+urea\s+nitrogen", r"\burea\s+nitrogen\b", r"\bserum\s+urea\b"]),
    ("eGFR",             "Estimated GFR",               "metabolic",
     [r"\begfr\b", r"estimated\s+(?:glomerular\s+filtration|gfr)", r"\bckd-epi\b", r"\bmdrd\b"]),
    ("Sodium",           "Sodium",                      "metabolic",
     [r"\bsodium\b", r"\bna\+?\b(?!\s*cl|\s*k|\s*hco)"]),
    ("Potassium",        "Potassium",                   "metabolic",
     [r"\bpotassium\b", r"\bk\+?\b(?!\s*cl|\s*na)"]),
    ("Chloride",         "Chloride",                    "metabolic",
     [r"\bchloride\b", r"\bcl-?\b"]),
    ("Bicarbonate",      "Bicarbonate / CO2",           "metabolic",
     [r"\bbicarbonate\b", r"\bserum\s+co2\b", r"\bco2\s+(?:content|total)\b", r"\bHCO3\b"]),
    ("Calcium",          "Calcium",                     "metabolic",
     [r"\bcalcium\b(?!\s+channel|\s*score)", r"\bca\b(?!\s*-?\s*125|\s*15|\s*19|\s*27)"]),
    ("Phosphorus",       "Phosphorus",                  "metabolic",
     [r"\bphosphorus\b", r"\bphosphate\b", r"\bphos\b", r"\binorganic\s+phosphate\b"]),
    ("Magnesium",        "Magnesium",                   "metabolic",
     [r"\bmagnesium\b", r"\bmg\b(?!\s*/\s*dl|\s*kg|\s*mmol)"]),
    ("Uric Acid",        "Uric Acid",                   "metabolic",
     [r"\buric\s+acid\b", r"\burate\b", r"\bserum\s+urate\b"]),
    ("ALT",              "Alanine Aminotransferase",    "metabolic",
     [r"\balt\b", r"alanine\s+(?:amino)?transferase", r"\bsgpt\b"]),
    ("AST",              "Aspartate Aminotransferase",  "metabolic",
     [r"\bast\b", r"aspartate\s+(?:amino)?transferase", r"\bsgot\b"]),
    ("ALP",              "Alkaline Phosphatase",        "metabolic",
     [r"\balp\b", r"alkaline\s+phosphatase"]),
    ("GGT",              "Gamma-Glutamyl Transferase",  "metabolic",
     [r"\bggt\b", r"gamma.glutamyl(?:\s+transferase|\s+transpeptidase)?", r"\bggtp\b"]),
    ("Bilirubin Total",  "Bilirubin, Total",            "metabolic",
     [r"\btotal\s+bilirubin\b", r"\bbilirubin\s+total\b", r"\bT\.?bili\b"]),
    ("Bilirubin Direct", "Bilirubin, Direct",           "metabolic",
     [r"\bdirect\s+bilirubin\b", r"\bconjugated\s+bilirubin\b", r"\bD\.?bili\b"]),
    ("Albumin",          "Albumin",                     "metabolic",
     [r"\balbumin\b(?!\s+globulin|\s+ratio)"]),
    ("Total Protein",    "Total Protein",               "metabolic",
     [r"\btotal\s+protein\b", r"\bserum\s+total\s+protein\b"]),

    # ── Diabetes / insulin ────────────────────────────────────────────────────
    ("Insulin",          "Insulin",                     "metabolic",
     [r"\binsulin\b(?!\s+resistance|\s+like)", r"\bfasting\s+insulin\b"]),
    ("C-Peptide",        "C-Peptide",                   "metabolic",
     [r"\bc.peptide\b", r"\bc\s+peptide\b"]),
    ("HOMA-IR",          "HOMA-IR",                     "metabolic",
     [r"\bhoma.?ir\b", r"homeostatic\s+model\s+assessment"]),

    # ── Lipids ────────────────────────────────────────────────────────────────
    ("LDL Cholesterol",  "LDL Cholesterol",             "lipids",
     [r"\bldl\b(?!\s+cell)", r"ldl.?cholesterol", r"low.density\s+lipoprotein(?:\s+cholesterol)?"]),
    ("HDL Cholesterol",  "HDL Cholesterol",             "lipids",
     [r"\bhdl\b", r"hdl.?cholesterol", r"high.density\s+lipoprotein(?:\s+cholesterol)?"]),
    ("Total Cholesterol","Total Cholesterol",           "lipids",
     [r"total\s+cholesterol", r"\bcholesterol\b(?!\s+ester|\s*,\s*hdl|\s*,\s*ldl)"]),
    ("Triglycerides",    "Triglycerides",               "lipids",
     [r"\btriglycerides?\b", r"\btrigs?\b", r"\btg\b(?!\s+score)"]),
    ("Non-HDL Cholesterol","Non-HDL Cholesterol",       "lipids",
     [r"non.hdl\s+cholesterol"]),
    ("VLDL",             "VLDL Cholesterol",            "lipids",
     [r"\bvldl\b", r"very\s+low.density\s+lipoprotein"]),
    ("Lp(a)",            "Lipoprotein (a)",             "lipids",
     [r"\blipoprotein\s*\(?a\)?\b", r"\blp\s*\(?a\)?\b"]),
    ("ApoB",             "Apolipoprotein B",            "lipids",
     [r"\bapob\b", r"apolipoprotein\s+b"]),

    # ── Thyroid ───────────────────────────────────────────────────────────────
    ("TSH",              "Thyroid Stimulating Hormone", "thyroid",
     [r"\btsh\b", r"thyroid.stimulating\s+hormone", r"thyrotropin"]),
    ("Free T4",          "Free T4 (Thyroxine)",         "thyroid",
     [r"\bfree\s+t4\b", r"\bft4\b", r"free\s+thyroxine"]),
    ("Free T3",          "Free T3 (Triiodothyronine)",  "thyroid",
     [r"\bfree\s+t3\b", r"\bft3\b", r"free\s+triiodothyronine"]),
    ("Total T4",         "Total T4",                    "thyroid",
     [r"\btotal\s+t4\b", r"\btt4\b", r"total\s+thyroxine"]),
    ("Total T3",         "Total T3",                    "thyroid",
     [r"\btotal\s+t3\b", r"\btt3\b", r"total\s+triiodothyronine"]),
    ("Reverse T3",       "Reverse T3",                  "thyroid",
     [r"\breverse\s+t3\b", r"\brt3\b"]),
    ("Anti-TPO",         "Anti-Thyroid Peroxidase",     "thyroid",
     [r"\banti.?tpo\b", r"thyroid\s+peroxidase\s+antibod", r"\btpo\s+antibod"]),
    ("Anti-Thyroglobulin","Anti-Thyroglobulin",         "thyroid",
     [r"\banti.?tg\b", r"anti.thyroglobulin", r"thyroglobulin\s+antibod"]),
    ("Thyroglobulin",    "Thyroglobulin",               "thyroid",
     [r"\bthyroglobulin\b(?!\s+antibod)"]),

    # ── Iron ─────────────────────────────────────────────────────────────────
    ("Ferritin",         "Ferritin",                    "iron",
     [r"\bferritin\b", r"\bserum\s+ferritin\b"]),
    ("Serum Iron",       "Serum Iron",                  "iron",
     [r"\bserum\s+iron\b", r"\biron\b(?!\s+supplement|\s+tablet|\s+deficiency\s+an|\s+panel)"]),
    ("TIBC",             "Total Iron-Binding Capacity", "iron",
     [r"\btibc\b", r"total\s+iron.binding\s+capacity"]),
    ("Transferrin Saturation","Transferrin Saturation", "iron",
     [r"\btransferrin\s+sat(?:uration)?\b", r"\biron\s+saturation\b", r"\bsat(?:uration)?\s*%"]),
    ("Transferrin",      "Transferrin",                 "iron",
     [r"\btransferrin\b(?!\s+sat)"]),

    # ── Vitamins / minerals ───────────────────────────────────────────────────
    ("Vitamin D",        "Vitamin D (25-OH)",           "vitamins",
     [r"\bvitamin\s+d\b", r"\b25.oh\b", r"25.hydroxy(?:vitamin\s*)?d", r"\bcholecalciferol\b"]),
    ("Vitamin B12",      "Vitamin B12 (Cobalamin)",     "vitamins",
     [r"\bvitamin\s+b.?12\b", r"\bcobalamin\b", r"\bcyanocobalamin\b"]),
    ("Folate",           "Folate",                      "vitamins",
     [r"\bfolate\b", r"\bfolic\s+acid\b", r"\bserum\s+folate\b"]),
    ("Zinc",             "Zinc",                        "vitamins",
     [r"\bzinc\b", r"\bserum\s+zinc\b"]),
    ("Magnesium RBC",    "RBC Magnesium",               "vitamins",
     [r"\brbc\s+magnesium\b", r"\bmagnesium.*rbc\b"]),

    # ── Inflammatory markers ──────────────────────────────────────────────────
    ("CRP",              "C-Reactive Protein",          "inflammation",
     [r"\bcrp\b", r"c.reactive\s+protein", r"\bhigh.sensitivity\s+crp\b", r"\bhs.?crp\b"]),
    ("ESR",              "Erythrocyte Sedimentation Rate","inflammation",
     [r"\besr\b", r"erythrocyte\s+sedimentation\s+rate", r"sedimentation\s+rate"]),
    ("Fibrinogen",       "Fibrinogen",                  "inflammation",
     [r"\bfibrinogen\b"]),
    ("IL-6",             "Interleukin-6",               "inflammation",
     [r"\bil.?6\b", r"interleukin.6"]),
    ("Procalcitonin",    "Procalcitonin",               "inflammation",
     [r"\bprocalcitonin\b", r"\bpct\b(?=\s*(?:level|ng|result))"]),

    # ── Coagulation ───────────────────────────────────────────────────────────
    ("PT/INR",           "Prothrombin Time / INR",      "metabolic",
     [r"\bpt\b(?=\s*/\s*inr|\s+inr|\s*:|\s*=)", r"\bprothrombin\s+time\b", r"\binr\b"]),
    ("aPTT",             "Activated Partial Thromboplastin Time","metabolic",
     [r"\baptt\b", r"\bptt\b(?!\s+ratio)", r"partial\s+thromboplastin\s+time"]),
    ("D-Dimer",          "D-Dimer",                     "cardiac",
     [r"\bd.dimer\b"]),

    # ── Cardiac markers ───────────────────────────────────────────────────────
    ("Troponin",         "Troponin",                    "cardiac",
     [r"\btroponin\b", r"\bctni\b", r"\bctnt\b", r"high.sensitivity\s+troponin", r"\bhs.?troponin\b"]),
    ("BNP",              "B-type Natriuretic Peptide",  "cardiac",
     [r"\bbnp\b(?!-)", r"b.type\s+natriuretic\s+peptide", r"brain\s+natriuretic"]),
    ("NT-proBNP",        "NT-proBNP",                   "cardiac",
     [r"\bnt.pro.?bnp\b", r"\bnt.?probnp\b", r"n.terminal\s+pro.?bnp"]),
    ("CK-MB",            "Creatine Kinase-MB",          "cardiac",
     [r"\bck.mb\b", r"creatine\s+kinase.mb", r"cardiac\s+enzyme\s+ck"]),
    ("CK",               "Creatine Kinase",             "cardiac",
     [r"\bck\b(?!.mb|\s*-\s*mb)", r"\bcreatine\s+kinase\b(?!.mb)"]),
    ("Homocysteine",     "Homocysteine",                "cardiac",
     [r"\bhomocysteine\b", r"\bserum\s+homocysteine\b"]),

    # ── Renal ─────────────────────────────────────────────────────────────────
    ("Urine Albumin",    "Urine Albumin",               "metabolic",
     [r"\burine\s+albumin\b", r"\bmicroalbuminuria\b", r"\balbuminuria\b",
      r"\burine\s+microalbumin\b"]),
    ("Urine Creatinine", "Urine Creatinine",            "metabolic",
     [r"\burine\s+creatinine\b"]),
    ("ACR",              "Albumin:Creatinine Ratio",    "metabolic",
     [r"\bacr\b", r"albumin.creatinine\s+ratio", r"urine\s+acr"]),

    # ── Hormones — reproductive ───────────────────────────────────────────────
    ("FSH",              "Follicle-Stimulating Hormone","hormones",
     [r"\bfsh\b", r"follicle.stimulating\s+hormone"]),
    ("LH",               "Luteinizing Hormone",         "hormones",
     [r"\blh\b(?!\s+ratio)", r"luteinizing\s+hormone", r"luteinising\s+hormone"]),
    ("AMH",              "Anti-Müllerian Hormone",      "hormones",
     [r"\bamh\b", r"anti.m[üu]llerian\s+hormone", r"antimullerian\s+hormone"]),
    ("Estradiol",        "Estradiol (E2)",              "hormones",
     [r"\bestradiol\b", r"\be2\b(?=\s*[:\(]|\s*level|\s*=)", r"\b17.?beta.?estradiol\b"]),
    ("Estrone",          "Estrone (E1)",                "hormones",
     [r"\bestrone\b", r"\be1\b(?=\s*level)"]),
    ("Estriol",          "Estriol (E3)",                "hormones",
     [r"\bestriol\b", r"\be3\b(?=\s*level)"]),
    ("Progesterone",     "Progesterone",                "hormones",
     [r"\bprogesterone\b", r"\bluteal\s+phase\s+progesterone\b"]),
    ("Prolactin",        "Prolactin",                   "hormones",
     [r"\bprolactin\b", r"\bprl\b"]),
    ("Testosterone",     "Testosterone",                "hormones",
     [r"\btestosterone\b", r"\btotal\s+testosterone\b", r"\bfree\s+testosterone\b"]),
    ("SHBG",             "Sex Hormone-Binding Globulin","hormones",
     [r"\bshbg\b", r"sex\s+hormone.binding\s+globulin"]),
    ("DHEA-S",           "DHEA-Sulfate",                "hormones",
     [r"\bdhea.?s\b", r"dehydroepiandrosterone.sulf"]),
    ("hCG",              "Human Chorionic Gonadotropin","hormones",
     [r"\bhcg\b", r"human\s+chorionic\s+gonadotropin", r"\burine\s+hcg\b",
      r"\bpregnancy\s+test\b"]),
    ("Cortisol",         "Cortisol",                    "hormones",
     [r"\bcortisol\b", r"\bserum\s+cortisol\b", r"\bam\s+cortisol\b", r"\bpm\s+cortisol\b"]),
    ("ACTH",             "ACTH",                        "hormones",
     [r"\bacth\b", r"adrenocorticotropic\s+hormone", r"corticotropin"]),

    # ── Tumour markers ────────────────────────────────────────────────────────
    ("PSA",              "Prostate-Specific Antigen",   "oncology",
     [r"\bpsa\b", r"prostate.specific\s+antigen"]),
    ("CA-125",           "CA-125",                      "oncology",
     [r"\bca.?125\b", r"cancer\s+antigen\s+125"]),
    ("CA 19-9",          "CA 19-9",                     "oncology",
     [r"\bca.?19.?9\b", r"cancer\s+antigen\s+19.9"]),
    ("CA 15-3",          "CA 15-3",                     "oncology",
     [r"\bca.?15.?3\b"]),
    ("CEA",              "Carcinoembryonic Antigen",    "oncology",
     [r"\bcea\b", r"carcinoembryonic\s+antigen"]),
    ("AFP",              "Alpha-Fetoprotein",           "oncology",
     [r"\bafp\b", r"alpha.fetoprotein"]),

    # ── Mental health scores ──────────────────────────────────────────────────
    ("PHQ-9",            "PHQ-9 Depression Score",      "mental_health",
     [r"\bphq.?9\b", r"patient\s+health\s+questionnaire.?9"]),
    ("GAD-7",            "GAD-7 Anxiety Score",         "mental_health",
     [r"\bgad.?7\b", r"generalized\s+anxiety\s+disorder.?7"]),
    ("AUDIT",            "AUDIT Alcohol Score",         "mental_health",
     [r"\baudit\b(?!.?c)", r"alcohol\s+use\s+disorder\s+identification"]),
    ("AUDIT-C",          "AUDIT-C Score",               "mental_health",
     [r"\baudit.?c\b"]),
    ("MMSE",             "Mini-Mental State Exam",      "mental_health",
     [r"\bmmse\b", r"mini.mental\s+state\s+exam"]),
    ("MoCA",             "Montreal Cognitive Assessment","mental_health",
     [r"\bmoca\b", r"montreal\s+cognitive\s+assessment"]),
    ("PCL-5",            "PTSD Checklist (PCL-5)",      "mental_health",
     [r"\bpcl.?5\b", r"ptsd\s+check(?:list)?"]),
    ("EPDS",             "Edinburgh Postnatal Depression Scale","mental_health",
     [r"\bepds\b", r"edinburgh\s+postnatal\s+depression"]),
    ("ISI",              "Insomnia Severity Index",     "mental_health",
     [r"\bisi\b(?=\s*score|\s*=|\s*:)", r"insomnia\s+severity\s+index"]),
    ("ESS",              "Epworth Sleepiness Scale",    "mental_health",
     [r"\bess\b(?=\s*score|\s*=|\s*:)", r"epworth\s+sleepiness\s+scale"]),

    # ── Pulmonary ─────────────────────────────────────────────────────────────
    ("FEV1/FVC",         "FEV1/FVC Ratio",              "respiratory",
     [r"\bfev1\s*/\s*fvc\b", r"\bfev1.fvc\s*ratio\b", r"\btiffeneau\b"]),
    ("FEV1",             "FEV1 (Forced Expiratory Volume 1s)","respiratory",
     [r"\bfev1\b(?!/)", r"forced\s+expiratory\s+volume.{0,5}1\s*s"]),
    ("FVC",              "FVC (Forced Vital Capacity)", "respiratory",
     [r"\bfvc\b", r"forced\s+vital\s+capacity"]),
    ("DLCO",             "DLCO (Diffusing Capacity)",   "respiratory",
     [r"\bdlco\b", r"diffusing\s+capacity", r"diffusion\s+capacity"]),
    ("TLC",              "Total Lung Capacity",         "respiratory",
     [r"\btlc\b", r"total\s+lung\s+capacity"]),
    ("SpO2",             "Oxygen Saturation (SpO2)",    "respiratory",
     [r"\bspo2\b", r"\bo2\s+sat(?:uration)?\b", r"pulse\s+ox(?:imetry)?",
      r"\boxygen\s+saturation\b"]),

    # ── GI markers ────────────────────────────────────────────────────────────
    ("H. pylori",        "H. pylori",                   "gastroenterology",
     [r"\bh\.?\s*pylori\b", r"helicobacter\s+pylori", r"\burea\s+breath\s+test\b"]),
    ("Calprotectin",     "Fecal Calprotectin",          "gastroenterology",
     [r"\bcalprotectin\b", r"fecal\s+calprotectin\b"]),
    ("Fecal Occult Blood","Fecal Occult Blood Test",    "gastroenterology",
     [r"\bfobt\b", r"\bfit\b(?=\s+test|\s+result)", r"fecal\s+occult\s+blood",
      r"occult\s+blood"]),
    ("Lipase",           "Lipase",                      "gastroenterology",
     [r"\blipase\b"]),
    ("Amylase",          "Amylase",                     "gastroenterology",
     [r"\bamylase\b", r"\bserum\s+amylase\b"]),
    ("Hepatitis B sAg",  "Hepatitis B Surface Antigen", "gastroenterology",
     [r"\bhbsag\b", r"hepatitis\s+b\s+surface\s+antigen"]),
    ("HCV Antibody",     "Hepatitis C Antibody",        "gastroenterology",
     [r"\bhcv\s+antibody\b", r"\banti.?hcv\b"]),

    # ── Musculoskeletal / bone ────────────────────────────────────────────────
    ("DEXA T-Score",     "DEXA T-Score",                "musculoskeletal",
     [r"\bt.score\b", r"\bdexa\s+t.score\b"]),
    ("DEXA Z-Score",     "DEXA Z-Score",                "musculoskeletal",
     [r"\bz.score\b", r"\bdexa\s+z.score\b"]),
    ("Rheumatoid Factor","Rheumatoid Factor",           "musculoskeletal",
     [r"\brheumatoid\s+factor\b", r"\brf\b(?=\s*:|\s*=|\s*positive|\s*negative|\s*\d)"]),
    ("Anti-CCP",         "Anti-CCP Antibody",           "musculoskeletal",
     [r"\banti.?ccp\b", r"anti.cyclic\s+citrullinated\s+peptide"]),
    ("ANA",              "Antinuclear Antibody",        "musculoskeletal",
     [r"\bana\b(?=\s*:|\s*=|\s*titer|\s*positive|\s*negative|\s*\d)",
      r"antinuclear\s+antibod"]),
    ("Uric Acid",        "Uric Acid",                   "musculoskeletal",
     [r"\buric\s+acid\b(?=.*gout|\bgout.*)", r"\bgout\s+panel\b"]),

    # ── Imaging scores ────────────────────────────────────────────────────────
    ("BI-RADS",          "BI-RADS Score",               "imaging_score",
     [r"\bbi.?rads\b", r"breast\s+imaging\s+reporting"]),
    ("TNM Stage",        "TNM Staging",                 "imaging_score",
     [r"\btnm\b", r"\bpathologic\s+stag", r"\bclinical\s+stag"]),
    ("FRAX Score",       "FRAX Fracture Risk Score",    "imaging_score",
     [r"\bfrax\b", r"fracture\s+risk\s+assessment"]),
    ("CAC Score",        "Coronary Artery Calcium Score","imaging_score",
     [r"\bcac\s+score\b", r"coronary\s+(?:artery\s+)?calcium\s+score",
      r"\bagatston\b"]),
    ("Pap Smear",        "Pap Smear / Cervical Cytology","imaging_score",
     [r"\bpap\s+(?:smear|test)\b", r"cervical\s+cytology", r"papanicolaou"]),
    ("HPV",              "HPV Test",                    "imaging_score",
     [r"\bhpv\b", r"human\s+papillomavirus"]),
]

# Compile patterns once
_COMPILED_MAP: list[tuple[str, str, str, list[re.Pattern[str]]]] = [
    (canon, display, category, [re.compile(p, re.IGNORECASE) for p in patterns])
    for canon, display, category, patterns in _TEST_MAP
]


def resolve_test_name(raw: str) -> tuple[str, str, str] | None:
    """
    Return (canonical_test_name, display_name, category) for raw test name,
    or None if no match found.
    """
    if not raw:
        return None
    for canon, display, category, patterns in _COMPILED_MAP:
        for pattern in patterns:
            if pattern.search(raw):
                return canon, display, category
    return None


# ══════════════════════════════════════════════════════════════════════════════
# 2. UNIT NORMALISATION
# ══════════════════════════════════════════════════════════════════════════════
# Format: (canonical_unit, [alias patterns], conversion_to_canonical, reverse_factor)
# conversion_to_canonical: multiply source value by this to get canonical value
# A test's canonical unit is defined per-test in _CANONICAL_UNIT below.
# A unit alias triggers no conversion (factor=1.0); a different unit triggers
# conversion if a factor is defined.

# Canonical unit per test name (fallback: keep original)
_CANONICAL_UNIT: dict[str, str] = {
    # Haematology
    "WBC":               "K/µL",
    "RBC":               "M/µL",
    "Hemoglobin":        "g/dL",
    "Hematocrit":        "%",
    "MCV":               "fL",
    "MCH":               "pg",
    "MCHC":              "g/dL",
    "RDW":               "%",
    "Platelet":          "K/µL",
    "MPV":               "fL",
    "Neutrophils":       "%",
    "Lymphocytes":       "%",
    "Monocytes":         "%",
    "Eosinophils":       "%",
    "Basophils":         "%",
    # Metabolic
    "Glucose":           "mg/dL",
    "Creatinine":        "mg/dL",
    "BUN":               "mg/dL",
    "eGFR":              "mL/min/1.73m²",
    "Sodium":            "mmol/L",
    "Potassium":         "mmol/L",
    "Chloride":          "mmol/L",
    "Bicarbonate":       "mmol/L",
    "Calcium":           "mg/dL",
    "Phosphorus":        "mg/dL",
    "Magnesium":         "mg/dL",
    "Uric Acid":         "mg/dL",
    "ALT":               "U/L",
    "AST":               "U/L",
    "ALP":               "U/L",
    "GGT":               "U/L",
    "Bilirubin Total":   "mg/dL",
    "Bilirubin Direct":  "mg/dL",
    "Albumin":           "g/dL",
    "Total Protein":     "g/dL",
    "HbA1c":             "%",
    "Insulin":           "µIU/mL",
    "C-Peptide":         "ng/mL",
    # Lipids
    "Total Cholesterol": "mg/dL",
    "LDL Cholesterol":   "mg/dL",
    "HDL Cholesterol":   "mg/dL",
    "Triglycerides":     "mg/dL",
    "VLDL":              "mg/dL",
    # Thyroid
    "TSH":               "mIU/L",
    "Free T4":           "ng/dL",
    "Free T3":           "pg/mL",
    "Total T4":          "µg/dL",
    "Total T3":          "ng/dL",
    # Iron
    "Ferritin":          "ng/mL",
    "Serum Iron":        "µg/dL",
    "TIBC":              "µg/dL",
    "Transferrin Saturation": "%",
    "Transferrin":       "mg/dL",
    # Vitamins
    "Vitamin D":         "ng/mL",
    "Vitamin B12":       "pg/mL",
    "Folate":            "ng/mL",
    "Zinc":              "µg/dL",
    # Inflammation
    "CRP":               "mg/L",
    "ESR":               "mm/hr",
    "Fibrinogen":        "mg/dL",
    # Cardiac
    "Troponin":          "ng/mL",
    "BNP":               "pg/mL",
    "NT-proBNP":         "pg/mL",
    "CK-MB":             "ng/mL",
    "CK":                "U/L",
    "D-Dimer":           "µg/mL FEU",
    "Homocysteine":      "µmol/L",
    # Hormones
    "FSH":               "mIU/mL",
    "LH":                "mIU/mL",
    "AMH":               "ng/mL",
    "Estradiol":         "pg/mL",
    "Progesterone":      "ng/mL",
    "Prolactin":         "ng/mL",
    "Testosterone":      "ng/dL",
    "SHBG":              "nmol/L",
    "DHEA-S":            "µg/dL",
    "hCG":               "mIU/mL",
    "Cortisol":          "µg/dL",
    "ACTH":              "pg/mL",
    # Oncology markers
    "PSA":               "ng/mL",
    "CA-125":            "U/mL",
    "CA 19-9":           "U/mL",
    "CA 15-3":           "U/mL",
    "CEA":               "ng/mL",
    "AFP":               "ng/mL",
    # Respiratory
    "FEV1":              "L",
    "FVC":               "L",
    "FEV1/FVC":          "%",
    "DLCO":              "mL/min/mmHg",
    "TLC":               "L",
    "SpO2":              "%",
    # GI
    "Calprotectin":      "µg/g",
    "Lipase":            "U/L",
    "Amylase":           "U/L",
}

# Unit conversion table
# Format: source_unit_pattern → (canonical_unit, factor_to_canonical)
# multiply source value × factor → canonical value
_UNIT_CONVERSIONS: list[tuple[re.Pattern[str], str, float]] = [
    # Glucose: mmol/L → mg/dL (÷ 0.0555 = × 18.018)
    (re.compile(r"\bmmol/l\b", re.IGNORECASE), "mg/dL", 18.018),
    # Cholesterol/LDL/HDL: mmol/L → mg/dL (× 38.67)
    # Triglycerides: mmol/L → mg/dL (× 88.57) — handled per-test below
    # Creatinine: µmol/L → mg/dL (÷ 88.42)
    (re.compile(r"\bµmol/l\b|\bumol/l\b", re.IGNORECASE), "µmol/L", 1.0),  # keep as µmol/L for non-creatinine
    # Hemoglobin: g/L → g/dL (÷ 10)
    (re.compile(r"\bg/l\b", re.IGNORECASE), "g/dL", 0.1),
    # TSH: µIU/mL = mIU/L (factor 1.0)
    (re.compile(r"\bµiu/ml\b|\buiu/ml\b", re.IGNORECASE), "mIU/L", 1.0),
    # K/uL = K/µL (Unicode normalisation only)
    (re.compile(r"\bk/ul\b|\bk/mcl\b", re.IGNORECASE), "K/µL", 1.0),
    # M/uL = M/µL
    (re.compile(r"\bm/ul\b|\bm/mcl\b", re.IGNORECASE), "M/µL", 1.0),
    # ng/dL → pg/mL for free T3 (× 10)  — only applied when canonical is pg/mL
    (re.compile(r"\bng/dl\b", re.IGNORECASE), "ng/dL", 1.0),
    # µg/dL = mcg/dL
    (re.compile(r"\bmcg/dl\b", re.IGNORECASE), "µg/dL", 1.0),
    # pg/mL = picogram/mL
    (re.compile(r"\bpg/ml\b", re.IGNORECASE), "pg/mL", 1.0),
    # mIU/mL = IU/L = mU/L (all equivalent, normalise label)
    (re.compile(r"\bmiu/ml\b|\biu/l\b|\bmu/l\b", re.IGNORECASE), "mIU/mL", 1.0),
    # nmol/L keep
    (re.compile(r"\bnmol/l\b", re.IGNORECASE), "nmol/L", 1.0),
    # U/L = IU/L for enzymes
    (re.compile(r"\biu/l\b", re.IGNORECASE), "U/L", 1.0),
    # % — no conversion
    (re.compile(r"\b%\b|\bpercent\b", re.IGNORECASE), "%", 1.0),
]

# Per-test overrides when same source unit means different thing
# (canonical_test_name, source_unit_pattern) → (canonical_unit, factor)
_TEST_UNIT_OVERRIDES: dict[tuple[str, str], tuple[str, float]] = {
    ("Glucose",          r"mmol/l"): ("mg/dL",   18.018),
    ("Total Cholesterol",r"mmol/l"): ("mg/dL",   38.67),
    ("LDL Cholesterol",  r"mmol/l"): ("mg/dL",   38.67),
    ("HDL Cholesterol",  r"mmol/l"): ("mg/dL",   38.67),
    ("Triglycerides",    r"mmol/l"): ("mg/dL",   88.57),
    ("VLDL",             r"mmol/l"): ("mg/dL",   38.67),
    ("Creatinine",       r"µmol/l"): ("mg/dL",   0.01131),
    ("Creatinine",       r"umol/l"): ("mg/dL",   0.01131),
    ("Hemoglobin",       r"g/l"):    ("g/dL",    0.1),
    ("Calcium",          r"mmol/l"): ("mg/dL",   4.008),
    ("Phosphorus",       r"mmol/l"): ("mg/dL",   3.097),
    ("Uric Acid",        r"µmol/l"): ("mg/dL",   0.01681),
    ("Free T4",          r"pmol/l"): ("ng/dL",   0.07752),
    ("Free T3",          r"pmol/l"): ("pg/mL",   0.6511),
    ("Cortisol",         r"nmol/l"): ("µg/dL",   0.036),
    ("Cortisol",         r"µg/l"):   ("µg/dL",   0.1),
    ("HbA1c",            r"mmol/mol"):("%",       0.09148),
}


def normalise_unit(
    canonical_test: str,
    raw_unit: str | None,
    raw_value: float | None,
) -> tuple[str | None, float | None, bool, float | None]:
    """
    Returns (canonical_unit, normalised_value, conversion_applied, factor).
    If no conversion is needed or possible, returns originals with
    conversion_applied=False.
    """
    if not raw_unit:
        canon_unit = _CANONICAL_UNIT.get(canonical_test)
        return canon_unit, raw_value, False, None

    unit_stripped = raw_unit.strip()

    # Check per-test overrides first
    for (test_key, unit_pattern), (out_unit, factor) in _TEST_UNIT_OVERRIDES.items():
        if test_key == canonical_test and re.search(unit_pattern, unit_stripped, re.IGNORECASE):
            if raw_value is not None:
                return out_unit, round(raw_value * factor, 4), factor != 1.0, factor
            return out_unit, None, False, None

    # Generic unit alias table
    for pattern, out_unit, factor in _UNIT_CONVERSIONS:
        if pattern.search(unit_stripped):
            if raw_value is not None and factor != 1.0:
                return out_unit, round(raw_value * factor, 4), True, factor
            return out_unit, raw_value, False, None

    # No conversion found — return canonical unit label if known, else keep raw
    canon_unit = _CANONICAL_UNIT.get(canonical_test, unit_stripped)
    return canon_unit, raw_value, False, None


# ══════════════════════════════════════════════════════════════════════════════
# 3. DATE NORMALISATION
# ══════════════════════════════════════════════════════════════════════════════

_MONTH_ABBR = {
    "jan": "01", "feb": "02", "mar": "03", "apr": "04",
    "may": "05", "jun": "06", "jul": "07", "aug": "08",
    "sep": "09", "oct": "10", "nov": "11", "dec": "12",
}

_DATE_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    # 2024-01-15  or  2024/01/15
    (re.compile(r"^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$"), "ymd"),
    # 01/15/2024  or  01-15-2024  (US format)
    (re.compile(r"^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$"), "mdy"),
    # 15-Jan-2024  or  15 Jan 2024
    (re.compile(r"^(\d{1,2})[-\s]([A-Za-z]{3,})[-\s](\d{4})$"), "dmonthy"),
    # Jan 15, 2024  or  January 15, 2024
    (re.compile(r"^([A-Za-z]{3,})\s+(\d{1,2}),?\s+(\d{4})$"), "monthdY"),
    # January 2024 (month + year only)
    (re.compile(r"^([A-Za-z]{3,})\s+(\d{4})$"), "monthY"),
    # 01/2024 (month/year only)
    (re.compile(r"^(\d{1,2})[-/](\d{4})$"), "mY"),
    # 2024-01 (year-month only)
    (re.compile(r"^(\d{4})[-/](\d{1,2})$"), "ym"),
    # 2024 (year only)
    (re.compile(r"^(\d{4})$"), "Y"),
]


def normalise_date(raw: str | None) -> str | None:
    """
    Normalise any recognisable date string to ISO 8601.
    Returns None for unparseable input.
    """
    if not raw:
        return None
    raw = raw.strip()

    for pattern, fmt in _DATE_PATTERNS:
        m = pattern.match(raw)
        if not m:
            continue
        g = m.groups()
        try:
            if fmt == "ymd":
                return f"{int(g[0]):04d}-{int(g[1]):02d}-{int(g[2]):02d}"
            if fmt == "mdy":
                return f"{int(g[2]):04d}-{int(g[0]):02d}-{int(g[1]):02d}"
            if fmt == "dmonthy":
                mon = _MONTH_ABBR.get(g[1][:3].lower())
                if mon:
                    return f"{int(g[2]):04d}-{mon}-{int(g[0]):02d}"
            if fmt == "monthdY":
                mon = _MONTH_ABBR.get(g[0][:3].lower())
                if mon:
                    return f"{int(g[2]):04d}-{mon}-{int(g[1]):02d}"
            if fmt == "monthY":
                mon = _MONTH_ABBR.get(g[0][:3].lower())
                if mon:
                    return f"{int(g[1]):04d}-{mon}"
            if fmt == "mY":
                return f"{int(g[1]):04d}-{int(g[0]):02d}"
            if fmt == "ym":
                return f"{int(g[0]):04d}-{int(g[1]):02d}"
            if fmt == "Y":
                return g[0]
        except (ValueError, IndexError):
            continue

    return None


# ══════════════════════════════════════════════════════════════════════════════
# 4. REFERENCE RANGE NORMALISATION
# ══════════════════════════════════════════════════════════════════════════════

_RANGE_PATTERN = re.compile(
    r"^([<>≤≥]?\s*[\d.,]+)\s*[-–—to]+\s*([\d.,]+)$|^([<>≤≥])\s*([\d.,]+)$",
    re.IGNORECASE,
)


def normalise_range(
    raw_range: str | None,
    canonical_unit: str | None,
    original_unit: str | None,
    conversion_factor: float | None,
) -> str | None:
    """
    Convert a reference range string to canonical units if a conversion was
    applied to the value.  Returns None if unparseable.
    """
    if not raw_range:
        return None
    raw_range = str(raw_range).strip()
    if not conversion_factor or conversion_factor == 1.0:
        return raw_range  # no conversion → keep as-is

    m = _RANGE_PATTERN.match(raw_range)
    if not m:
        return raw_range

    try:
        if m.group(1) is not None:   # range form  "lo - hi"
            lo = float(m.group(1).replace(",", ""))
            hi = float(m.group(2).replace(",", ""))
            lo_c = round(lo * conversion_factor, 4)
            hi_c = round(hi * conversion_factor, 4)
            unit_str = f" {canonical_unit}" if canonical_unit else ""
            return f"{lo_c}–{hi_c}{unit_str}"
        else:                        # inequality form  "< N"
            op  = m.group(3)
            val = float(m.group(4).replace(",", ""))
            val_c = round(val * conversion_factor, 4)
            unit_str = f" {canonical_unit}" if canonical_unit else ""
            return f"{op}{val_c}{unit_str}"
    except (ValueError, AttributeError):
        return raw_range


# ══════════════════════════════════════════════════════════════════════════════
# 5. OBSERVATION MODEL + DEDUPLICATION
# ══════════════════════════════════════════════════════════════════════════════

@dataclass
class NormalizedObservation:
    observation_id:             str          # deterministic hash
    canonical_test_name:        str
    display_name:               str
    category:                   str
    original_test_name:         str
    normalized_value:           float | str | None
    normalized_unit:            str | None
    original_value:             float | str | None
    original_unit:              str | None
    conversion_applied:         bool
    conversion_factor:          float | None
    reference_range_normalized: str | None
    flag:                       str | None
    interpretation:             str | None
    observation_date:           str | None
    source_entity_index:        int
    confidence:                 float
    superseded:                 bool = False  # True = duplicate, lower-confidence copy

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _make_obs_id(document_id: str, canonical: str, date: str | None) -> str:
    """Deterministic UUID-like ID from document + test + date."""
    key = f"{document_id}::{canonical}::{date or ''}"
    return hashlib.sha256(key.encode()).hexdigest()[:32]


def _extract_report_date(entities: list[dict[str, Any]]) -> str | None:
    """Pull report_date or observation_date from patient_info entities."""
    for e in entities:
        if e.get("entity_type") == "patient_info":
            if e.get("field") in ("report_date", "observation_date"):
                return normalise_date(e.get("value"))
    return None


def build_observations(
    document_id: str,
    entities: list[dict[str, Any]],
) -> list[NormalizedObservation]:
    """
    Convert structured extraction entities into NormalizedObservation objects.
    Handles test_result, score, and medication entity types.
    Deduplicates: if two entities resolve to the same canonical name + date,
    the higher-confidence one is kept; the lower one is marked superseded=True.
    """
    doc_date = _extract_report_date(entities)
    observations: list[NormalizedObservation] = []
    # key → index in observations list (for dedup)
    seen: dict[str, int] = {}

    for idx, entity in enumerate(entities):
        etype = entity.get("entity_type")

        obs = _entity_to_obs(idx, entity, document_id, doc_date)
        if obs is None:
            continue

        dedup_key = f"{obs.canonical_test_name}::{obs.observation_date or ''}"
        if dedup_key in seen:
            existing_idx = seen[dedup_key]
            existing = observations[existing_idx]
            if obs.confidence > existing.confidence:
                # New one is better — supersede the old
                observations[existing_idx] = NormalizedObservation(
                    **{**asdict(existing), "superseded": True}
                )
                seen[dedup_key] = len(observations)
                observations.append(obs)
            else:
                # Old is better — mark new as superseded
                observations.append(NormalizedObservation(
                    **{**asdict(obs), "superseded": True}
                ))
        else:
            seen[dedup_key] = len(observations)
            observations.append(obs)

    return observations


def _entity_to_obs(
    idx: int,
    entity: dict[str, Any],
    document_id: str,
    doc_date: str | None,
) -> NormalizedObservation | None:
    """Convert one entity dict to a NormalizedObservation, or None if not applicable."""
    etype = entity.get("entity_type")

    # ── test_result ───────────────────────────────────────────────────────────
    if etype == "test_result":
        raw_name  = entity.get("test_name") or entity.get("result_name") or ""
        raw_value: float | str | None = entity.get("numeric_value")
        text_val: str | None          = entity.get("text_value")
        raw_unit  = entity.get("units")
        raw_range = entity.get("reference_range")
        flag      = _normalise_flag(entity.get("flag"))
        interp    = entity.get("interpretation")
        conf      = float(entity.get("confidence") or 0.5)

        resolved = resolve_test_name(raw_name)
        if resolved:
            canonical, display, category = resolved
        else:
            canonical = raw_name or "Unknown Test"
            display   = raw_name or "Unknown Test"
            category  = "other"

        canon_unit, norm_value, conv_applied, factor = normalise_unit(
            canonical, raw_unit, raw_value if isinstance(raw_value, (int, float)) else None
        )
        norm_range = normalise_range(raw_range, canon_unit, raw_unit, factor)

        # Use text_value if no numeric
        final_value: float | str | None = norm_value if norm_value is not None else text_val

        return NormalizedObservation(
            observation_id             = _make_obs_id(document_id, canonical, doc_date),
            canonical_test_name        = canonical,
            display_name               = display,
            category                   = category,
            original_test_name         = raw_name,
            normalized_value           = final_value,
            normalized_unit            = canon_unit,
            original_value             = raw_value if raw_value is not None else text_val,
            original_unit              = raw_unit,
            conversion_applied         = conv_applied,
            conversion_factor          = factor if conv_applied else None,
            reference_range_normalized = norm_range,
            flag                       = flag,
            interpretation             = interp,
            observation_date           = doc_date,
            source_entity_index        = idx,
            confidence                 = conf,
        )

    # ── score ─────────────────────────────────────────────────────────────────
    if etype == "score":
        score_name = entity.get("score_name") or ""
        raw_value  = entity.get("numeric_value")
        text_val   = entity.get("value")
        stage      = entity.get("stage")
        interp     = entity.get("interpretation")
        conf       = float(entity.get("confidence") or 0.5)

        resolved = resolve_test_name(score_name)
        if resolved:
            canonical, display, category = resolved
        else:
            canonical = score_name or "Unknown Score"
            display   = score_name or "Unknown Score"
            category  = "imaging_score"

        final_value: float | str | None = raw_value if raw_value is not None else (stage or text_val)

        return NormalizedObservation(
            observation_id             = _make_obs_id(document_id, canonical, doc_date),
            canonical_test_name        = canonical,
            display_name               = display,
            category                   = category,
            original_test_name         = score_name,
            normalized_value           = final_value,
            normalized_unit            = None,
            original_value             = text_val,
            original_unit              = None,
            conversion_applied         = False,
            conversion_factor          = None,
            reference_range_normalized = None,
            flag                       = None,
            interpretation             = interp,
            observation_date           = doc_date,
            source_entity_index        = idx,
            confidence                 = conf,
        )

    # ── medication ────────────────────────────────────────────────────────────
    if etype == "medication":
        name  = entity.get("name") or ""
        dose  = entity.get("dose")
        units = entity.get("units")
        freq  = entity.get("frequency")
        route = entity.get("route")
        conf  = float(entity.get("confidence") or 0.5)

        text_val = name
        if dose and units:
            text_val = f"{name} {dose}{units}"
        if freq:
            text_val += f" {freq}"
        if route:
            text_val += f" ({route})"

        return NormalizedObservation(
            observation_id             = _make_obs_id(document_id, f"MED:{name}", doc_date),
            canonical_test_name        = f"Medication: {name}",
            display_name               = name,
            category                   = "medication",
            original_test_name         = name,
            normalized_value           = text_val,
            normalized_unit            = units,
            original_value             = dose,
            original_unit              = units,
            conversion_applied         = False,
            conversion_factor          = None,
            reference_range_normalized = None,
            flag                       = None,
            interpretation             = None,
            observation_date           = doc_date,
            source_entity_index        = idx,
            confidence                 = conf,
        )

    return None


def _normalise_flag(raw: str | None) -> str | None:
    if not raw:
        return None
    r = raw.strip().upper()
    mapping = {
        "H": "H", "HIGH": "H", "HI": "H", "ABOVE": "H", "ELEVATED": "H",
        "L": "L", "LOW": "L", "LO": "L", "BELOW": "L",
        "CRITICAL": "CRITICAL", "CRIT": "CRITICAL", "C": "CRITICAL",
        "PANIC": "PANIC", "PNCK": "PANIC",
        "A": "H",   # some labs use A for abnormal — default to H
        "N": None, "NORMAL": None, "WNL": None,
    }
    return mapping.get(r, r if r else None)


# ══════════════════════════════════════════════════════════════════════════════
# 6. RESULT TYPE + SUMMARY
# ══════════════════════════════════════════════════════════════════════════════

@dataclass
class NormalizationResult:
    normalized_observations: list[dict[str, Any]]
    total_observations:      int
    active_observations:     int   # non-superseded
    superseded_count:        int
    conversion_count:        int
    missing_canonical:       int   # entities that matched no test name

    def to_dict(self) -> dict[str, Any]:
        return {
            "normalized_observations": self.normalized_observations,
            "total_observations":      self.total_observations,
            "active_observations":     self.active_observations,
            "superseded_count":        self.superseded_count,
            "conversion_count":        self.conversion_count,
            "missing_canonical":       self.missing_canonical,
        }


def normalize_entities(
    document_id: str,
    entities: list[dict[str, Any]],
) -> NormalizationResult:
    """
    Public entry point for in-process use (e.g. tests, CLI --json).
    Does not touch the database.
    """
    observations = build_observations(document_id, entities)
    obs_dicts = [o.to_dict() for o in observations]

    active      = [o for o in observations if not o.superseded]
    superseded  = [o for o in observations if o.superseded]
    converted   = [o for o in active if o.conversion_applied]
    no_canon    = [o for o in active if o.category == "other"]

    log.info(
        "Normalisation: %d observations (%d active, %d superseded, %d converted)",
        len(observations), len(active), len(superseded), len(converted),
    )

    return NormalizationResult(
        normalized_observations = obs_dicts,
        total_observations      = len(observations),
        active_observations     = len(active),
        superseded_count        = len(superseded),
        conversion_count        = len(converted),
        missing_canonical       = len(no_canon),
    )


# ── DB helpers ─────────────────────────────────────────────────────────────────

def _get_entities(document_id: str) -> list[dict[str, Any]] | None:
    from workers.db import get_conn
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT structured_entities FROM medical_extractions WHERE document_id = %s LIMIT 1",
                (document_id,),
            )
            row = cur.fetchone()
            if not row:
                return None
            raw = row[0]
            if isinstance(raw, str):
                raw = json.loads(raw)
            return raw if isinstance(raw, list) else []


def persist_normalized(document_id: str, result: NormalizationResult) -> None:
    from workers.db import get_conn
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO normalized_results
                    (document_id, normalized_observations, total_observations,
                     active_observations, superseded_count, conversion_count,
                     missing_canonical)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (document_id) DO UPDATE SET
                    normalized_observations = EXCLUDED.normalized_observations,
                    total_observations      = EXCLUDED.total_observations,
                    active_observations     = EXCLUDED.active_observations,
                    superseded_count        = EXCLUDED.superseded_count,
                    conversion_count        = EXCLUDED.conversion_count,
                    missing_canonical       = EXCLUDED.missing_canonical,
                    normalized_at           = NOW()
                """,
                (
                    document_id,
                    json.dumps(result.normalized_observations),
                    result.total_observations,
                    result.active_observations,
                    result.superseded_count,
                    result.conversion_count,
                    result.missing_canonical,
                ),
            )
    log.info(
        "Normalization persisted: %d active observations, %d converted",
        result.active_observations, result.conversion_count,
    )


def normalize_document(document_id: str) -> NormalizationResult:
    """Full pipeline: fetch → normalise → persist → return."""
    entities = _get_entities(document_id)
    if entities is None:
        raise ValueError(f"No extraction found for document_id={document_id}")

    log.info("Normalizing document %s (%d entities)", document_id, len(entities))
    result = normalize_entities(document_id, entities)
    persist_normalized(document_id, result)
    return result


# ── CLI ────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    try:
        from dotenv import load_dotenv
        if (_root / ".env").exists():
            load_dotenv(_root / ".env")
        if (_root / ".env.local").exists():
            load_dotenv(_root / ".env.local", override=True)
    except ImportError:
        pass

    parser = argparse.ArgumentParser(
        description="Normalise extracted medical entities for a document."
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("document_id", nargs="?", help="UUID of document in DB")
    group.add_argument(
        "--json",
        metavar="JSON",
        help='JSON string: {"document_id":"...", "structured_entities":[...]}',
    )
    args = parser.parse_args()

    try:
        if args.json:
            payload   = json.loads(args.json)
            doc_id    = payload.get("document_id", "local-test")
            entities  = payload.get("structured_entities", [])
            result    = normalize_entities(doc_id, entities)
        else:
            result = normalize_document(args.document_id)

        print(json.dumps(result.to_dict(), indent=2))

    except Exception as exc:
        import traceback
        log.error("Normalisation failed: %s", exc)
        traceback.print_exc()
        print(json.dumps({"ok": False, "error": str(exc)}))
        sys.exit(1)
