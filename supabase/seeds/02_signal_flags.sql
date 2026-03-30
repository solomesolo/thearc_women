-- ============================================================
-- Seed: derived_signal_flags
-- All 22 signal codes with full rule_json and confidence rules.
-- ============================================================

delete from derived_signal_flags where approved = true and version = 1;

insert into derived_signal_flags (
  signal_code, signal_name, domain,
  source_variables, trigger_logic, rule_json,
  min_trigger_score, default_strength, confidence_rule,
  supporting_conditions, exclusion_conditions, life_stage_modifier,
  rule_hint, safe_language_notes,
  approved, version
) values

-- ── SIG_SLEEP_DISRUPTION ────────────────────────────────────
(
  'SIG_SLEEP_DISRUPTION',
  'Sleep Disruption',
  'sleep',
  '["sleep_quality", "night_waking", "unrefreshing_sleep"]',
  'Fires when sleep quality is rated 2 or below AND at least one of night waking or unrefreshing sleep is above baseline. Captures a pattern of poor sleep architecture rather than isolated poor nights.',
  '{
    "all_of": [
      {"lte": ["sleep_quality", 2]},
      {"any_of": [
        {"gte": ["night_waking", 2]},
        {"gte": ["unrefreshing_sleep", 2]}
      ]}
    ]
  }',
  2.0,
  'moderate',
  '{
    "high_threshold": {"all_of": [{"lte": ["sleep_quality", 1]}, {"gte": ["night_waking", 3]}, {"gte": ["unrefreshing_sleep", 2]}]},
    "strong_threshold": {"all_of": [{"lte": ["sleep_quality", 2]}, {"gte": ["night_waking", 2]}]},
    "medium_threshold": {"all_of": [{"lte": ["sleep_quality", 2]}, {"gte": ["unrefreshing_sleep", 2]}]},
    "moderate_threshold": {"lte": ["sleep_quality", 2]}
  }',
  '{"any_of": [{"gte": ["fatigue_freq", 3]}, {"equals": ["fatigue_timing", "Morning"]}]}',
  null,
  '{"perimenopause": {"threshold_delta": -0.5, "strength_delta": 0.5}, "postpartum": {"threshold_delta": -0.5, "strength_delta": 0.5}}',
  'Requires both quality and quantity disruption markers to avoid false positives from single-night variation.',
  'Use pattern language. Avoid diagnosing insomnia. Example: "Sleep disruption may be affecting how you recover overnight."',
  true, 1
),

-- ── SIG_SLEEP_LATENCY_PATTERN ────────────────────────────────
(
  'SIG_SLEEP_LATENCY_PATTERN',
  'Sleep Onset Latency Pattern',
  'sleep',
  '["sleep_latency", "stress_level", "sleep_quality"]',
  'Fires when sleep latency is 30 minutes or longer (ordinal >= 3). Elevated stress amplifies. Captures difficulty initiating sleep rather than maintaining it.',
  '{
    "all_of": [
      {"gte": ["sleep_latency", 3]}
    ]
  }',
  1.0,
  'mild',
  '{
    "high_threshold": {"all_of": [{"gte": ["sleep_latency", 4]}, {"gte": ["stress_level", 4]}]},
    "strong_threshold": {"all_of": [{"gte": ["sleep_latency", 3]}, {"gte": ["stress_level", 3]}]},
    "medium_threshold": {"gte": ["sleep_latency", 3]},
    "moderate_threshold": {"gte": ["sleep_latency", 2]}
  }',
  '{"gte": ["stress_level", 3]}',
  '{"lte": ["sleep_latency", 1]}',
  null,
  'Sleep onset latency >= 30 min is the clinical threshold for concern.',
  'Use pattern language. Example: "It may be taking longer than expected to fall asleep."',
  true, 1
),

-- ── SIG_NIGHT_WAKING_PATTERN ─────────────────────────────────
(
  'SIG_NIGHT_WAKING_PATTERN',
  'Night Waking Pattern',
  'sleep',
  '["night_waking", "sleep_quality", "unrefreshing_sleep"]',
  'Fires when night waking is reported most nights or every night. Captures fragmented sleep architecture as a standalone pattern, separate from sleep quality score.',
  '{
    "gte": ["night_waking", 2]
  }',
  1.0,
  'mild',
  '{
    "high_threshold": {"all_of": [{"gte": ["night_waking", 3]}, {"gte": ["unrefreshing_sleep", 2]}]},
    "strong_threshold": {"gte": ["night_waking", 3]},
    "medium_threshold": {"all_of": [{"gte": ["night_waking", 2]}, {"gte": ["unrefreshing_sleep", 1]}]},
    "moderate_threshold": {"gte": ["night_waking", 2]}
  }',
  '{"gte": ["unrefreshing_sleep", 1]}',
  '{"equals": ["night_waking", 0]}',
  '{"perimenopause": {"threshold_delta": -0.5, "strength_delta": 0.5}, "postpartum": {"threshold_delta": -0.5, "strength_delta": 0.5}}',
  'Night waking frequency is an independent sleep quality indicator beyond subjective rating.',
  'Example: "Waking during the night may be reducing the quality of your sleep overall."',
  true, 1
),

-- ── SIG_UNREFRESHING_SLEEP ───────────────────────────────────
(
  'SIG_UNREFRESHING_SLEEP',
  'Unrefreshing Sleep',
  'sleep',
  '["unrefreshing_sleep", "fatigue_timing", "fatigue_freq"]',
  'Fires when sleep is reported as often or almost always unrefreshing. Captures the subjective restorative quality deficiency, often co-presenting with morning fatigue.',
  '{
    "gte": ["unrefreshing_sleep", 2]
  }',
  1.0,
  'moderate',
  '{
    "high_threshold": {"all_of": [{"gte": ["unrefreshing_sleep", 3]}, {"gte": ["fatigue_freq", 3]}]},
    "strong_threshold": {"all_of": [{"gte": ["unrefreshing_sleep", 2]}, {"equals": ["fatigue_timing", "Morning"]}]},
    "medium_threshold": {"all_of": [{"gte": ["unrefreshing_sleep", 2]}, {"gte": ["fatigue_freq", 2]}]},
    "moderate_threshold": {"gte": ["unrefreshing_sleep", 2]}
  }',
  '{"any_of": [{"equals": ["fatigue_timing", "Morning"]}, {"gte": ["fatigue_freq", 3]}]}',
  null,
  '{"postpartum": {"threshold_delta": -0.5, "strength_delta": 0.5}}',
  'Unrefreshing sleep often co-presents with HPA dysregulation and iron deficiency.',
  'Example: "Sleep may not be feeling as restorative as you''d expect."',
  true, 1
),

-- ── SIG_STRESS_LOAD ──────────────────────────────────────────
(
  'SIG_STRESS_LOAD',
  'Stress Load',
  'stress',
  '["stress_level", "stress_type", "fatigue_freq"]',
  'Fires when subjective stress level is rated 3 or above (moderate to very high). Multi-domain stress type amplifies. Reflects total perceived stress burden.',
  '{
    "gte": ["stress_level", 3]
  }',
  1.5,
  'moderate',
  '{
    "high_threshold": {"all_of": [{"gte": ["stress_level", 5]}, {"equals": ["stress_type", "Multiple"]}]},
    "strong_threshold": {"all_of": [{"gte": ["stress_level", 4]}, {"any_of": [{"equals": ["stress_type", "Multiple"]}, {"equals": ["stress_type", "Physical"]}]}]},
    "medium_threshold": {"gte": ["stress_level", 4]},
    "moderate_threshold": {"gte": ["stress_level", 3]}
  }',
  '{"any_of": [{"equals": ["stress_type", "Multiple"]}, {"gte": ["fatigue_freq", 2]}]}',
  null,
  '{"perimenopause": {"threshold_delta": -0.5, "strength_delta": 0.5}}',
  'Stress level is the primary axis. stress_type = Multiple elevates to strong.',
  'Use load language not diagnosis. Example: "Stress appears to be a meaningful part of the current pattern."',
  true, 1
),

-- ── SIG_STRESS_SENSITIVITY ───────────────────────────────────
(
  'SIG_STRESS_SENSITIVITY',
  'Stress Sensitivity',
  'stress',
  '["stress_level", "sleep_quality", "energy_crash", "fatigue_sev"]',
  'Fires when moderate stress (>= 3) co-occurs with amplified downstream effects: disrupted sleep, energy crashes, or high fatigue severity. Captures nervous system sensitivity beyond raw load.',
  '{
    "all_of": [
      {"gte": ["stress_level", 3]},
      {"any_of": [
        {"all_of": [{"lte": ["sleep_quality", 2]}, {"gte": ["fatigue_sev", 3]}]},
        {"all_of": [{"gte": ["energy_crash", 1]}, {"gte": ["fatigue_freq", 2]}]}
      ]}
    ]
  }',
  2.0,
  'mild',
  '{
    "high_threshold": {"all_of": [{"gte": ["stress_level", 4]}, {"lte": ["sleep_quality", 1]}, {"gte": ["energy_crash", 2]}]},
    "strong_threshold": {"all_of": [{"gte": ["stress_level", 3]}, {"lte": ["sleep_quality", 2]}, {"gte": ["fatigue_sev", 4]}]},
    "medium_threshold": {"all_of": [{"gte": ["stress_level", 3]}, {"gte": ["energy_crash", 1]}]},
    "moderate_threshold": {"all_of": [{"gte": ["stress_level", 3]}, {"gte": ["fatigue_sev", 3]}]}
  }',
  null,
  null,
  null,
  'Distinguishes sensitivity (amplified effect) from load (input level).',
  'Use sensitivity framing. Example: "Your system may be responding more strongly to stress than usual."',
  true, 1
),

-- ── SIG_RECOVERY_STRAIN ──────────────────────────────────────
(
  'SIG_RECOVERY_STRAIN',
  'Recovery Strain',
  'recovery',
  '["exercise_tolerance", "unrefreshing_sleep", "fatigue_freq", "stress_level"]',
  'Fires when exercise tolerance is poor or very poor, or when unrefreshing sleep combines with high fatigue and stress. Reflects the body''s inability to fully recover between demands.',
  '{
    "any_of": [
      {"gte": ["exercise_tolerance", 3]},
      {"all_of": [
        {"gte": ["unrefreshing_sleep", 2]},
        {"gte": ["fatigue_freq", 3]},
        {"gte": ["stress_level", 3]}
      ]}
    ]
  }',
  1.5,
  'moderate',
  '{
    "high_threshold": {"all_of": [{"gte": ["exercise_tolerance", 4]}, {"gte": ["unrefreshing_sleep", 2]}, {"gte": ["fatigue_freq", 3]}]},
    "strong_threshold": {"all_of": [{"gte": ["exercise_tolerance", 3]}, {"gte": ["fatigue_freq", 3]}]},
    "medium_threshold": {"any_of": [{"gte": ["exercise_tolerance", 3]}, {"all_of": [{"gte": ["unrefreshing_sleep", 2]}, {"gte": ["fatigue_freq", 2]}]}]},
    "moderate_threshold": {"gte": ["exercise_tolerance", 3]}
  }',
  '{"gte": ["stress_level", 3]}',
  null,
  '{"postpartum": {"threshold_delta": -0.5, "strength_delta": 1.0}}',
  'Exercise tolerance is a proxy for systemic recovery capacity.',
  'Example: "Recovery between demands may need more time and support right now."',
  true, 1
),

-- ── SIG_ENERGY_VARIABILITY ───────────────────────────────────
(
  'SIG_ENERGY_VARIABILITY',
  'Energy Variability',
  'energy',
  '["energy_crash", "fatigue_timing", "fatigue_freq"]',
  'Fires when energy crashes are Sometimes or Often AND fatigue timing varies or is all-day. Captures fluctuating energy rather than flat persistent fatigue.',
  '{
    "all_of": [
      {"gte": ["energy_crash", 1]},
      {"any_of": [
        {"equals": ["fatigue_timing", "Varies"]},
        {"equals": ["fatigue_timing", "All day"]},
        {"gte": ["fatigue_freq", 2]}
      ]}
    ]
  }',
  1.0,
  'mild',
  '{
    "high_threshold": {"all_of": [{"equals": ["energy_crash", 2]}, {"equals": ["fatigue_timing", "Varies"]}, {"gte": ["fatigue_freq", 3]}]},
    "strong_threshold": {"all_of": [{"gte": ["energy_crash", 1]}, {"gte": ["fatigue_freq", 3]}, {"equals": ["fatigue_timing", "Varies"]}]},
    "medium_threshold": {"all_of": [{"gte": ["energy_crash", 1]}, {"gte": ["fatigue_freq", 2]}]},
    "moderate_threshold": {"gte": ["energy_crash", 1]}
  }',
  null,
  null,
  null,
  'Variability pattern differs from persistent fatigue in actionability — targets stabilization strategies.',
  'Example: "Energy levels appear to vary more than expected through the day."',
  true, 1
),

-- ── SIG_PERSISTENT_FATIGUE ───────────────────────────────────
(
  'SIG_PERSISTENT_FATIGUE',
  'Persistent Fatigue',
  'energy',
  '["fatigue_freq", "fatigue_sev", "fatigue_timing", "unrefreshing_sleep"]',
  'Fires when fatigue is reported most days or daily at moderate severity (>= 3) and is not confined to a single time window. Captures sustained systemic fatigue rather than situational tiredness.',
  '{
    "all_of": [
      {"gte": ["fatigue_freq", 3]},
      {"gte": ["fatigue_sev", 3]}
    ]
  }',
  2.0,
  'moderate',
  '{
    "high_threshold": {"all_of": [{"gte": ["fatigue_freq", 4]}, {"gte": ["fatigue_sev", 4]}, {"gte": ["unrefreshing_sleep", 2]}]},
    "strong_threshold": {"all_of": [{"gte": ["fatigue_freq", 3]}, {"gte": ["fatigue_sev", 4]}]},
    "medium_threshold": {"all_of": [{"gte": ["fatigue_freq", 3]}, {"gte": ["fatigue_sev", 3]}]},
    "moderate_threshold": {"gte": ["fatigue_freq", 3]}
  }',
  '{"any_of": [{"equals": ["fatigue_timing", "All day"]}, {"gte": ["unrefreshing_sleep", 2]}]}',
  null,
  '{"perimenopause": {"threshold_delta": -0.5, "strength_delta": 0.5}, "postpartum": {"threshold_delta": -0.5, "strength_delta": 0.5}}',
  'Frequency >= most_days AND severity >= 3 is the dual-axis trigger for persistent fatigue.',
  'Example: "Fatigue appears to be a consistent part of the day-to-day pattern."',
  true, 1
),

-- ── SIG_BLOOD_SUGAR_INSTABILITY ──────────────────────────────
(
  'SIG_BLOOD_SUGAR_INSTABILITY',
  'Blood Sugar Instability',
  'metabolic',
  '["crash_post_meal", "sugar_cravings", "energy_crash", "lab_glucose_value", "lab_hba1c_value"]',
  'Fires when post-meal crashes are reported alongside elevated sugar cravings, or when lab glucose/HbA1c values are elevated. Reflects glycemic regulatory dysfunction pattern.',
  '{
    "any_of": [
      {"all_of": [
        {"equals": ["crash_post_meal", true]},
        {"gte": ["sugar_cravings", 3]}
      ]},
      {"all_of": [
        {"gte": ["energy_crash", 1]},
        {"gte": ["sugar_cravings", 3]},
        {"gte": ["crash_post_meal", 1]}
      ]},
      {"gte": ["lab_glucose_value", 100]},
      {"gte": ["lab_hba1c_value", 5.7]}
    ]
  }',
  2.0,
  'moderate',
  '{
    "high_threshold": {"any_of": [{"gte": ["lab_glucose_value", 126]}, {"gte": ["lab_hba1c_value", 6.5]}, {"all_of": [{"equals": ["crash_post_meal", true]}, {"gte": ["sugar_cravings", 4]}, {"gte": ["energy_crash", 2]}]}]},
    "strong_threshold": {"any_of": [{"gte": ["lab_glucose_value", 100]}, {"gte": ["lab_hba1c_value", 5.7]}, {"all_of": [{"equals": ["crash_post_meal", true]}, {"gte": ["sugar_cravings", 3]}]}]},
    "medium_threshold": {"all_of": [{"gte": ["sugar_cravings", 3]}, {"gte": ["energy_crash", 1]}]},
    "moderate_threshold": {"gte": ["sugar_cravings", 3]}
  }',
  '{"any_of": [{"exists": "lab_glucose_value"}, {"exists": "lab_insulin_value"}]}',
  null,
  null,
  'Lab values are high-specificity; symptom cluster alone is moderate-confidence.',
  'Use instability framing not diabetes language. Example: "Blood sugar regulation may be part of the energy pattern here."',
  true, 1
),

-- ── SIG_METABOLIC_VARIABILITY ────────────────────────────────
(
  'SIG_METABOLIC_VARIABILITY',
  'Metabolic Variability',
  'metabolic',
  '["sugar_cravings", "energy_crash", "fatigue_timing", "crash_post_meal"]',
  'Fires when energy crashes and sugar cravings co-occur without confirmed post-meal crash. Captures broader metabolic rhythm disruption that may not be purely glycemic.',
  '{
    "all_of": [
      {"gte": ["sugar_cravings", 2]},
      {"gte": ["energy_crash", 1]},
      {"not": {"equals": ["crash_post_meal", true]}}
    ]
  }',
  1.0,
  'mild',
  '{
    "high_threshold": {"all_of": [{"gte": ["sugar_cravings", 4]}, {"gte": ["energy_crash", 2]}, {"equals": ["fatigue_timing", "Varies"]}]},
    "strong_threshold": {"all_of": [{"gte": ["sugar_cravings", 3]}, {"gte": ["energy_crash", 2]}]},
    "medium_threshold": {"all_of": [{"gte": ["sugar_cravings", 2]}, {"gte": ["energy_crash", 1]}]},
    "moderate_threshold": {"gte": ["sugar_cravings", 2]}
  }',
  null,
  '{"signal_active": "SIG_BLOOD_SUGAR_INSTABILITY"}',
  null,
  'Use as secondary signal when SIG_BLOOD_SUGAR_INSTABILITY does not fire.',
  'Example: "Metabolic rhythm may be contributing to energy variability throughout the day."',
  true, 1
),

-- ── SIG_HORMONAL_VARIABILITY ─────────────────────────────────
(
  'SIG_HORMONAL_VARIABILITY',
  'Hormonal Variability',
  'hormonal',
  '["hormone_symptoms", "cycle_regularity", "skin_hair_changes", "fatigue_freq"]',
  'Fires when hormone symptoms are moderate or significant, or when cycle irregularity co-occurs with notable skin/hair changes. Captures broad hormonal fluctuation pattern.',
  '{
    "any_of": [
      {"gte": ["hormone_symptoms", 2]},
      {"all_of": [
        {"gte": ["cycle_regularity", 1]},
        {"gte": ["skin_hair_changes", 2]}
      ]}
    ]
  }',
  1.5,
  'moderate',
  '{
    "high_threshold": {"all_of": [{"gte": ["hormone_symptoms", 3]}, {"gte": ["cycle_regularity", 2]}]},
    "strong_threshold": {"all_of": [{"gte": ["hormone_symptoms", 2]}, {"gte": ["cycle_regularity", 1]}]},
    "medium_threshold": {"gte": ["hormone_symptoms", 2]},
    "moderate_threshold": {"any_of": [{"gte": ["hormone_symptoms", 1]}, {"gte": ["cycle_regularity", 2]}]}
  }',
  '{"gte": ["skin_hair_changes", 1]}',
  null,
  '{"perimenopause": {"threshold_delta": -0.5, "strength_delta": 0.5}, "reproductive_26_35": {"threshold_delta": 0, "strength_delta": 0}}',
  'Hormonal variability is a pattern signal, not a diagnosis.',
  'Example: "Hormonal shifts may be contributing to some of what you''re noticing."',
  true, 1
),

-- ── SIG_CYCLE_LINKED_PATTERN ─────────────────────────────────
(
  'SIG_CYCLE_LINKED_PATTERN',
  'Cycle-Linked Pattern',
  'hormonal',
  '["cycle_linked_symptoms", "cycle_regularity", "hormone_symptoms"]',
  'Fires when cycle-linked symptoms are moderate or significant. Specifically tracks the cyclical hormonal influence axis, distinct from general hormonal variability.',
  '{
    "all_of": [
      {"gte": ["cycle_linked_symptoms", 2]},
      {"not": {"equals": ["cycle_regularity", "No period"]}}
    ]
  }',
  1.5,
  'moderate',
  '{
    "high_threshold": {"all_of": [{"gte": ["cycle_linked_symptoms", 3]}, {"gte": ["cycle_regularity", 1]}]},
    "strong_threshold": {"all_of": [{"gte": ["cycle_linked_symptoms", 2]}, {"gte": ["hormone_symptoms", 2]}]},
    "medium_threshold": {"gte": ["cycle_linked_symptoms", 2]},
    "moderate_threshold": {"gte": ["cycle_linked_symptoms", 1]}
  }',
  '{"gte": ["hormone_symptoms", 1]}',
  '{"equals": ["cycle_regularity", "No period"]}',
  '{"reproductive_18_25": {"threshold_delta": -0.5, "strength_delta": 0.5}, "reproductive_26_35": {"threshold_delta": -0.5, "strength_delta": 0.5}}',
  'Excludes post-menopausal users where cycle-linked framing is not applicable.',
  'Example: "Symptoms may be following a cyclical pattern linked to your hormonal rhythm."',
  true, 1
),

-- ── SIG_GUT_DISRUPTION ───────────────────────────────────────
(
  'SIG_GUT_DISRUPTION',
  'Gut Disruption',
  'gut',
  '["gut_symptoms", "bloating", "bowel_changes"]',
  'Fires when gut symptoms are reported weekly or more often, or when moderate-to-severe bloating combines with bowel changes. Captures a chronic gut disruption pattern.',
  '{
    "any_of": [
      {"gte": ["gut_symptoms", 2]},
      {"all_of": [
        {"gte": ["bloating", 2]},
        {"gte": ["bowel_changes", 1]}
      ]}
    ]
  }',
  1.5,
  'moderate',
  '{
    "high_threshold": {"all_of": [{"gte": ["gut_symptoms", 4]}, {"gte": ["bloating", 2]}]},
    "strong_threshold": {"all_of": [{"gte": ["gut_symptoms", 3]}, {"gte": ["bloating", 1]}]},
    "medium_threshold": {"any_of": [{"gte": ["gut_symptoms", 2]}, {"all_of": [{"gte": ["bloating", 2]}, {"gte": ["bowel_changes", 1]}]}]},
    "moderate_threshold": {"gte": ["gut_symptoms", 2]}
  }',
  '{"gte": ["bloating", 1]}',
  null,
  '{"postpartum": {"threshold_delta": -0.5, "strength_delta": 0.5}}',
  'Weekly+ symptoms is the threshold for pattern vs. incidental.',
  'Example: "Gut discomfort appears to be a recurring part of your experience."',
  true, 1
),

-- ── SIG_APPETITE_INSTABILITY ─────────────────────────────────
(
  'SIG_APPETITE_INSTABILITY',
  'Appetite Instability',
  'metabolic',
  '["sugar_cravings", "crash_post_meal", "energy_crash", "gut_symptoms"]',
  'Fires when sugar cravings are elevated and gut symptoms are present, or when post-meal crashes suggest irregular appetite regulation. Distinct from pure blood sugar instability.',
  '{
    "all_of": [
      {"gte": ["sugar_cravings", 3]},
      {"any_of": [
        {"gte": ["gut_symptoms", 2]},
        {"gte": ["crash_post_meal", 1]}
      ]}
    ]
  }',
  1.5,
  'mild',
  '{
    "high_threshold": {"all_of": [{"gte": ["sugar_cravings", 4]}, {"gte": ["gut_symptoms", 3]}, {"gte": ["crash_post_meal", 1]}]},
    "strong_threshold": {"all_of": [{"gte": ["sugar_cravings", 3]}, {"gte": ["gut_symptoms", 2]}]},
    "medium_threshold": {"all_of": [{"gte": ["sugar_cravings", 3]}, {"gte": ["crash_post_meal", 1]}]},
    "moderate_threshold": {"gte": ["sugar_cravings", 3]}
  }',
  null,
  null,
  null,
  'Targets appetite regulation axis, especially gut-brain connection.',
  'Example: "Appetite and hunger cues may be less stable than usual right now."',
  true, 1
),

-- ── SIG_MICRONUTRIENT_PATTERN ────────────────────────────────
(
  'SIG_MICRONUTRIENT_PATTERN',
  'Micronutrient Pattern',
  'metabolic',
  '["fatigue_freq", "fatigue_sev", "skin_hair_changes", "exercise_tolerance"]',
  'Fires when persistent fatigue combines with skin/hair changes or poor exercise tolerance, in the absence of a clear metabolic or hormonal driver. Raises the possibility of micronutrient insufficiency.',
  '{
    "all_of": [
      {"gte": ["fatigue_freq", 2]},
      {"gte": ["fatigue_sev", 2]},
      {"any_of": [
        {"gte": ["skin_hair_changes", 2]},
        {"gte": ["exercise_tolerance", 3]}
      ]}
    ]
  }',
  1.5,
  'mild',
  '{
    "high_threshold": {"all_of": [{"gte": ["fatigue_freq", 3]}, {"gte": ["skin_hair_changes", 2]}, {"gte": ["exercise_tolerance", 3]}]},
    "strong_threshold": {"all_of": [{"gte": ["fatigue_freq", 3]}, {"gte": ["fatigue_sev", 3]}, {"gte": ["skin_hair_changes", 1]}]},
    "medium_threshold": {"all_of": [{"gte": ["fatigue_freq", 2]}, {"gte": ["skin_hair_changes", 2]}]},
    "moderate_threshold": {"all_of": [{"gte": ["fatigue_freq", 2]}, {"gte": ["fatigue_sev", 2]}]}
  }',
  '{"gte": ["skin_hair_changes", 1]}',
  null,
  '{"perimenopause": {"threshold_delta": -0.5, "strength_delta": 0.5}, "postpartum": {"threshold_delta": -0.5, "strength_delta": 0.5}}',
  'Micronutrient pattern is a soft signal — requires clinical confirmation. Do not name specific deficiencies.',
  'Example: "Some patterns here are worth discussing with your clinician — micronutrient levels may be relevant."',
  true, 1
),

-- ── SIG_SKIN_HAIR_PATTERN ────────────────────────────────────
(
  'SIG_SKIN_HAIR_PATTERN',
  'Skin and Hair Pattern',
  'hormonal',
  '["skin_hair_changes", "hormone_symptoms", "cycle_regularity"]',
  'Fires when skin or hair changes are moderate or significant. These may reflect hormonal, nutritional, or inflammatory influences and warrant contextual interpretation.',
  '{
    "gte": ["skin_hair_changes", 2]
  }',
  1.0,
  'mild',
  '{
    "high_threshold": {"all_of": [{"gte": ["skin_hair_changes", 3]}, {"gte": ["hormone_symptoms", 2]}]},
    "strong_threshold": {"all_of": [{"gte": ["skin_hair_changes", 2]}, {"gte": ["hormone_symptoms", 1]}]},
    "medium_threshold": {"all_of": [{"gte": ["skin_hair_changes", 2]}, {"gte": ["cycle_regularity", 1]}]},
    "moderate_threshold": {"gte": ["skin_hair_changes", 2]}
  }',
  '{"gte": ["hormone_symptoms", 1]}',
  null,
  '{"perimenopause": {"threshold_delta": -0.5, "strength_delta": 0.5}}',
  'Skin/hair changes are a downstream signal, not a primary diagnosis marker.',
  'Example: "Changes in skin or hair may reflect a shift worth paying attention to."',
  true, 1
),

-- ── SIG_CARDIO_STRAIN_CONTEXT ────────────────────────────────
(
  'SIG_CARDIO_STRAIN_CONTEXT',
  'Cardiovascular Strain Context',
  'recovery',
  '["exercise_tolerance", "fatigue_freq", "stress_level", "age_years"]',
  'Fires when exercise tolerance is poor or very poor alongside elevated stress and fatigue. Provides contextual cardiovascular strain signal — not a diagnostic marker.',
  '{
    "all_of": [
      {"gte": ["exercise_tolerance", 3]},
      {"any_of": [
        {"gte": ["stress_level", 3]},
        {"gte": ["fatigue_freq", 3]}
      ]}
    ]
  }',
  1.5,
  'mild',
  '{
    "high_threshold": {"all_of": [{"gte": ["exercise_tolerance", 4]}, {"gte": ["stress_level", 4]}, {"gte": ["fatigue_freq", 3]}]},
    "strong_threshold": {"all_of": [{"gte": ["exercise_tolerance", 3]}, {"gte": ["stress_level", 3]}, {"gte": ["fatigue_freq", 3]}]},
    "medium_threshold": {"all_of": [{"gte": ["exercise_tolerance", 3]}, {"gte": ["stress_level", 3]}]},
    "moderate_threshold": {"gte": ["exercise_tolerance", 3]}
  }',
  null,
  null,
  '{"perimenopause": {"threshold_delta": -0.5, "strength_delta": 0.5}, "menopause": {"threshold_delta": -0.5, "strength_delta": 0.5}}',
  'Cardiovascular context only — low specificity without lab data.',
  'Use recovery language not cardiac language. Example: "Your cardiovascular system may benefit from reduced strain right now."',
  true, 1
),

-- ── SIG_CONTRADICTORY_PATTERN ────────────────────────────────
(
  'SIG_CONTRADICTORY_PATTERN',
  'Contradictory Pattern',
  'meta',
  '["sleep_quality", "fatigue_freq", "exercise_tolerance", "stress_level"]',
  'Fires when multiple signals are in tension — for example, good sleep quality but high fatigue, or low stress but poor exercise tolerance. Indicates the survey data alone may not explain the pattern.',
  '{
    "any_of": [
      {"all_of": [
        {"gte": ["sleep_quality", 4]},
        {"gte": ["fatigue_freq", 3]}
      ]},
      {"all_of": [
        {"lte": ["stress_level", 1]},
        {"gte": ["exercise_tolerance", 3]},
        {"gte": ["fatigue_freq", 3]}
      ]}
    ]
  }',
  1.0,
  'mild',
  '{
    "high_threshold": {"all_of": [{"gte": ["sleep_quality", 4]}, {"gte": ["fatigue_freq", 4]}, {"lte": ["stress_level", 2]}]},
    "strong_threshold": {"all_of": [{"gte": ["sleep_quality", 4]}, {"gte": ["fatigue_freq", 3]}]},
    "medium_threshold": {"any_of": [{"all_of": [{"gte": ["sleep_quality", 3]}, {"gte": ["fatigue_freq", 3]}]}, {"all_of": [{"lte": ["stress_level", 1]}, {"gte": ["exercise_tolerance", 3]}]}]},
    "moderate_threshold": {"gte": ["fatigue_freq", 3]}
  }',
  null,
  null,
  null,
  'Contradictory pattern is a meta-signal for interpreter uncertainty. Use to recommend lab review.',
  'Example: "Some patterns here appear to be pulling in different directions — this may be worth exploring further."',
  true, 1
),

-- ── SIG_IMPROVING_TREND ──────────────────────────────────────
(
  'SIG_IMPROVING_TREND',
  'Improving Trend',
  'meta',
  '["sleep_quality", "fatigue_freq", "stress_level", "exercise_tolerance"]',
  'Fires when the profile shows low-moderate signals across multiple axes with no strong disruption markers. Indicates a trajectory toward stability. Soft signal; may be used for positive reinforcement framing.',
  '{
    "all_of": [
      {"gte": ["sleep_quality", 3]},
      {"lte": ["fatigue_freq", 2]},
      {"lte": ["stress_level", 2]},
      {"lte": ["exercise_tolerance", 2]}
    ]
  }',
  0.5,
  'mild',
  '{
    "high_threshold": {"all_of": [{"gte": ["sleep_quality", 4]}, {"lte": ["fatigue_freq", 1]}, {"lte": ["stress_level", 1]}]},
    "strong_threshold": {"all_of": [{"gte": ["sleep_quality", 4]}, {"lte": ["fatigue_freq", 2]}, {"lte": ["stress_level", 2]}]},
    "medium_threshold": {"all_of": [{"gte": ["sleep_quality", 3]}, {"lte": ["fatigue_freq", 2]}]},
    "moderate_threshold": {"all_of": [{"gte": ["sleep_quality", 3]}, {"lte": ["stress_level", 2]}]}
  }',
  null,
  '{"any_of": [{"signal_active": "SIG_PERSISTENT_FATIGUE"}, {"signal_active": "SIG_STRESS_LOAD"}, {"signal_active": "SIG_SLEEP_DISRUPTION"}]}',
  null,
  'Suppressed if any major disruption signal is active.',
  'Example: "Overall patterns appear to be moving in a positive direction."',
  true, 1
),

-- ── SIG_DECLINING_TREND ──────────────────────────────────────
(
  'SIG_DECLINING_TREND',
  'Declining Trend',
  'meta',
  '["sleep_quality", "fatigue_freq", "fatigue_sev", "exercise_tolerance", "stress_level"]',
  'Fires when three or more major signal axes are simultaneously elevated. Indicates a potential declining trajectory requiring attention across multiple systems.',
  '{
    "all_of": [
      {"gte": ["fatigue_freq", 3]},
      {"gte": ["fatigue_sev", 3]},
      {"any_of": [
        {"lte": ["sleep_quality", 2]},
        {"gte": ["stress_level", 4]},
        {"gte": ["exercise_tolerance", 3]}
      ]}
    ]
  }',
  2.5,
  'moderate',
  '{
    "high_threshold": {"all_of": [{"gte": ["fatigue_freq", 4]}, {"gte": ["fatigue_sev", 4]}, {"lte": ["sleep_quality", 1]}, {"gte": ["stress_level", 4]}]},
    "strong_threshold": {"all_of": [{"gte": ["fatigue_freq", 3]}, {"gte": ["fatigue_sev", 4]}, {"any_of": [{"lte": ["sleep_quality", 2]}, {"gte": ["stress_level", 4]}]}]},
    "medium_threshold": {"all_of": [{"gte": ["fatigue_freq", 3]}, {"gte": ["fatigue_sev", 3]}, {"lte": ["sleep_quality", 2]}]},
    "moderate_threshold": {"all_of": [{"gte": ["fatigue_freq", 3]}, {"gte": ["fatigue_sev", 3]}]}
  }',
  null,
  '{"signal_active": "SIG_IMPROVING_TREND"}',
  null,
  'Use supportive, not alarmist language.',
  'Example: "Several areas appear to need support at the same time — a more integrated approach may help."',
  true, 1
),

-- ── SIG_LOW_CONTEXT_PATTERN ──────────────────────────────────
(
  'SIG_LOW_CONTEXT_PATTERN',
  'Low Context Pattern',
  'meta',
  '["fatigue_freq", "sleep_quality", "stress_level", "gut_symptoms", "hormone_symptoms"]',
  'Fires when all primary signal axes are low or absent. Indicates insufficient symptom context to draw strong conclusions. Used to trigger a baseline/healthy framing rather than a pathological one.',
  '{
    "all_of": [
      {"lte": ["fatigue_freq", 1]},
      {"gte": ["sleep_quality", 4]},
      {"lte": ["stress_level", 2]},
      {"lte": ["gut_symptoms", 1]},
      {"lte": ["hormone_symptoms", 1]}
    ]
  }',
  0.0,
  'mild',
  '{
    "high_threshold": {"all_of": [{"equals": ["fatigue_freq", 0]}, {"gte": ["sleep_quality", 5]}, {"lte": ["stress_level", 1]}]},
    "strong_threshold": {"all_of": [{"lte": ["fatigue_freq", 1]}, {"gte": ["sleep_quality", 4]}, {"lte": ["stress_level", 1]}]},
    "medium_threshold": {"all_of": [{"lte": ["fatigue_freq", 1]}, {"gte": ["sleep_quality", 4]}, {"lte": ["stress_level", 2]}]},
    "moderate_threshold": {"all_of": [{"lte": ["fatigue_freq", 1]}, {"gte": ["sleep_quality", 3]}]}
  }',
  null,
  '{"any_of": [{"signal_active": "SIG_PERSISTENT_FATIGUE"}, {"signal_active": "SIG_SLEEP_DISRUPTION"}, {"signal_active": "SIG_GUT_DISRUPTION"}, {"signal_active": "SIG_STRESS_LOAD"}]}',
  null,
  'Suppressed if any major signal fires. Enables HERO_BASELINE routing.',
  'Example: "Overall patterns look relatively settled right now."',
  true, 1
);
