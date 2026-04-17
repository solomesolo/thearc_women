-- ============================================================
-- Seed: key_area_state_resolution_rules
--       body_system_resolution_rules
--       hero_resolution_rules
-- ============================================================

delete from key_area_state_resolution_rules where approved = true and version = 1;
delete from body_system_resolution_rules where approved = true and version = 1;
delete from hero_resolution_rules where approved = true and version = 1;


-- ════════════════════════════════════════════════════════════
-- key_area_state_resolution_rules
-- At least 2-3 states per key area (highest rule_priority wins)
-- State codes reference key_area_states content table.
-- ════════════════════════════════════════════════════════════

insert into key_area_state_resolution_rules (
  key_area_code, state_code, rule_name, rule_priority,
  required_signals, supporting_signals, excluded_signals,
  minimum_total_weight, minimum_confidence, life_stage_scope,
  resolution_logic, rule_json,
  approved, version
) values

-- ── sleep ────────────────────────────────────────────────────
('sleep', 'attention_sleep_disruption', 'Sleep: Active Disruption', 100,
 '["SIG_SLEEP_DISRUPTION"]',
 '["SIG_NIGHT_WAKING_PATTERN", "SIG_UNREFRESHING_SLEEP", "SIG_SLEEP_LATENCY_PATTERN"]',
 '[]',
 2.0, 'medium', 'all',
 'Primary sleep disruption signal is active. At least one structural indicator (night waking, latency, unrefreshing) should co-present to reach this state.',
 '{"signal_active": "SIG_SLEEP_DISRUPTION"}',
 true, 1),

('sleep', 'attention_sleep_latency', 'Sleep: Onset Difficulty', 80,
 '["SIG_SLEEP_LATENCY_PATTERN"]',
 '["SIG_STRESS_LOAD", "SIG_SLEEP_DISRUPTION"]',
 '["SIG_SLEEP_DISRUPTION"]',
 1.0, 'medium', 'all',
 'Delayed sleep onset without broader disruption pattern. Suppressed if full disruption is already active to avoid redundant messaging.',
 '{"all_of": [{"signal_active": "SIG_SLEEP_LATENCY_PATTERN"}, {"not": {"signal_active": "SIG_SLEEP_DISRUPTION"}}]}',
 true, 1),

('sleep', 'attention_unrefreshing', 'Sleep: Unrestorative Quality', 85,
 '["SIG_UNREFRESHING_SLEEP"]',
 '["SIG_RECOVERY_STRAIN", "SIG_PERSISTENT_FATIGUE"]',
 '["SIG_SLEEP_DISRUPTION"]',
 1.5, 'medium', 'all',
 'Unrefreshing sleep present as standalone without full disruption. Often co-presents with recovery strain.',
 '{"all_of": [{"signal_active": "SIG_UNREFRESHING_SLEEP"}, {"not": {"signal_active": "SIG_SLEEP_DISRUPTION"}}]}',
 true, 1),

('sleep', 'stable', 'Sleep: Stable Baseline', 10,
 '[]',
 '["SIG_IMPROVING_TREND", "SIG_LOW_CONTEXT_PATTERN"]',
 '["SIG_SLEEP_DISRUPTION", "SIG_NIGHT_WAKING_PATTERN", "SIG_UNREFRESHING_SLEEP"]',
 0.0, 'low', 'all',
 'Default stable state. No active sleep disruption signals.',
 '{"none_of": ["SIG_SLEEP_DISRUPTION", "SIG_NIGHT_WAKING_PATTERN", "SIG_UNREFRESHING_SLEEP"]}',
 true, 1),

-- ── stress ───────────────────────────────────────────────────
('stress', 'attention_stress_high', 'Stress: High Load', 100,
 '["SIG_STRESS_LOAD"]',
 '["SIG_STRESS_SENSITIVITY", "SIG_SLEEP_LATENCY_PATTERN"]',
 '[]',
 2.0, 'medium', 'all',
 'Stress load signal active at or above trigger threshold.',
 '{"signal_active": "SIG_STRESS_LOAD"}',
 true, 1),

('stress', 'attention_stress_sensitive', 'Stress: Heightened Sensitivity', 80,
 '["SIG_STRESS_SENSITIVITY"]',
 '["SIG_STRESS_LOAD", "SIG_SLEEP_DISRUPTION"]',
 '["SIG_STRESS_LOAD"]',
 1.5, 'medium', 'all',
 'Sensitivity pattern present with amplified downstream effects, but raw load below threshold.',
 '{"all_of": [{"signal_active": "SIG_STRESS_SENSITIVITY"}, {"not": {"signal_active": "SIG_STRESS_LOAD"}}]}',
 true, 1),

('stress', 'stable', 'Stress: Stable', 10,
 '[]',
 '["SIG_IMPROVING_TREND"]',
 '["SIG_STRESS_LOAD", "SIG_STRESS_SENSITIVITY"]',
 0.0, 'low', 'all',
 'No active stress signals. Default stable state.',
 null,
 true, 1),

-- ── energy ───────────────────────────────────────────────────
('energy', 'attention_blood_sugar', 'Energy: Blood Sugar Pattern', 100,
 '["SIG_BLOOD_SUGAR_INSTABILITY"]',
 '["SIG_ENERGY_VARIABILITY", "SIG_APPETITE_INSTABILITY"]',
 '[]',
 2.0, 'medium', 'all',
 'Blood sugar instability is the primary energy driver. Highest priority for energy area.',
 '{"signal_active": "SIG_BLOOD_SUGAR_INSTABILITY"}',
 true, 1),

('energy', 'attention_persistent_fatigue', 'Energy: Persistent Fatigue', 90,
 '["SIG_PERSISTENT_FATIGUE"]',
 '["SIG_MICRONUTRIENT_PATTERN", "SIG_UNREFRESHING_SLEEP"]',
 '["SIG_BLOOD_SUGAR_INSTABILITY"]',
 2.0, 'medium', 'all',
 'Persistent fatigue is the primary energy driver when blood sugar is not the leading pattern.',
 '{"all_of": [{"signal_active": "SIG_PERSISTENT_FATIGUE"}, {"not": {"signal_active": "SIG_BLOOD_SUGAR_INSTABILITY"}}]}',
 true, 1),

('energy', 'attention_variable_energy', 'Energy: Variable Pattern', 75,
 '["SIG_ENERGY_VARIABILITY"]',
 '["SIG_METABOLIC_VARIABILITY", "SIG_STRESS_LOAD"]',
 '["SIG_BLOOD_SUGAR_INSTABILITY", "SIG_PERSISTENT_FATIGUE"]',
 1.0, 'medium', 'all',
 'Energy variability without a dominant fatigue or blood sugar signal.',
 '{"all_of": [{"signal_active": "SIG_ENERGY_VARIABILITY"}, {"none_of": ["SIG_BLOOD_SUGAR_INSTABILITY", "SIG_PERSISTENT_FATIGUE"]}]}',
 true, 1),

('energy', 'stable', 'Energy: Stable', 10,
 '[]',
 '["SIG_IMPROVING_TREND", "SIG_LOW_CONTEXT_PATTERN"]',
 '["SIG_BLOOD_SUGAR_INSTABILITY", "SIG_PERSISTENT_FATIGUE", "SIG_ENERGY_VARIABILITY"]',
 0.0, 'low', 'all',
 'No active energy disruption signals.',
 null,
 true, 1),

-- ── recovery ─────────────────────────────────────────────────
('recovery', 'attention_recovery_strain', 'Recovery: Active Strain', 100,
 '["SIG_RECOVERY_STRAIN"]',
 '["SIG_UNREFRESHING_SLEEP", "SIG_STRESS_LOAD"]',
 '[]',
 2.0, 'medium', 'all',
 'Recovery strain signal active. Systemic recovery capacity reduced.',
 '{"signal_active": "SIG_RECOVERY_STRAIN"}',
 true, 1),

('recovery', 'attention_cardio_context', 'Recovery: Cardiovascular Context', 80,
 '["SIG_CARDIO_STRAIN_CONTEXT"]',
 '["SIG_RECOVERY_STRAIN", "SIG_PERSISTENT_FATIGUE"]',
 '["SIG_RECOVERY_STRAIN"]',
 1.5, 'medium', 'all',
 'Cardiovascular strain context present without full recovery strain. Lower specificity — flagged as contextual.',
 '{"all_of": [{"signal_active": "SIG_CARDIO_STRAIN_CONTEXT"}, {"not": {"signal_active": "SIG_RECOVERY_STRAIN"}}]}',
 true, 1),

('recovery', 'stable', 'Recovery: Stable', 10,
 '[]',
 '["SIG_IMPROVING_TREND"]',
 '["SIG_RECOVERY_STRAIN", "SIG_CARDIO_STRAIN_CONTEXT"]',
 0.0, 'low', 'all',
 'No active recovery strain signals.',
 null,
 true, 1),

-- ── hormones ─────────────────────────────────────────────────
('hormones', 'attention_hormonal_variability', 'Hormones: Active Variability', 100,
 '["SIG_HORMONAL_VARIABILITY"]',
 '["SIG_CYCLE_LINKED_PATTERN", "SIG_SKIN_HAIR_PATTERN"]',
 '[]',
 2.0, 'medium', 'all',
 'Hormonal variability signal active. Broad hormonal pattern present.',
 '{"signal_active": "SIG_HORMONAL_VARIABILITY"}',
 true, 1),

('hormones', 'attention_cycle_linked', 'Hormones: Cycle-Linked Pattern', 85,
 '["SIG_CYCLE_LINKED_PATTERN"]',
 '["SIG_HORMONAL_VARIABILITY"]',
 '["SIG_HORMONAL_VARIABILITY"]',
 1.5, 'medium', 'all',
 'Cycle-linked pattern without broader hormonal variability signal.',
 '{"all_of": [{"signal_active": "SIG_CYCLE_LINKED_PATTERN"}, {"not": {"signal_active": "SIG_HORMONAL_VARIABILITY"}}]}',
 true, 1),

('hormones', 'stable', 'Hormones: Stable', 10,
 '[]',
 '["SIG_LOW_CONTEXT_PATTERN"]',
 '["SIG_HORMONAL_VARIABILITY", "SIG_CYCLE_LINKED_PATTERN"]',
 0.0, 'low', 'all',
 'No active hormonal pattern signals.',
 null,
 true, 1),

-- ── cycle ────────────────────────────────────────────────────
('cycle', 'attention_cycle_pattern', 'Cycle: Active Pattern', 100,
 '["SIG_CYCLE_LINKED_PATTERN"]',
 '["SIG_HORMONAL_VARIABILITY"]',
 '[]',
 1.5, 'medium', 'all',
 'Cycle-linked symptom pattern is active.',
 '{"signal_active": "SIG_CYCLE_LINKED_PATTERN"}',
 true, 1),

('cycle', 'stable', 'Cycle: Stable or Not Applicable', 10,
 '[]',
 '[]',
 '["SIG_CYCLE_LINKED_PATTERN"]',
 0.0, 'low', 'all',
 'No cycle-linked pattern active. May be stable, post-menopausal, or not applicable.',
 null,
 true, 1),

-- ── metabolism ───────────────────────────────────────────────
('metabolism', 'attention_blood_sugar', 'Metabolism: Blood Sugar Instability', 100,
 '["SIG_BLOOD_SUGAR_INSTABILITY"]',
 '["SIG_METABOLIC_VARIABILITY", "SIG_APPETITE_INSTABILITY"]',
 '[]',
 2.0, 'medium', 'all',
 'Blood sugar instability is the primary metabolic signal.',
 '{"signal_active": "SIG_BLOOD_SUGAR_INSTABILITY"}',
 true, 1),

('metabolism', 'attention_metabolic_variability', 'Metabolism: Variability Pattern', 80,
 '["SIG_METABOLIC_VARIABILITY"]',
 '["SIG_APPETITE_INSTABILITY", "SIG_ENERGY_VARIABILITY"]',
 '["SIG_BLOOD_SUGAR_INSTABILITY"]',
 1.0, 'medium', 'all',
 'Metabolic variability present without confirmed blood sugar instability.',
 '{"all_of": [{"signal_active": "SIG_METABOLIC_VARIABILITY"}, {"not": {"signal_active": "SIG_BLOOD_SUGAR_INSTABILITY"}}]}',
 true, 1),

('metabolism', 'stable', 'Metabolism: Stable', 10,
 '[]',
 '[]',
 '["SIG_BLOOD_SUGAR_INSTABILITY", "SIG_METABOLIC_VARIABILITY"]',
 0.0, 'low', 'all',
 'No active metabolic signals.',
 null,
 true, 1),

-- ── nutrition ────────────────────────────────────────────────
('nutrition', 'attention_micronutrient', 'Nutrition: Micronutrient Pattern', 100,
 '["SIG_MICRONUTRIENT_PATTERN"]',
 '["SIG_PERSISTENT_FATIGUE", "SIG_SKIN_HAIR_PATTERN"]',
 '[]',
 1.5, 'medium', 'all',
 'Micronutrient pattern signal active. Nutritional insufficiency may be a contributing factor.',
 '{"signal_active": "SIG_MICRONUTRIENT_PATTERN"}',
 true, 1),

('nutrition', 'attention_appetite', 'Nutrition: Appetite Instability', 80,
 '["SIG_APPETITE_INSTABILITY"]',
 '["SIG_GUT_DISRUPTION", "SIG_METABOLIC_VARIABILITY"]',
 '["SIG_MICRONUTRIENT_PATTERN"]',
 1.0, 'medium', 'all',
 'Appetite regulation instability without confirmed micronutrient pattern.',
 '{"all_of": [{"signal_active": "SIG_APPETITE_INSTABILITY"}, {"not": {"signal_active": "SIG_MICRONUTRIENT_PATTERN"}}]}',
 true, 1),

('nutrition', 'stable', 'Nutrition: Stable', 10,
 '[]',
 '[]',
 '["SIG_MICRONUTRIENT_PATTERN", "SIG_APPETITE_INSTABILITY"]',
 0.0, 'low', 'all',
 'No active nutrition signals.',
 null,
 true, 1),

-- ── cardiovascular ───────────────────────────────────────────
('cardiovascular', 'attention_cardio_context', 'Cardiovascular: Strain Context', 100,
 '["SIG_CARDIO_STRAIN_CONTEXT"]',
 '["SIG_RECOVERY_STRAIN", "SIG_STRESS_LOAD"]',
 '[]',
 1.5, 'medium', 'all',
 'Cardiovascular strain context signal active. Low specificity; contextual only.',
 '{"signal_active": "SIG_CARDIO_STRAIN_CONTEXT"}',
 true, 1),

('cardiovascular', 'stable', 'Cardiovascular: Stable', 10,
 '[]',
 '[]',
 '["SIG_CARDIO_STRAIN_CONTEXT"]',
 0.0, 'low', 'all',
 'No active cardiovascular signals.',
 null,
 true, 1),

-- ── gut ──────────────────────────────────────────────────────
('gut', 'attention_gut_disruption', 'Gut: Active Disruption', 100,
 '["SIG_GUT_DISRUPTION"]',
 '["SIG_APPETITE_INSTABILITY", "SIG_METABOLIC_VARIABILITY"]',
 '[]',
 2.0, 'medium', 'all',
 'Gut disruption signal active. Chronic pattern present.',
 '{"signal_active": "SIG_GUT_DISRUPTION"}',
 true, 1),

('gut', 'attention_appetite', 'Gut: Appetite and Digestion Pattern', 75,
 '["SIG_APPETITE_INSTABILITY"]',
 '["SIG_GUT_DISRUPTION"]',
 '["SIG_GUT_DISRUPTION"]',
 1.0, 'medium', 'all',
 'Appetite instability without full gut disruption pattern.',
 '{"all_of": [{"signal_active": "SIG_APPETITE_INSTABILITY"}, {"not": {"signal_active": "SIG_GUT_DISRUPTION"}}]}',
 true, 1),

('gut', 'stable', 'Gut: Stable', 10,
 '[]',
 '[]',
 '["SIG_GUT_DISRUPTION", "SIG_APPETITE_INSTABILITY"]',
 0.0, 'low', 'all',
 'No active gut signals.',
 null,
 true, 1),

-- ── skin_hair ────────────────────────────────────────────────
('skin_hair', 'attention_skin_hair', 'Skin/Hair: Active Pattern', 100,
 '["SIG_SKIN_HAIR_PATTERN"]',
 '["SIG_HORMONAL_VARIABILITY", "SIG_MICRONUTRIENT_PATTERN"]',
 '[]',
 1.0, 'medium', 'all',
 'Skin/hair pattern signal active. May reflect hormonal or nutritional changes.',
 '{"signal_active": "SIG_SKIN_HAIR_PATTERN"}',
 true, 1),

('skin_hair', 'stable', 'Skin/Hair: Stable', 10,
 '[]',
 '[]',
 '["SIG_SKIN_HAIR_PATTERN"]',
 0.0, 'low', 'all',
 'No active skin/hair signals.',
 null,
 true, 1);


-- ════════════════════════════════════════════════════════════
-- body_system_resolution_rules
-- needs_attention and stable for each body system
-- ════════════════════════════════════════════════════════════

insert into body_system_resolution_rules (
  body_system_code, state_code, rule_name, rule_priority,
  required_signals, supporting_signals, excluded_signals,
  minimum_total_weight, minimum_confidence, life_stage_scope,
  resolution_logic, rule_json,
  approved, version
) values

-- SYS_SLEEP
('SYS_SLEEP', 'needs_attention', 'Sleep System: Needs Attention', 100,
 '["SIG_SLEEP_DISRUPTION"]',
 '["SIG_NIGHT_WAKING_PATTERN", "SIG_UNREFRESHING_SLEEP", "SIG_SLEEP_LATENCY_PATTERN"]',
 '[]',
 2.0, 'medium', 'all',
 'Primary sleep disruption signal active.',
 '{"signal_active": "SIG_SLEEP_DISRUPTION"}',
 true, 1),

('SYS_SLEEP', 'variable', 'Sleep System: Variable Pattern', 70,
 '[]',
 '["SIG_SLEEP_LATENCY_PATTERN", "SIG_NIGHT_WAKING_PATTERN", "SIG_UNREFRESHING_SLEEP"]',
 '["SIG_SLEEP_DISRUPTION"]',
 1.0, 'low', 'all',
 'Sub-threshold sleep pattern signals present; not yet full disruption.',
 '{"all_of": [{"none_of": ["SIG_SLEEP_DISRUPTION"]}, {"any_of": [{"signal_active": "SIG_SLEEP_LATENCY_PATTERN"}, {"signal_active": "SIG_NIGHT_WAKING_PATTERN"}, {"signal_active": "SIG_UNREFRESHING_SLEEP"}]}]}',
 true, 1),

('SYS_SLEEP', 'stable', 'Sleep System: Stable', 10,
 '[]', '[]', '["SIG_SLEEP_DISRUPTION", "SIG_NIGHT_WAKING_PATTERN", "SIG_UNREFRESHING_SLEEP"]',
 0.0, 'low', 'all', 'No sleep signals active.', null, true, 1),

-- SYS_STRESS
('SYS_STRESS', 'needs_attention', 'Stress System: Needs Attention', 100,
 '["SIG_STRESS_LOAD"]',
 '["SIG_STRESS_SENSITIVITY", "SIG_RECOVERY_STRAIN"]',
 '[]',
 2.0, 'medium', 'all',
 'Stress load signal active.',
 '{"signal_active": "SIG_STRESS_LOAD"}',
 true, 1),

('SYS_STRESS', 'variable', 'Stress System: Variable', 70,
 '["SIG_STRESS_SENSITIVITY"]',
 '[]',
 '["SIG_STRESS_LOAD"]',
 1.0, 'low', 'all',
 'Stress sensitivity without full load signal.',
 '{"all_of": [{"signal_active": "SIG_STRESS_SENSITIVITY"}, {"not": {"signal_active": "SIG_STRESS_LOAD"}}]}',
 true, 1),

('SYS_STRESS', 'stable', 'Stress System: Stable', 10,
 '[]', '[]', '["SIG_STRESS_LOAD", "SIG_STRESS_SENSITIVITY"]',
 0.0, 'low', 'all', 'No stress signals active.', null, true, 1),

-- SYS_HORMONAL
('SYS_HORMONAL', 'needs_attention', 'Hormonal System: Needs Attention', 100,
 '["SIG_HORMONAL_VARIABILITY"]',
 '["SIG_CYCLE_LINKED_PATTERN", "SIG_SKIN_HAIR_PATTERN"]',
 '[]',
 2.0, 'medium', 'all',
 'Hormonal variability signal active.',
 '{"signal_active": "SIG_HORMONAL_VARIABILITY"}',
 true, 1),

('SYS_HORMONAL', 'variable', 'Hormonal System: Variable', 70,
 '[]',
 '["SIG_CYCLE_LINKED_PATTERN", "SIG_SKIN_HAIR_PATTERN"]',
 '["SIG_HORMONAL_VARIABILITY"]',
 1.0, 'low', 'all',
 'Cycle or skin signals without full hormonal variability.',
 '{"all_of": [{"not": {"signal_active": "SIG_HORMONAL_VARIABILITY"}}, {"any_of": [{"signal_active": "SIG_CYCLE_LINKED_PATTERN"}, {"signal_active": "SIG_SKIN_HAIR_PATTERN"}]}]}',
 true, 1),

('SYS_HORMONAL', 'stable', 'Hormonal System: Stable', 10,
 '[]', '[]', '["SIG_HORMONAL_VARIABILITY", "SIG_CYCLE_LINKED_PATTERN"]',
 0.0, 'low', 'all', 'No hormonal signals active.', null, true, 1),

-- SYS_METABOLIC
('SYS_METABOLIC', 'needs_attention', 'Metabolic System: Needs Attention', 100,
 '["SIG_BLOOD_SUGAR_INSTABILITY"]',
 '["SIG_METABOLIC_VARIABILITY", "SIG_APPETITE_INSTABILITY"]',
 '[]',
 2.0, 'medium', 'all',
 'Blood sugar instability active.',
 '{"signal_active": "SIG_BLOOD_SUGAR_INSTABILITY"}',
 true, 1),

('SYS_METABOLIC', 'variable', 'Metabolic System: Variable', 70,
 '["SIG_METABOLIC_VARIABILITY"]',
 '[]',
 '["SIG_BLOOD_SUGAR_INSTABILITY"]',
 1.0, 'low', 'all',
 'Metabolic variability without confirmed blood sugar instability.',
 '{"all_of": [{"signal_active": "SIG_METABOLIC_VARIABILITY"}, {"not": {"signal_active": "SIG_BLOOD_SUGAR_INSTABILITY"}}]}',
 true, 1),

('SYS_METABOLIC', 'stable', 'Metabolic System: Stable', 10,
 '[]', '[]', '["SIG_BLOOD_SUGAR_INSTABILITY", "SIG_METABOLIC_VARIABILITY"]',
 0.0, 'low', 'all', 'No metabolic signals active.', null, true, 1),

-- SYS_GUT
('SYS_GUT', 'needs_attention', 'Gut System: Needs Attention', 100,
 '["SIG_GUT_DISRUPTION"]',
 '["SIG_APPETITE_INSTABILITY"]',
 '[]',
 2.0, 'medium', 'all',
 'Gut disruption signal active.',
 '{"signal_active": "SIG_GUT_DISRUPTION"}',
 true, 1),

('SYS_GUT', 'variable', 'Gut System: Variable', 70,
 '["SIG_APPETITE_INSTABILITY"]',
 '[]',
 '["SIG_GUT_DISRUPTION"]',
 1.0, 'low', 'all',
 'Appetite instability without full gut disruption.',
 '{"all_of": [{"signal_active": "SIG_APPETITE_INSTABILITY"}, {"not": {"signal_active": "SIG_GUT_DISRUPTION"}}]}',
 true, 1),

('SYS_GUT', 'stable', 'Gut System: Stable', 10,
 '[]', '[]', '["SIG_GUT_DISRUPTION", "SIG_APPETITE_INSTABILITY"]',
 0.0, 'low', 'all', 'No gut signals active.', null, true, 1),

-- SYS_RECOVERY
('SYS_RECOVERY', 'needs_attention', 'Recovery System: Needs Attention', 100,
 '["SIG_RECOVERY_STRAIN"]',
 '["SIG_UNREFRESHING_SLEEP", "SIG_PERSISTENT_FATIGUE"]',
 '[]',
 2.0, 'medium', 'all',
 'Recovery strain signal active.',
 '{"signal_active": "SIG_RECOVERY_STRAIN"}',
 true, 1),

('SYS_RECOVERY', 'variable', 'Recovery System: Variable', 70,
 '[]',
 '["SIG_UNREFRESHING_SLEEP", "SIG_CARDIO_STRAIN_CONTEXT"]',
 '["SIG_RECOVERY_STRAIN"]',
 1.0, 'low', 'all',
 'Recovery sub-signals present without full strain.',
 '{"all_of": [{"not": {"signal_active": "SIG_RECOVERY_STRAIN"}}, {"any_of": [{"signal_active": "SIG_UNREFRESHING_SLEEP"}, {"signal_active": "SIG_CARDIO_STRAIN_CONTEXT"}]}]}',
 true, 1),

('SYS_RECOVERY', 'stable', 'Recovery System: Stable', 10,
 '[]', '[]', '["SIG_RECOVERY_STRAIN", "SIG_UNREFRESHING_SLEEP"]',
 0.0, 'low', 'all', 'No recovery signals active.', null, true, 1),

-- SYS_MICRO
('SYS_MICRO', 'needs_attention', 'Micronutrient System: Needs Attention', 100,
 '["SIG_MICRONUTRIENT_PATTERN"]',
 '["SIG_SKIN_HAIR_PATTERN", "SIG_PERSISTENT_FATIGUE"]',
 '[]',
 1.5, 'medium', 'all',
 'Micronutrient pattern signal active.',
 '{"signal_active": "SIG_MICRONUTRIENT_PATTERN"}',
 true, 1),

('SYS_MICRO', 'stable', 'Micronutrient System: Stable', 10,
 '[]', '[]', '["SIG_MICRONUTRIENT_PATTERN"]',
 0.0, 'low', 'all', 'No micronutrient signals active.', null, true, 1),

-- SYS_CARDIO
('SYS_CARDIO', 'needs_attention', 'Cardiovascular System: Contextual Attention', 100,
 '["SIG_CARDIO_STRAIN_CONTEXT"]',
 '["SIG_RECOVERY_STRAIN"]',
 '[]',
 1.5, 'medium', 'all',
 'Cardiovascular strain context signal active. Low specificity — contextual.',
 '{"signal_active": "SIG_CARDIO_STRAIN_CONTEXT"}',
 true, 1),

('SYS_CARDIO', 'stable', 'Cardiovascular System: Stable', 10,
 '[]', '[]', '["SIG_CARDIO_STRAIN_CONTEXT"]',
 0.0, 'low', 'all', 'No cardiovascular signals active.', null, true, 1),

-- SYS_BONE (no specific signal yet — default stable)
('SYS_BONE', 'stable', 'Bone System: Stable', 10,
 '[]', '[]', '[]',
 0.0, 'low', 'all', 'No bone-specific signals currently defined.', null, true, 1),

-- SYS_INFLAM_CTX
('SYS_INFLAM_CTX', 'needs_attention', 'Inflammation Context: Signal Present', 100,
 '[]',
 '["SIG_GUT_DISRUPTION", "SIG_CYCLE_LINKED_PATTERN", "SIG_HORMONAL_VARIABILITY"]',
 '[]',
 1.5, 'low', 'all',
 'Inflammatory context signals present from gut, hormonal, or cycle axes.',
 '{"any_of": [{"signal_active": "SIG_GUT_DISRUPTION"}, {"signal_active": "SIG_CYCLE_LINKED_PATTERN"}, {"signal_active": "SIG_HORMONAL_VARIABILITY"}]}',
 true, 1),

('SYS_INFLAM_CTX', 'stable', 'Inflammation Context: Stable', 10,
 '[]', '[]', '[]',
 0.0, 'low', 'all', 'No inflammatory context signals active.', null, true, 1),

-- SYS_NUTRITION
('SYS_NUTRITION', 'needs_attention', 'Nutrition System: Needs Attention', 100,
 '[]',
 '["SIG_MICRONUTRIENT_PATTERN", "SIG_APPETITE_INSTABILITY", "SIG_BLOOD_SUGAR_INSTABILITY"]',
 '[]',
 1.5, 'low', 'all',
 'At least one nutrition-adjacent signal is active.',
 '{"any_of": [{"signal_active": "SIG_MICRONUTRIENT_PATTERN"}, {"signal_active": "SIG_APPETITE_INSTABILITY"}, {"signal_active": "SIG_BLOOD_SUGAR_INSTABILITY"}]}',
 true, 1),

('SYS_NUTRITION', 'stable', 'Nutrition System: Stable', 10,
 '[]', '[]', '[]',
 0.0, 'low', 'all', 'No nutrition signals active.', null, true, 1),

-- SYS_BIOMARKERS_CTX
('SYS_BIOMARKERS_CTX', 'needs_attention', 'Biomarkers Context: Elevated Values', 100,
 '["SIG_BLOOD_SUGAR_INSTABILITY"]',
 '["SIG_CONTRADICTORY_PATTERN"]',
 '[]',
 1.5, 'medium', 'all',
 'Blood sugar instability with lab values elevated triggers biomarker context attention.',
 '{"signal_active": "SIG_BLOOD_SUGAR_INSTABILITY"}',
 true, 1),

('SYS_BIOMARKERS_CTX', 'stable', 'Biomarkers Context: Stable', 10,
 '[]', '[]', '["SIG_BLOOD_SUGAR_INSTABILITY"]',
 0.0, 'low', 'all', 'No biomarker-relevant signals active.', null, true, 1);


-- ════════════════════════════════════════════════════════════
-- hero_resolution_rules
-- 1-2 rules per hero code
-- ════════════════════════════════════════════════════════════

insert into hero_resolution_rules (
  hero_code, rule_name, rule_priority,
  required_signals, supporting_signals, excluded_signals,
  minimum_cluster_score, minimum_specificity_score, minimum_confidence,
  non_overlap_constraints, life_stage_scope,
  resolution_logic, rule_json,
  approved, version
) values

-- HERO_BLOOD_SUGAR_INSTAB
('HERO_BLOOD_SUGAR_INSTAB', 'Blood Sugar: Primary Signal Active', 100,
 '["SIG_BLOOD_SUGAR_INSTABILITY"]',
 '["SIG_ENERGY_VARIABILITY", "SIG_APPETITE_INSTABILITY", "SIG_METABOLIC_VARIABILITY"]',
 '[]',
 3.0, 0.85, 'medium',
 '["HERO_ENERGY_METABOLIC"]',
 'all',
 'Blood sugar instability is the dominant signal. Suppresses energy-metabolic hero to avoid overlap.',
 '{"all_of": [{"signal_active": "SIG_BLOOD_SUGAR_INSTABILITY"}, {"signal_strength_at_least": ["SIG_BLOOD_SUGAR_INSTABILITY", "moderate"]}]}',
 true, 1),

('HERO_BLOOD_SUGAR_INSTAB', 'Blood Sugar: Lab-Confirmed Pattern', 90,
 '["SIG_BLOOD_SUGAR_INSTABILITY"]',
 '["SIG_METABOLIC_VARIABILITY"]',
 '[]',
 2.5, 0.90, 'high',
 '[]',
 'all',
 'Lab values present and blood sugar signal active — high confidence route.',
 '{"all_of": [{"signal_active": "SIG_BLOOD_SUGAR_INSTABILITY"}, {"exists": "lab_glucose_value"}]}',
 true, 1),

-- HERO_SLEEP_DISRUPTION
('HERO_SLEEP_DISRUPTION', 'Sleep: Full Disruption Cluster', 100,
 '["SIG_SLEEP_DISRUPTION"]',
 '["SIG_NIGHT_WAKING_PATTERN", "SIG_UNREFRESHING_SLEEP", "SIG_SLEEP_LATENCY_PATTERN"]',
 '[]',
 4.0, 0.85, 'medium',
 '[]',
 'all',
 'Primary sleep disruption with at least one structural co-signal reaches this hero.',
 '{"all_of": [{"signal_active": "SIG_SLEEP_DISRUPTION"}, {"any_of": [{"signal_active": "SIG_NIGHT_WAKING_PATTERN"}, {"signal_active": "SIG_UNREFRESHING_SLEEP"}, {"signal_active": "SIG_SLEEP_LATENCY_PATTERN"}]}]}',
 true, 1),

('HERO_SLEEP_DISRUPTION', 'Sleep: Standalone Disruption', 75,
 '["SIG_SLEEP_DISRUPTION"]',
 '[]',
 '[]',
 2.5, 0.70, 'medium',
 '[]',
 'all',
 'Sleep disruption alone without cluster, at moderate confidence.',
 '{"signal_active": "SIG_SLEEP_DISRUPTION"}',
 true, 1),

-- HERO_STRESS_LOAD
('HERO_STRESS_LOAD', 'Stress: High Load with Downstream Impact', 100,
 '["SIG_STRESS_LOAD"]',
 '["SIG_STRESS_SENSITIVITY", "SIG_SLEEP_LATENCY_PATTERN", "SIG_RECOVERY_STRAIN"]',
 '[]',
 3.5, 0.80, 'medium',
 '[]',
 'all',
 'Stress load is primary with at least one downstream impact signal.',
 '{"all_of": [{"signal_active": "SIG_STRESS_LOAD"}, {"any_of": [{"signal_active": "SIG_STRESS_SENSITIVITY"}, {"signal_active": "SIG_SLEEP_LATENCY_PATTERN"}, {"signal_active": "SIG_RECOVERY_STRAIN"}]}]}',
 true, 1),

('HERO_STRESS_LOAD', 'Stress: Isolated Load Pattern', 75,
 '["SIG_STRESS_LOAD"]',
 '[]',
 '[]',
 2.0, 0.65, 'medium',
 '[]',
 'all',
 'Stress load signal alone, without confirmed downstream signals.',
 '{"signal_active": "SIG_STRESS_LOAD"}',
 true, 1),

-- HERO_IRON_DEPLETION
('HERO_IRON_DEPLETION', 'Iron: Micronutrient + Fatigue Cluster', 100,
 '["SIG_MICRONUTRIENT_PATTERN", "SIG_PERSISTENT_FATIGUE"]',
 '["SIG_SKIN_HAIR_PATTERN", "SIG_UNREFRESHING_SLEEP"]',
 '["SIG_BLOOD_SUGAR_INSTABILITY"]',
 4.0, 0.80, 'medium',
 '["HERO_ENERGY_METABOLIC"]',
 'all',
 'Micronutrient pattern with persistent fatigue. Blood sugar instability excluded to avoid misattribution.',
 '{"all_of": [{"signal_active": "SIG_MICRONUTRIENT_PATTERN"}, {"signal_active": "SIG_PERSISTENT_FATIGUE"}, {"not": {"signal_active": "SIG_BLOOD_SUGAR_INSTABILITY"}}]}',
 true, 1),

('HERO_IRON_DEPLETION', 'Iron: Micronutrient Pattern Only', 75,
 '["SIG_MICRONUTRIENT_PATTERN"]',
 '["SIG_SKIN_HAIR_PATTERN"]',
 '["SIG_BLOOD_SUGAR_INSTABILITY", "SIG_HORMONAL_VARIABILITY"]',
 2.5, 0.70, 'medium',
 '[]',
 'all',
 'Micronutrient pattern alone without hormonal or metabolic competing heroes.',
 '{"all_of": [{"signal_active": "SIG_MICRONUTRIENT_PATTERN"}, {"none_of": ["SIG_BLOOD_SUGAR_INSTABILITY", "SIG_HORMONAL_VARIABILITY"]}]}',
 true, 1),

-- HERO_HORMONAL_VARIABILITY
('HERO_HORMONAL_VARIABILITY', 'Hormonal: Full Variability Cluster', 100,
 '["SIG_HORMONAL_VARIABILITY"]',
 '["SIG_CYCLE_LINKED_PATTERN", "SIG_SKIN_HAIR_PATTERN", "SIG_NIGHT_WAKING_PATTERN"]',
 '[]',
 4.0, 0.85, 'medium',
 '[]',
 'all',
 'Hormonal variability as primary with cycle or skin/hair co-signals.',
 '{"all_of": [{"signal_active": "SIG_HORMONAL_VARIABILITY"}, {"any_of": [{"signal_active": "SIG_CYCLE_LINKED_PATTERN"}, {"signal_active": "SIG_SKIN_HAIR_PATTERN"}]}]}',
 true, 1),

('HERO_HORMONAL_VARIABILITY', 'Hormonal: Cycle-Led Pattern', 80,
 '["SIG_CYCLE_LINKED_PATTERN"]',
 '["SIG_HORMONAL_VARIABILITY"]',
 '[]',
 2.5, 0.70, 'medium',
 '[]',
 'all',
 'Cycle-linked pattern drives hero selection when broader hormonal signal is borderline.',
 '{"all_of": [{"signal_active": "SIG_CYCLE_LINKED_PATTERN"}, {"signal_strength_at_least": ["SIG_CYCLE_LINKED_PATTERN", "moderate"]}]}',
 true, 1),

-- HERO_GUT_PATTERN
('HERO_GUT_PATTERN', 'Gut: Active Disruption Cluster', 100,
 '["SIG_GUT_DISRUPTION"]',
 '["SIG_APPETITE_INSTABILITY", "SIG_METABOLIC_VARIABILITY"]',
 '[]',
 3.5, 0.85, 'medium',
 '[]',
 'all',
 'Gut disruption is the dominant signal. Appetite instability amplifies.',
 '{"all_of": [{"signal_active": "SIG_GUT_DISRUPTION"}, {"signal_strength_at_least": ["SIG_GUT_DISRUPTION", "moderate"]}]}',
 true, 1),

('HERO_GUT_PATTERN', 'Gut: Mild Disruption Pattern', 75,
 '["SIG_GUT_DISRUPTION"]',
 '[]',
 '[]',
 2.0, 0.65, 'low',
 '[]',
 'all',
 'Gut disruption at mild strength, without amplifying signals.',
 '{"signal_active": "SIG_GUT_DISRUPTION"}',
 true, 1),

-- HERO_ENERGY_METABOLIC
('HERO_ENERGY_METABOLIC', 'Energy: Variability + Fatigue Cluster', 100,
 '["SIG_ENERGY_VARIABILITY", "SIG_PERSISTENT_FATIGUE"]',
 '["SIG_METABOLIC_VARIABILITY", "SIG_RECOVERY_STRAIN"]',
 '["SIG_BLOOD_SUGAR_INSTABILITY", "SIG_MICRONUTRIENT_PATTERN"]',
 3.5, 0.75, 'medium',
 '["HERO_BLOOD_SUGAR_INSTAB", "HERO_IRON_DEPLETION"]',
 'all',
 'Energy variability and persistent fatigue co-present without a more specific metabolic or micronutrient hero.',
 '{"all_of": [{"signal_active": "SIG_ENERGY_VARIABILITY"}, {"signal_active": "SIG_PERSISTENT_FATIGUE"}, {"none_of": ["SIG_BLOOD_SUGAR_INSTABILITY", "SIG_MICRONUTRIENT_PATTERN"]}]}',
 true, 1),

('HERO_ENERGY_METABOLIC', 'Energy: Variability Pattern Only', 75,
 '["SIG_ENERGY_VARIABILITY"]',
 '["SIG_METABOLIC_VARIABILITY"]',
 '["SIG_BLOOD_SUGAR_INSTABILITY", "SIG_PERSISTENT_FATIGUE"]',
 2.0, 0.60, 'medium',
 '["HERO_BLOOD_SUGAR_INSTAB"]',
 'all',
 'Energy variability without persistent fatigue or blood sugar pattern.',
 '{"all_of": [{"signal_active": "SIG_ENERGY_VARIABILITY"}, {"none_of": ["SIG_BLOOD_SUGAR_INSTABILITY", "SIG_PERSISTENT_FATIGUE"]}]}',
 true, 1),

-- HERO_RECOVERY_STRAIN
('HERO_RECOVERY_STRAIN', 'Recovery: Full Strain Cluster', 100,
 '["SIG_RECOVERY_STRAIN"]',
 '["SIG_UNREFRESHING_SLEEP", "SIG_CARDIO_STRAIN_CONTEXT", "SIG_DECLINING_TREND"]',
 '[]',
 3.5, 0.80, 'medium',
 '[]',
 'all',
 'Recovery strain signal active with at least one amplifying signal.',
 '{"all_of": [{"signal_active": "SIG_RECOVERY_STRAIN"}, {"any_of": [{"signal_active": "SIG_UNREFRESHING_SLEEP"}, {"signal_active": "SIG_CARDIO_STRAIN_CONTEXT"}, {"signal_active": "SIG_DECLINING_TREND"}]}]}',
 true, 1),

('HERO_RECOVERY_STRAIN', 'Recovery: Standalone Strain', 75,
 '["SIG_RECOVERY_STRAIN"]',
 '[]',
 '[]',
 2.0, 0.65, 'medium',
 '[]',
 'all',
 'Recovery strain alone without cluster amplifiers.',
 '{"signal_active": "SIG_RECOVERY_STRAIN"}',
 true, 1),

-- HERO_BASELINE
('HERO_BASELINE', 'Baseline: Low-Signal Profile', 100,
 '["SIG_LOW_CONTEXT_PATTERN"]',
 '["SIG_IMPROVING_TREND"]',
 '["SIG_SLEEP_DISRUPTION", "SIG_STRESS_LOAD", "SIG_PERSISTENT_FATIGUE",
    "SIG_BLOOD_SUGAR_INSTABILITY", "SIG_GUT_DISRUPTION", "SIG_HORMONAL_VARIABILITY",
    "SIG_RECOVERY_STRAIN"]',
 1.0, 0.60, 'low',
 '[]',
 'all',
 'Low-context pattern active with no major disruption signals. Profile is stable or insufficient for stronger hero.',
 '{"all_of": [{"signal_active": "SIG_LOW_CONTEXT_PATTERN"}, {"none_of": ["SIG_SLEEP_DISRUPTION", "SIG_STRESS_LOAD", "SIG_PERSISTENT_FATIGUE", "SIG_BLOOD_SUGAR_INSTABILITY", "SIG_GUT_DISRUPTION", "SIG_HORMONAL_VARIABILITY", "SIG_RECOVERY_STRAIN"]}]}',
 true, 1),

('HERO_BASELINE', 'Baseline: Improving Trend', 75,
 '["SIG_IMPROVING_TREND"]',
 '[]',
 '["SIG_DECLINING_TREND", "SIG_SLEEP_DISRUPTION", "SIG_STRESS_LOAD"]',
 1.0, 0.55, 'low',
 '[]',
 'all',
 'Improving trend signal active with no major disruption. Positive trajectory framing.',
 '{"all_of": [{"signal_active": "SIG_IMPROVING_TREND"}, {"none_of": ["SIG_DECLINING_TREND", "SIG_SLEEP_DISRUPTION", "SIG_STRESS_LOAD"]}]}',
 true, 1);
