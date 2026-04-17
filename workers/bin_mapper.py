#!/usr/bin/env python3.10
"""
Health category bin mapper — The Arc Woman
==========================================
Assigns structured medical entities (from medical_extractor.py) to health
category bins using a two-layer approach:

  Layer 1 — Rule-based  (fast, deterministic, covers ~90% of entities)
    Regex patterns matched against entity fields.  Every known test name,
    procedure type, drug class, and score name has a pre-defined bin assignment.

  Layer 2 — Model-based  (Claude claude-haiku-4-5; used only for unclassified entities)
    Entities that matched nothing in Layer 1 are batched into a single Claude
    call.  This keeps API usage minimal while handling novel or rare items.

Health bins (8)
---------------
  general_labs      General Labs & Metabolic Health
  cardiovascular    Cardiovascular Health
  gynecology        Gynecology & Reproductive Health
  musculoskeletal   Musculoskeletal & Orthopedics
  oncology          Oncology
  mental_health     Mental & Behavioral Health
  respiratory       Respiratory & Pulmonology
  gastroenterology  Gastroenterology (GI)

Output
------
  {
    "assigned_bins":          ["general_labs", "cardiovascular"],
    "entity_bin_map":         [{entity_index, entity_type, entity_name, bins, confidence, method}, ...],
    "classification_confidence": 0.95,
    "method_summary":         {"rule": 14, "model": 1, "context_fallback": 0, "unclassified": 0}
  }

Usage (CLI)
-----------
  python3.10 workers/bin_mapper.py <document_id>
  python3.10 workers/bin_mapper.py --json '{"structured_entities": [...]}'
"""
from __future__ import annotations

import json
import logging
import os
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

_root = Path(__file__).resolve().parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [BINS] %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ── Bin definitions ────────────────────────────────────────────────────────────

BINS: dict[str, str] = {
    "general_labs":      "General Labs & Metabolic Health",
    "cardiovascular":    "Cardiovascular Health",
    "gynecology":        "Gynecology & Reproductive Health",
    "musculoskeletal":   "Musculoskeletal & Orthopedics",
    "oncology":          "Oncology",
    "mental_health":     "Mental & Behavioral Health",
    "respiratory":       "Respiratory & Pulmonology",
    "gastroenterology":  "Gastroenterology (GI)",
}
BIN_SLUGS = set(BINS)

MODEL = "claude-haiku-4-5-20251001"

# ── Result types ───────────────────────────────────────────────────────────────

@dataclass
class EntityBinMapping:
    entity_index:  int
    entity_type:   str
    entity_name:   str
    bins:          list[str]
    confidence:    float
    method:        str   # rule | model | context_fallback | unclassified


@dataclass
class BinAssignmentResult:
    assigned_bins:            list[str]
    entity_bin_map:           list[EntityBinMapping]
    classification_confidence: float
    method_summary:           dict[str, int]

    def to_dict(self) -> dict[str, Any]:
        return {
            "assigned_bins":             self.assigned_bins,
            "entity_bin_map":            [
                {
                    "entity_index":  m.entity_index,
                    "entity_type":   m.entity_type,
                    "entity_name":   m.entity_name,
                    "bins":          m.bins,
                    "confidence":    m.confidence,
                    "method":        m.method,
                }
                for m in self.entity_bin_map
            ],
            "classification_confidence": self.classification_confidence,
            "method_summary":            self.method_summary,
        }


# ── Rule definitions ───────────────────────────────────────────────────────────
# Format: (regex_pattern, [bin_slugs], confidence)
# Patterns are matched case-insensitively against the entity's searchable text.
# Confidence reflects how specific the match is (1-word exact = 0.99, broad = 0.85).

_RULES: list[tuple[str, list[str], float]] = [

    # ════════════════════ GENERAL LABS & METABOLIC ═══════════════════════════

    # CBC components
    (r"\bwbc\b|white\s+blood\s+cell", ["general_labs"], 0.99),
    (r"\brbc\b|red\s+blood\s+cell", ["general_labs"], 0.99),
    (r"\bhemoglobin\b|\bhgb\b|\bhb\b(?!\s*a1c)", ["general_labs"], 0.99),
    (r"\bhematocrit\b|\bhct\b", ["general_labs"], 0.99),
    (r"\bplatelet\b|\bplt\b", ["general_labs"], 0.99),
    (r"\bneutrophil\b|\bneutrophil\s*%", ["general_labs"], 0.99),
    (r"\blymphocyte\b|\blymph\s*%", ["general_labs"], 0.99),
    (r"\bmonocyte\b|\bmono\s*%", ["general_labs"], 0.99),
    (r"\beosinophil\b|\beos\s*%", ["general_labs"], 0.99),
    (r"\bbasophil\b|\bbaso\s*%", ["general_labs"], 0.99),
    (r"\bmcv\b|\bmch\b|\bmchc\b|\brdw\b|\bmpv\b", ["general_labs"], 0.99),

    # Metabolic / CMP / BMP
    (r"\bglucose\b|\bfasting\s+glucose\b|\bblood\s+sugar\b", ["general_labs"], 0.98),
    (r"\bcreatinine\b", ["general_labs"], 0.98),
    (r"\bbun\b|blood\s+urea\s+nitrogen", ["general_labs"], 0.98),
    (r"\begfr\b|glomerular\s+filtration\s+rate", ["general_labs"], 0.98),
    (r"\bsodium\b|\bna\b", ["general_labs"], 0.97),
    (r"\bpotassium\b|\bk\b", ["general_labs"], 0.97),
    (r"\bchloride\b|\bcl\b", ["general_labs"], 0.97),
    (r"\bbicarbonate\b|\bco2\b|\bserum\s+co2\b", ["general_labs"], 0.97),
    (r"\bcalcium\b|\bca\b(?!\s+125|\s*-\s*125)", ["general_labs"], 0.97),
    (r"\bphosphorus\b|\bphos\b|\bphosphate\b|\binorganic\s+phosphate\b", ["general_labs"], 0.97),
    (r"\bmagnesium\b|\bmg\b(?!\s*kg|\s*/\s*dl)", ["general_labs"], 0.97),
    (r"\buric\s+acid\b|\burate\b", ["general_labs", "musculoskeletal"], 0.9),

    # Liver enzymes (also GI)
    (r"\balt\b|alanine\s+(amino)?transferase\b|\bsgpt\b", ["general_labs", "gastroenterology"], 0.95),
    (r"\bast\b|aspartate\s+(amino)?transferase\b|\bsgot\b", ["general_labs", "gastroenterology"], 0.95),
    (r"\balp\b|alkaline\s+phosphatase\b", ["general_labs", "gastroenterology"], 0.95),
    (r"\bggt\b|gamma.glutamyl\b", ["general_labs", "gastroenterology"], 0.95),
    (r"\bbilirubin\b", ["general_labs", "gastroenterology"], 0.95),
    (r"\balbumin\b", ["general_labs", "gastroenterology"], 0.93),
    (r"\btotal\s+protein\b|\bserum\s+protein\b", ["general_labs", "gastroenterology"], 0.90),

    # Thyroid
    (r"\btsh\b|thyroid.stimulating\s+hormone\b", ["general_labs"], 0.99),
    (r"\bfree\s+t[34]\b|\bft[34]\b|total\s+t[34]\b|\btriiodothyronine\b|\bthyroxine\b", ["general_labs"], 0.99),
    (r"\bthyroglobulin\b|\banti.tpo\b|\banti.thyroglobulin\b|tpo\s+antibody\b", ["general_labs"], 0.99),
    (r"\breverse\s+t3\b|\brt3\b", ["general_labs"], 0.99),

    # Iron & haematinics
    (r"\bferritin\b", ["general_labs"], 0.99),
    (r"\bserum\s+iron\b|\biron\b(?!\s+deficiency\s+anemia)", ["general_labs"], 0.98),
    (r"\btibc\b|total\s+iron.binding\s+capacity\b", ["general_labs"], 0.99),
    (r"\btransferrin\b|\btransferrin\s+saturation\b", ["general_labs"], 0.99),

    # Iron supplements
    (r"\bferrous\s+(?:sulfate|gluconate|fumarate)\b|\biron\s+supplement\b|\biron\s+tablet\b", ["general_labs"], 0.99),

    # Vitamins & minerals
    (r"\bvitamin\s+d\b|\b25.oh\b|\b25.hydroxy(?:vitamin)?\s*d\b", ["general_labs"], 0.99),
    (r"\bvitamin\s+b12\b|\bcobalamin\b|\bcyanocobalamin\b", ["general_labs"], 0.99),
    (r"\bfolate\b|\bfolic\s+acid\b|\bserum\s+folate\b", ["general_labs"], 0.99),
    (r"\bvitamin\s+b[16]\b|\bpyridoxine\b|\bthiamine\b", ["general_labs"], 0.98),
    (r"\bzinc\b|\bselenium\b|\bcopper\b(?!\s+iud)", ["general_labs"], 0.97),

    # Inflammation / acute phase
    (r"\bcrp\b|c.reactive\s+protein\b", ["general_labs"], 0.97),
    (r"\besr\b|erythrocyte\s+sedimentation\s+rate\b|sedimentation\s+rate\b", ["general_labs"], 0.97),
    (r"\bfibrinogen\b", ["general_labs"], 0.97),
    (r"\binterleukin\b|\bcytokine\b|\bprocalcitonin\b", ["general_labs"], 0.90),

    # Diabetes / insulin
    (r"\bhba1c\b|hemoglobin\s+a1c\b|glycated\s+hemoglobin\b|glycohemoglobin\b", ["general_labs"], 0.99),
    (r"\binsulin\b|\bfasting\s+insulin\b|\bpostprandial\s+insulin\b", ["general_labs"], 0.97),
    (r"\bc.peptide\b", ["general_labs"], 0.97),
    (r"\bHOMA.IR\b|homeostatic\s+model\s+assessment\b", ["general_labs"], 0.97),

    # Lipids — also cardiovascular
    (r"\btotal\s+cholesterol\b|\bcholesterol\b(?!\s+ester)", ["general_labs", "cardiovascular"], 0.95),
    (r"\bldl\b(?!.{0,5}cell)|low.density\s+lipoprotein\b", ["general_labs", "cardiovascular"], 0.95),
    (r"\bhdl\b|high.density\s+lipoprotein\b", ["general_labs", "cardiovascular"], 0.95),
    (r"\btriglycerides?\b|\btg\b(?!\s+score)", ["general_labs", "cardiovascular"], 0.95),
    (r"\bnon.hdl\s+cholesterol\b", ["general_labs", "cardiovascular"], 0.95),
    (r"\bvldl\b|very\s+low.density\s+lipoprotein\b", ["general_labs", "cardiovascular"], 0.95),

    # Urinalysis
    (r"\burinalysis\b|\bua\s+(?:complete|with|w\/)\b", ["general_labs"], 0.98),
    (r"\burine\s+(protein|glucose|creatinine|microalbumin|ketones|nitrites|leukocytes)\b", ["general_labs"], 0.97),
    (r"\bproteinuria\b|\bmicroalbuminuria\b|\balbuminuria\b", ["general_labs"], 0.97),
    (r"\burine\s+culture\b|\burine\s+microscopy\b", ["general_labs"], 0.97),

    # Hormone / endocrine (generic — more specific ones in gyn)
    (r"\bcortisol\b|\bampm\s+cortisol\b|\bdexamethasone\s+suppression\b", ["general_labs", "mental_health"], 0.88),
    (r"\bacth\b|adrenocorticotropic\b|\bcorticotropin\b", ["general_labs"], 0.97),
    (r"\bgrowth\s+hormone\b|\bigh\b|\bigf.1\b", ["general_labs"], 0.97),
    (r"\brenin\b|\baldosterone\b|\baldo.renin\s+ratio\b", ["general_labs"], 0.97),
    (r"\bparathyroid\s+hormone\b|\bpth\b", ["general_labs", "musculoskeletal"], 0.93),

    # Serology / microbiology (generic)
    (r"\bantigen\b|\bantibody\b|\bigg\b|\bigm\b|\biga\b|\bige\b", ["general_labs"], 0.85),
    (r"\bpcr\b(?!\s+score)|\bdna\s+test\b|\brna\s+test\b", ["general_labs"], 0.85),
    (r"\bculture\b.*\bsensitivity\b|sensitivity\b.*\bculture\b", ["general_labs"], 0.88),
    (r"\bcbc\b|complete\s+blood\s+count\b", ["general_labs"], 0.99),
    (r"\bcmp\b|comprehensive\s+metabolic\s+panel\b", ["general_labs"], 0.99),
    (r"\bbmp\b|basic\s+metabolic\s+panel\b", ["general_labs"], 0.99),

    # ════════════════════ CARDIOVASCULAR ═════════════════════════════════════

    (r"\btroponin\b|\bctni\b|\bctnt\b|\bhigh.sensitivity\s+troponin\b", ["cardiovascular"], 0.99),
    (r"\bbnp\b|\bpro.?bnp\b|\bnt.pro.?bnp\b|natriuretic\s+peptide\b", ["cardiovascular"], 0.99),
    (r"\bck.mb\b|\bcardiac\s+(enzyme|marker)\b", ["cardiovascular"], 0.99),
    (r"\bck\b|creatine\s+kinase\b(?!.*thyroid)", ["cardiovascular", "general_labs"], 0.90),
    (r"\bd.dimer\b", ["cardiovascular"], 0.97),
    (r"\bhomocysteine\b", ["cardiovascular"], 0.97),
    (r"\blipoprotein.?a\b|\blp\s*\(a\)\b", ["cardiovascular"], 0.99),
    (r"\bapolipoprotein\b|\bapob\b|\bapoa[12]?\b", ["cardiovascular"], 0.99),
    (r"\becg\b|\bekg\b|electrocardiograph|\belectrocardiogram\b", ["cardiovascular"], 0.99),
    (r"\bechocardiograph|\bechocardiogram\b|\becho\s+(?:of|result|report|shows)\b", ["cardiovascular"], 0.99),
    (r"\bcardiac\s+(?:mri|ct|cath|catheterization|stress)\b", ["cardiovascular"], 0.99),
    (r"\bstress\s+test\b|\btreadmill\s+test\b|\bnuclear\s+stress\b", ["cardiovascular"], 0.99),
    (r"\bangiograph\b|\bangiogram\b|coronary\s+angiograph\b", ["cardiovascular"], 0.99),
    (r"\bcoronary\s+(?:artery|ct|calcium)\b|\bcac\s+score\b|\bcalcium\s+score\b", ["cardiovascular"], 0.99),
    (r"\bblood\s+pressure\b|\bsystolic\b|\bdiastolic\b|\bhypertension\b", ["cardiovascular"], 0.97),
    (r"\bheart\s+rate\b|\bheart\s+rhythm\b|\bpulse\s+rate\b", ["cardiovascular"], 0.93),
    (r"\batrial\s+fibrill\b|\bafib\b|\barrhythmia\b|\bpalpitation\b", ["cardiovascular"], 0.99),
    (r"\bheart\s+failure\b|\bchf\b|\bcardiac\s+output\b|\befraction\b", ["cardiovascular"], 0.99),
    (r"\bejection\s+fraction\b|\bef\b\s*(?:=|:)", ["cardiovascular"], 0.99),
    (r"\bmyocardial\s+infar\b|\bheart\s+attack\b|\bstemi\b|\bnstemi\b", ["cardiovascular"], 0.99),
    (r"\bcoagulation\b|\binr\b|prothrombin\s+time\b|\bpt\b\s*(?:=|:)|\bptt\b|\baptt\b", ["cardiovascular", "general_labs"], 0.90),
    (r"\bwarfarin\b|\beliquis\b|\bxarelto\b|\bapixaban\b|\brivaroxaban\b|\bdabigatran\b", ["cardiovascular"], 0.99),
    (r"\bstatin\b|\batorvastatin\b|\brosuvastatin\b|\bsimvastatin\b|\bpravastatin\b", ["cardiovascular", "general_labs"], 0.95),
    (r"\bace\s+inhibitor\b|\blisinopril\b|\benalapril\b|\bbenazepril\b|\bperindopril\b", ["cardiovascular"], 0.99),
    (r"\bARB\b|\blosartan\b|\bvalsartan\b|\birbesartan\b|\bolmesartan\b", ["cardiovascular"], 0.99),
    (r"\bbeta.blocker\b|\bmetoprolol\b|\batenolol\b|\bcarvedilol\b|\bbisoprolol\b", ["cardiovascular"], 0.99),
    (r"\bdiuretic\b|\bfurosemide\b|\blasix\b|\bhydrochlorothiazide\b|\bspironolactone\b", ["cardiovascular", "general_labs"], 0.90),
    (r"\bcalcium\s+channel\s+blocker\b|\bamlodipine\b|\bnifedipine\b|\bdiltiazem\b|\bverapamil\b", ["cardiovascular"], 0.99),
    (r"\bnitrate\b|\bnitroglycerin\b|\bisosorbide\b", ["cardiovascular"], 0.99),
    (r"\bchest\s+(?:pain|tightness)\b|\bangina\b", ["cardiovascular"], 0.97),

    # ════════════════════ GYNECOLOGY & REPRODUCTIVE ═══════════════════════════

    (r"\bfsh\b|follicle.stimulating\s+hormone\b", ["gynecology"], 0.99),
    (r"\blh\b|luteinizing\s+hormone\b", ["gynecology"], 0.99),
    (r"\bamh\b|anti.mullerian\s+hormone\b|antimullerian\b", ["gynecology"], 0.99),
    (r"\bestradiol\b|\be2\b|\bestrogen\b|\be1\b|\bestriol\b|\bE3\b", ["gynecology"], 0.99),
    (r"\bprogesterone\b|\bprogestin\b|\bluteal\s+phase\b", ["gynecology"], 0.99),
    (r"\bprolactin\b|\bhyperprolactinemia\b", ["gynecology"], 0.99),
    (r"\bdhea.?s\b|dehydroepiandrosterone\b", ["gynecology", "general_labs"], 0.93),
    (r"\btestosterone\b(?!\s+propionate.*\bcancer)", ["gynecology", "general_labs"], 0.93),
    (r"\bshbg\b|sex\s+hormone.binding\s+globulin\b", ["gynecology"], 0.99),
    (r"\bhcg\b|human\s+chorionic\s+gonadotropin\b|\bpregnancy\s+test\b|\burine\s+hcg\b", ["gynecology"], 0.99),
    (r"\bpap\s+smear\b|cervical\s+cytology\b|papanicolaou\b|pap\s+test\b", ["gynecology"], 0.99),
    (r"\bhpv\b|human\s+papillomavirus\b", ["gynecology", "oncology"], 0.95),
    (r"\bmammograph\b|\bmammogram\b|\bBI.?RADS\b|\bbirads\b", ["gynecology", "oncology"], 0.95),
    (r"\bpelvic\s+(?:ultrasound|us|mri|exam)\b|\btransvaginal\b", ["gynecology"], 0.99),
    (r"\bovarian\b|\bovary\b|\buterus\b|\buterine\b|\bendometri\b", ["gynecology"], 0.99),
    (r"\bbrca[12]?\b|breast\s+cancer\s+gene\b", ["gynecology", "oncology"], 0.99),
    (r"\bca.?125\b|cancer\s+antigen\s+125\b", ["gynecology", "oncology"], 0.95),
    (r"\bhiv\b|\bchlamydia\b|\bgonorrhea\b|\bsyphilis\b|\bherpes\s+(?:simplex|zoster|hsv)\b", ["gynecology"], 0.95),
    (r"\bmenopause\b|\bperimenopause\b|\bpostmenopause\b", ["gynecology"], 0.99),
    (r"\bmenstrual\b|\bmenstruation\b|\bperiod\b|\bcycle\s+(?:day|length)\b", ["gynecology"], 0.98),
    (r"\bfertility\b|\binfertility\b|\bovarian\s+reserve\b|\bantral\s+follicle\b|\bIVF\b|\bIUI\b", ["gynecology"], 0.99),
    (r"\bcontraceptive\b|\bOCP\b|oral\s+contraceptive\b|\bIUD\b|\bimplant\b(?=.*\bcontra)", ["gynecology"], 0.99),
    (r"\bHRT\b|hormone\s+replacement\s+therapy\b|menopausal\s+hormone\s+therapy\b", ["gynecology"], 0.99),
    (r"\bcervical\b|\bcervix\b|\bvaginal\b|\bvulvar\b|\bvulva\b", ["gynecology"], 0.99),
    (r"\bchorionic\s+villus\b|\bamniocentesis\b|\bprenatal\s+screen\b|\bmaternal\s+serum\b", ["gynecology"], 0.99),
    (r"\bbirth\s+control\b|\bdepo.provera\b|\bnuva\s+ring\b|\bpatch\b(?=.*\bcontra)", ["gynecology"], 0.99),

    # ════════════════════ MUSCULOSKELETAL & ORTHOPEDICS ══════════════════════

    (r"\bdexa\b|bone\s+(?:density|mineral\s+density)\b|\bbmd\b", ["musculoskeletal"], 0.99),
    (r"\bt.score\b|\bz.score\b", ["musculoskeletal"], 0.99),
    (r"\bosteoporosis\b|\bosteopenia\b|\bosteomalacia\b|\bostoarthritis\b", ["musculoskeletal"], 0.99),
    (r"\bosteoarthritis\b|\brheumatoid\s+arthritis\b|\bpsoriatic\s+arthritis\b", ["musculoskeletal"], 0.99),
    (r"\bana\b|antinuclear\s+antibody\b", ["musculoskeletal"], 0.97),
    (r"\banti.?ds.?dna\b|anti.?ds\b.*\bdna\b|double.stranded\s+dna\b", ["musculoskeletal"], 0.99),
    (r"\banti.?ccp\b|anti.cyclic\s+citrullinated\s+peptide\b", ["musculoskeletal"], 0.99),
    (r"\brheumatoid\s+factor\b|\brf\b(?=\s*:|\s*=|\s*positive|\s*negative)", ["musculoskeletal"], 0.99),
    (r"\bscleroderma\b|\bscl.70\b|\banti.centromere\b", ["musculoskeletal"], 0.99),
    (r"\blupus\b|\bsle\b|systemic\s+lupus\b|\banti.smith\b|\banti.ro\b|\banti.la\b", ["musculoskeletal"], 0.99),
    (r"\bsjogren\b|\banti.ssa\b|\banti.ssb\b", ["musculoskeletal"], 0.99),
    (r"\bgout\b|\bpseudogout\b|\burate\s+crystals\b", ["musculoskeletal"], 0.99),
    (r"\bjoint\s+(?:x.ray|xray|mri|ct|aspiration|fluid)\b", ["musculoskeletal"], 0.99),
    (r"\bbone\s+(?:x.ray|xray|mri|ct|scan|age)\b", ["musculoskeletal"], 0.99),
    (r"\bspine\s+(?:mri|ct|x.ray|xray)\b|\bvertebr\b.*(?:mri|ct|x.ray)\b", ["musculoskeletal"], 0.99),
    (r"\btendon\b|\bligament\b|\bmeniscus\b|\brotator\s+cuff\b|\bcartilage\b", ["musculoskeletal"], 0.99),
    (r"\bfracture\b|\bdislocation\b|\bfracture\s+risk\b|\bfrax\b", ["musculoskeletal"], 0.98),
    (r"\borthopedic\b|\borthopaedic\b|\barthroplasty\b|\bjoint\s+replacement\b", ["musculoskeletal"], 0.99),
    (r"\bphysical\s+therapy\b|\bphysiotherapy\b|\bPT\s+evaluation\b", ["musculoskeletal"], 0.95),
    (r"\balkaline\s+phosphatase\b.*\bbone\b|\bbone\b.*\balkaline\s+phosphatase\b", ["musculoskeletal"], 0.95),
    (r"\bmethotrexate\b|\bhydroxychloroquine\b|\bplaquenil\b|\bleflunomide\b|\barava\b", ["musculoskeletal"], 0.99),
    (r"\bbiologic\b|\badalimumab\b|\bhumira\b|\betanercept\b|\benbrel\b|\binfliximab\b|\bremicade\b", ["musculoskeletal"], 0.99),

    # ════════════════════ ONCOLOGY ════════════════════════════════════════════

    (r"\bpsa\b|prostate.specific\s+antigen\b", ["oncology"], 0.99),
    (r"\bcea\b|carcinoembryonic\s+antigen\b", ["oncology", "gastroenterology"], 0.95),
    (r"\bca\s*19.?9\b|cancer\s+antigen\s+19.9\b", ["oncology", "gastroenterology"], 0.97),
    (r"\bca\s*15.?3\b|cancer\s+antigen\s+15.3\b", ["oncology"], 0.99),
    (r"\bca\s*27.?29\b", ["oncology"], 0.99),
    (r"\bafp\b|alpha.fetoprotein\b", ["oncology"], 0.99),
    (r"\bbeta.?hcg\b.*\boncol\b|\btumor\s+marker\b|\bcancer\s+marker\b", ["oncology"], 0.99),
    (r"\bmsi\b|microsatellite\s+instability\b|\bmlh1\b|\bmsh2\b|\bpms2\b|\bmsh6\b", ["oncology"], 0.99),
    (r"\bki.?67\b|proliferation\s+index\b|\bmitotic\s+rate\b|\bmitotic\s+index\b", ["oncology"], 0.99),
    (r"\btnm\b|\bpathologic\s+stag\b|\bclinical\s+stag\b", ["oncology"], 0.99),
    (r"\bcarcinoma\b|\badenocarcinoma\b|\bsquamous\s+cell\s+carcinoma\b|\bbasal\s+cell\b", ["oncology"], 0.99),
    (r"\blymphoma\b|\bleukemia\b|\bmelanoma\b|\bsarcoma\b|\bglioma\b|\bglioblastoma\b", ["oncology"], 0.99),
    (r"\badenocarcinoma\b|\bmucinous\b|\bpapillary\b(?=.*carcinoma|\s+thyroid|\s+serous)", ["oncology"], 0.99),
    (r"\bER\s*(?:positive|negative|\+|\-)\b|\bPR\s*(?:positive|negative|\+|\-)\b|\bHER2\b", ["oncology"], 0.99),
    (r"\bimmunohisto\w+\b|\bIHC\b|\bimmunophenotyp\b", ["oncology"], 0.97),
    (r"\bpet\s+(?:scan|ct)\b|positron\s+emission\b", ["oncology", "cardiovascular"], 0.90),
    (r"\bchemo(?:therapy)?\b|\bcyclophosphamide\b|\bdoxorubicin\b|\bpaclitaxel\b|\bcarboplatin\b", ["oncology"], 0.99),
    (r"\bimmunotherapy\b|\bcheckpoint\s+inhibitor\b|\bpembrolizumab\b|\bnivolumab\b|\batezolizumab\b", ["oncology"], 0.99),
    (r"\btargeted\s+therapy\b|\btyrosine\s+kinase\b|\bimatinib\b|\bgleevec\b|\berl\w+nib\b", ["oncology"], 0.99),
    (r"\bradiation\s+therapy\b|\bradiotherapy\b|\bXRT\b|\bIMRT\b|\bSBRT\b|\bgamma\s+knife\b", ["oncology"], 0.99),
    (r"\bpathology\s+report\b|\bpathologic\s+(?:diagnosis|finding)\b|\bhistolog\w+\b", ["oncology"], 0.95),
    (r"\bbiopsy\b|tissue\s+diagnosis\b|\bcytolog\w+\b", ["oncology"], 0.95),
    (r"\bmalignant\b|\bmalignancy\b|\bnot\s+malignant\b|\bno\s+malignancy\b", ["oncology"], 0.97),
    (r"\bmetastas\w+\b|\bdistant\s+spread\b|\bnodal\s+involvement\b|\blymph\s+node\s+metas\b", ["oncology"], 0.99),
    (r"\boncolog\w+\b|medical\s+oncolog\b|\bradiation\s+oncolog\b", ["oncology"], 0.99),

    # ════════════════════ MENTAL & BEHAVIORAL HEALTH ═════════════════════════

    (r"\bphq.?9\b|patient\s+health\s+questionnaire\b", ["mental_health"], 0.99),
    (r"\bgad.?7\b|generalized\s+anxiety\s+disorder\s+scale\b", ["mental_health"], 0.99),
    (r"\baudit\b.?c?\b|alcohol\s+use\s+disorder\s+identification\b", ["mental_health"], 0.99),
    (r"\bdast\b|drug\s+abuse\s+screening\s+test\b", ["mental_health"], 0.99),
    (r"\bmmse\b|mini.mental\s+state\s+exam\b", ["mental_health"], 0.99),
    (r"\bmoca\b|montreal\s+cognitive\s+assessment\b", ["mental_health"], 0.99),
    (r"\bpcl.?[5c]?\b|ptsd\s+check\b|post.traumatic\s+stress\s+disorder\b", ["mental_health"], 0.99),
    (r"\bepds\b|edinburgh\s+postnatal\s+depression\b", ["mental_health"], 0.99),
    (r"\bmdq\b|mood\s+disorder\s+questionnaire\b", ["mental_health"], 0.99),
    (r"\biss\b|insomnia\s+severity\s+index\b", ["mental_health"], 0.99),
    (r"\bess\b|epworth\s+sleepiness\s+scale\b", ["mental_health"], 0.99),
    (r"\bpolysomnograph\b|sleep\s+study\b|\bpsg\b(?=\s*:|\s*=|\s*result)", ["mental_health", "respiratory"], 0.92),
    (r"\bpsychiatric\s+(?:evaluation|consult|note)\b|\bpsychology\s+(?:eval|note)\b", ["mental_health"], 0.99),
    (r"\bdepression\b|\banxiety\b|\bpanic\s+disorder\b|\bOCD\b|\bOCDD\b", ["mental_health"], 0.97),
    (r"\bschizophrenia\b|\bbipolar\b|\bmania\b|\bpsychosis\b", ["mental_health"], 0.99),
    (r"\bADHD\b|attention\s+deficit\b|\bADD\b", ["mental_health"], 0.99),
    (r"\bantidepressant\b|\bSSRI\b|\bSNRI\b|\bsertraline\b|\bfluoxetine\b|\bescitalopram\b", ["mental_health"], 0.99),
    (r"\banziolytic\b|\bbenzodiazepine\b|\blorazepam\b|\bclonazepam\b|\balprazolam\b|\bdiazepam\b", ["mental_health"], 0.99),
    (r"\bantipsychotic\b|\brisperidone\b|\bolanzapine\b|\bquetiapine\b|\baripiprazole\b", ["mental_health"], 0.99),
    (r"\blithium\b|\bvalproate\b|\bdepakote\b|\blamotrigine\b|\blamictal\b", ["mental_health"], 0.99),
    (r"\bsleep\s+apnea\b|\bcpap\b|\bbipap\b|\bahi\b|apnea.hypopnea\s+index\b", ["mental_health", "respiratory"], 0.92),
    (r"\bcognitive\s+impairment\b|\bdementia\b|\balzheimer\b|\bmemory\s+loss\b", ["mental_health"], 0.99),
    (r"\bsubstance\s+use\b|\bsubstance\s+abuse\b|\baddiction\b|\bopioid\s+use\b", ["mental_health"], 0.99),

    # ════════════════════ RESPIRATORY & PULMONOLOGY ═══════════════════════════

    (r"\bfev1\b|forced\s+expiratory\s+volume\b", ["respiratory"], 0.99),
    (r"\bfvc\b|forced\s+vital\s+capacity\b", ["respiratory"], 0.99),
    (r"\bfev1\s*/\s*fvc\b|\bfev1.fvc\s+ratio\b", ["respiratory"], 0.99),
    (r"\bdlco\b|diffusion\s+(?:capacity|lung\s+co)\b|diffusing\s+capacity\b", ["respiratory"], 0.99),
    (r"\btlc\b|total\s+lung\s+capacity\b|\brv\b|residual\s+volume\b|\berv\b|expiratory\s+reserve\b", ["respiratory"], 0.99),
    (r"\bspirometry\b|pulmonary\s+function\s+(?:test|study)\b|\bPFT\b", ["respiratory"], 0.99),
    (r"\bpeak\s+(?:flow|expiratory|inspiratory)\b|\bPEFR\b|\bPIFR\b", ["respiratory"], 0.99),
    (r"\bO2\s+sat(?:uration)?\b|\bSpO2\b|pulse\s+ox(?:imetry)?\b", ["respiratory"], 0.99),
    (r"\bPaO2\b|\bPaCO2\b|\bABG\b|arterial\s+blood\s+gas\b", ["respiratory"], 0.99),
    (r"\balpha.?1\s+antitrypsin\b|\bA1AT\b|\bAAT\b", ["respiratory"], 0.99),
    (r"\bchest\s+(?:x.ray|xray|radiograph|ct|mri)\b", ["respiratory", "cardiovascular"], 0.88),
    (r"\bsputum\s+(?:culture|analysis|gram\s+stain)\b|\brespiratory\s+culture\b", ["respiratory"], 0.99),
    (r"\binhaler\b|\bbronchodilator\b|\bnebulizer\b|\bpreventer\b", ["respiratory"], 0.99),
    (r"\bsalbutamol\b|\balbuterol\b|\bsalmeterol\b|\bformoterol\b|\btiotropium\b", ["respiratory"], 0.99),
    (r"\bfluticasone\b|\bbudesonide\b|\bbeclomethasone\b|\bciclesonide\b", ["respiratory"], 0.99),
    (r"\bmontelukast\b|\bsingulair\b|\bleukotriene\b", ["respiratory"], 0.99),
    (r"\basthma\b|\bCOPD\b|chronic\s+obstructive\s+pulmonary\b|\bemphysema\b|\bbronchiectasis\b", ["respiratory"], 0.99),
    (r"\bpneumonia\b|\bbronchitis\b|\bpneumothorax\b|\bpleural\s+effusion\b|\bpleuritis\b", ["respiratory"], 0.99),
    (r"\binterstitial\s+lung\b|\bILD\b|\bpulmonary\s+fibrosis\b|\bipf\b", ["respiratory"], 0.99),
    (r"\bpulmonary\s+embolism\b|\bpe\b(?=\s+confirmed|\s+ruled\s+out|\s+diagnosis)", ["respiratory", "cardiovascular"], 0.95),
    (r"\bbronchoscopy\b|\bbronchoscop\w+\b", ["respiratory"], 0.99),
    (r"\blung\s+(?:biopsy|nodule|mass|lesion|cancer)\b", ["respiratory", "oncology"], 0.93),

    # ════════════════════ GASTROENTEROLOGY (GI) ═══════════════════════════════

    (r"\bh\.\s*pylori\b|helicobacter\s+pylori\b|\burea\s+breath\s+test\b", ["gastroenterology"], 0.99),
    (r"\bcalprotectin\b|fecal\s+calprotectin\b", ["gastroenterology"], 0.99),
    (r"\boccult\s+blood\b|\bFOBT\b|\bFIT\b|fecal\s+(?:immunochemical|occult)\s+test\b", ["gastroenterology"], 0.99),
    (r"\bcolonoscopy\b|\bcolonoscopic\b|\bfull\s+colonoscopy\b", ["gastroenterology"], 0.99),
    (r"\bendoscopy\b|\bEGD\b|esophagogastroduodenoscopy\b|\bgastroscopy\b|\bupper\s+GI\s+endoscopy\b", ["gastroenterology"], 0.99),
    (r"\bERCP\b|endoscopic\s+retrograde\s+cholangiopancreatography\b", ["gastroenterology"], 0.99),
    (r"\bhepatitis\s+[abcde]\b|\bhbsag\b|\banti.?hbs\b|\bhcv\s+antibody\b|\bhcv\s+rna\b|\bhbv\s+dna\b", ["gastroenterology"], 0.99),
    (r"\bliver\s+(?:biopsy|fibrosis|cirrhosis|function|disease)\b|\bfibrosis\s+score\b|\bfibroscan\b", ["gastroenterology"], 0.99),
    (r"\bcirrhosis\b|\bportal\s+hypertension\b|\bascites\b|\bvarices\b|\bhepatic\s+encephalopathy\b", ["gastroenterology"], 0.99),
    (r"\bceliac\s+disease\b|\btTG.?IgA\b|anti.gliadin\b|\bgluten\s+(?:intolerance|sensitivity)\b", ["gastroenterology"], 0.99),
    (r"\bstool\s+(?:culture|test|antigen|exam)\b|\bparasitology\b|\bova\s+and\s+parasite\b", ["gastroenterology"], 0.99),
    (r"\bcrohn\s+disease\b|\bulcerative\s+colitis\b|\bIBD\b|inflammatory\s+bowel\b", ["gastroenterology"], 0.99),
    (r"\bIBS\b|irritable\s+bowel\s+syndrome\b", ["gastroenterology"], 0.99),
    (r"\bcolorectal\s+(?:cancer|polyp|adenoma)\b|\bpolyp\b|\bcolonic\s+polyp\b", ["gastroenterology", "oncology"], 0.95),
    (r"\babdominal\s+(?:ultrasound|ct|mri|us)\b|\bhepatic\s+ultrasound\b", ["gastroenterology"], 0.97),
    (r"\bgallbladder\b|\bgallstone\b|\bbile\s+duct\b|\bcholecystitis\b|\bcholelithiasis\b|\bEBUS\b", ["gastroenterology"], 0.99),
    (r"\bpancrea\w+\b|\bpancreatitis\b|\bpancreatic\s+(?:enzyme|function|mass|duct)\b", ["gastroenterology"], 0.99),
    (r"\blipase\b|\bamylase\b", ["gastroenterology"], 0.99),
    (r"\bammonia\b(?!\s+level.*\bskin)", ["gastroenterology"], 0.97),
    (r"\bgerd\b|gastroesophageal\s+reflux\b|acid\s+reflux\b|\bPPI\b|proton\s+pump\s+inhibitor\b", ["gastroenterology"], 0.99),
    (r"\bomeprazole\b|\bpantoprazole\b|\blansoprazole\b|\besomeprazole\b|\bnexium\b|\bprilosec\b", ["gastroenterology"], 0.99),
    (r"\bsigmoidoscopy\b|flexible\s+sigmoidoscopy\b", ["gastroenterology"], 0.99),
    (r"\bappendix\b|\bappendectomy\b|\bappendicit\b", ["gastroenterology"], 0.99),
    (r"\bCEA\b(?=.*\bcolon\b|\bcolorectal\b|\bGI\b)", ["gastroenterology", "oncology"], 0.95),
]

# Compile once at import
_COMPILED = [
    (re.compile(p, re.IGNORECASE | re.MULTILINE), bins, conf)
    for p, bins, conf in _RULES
]

# ── Document type → default bin (context fallback) ────────────────────────────
# When an entity has no rule match, use document classification as weak signal.
_DOC_TYPE_FALLBACK: dict[str, list[str]] = {
    "lab_report":                    ["general_labs"],
    "imaging_report":                [],   # too ambiguous without body region
    "pathology_report":              ["oncology"],
    "procedure_summary":             [],
    "consultation_note":             [],
    "screening_result":              ["general_labs"],
    "medication_treatment_summary":  [],
}

# ── Entity field extraction ───────────────────────────────────────────────────

def _entity_text(entity: dict[str, Any]) -> str:
    """Build a searchable text string from an entity dict."""
    etype = entity.get("entity_type", "")
    parts: list[str] = []
    if etype == "patient_info":
        return ""   # no bin assignment for patient demographics
    elif etype == "test_result":
        parts = [
            entity.get("test_name") or "",
            entity.get("result_name") or "",
            entity.get("units") or "",
            entity.get("interpretation") or "",
        ]
    elif etype == "diagnosis":
        parts = [entity.get("value") or ""]
    elif etype == "score":
        parts = [
            entity.get("score_name") or "",
            entity.get("stage") or "",
            entity.get("interpretation") or "",
        ]
    elif etype == "procedure":
        parts = [
            entity.get("procedure_name") or "",
            entity.get("details") or "",
        ]
    elif etype == "medication":
        parts = [
            entity.get("name") or "",
            entity.get("frequency") or "",
            entity.get("route") or "",
        ]
    elif etype == "note":
        parts = [
            entity.get("section") or "",
            entity.get("text") or "",
        ]
    return " ".join(p for p in parts if p).strip()


def _entity_display_name(entity: dict[str, Any]) -> str:
    """Human-readable identifier for logging / output."""
    etype = entity.get("entity_type", "")
    if etype == "test_result":
        return entity.get("test_name") or entity.get("result_name") or "test"
    if etype == "patient_info":
        return f"patient_info:{entity.get('field','?')}"
    if etype == "diagnosis":
        val = entity.get("value") or ""
        return val[:60] or "diagnosis"
    if etype == "score":
        return entity.get("score_name") or "score"
    if etype == "procedure":
        return entity.get("procedure_name") or "procedure"
    if etype == "medication":
        return entity.get("name") or "medication"
    if etype == "note":
        return f"note:{entity.get('section','?')}"
    return etype


# ── Rule-based classification ─────────────────────────────────────────────────

def _apply_rules(text: str) -> tuple[list[str], float]:
    """
    Return (bins, best_confidence) for the given entity text using compiled rules.
    Multiple rules can match; the highest-confidence match per bin wins.
    """
    if not text:
        return [], 0.0

    bin_conf: dict[str, float] = {}
    for pattern, bins, conf in _COMPILED:
        if pattern.search(text):
            for b in bins:
                if conf > bin_conf.get(b, 0.0):
                    bin_conf[b] = conf

    if not bin_conf:
        return [], 0.0

    best_conf = max(bin_conf.values())
    return sorted(bin_conf.keys()), round(best_conf, 3)


# ── LLM fallback (batched) ────────────────────────────────────────────────────

def _classify_via_llm(
    items: list[tuple[int, str, str]],   # (original_index, entity_type, text)
) -> dict[int, tuple[list[str], float]]:
    """
    Send unclassified entities to Claude in one batch call.
    Returns {original_index: (bins, confidence)}.
    """
    import anthropic

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        log.warning("ANTHROPIC_API_KEY not set — skipping model-based classification")
        return {}

    bin_descriptions = "\n".join(
        f"  {slug}: {label}" for slug, label in BINS.items()
    )

    items_text = "\n".join(
        f'{i+1}. [{etype}] {text[:200]}'
        for i, (_, etype, text) in enumerate(items)
    )

    prompt = f"""\
You are a medical classifier. Assign each item below to one or more health bins.

Available bins:
{bin_descriptions}

Items:
{items_text}

Return a JSON array with one object per item, in the same order:
[
  {{"index": 1, "bins": ["bin_slug1"], "confidence": 0.9}},
  ...
]

Rules:
- bins: list of slug(s) from the available bins above (empty list if truly unclear)
- confidence: 0.0–1.0 reflecting certainty of classification
- Respond with ONLY valid JSON — no markdown, no explanation."""

    client = anthropic.Anthropic(api_key=api_key)
    try:
        msg = client.messages.create(
            model=MODEL,
            max_tokens=1024,
            temperature=0,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = msg.content[0].text.strip()
        if raw.startswith("```"):
            raw = "\n".join(raw.splitlines()[1:]).rstrip("`").strip()
        parsed = json.loads(raw)
    except Exception as exc:
        log.warning("LLM batch classify failed: %s", exc)
        return {}

    result: dict[int, tuple[list[str], float]] = {}
    for obj in parsed:
        item_num = obj.get("index", 0) - 1   # convert 1-based → 0-based list index
        if 0 <= item_num < len(items):
            orig_idx = items[item_num][0]
            raw_bins = [b for b in (obj.get("bins") or []) if b in BIN_SLUGS]
            conf = float(obj.get("confidence") or 0.6)
            result[orig_idx] = (raw_bins, round(conf, 3))

    return result


# ── Core mapping logic ────────────────────────────────────────────────────────

def map_entities(
    entities: list[dict[str, Any]],
    document_type: str = "unknown",
) -> list[EntityBinMapping]:
    """
    Map each entity to health bins using rules, then LLM for unmatched entities.
    Returns one EntityBinMapping per entity (including patient_info as skip).
    """
    mappings: list[EntityBinMapping] = []
    unclassified: list[tuple[int, str, str]] = []   # (entity_index, etype, text)

    for idx, entity in enumerate(entities):
        etype = entity.get("entity_type", "unknown")
        name  = _entity_display_name(entity)
        text  = _entity_text(entity)

        # patient_info — no bin assignment
        if etype == "patient_info" or not text:
            mappings.append(EntityBinMapping(
                entity_index=idx, entity_type=etype, entity_name=name,
                bins=[], confidence=1.0, method="skip",
            ))
            continue

        bins, conf = _apply_rules(text)

        if bins:
            mappings.append(EntityBinMapping(
                entity_index=idx, entity_type=etype, entity_name=name,
                bins=bins, confidence=conf, method="rule",
            ))
        else:
            # queue for LLM fallback
            mappings.append(None)   # placeholder, filled in below
            unclassified.append((idx, etype, text))

    # LLM batch call for unclassified
    llm_results: dict[int, tuple[list[str], float]] = {}
    if unclassified:
        log.info("Sending %d unclassified entities to Claude for bin mapping…", len(unclassified))
        llm_results = _classify_via_llm(unclassified)

    # Fill in placeholders
    fallback_bins = _DOC_TYPE_FALLBACK.get(document_type, [])
    placeholder_count = 0
    for i, m in enumerate(mappings):
        if m is not None:
            continue
        idx, etype, text = unclassified[placeholder_count]
        placeholder_count += 1
        name = _entity_display_name(entities[idx])

        if idx in llm_results:
            bins, conf = llm_results[idx]
            method = "model"
        elif fallback_bins:
            bins, conf, method = fallback_bins.copy(), 0.5, "context_fallback"
        else:
            bins, conf, method = [], 0.0, "unclassified"

        mappings[i] = EntityBinMapping(
            entity_index=idx, entity_type=etype, entity_name=name,
            bins=bins, confidence=conf, method=method,
        )

    return mappings


# ── Document-level aggregation ────────────────────────────────────────────────

def aggregate_bins(
    mappings: list[EntityBinMapping],
) -> tuple[list[str], float, dict[str, int]]:
    """
    Returns (assigned_bins, classification_confidence, method_summary).
    assigned_bins: sorted list of unique bin slugs across all entities.
    classification_confidence: weighted mean of per-entity confidences (skips patient_info).
    method_summary: count per method string.
    """
    all_bins: set[str] = set()
    total_conf = 0.0
    count = 0
    method_counts: dict[str, int] = {}

    for m in mappings:
        method_counts[m.method] = method_counts.get(m.method, 0) + 1
        if m.method == "skip":
            continue
        all_bins.update(m.bins)
        total_conf += m.confidence
        count += 1

    doc_conf = round(total_conf / count, 3) if count > 0 else 0.0
    return sorted(all_bins), doc_conf, method_counts


# ── Public API ────────────────────────────────────────────────────────────────

def map_document(
    entities: list[dict[str, Any]],
    document_type: str = "unknown",
) -> BinAssignmentResult:
    """
    Full bin-mapping pipeline for a list of structured entities.
    Combines rule layer + optional LLM layer.
    """
    if not entities:
        return BinAssignmentResult(
            assigned_bins=[], entity_bin_map=[],
            classification_confidence=0.0,
            method_summary={"unclassified": 0},
        )

    mappings = map_entities(entities, document_type)
    assigned_bins, doc_conf, method_summary = aggregate_bins(mappings)

    log.info(
        "Bin mapping: bins=%s  conf=%.2f  methods=%s",
        assigned_bins, doc_conf, method_summary,
    )

    return BinAssignmentResult(
        assigned_bins=assigned_bins,
        entity_bin_map=mappings,
        classification_confidence=doc_conf,
        method_summary=method_summary,
    )


# ── DB helpers ─────────────────────────────────────────────────────────────────

def _get_extraction(document_id: str) -> tuple[list[dict], str] | None:
    """Fetch structured_entities and document_type for the given document."""
    from workers.db import get_conn
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT me.structured_entities, COALESCE(dc.document_type, 'unknown')
                FROM   medical_extractions me
                LEFT JOIN document_classifications dc USING (document_id)
                WHERE  me.document_id = %s
                LIMIT  1
                """,
                (document_id,),
            )
            row = cur.fetchone()
            if not row:
                return None
            entities_raw = row[0]
            # psycopg2 returns JSONB as a Python object already
            if isinstance(entities_raw, str):
                entities_raw = json.loads(entities_raw)
            return entities_raw, str(row[1])


def persist_bin_assignment(document_id: str, result: BinAssignmentResult) -> None:
    """Upsert bin_assignments row."""
    from workers.db import get_conn

    entity_map_json = json.dumps([
        {
            "entity_index": m.entity_index,
            "entity_type":  m.entity_type,
            "entity_name":  m.entity_name,
            "bins":         m.bins,
            "confidence":   m.confidence,
            "method":       m.method,
        }
        for m in result.entity_bin_map
    ])

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO bin_assignments
                    (document_id, assigned_bins, entity_bin_map,
                     classification_confidence, method_summary)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (document_id) DO UPDATE SET
                    assigned_bins             = EXCLUDED.assigned_bins,
                    entity_bin_map            = EXCLUDED.entity_bin_map,
                    classification_confidence = EXCLUDED.classification_confidence,
                    method_summary            = EXCLUDED.method_summary,
                    assigned_at               = NOW()
                """,
                (
                    document_id,
                    result.assigned_bins,
                    entity_map_json,
                    result.classification_confidence,
                    json.dumps(result.method_summary),
                ),
            )
    log.info(
        "Bin assignment persisted: bins=%s  entities=%d",
        result.assigned_bins, len(result.entity_bin_map),
    )


def assign_bins(document_id: str) -> BinAssignmentResult:
    """
    Full pipeline:
      1. Fetch extraction entities + document type from DB
      2. Run rule + model mapping
      3. Persist result
      4. Return BinAssignmentResult
    """
    row = _get_extraction(document_id)
    if row is None:
        raise ValueError(f"No medical extraction found for document_id={document_id}")

    entities, document_type = row
    log.info(
        "Assigning bins for document %s (%d entities, type=%s)",
        document_id, len(entities), document_type,
    )

    result = map_document(entities, document_type)
    persist_bin_assignment(document_id, result)
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
        description="Assign health category bins to a document's extracted entities."
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("document_id", nargs="?", help="UUID of document in DB")
    group.add_argument(
        "--json",
        metavar="JSON",
        help='JSON string with {structured_entities: [...], document_type: "..."}',
    )
    args = parser.parse_args()

    try:
        if args.json:
            payload = json.loads(args.json)
            entities = payload.get("structured_entities", [])
            doc_type = payload.get("document_type", "unknown")
            result = map_document(entities, doc_type)
        else:
            result = assign_bins(args.document_id)

        print(json.dumps(result.to_dict(), indent=2))

    except Exception as exc:
        import traceback
        log.error("Bin mapping failed: %s", exc)
        traceback.print_exc()
        print(json.dumps({"ok": False, "error": str(exc)}))
        sys.exit(1)
