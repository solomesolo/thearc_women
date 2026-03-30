-- ============================================================
-- Seed: survey_answer_normalization
-- Survey version: arc_core_intake_v1
-- Maps every raw survey answer string → typed canonical value.
-- ============================================================

-- Idempotent: delete existing rows for this survey version before reinserting.
delete from survey_answer_normalization where survey_version = 'arc_core_intake_v1';

insert into survey_answer_normalization (
  survey_version, question_code, raw_value,
  normalized_value, normalized_type,
  ordinal_value, boolean_value, numeric_value,
  canonical_code, life_stage_scope,
  approved, version, notes
) values

-- ── life_stage ───────────────────────────────────────────────
('arc_core_intake_v1', 'life_stage', 'Reproductive (18–25)',
 'reproductive_18_25', 'canonical_text',
 null, null, null,
 'reproductive_18_25', 'all',
 true, 1, 'Younger reproductive window'),

('arc_core_intake_v1', 'life_stage', 'Reproductive (26–35)',
 'reproductive_26_35', 'canonical_text',
 null, null, null,
 'reproductive_26_35', 'all',
 true, 1, 'Core reproductive window'),

('arc_core_intake_v1', 'life_stage', 'Perimenopause',
 'perimenopause', 'canonical_text',
 null, null, null,
 'perimenopause', 'all',
 true, 1, 'Hormonal transition phase'),

('arc_core_intake_v1', 'life_stage', 'Menopause',
 'menopause', 'canonical_text',
 null, null, null,
 'menopause', 'all',
 true, 1, 'Post-menopausal transition'),

('arc_core_intake_v1', 'life_stage', 'Postpartum',
 'postpartum', 'canonical_text',
 null, null, null,
 'postpartum', 'all',
 true, 1, 'Post-delivery recovery window'),

-- ── fatigue_freq ─────────────────────────────────────────────
('arc_core_intake_v1', 'fatigue_freq', 'Never',
 '0', 'ordinal',
 0, null, null,
 'never', 'all',
 true, 1, 'No fatigue reported'),

('arc_core_intake_v1', 'fatigue_freq', 'Occasionally',
 '1', 'ordinal',
 1, null, null,
 'occasionally', 'all',
 true, 1, 'Fatigue a few times per month'),

('arc_core_intake_v1', 'fatigue_freq', 'Weekly',
 '2', 'ordinal',
 2, null, null,
 'weekly', 'all',
 true, 1, 'Fatigue at least once a week'),

('arc_core_intake_v1', 'fatigue_freq', 'Most days',
 '3', 'ordinal',
 3, null, null,
 'most_days', 'all',
 true, 1, 'Fatigue most days of the week'),

('arc_core_intake_v1', 'fatigue_freq', 'Daily',
 '4', 'ordinal',
 4, null, null,
 'daily', 'all',
 true, 1, 'Fatigue every day'),

-- ── fatigue_sev (0-5 numeric passthrough) ────────────────────
('arc_core_intake_v1', 'fatigue_sev', '0',
 '0', 'numeric',
 null, null, 0,
 'none', 'all',
 true, 1, 'No fatigue severity'),

('arc_core_intake_v1', 'fatigue_sev', '1',
 '1', 'numeric',
 null, null, 1,
 'minimal', 'all',
 true, 1, null),

('arc_core_intake_v1', 'fatigue_sev', '2',
 '2', 'numeric',
 null, null, 2,
 'mild', 'all',
 true, 1, null),

('arc_core_intake_v1', 'fatigue_sev', '3',
 '3', 'numeric',
 null, null, 3,
 'moderate', 'all',
 true, 1, null),

('arc_core_intake_v1', 'fatigue_sev', '4',
 '4', 'numeric',
 null, null, 4,
 'significant', 'all',
 true, 1, null),

('arc_core_intake_v1', 'fatigue_sev', '5',
 '5', 'numeric',
 null, null, 5,
 'severe', 'all',
 true, 1, null),

-- ── fatigue_timing ────────────────────────────────────────────
('arc_core_intake_v1', 'fatigue_timing', 'Morning',
 'morning', 'canonical_text',
 null, null, null,
 'morning', 'all',
 true, 1, 'Fatigue primarily in the morning'),

('arc_core_intake_v1', 'fatigue_timing', 'Afternoon',
 'afternoon', 'canonical_text',
 null, null, null,
 'afternoon', 'all',
 true, 1, 'Classic post-lunch dip window'),

('arc_core_intake_v1', 'fatigue_timing', 'Evening',
 'evening', 'canonical_text',
 null, null, null,
 'evening', 'all',
 true, 1, 'Late-day depletion pattern'),

('arc_core_intake_v1', 'fatigue_timing', 'All day',
 'all_day', 'canonical_text',
 null, null, null,
 'all_day', 'all',
 true, 1, 'Persistent fatigue without clear pattern'),

('arc_core_intake_v1', 'fatigue_timing', 'Varies',
 'varies', 'canonical_text',
 null, null, null,
 'varies', 'all',
 true, 1, 'Variable timing; may indicate metabolic instability'),

-- ── energy_crash ─────────────────────────────────────────────
('arc_core_intake_v1', 'energy_crash', 'No',
 '0', 'ordinal',
 0, null, null,
 'no', 'all',
 true, 1, 'No reported energy crashes'),

('arc_core_intake_v1', 'energy_crash', 'Sometimes',
 '1', 'ordinal',
 1, null, null,
 'sometimes', 'all',
 true, 1, 'Occasional energy crash'),

('arc_core_intake_v1', 'energy_crash', 'Often',
 '2', 'ordinal',
 2, null, null,
 'often', 'all',
 true, 1, 'Frequent energy crash; higher signal weight'),

-- ── crash_post_meal ──────────────────────────────────────────
('arc_core_intake_v1', 'crash_post_meal', 'No',
 'false', 'boolean',
 null, false, null,
 'no', 'all',
 true, 1, null),

('arc_core_intake_v1', 'crash_post_meal', 'Sometimes',
 'sometimes', 'ordinal',
 1, null, null,
 'sometimes', 'all',
 true, 1, null),

('arc_core_intake_v1', 'crash_post_meal', 'Often',
 'often', 'ordinal',
 2, null, null,
 'often', 'all',
 true, 1, 'Post-meal crash; strong metabolic signal'),

-- raw_fields.crash_post_meal boolean form
('arc_core_intake_v1', 'crash_post_meal', 'yes',
 'true', 'boolean',
 null, true, null,
 'yes', 'all',
 true, 1, 'Raw boolean form from raw_fields'),

('arc_core_intake_v1', 'crash_post_meal', 'no',
 'false', 'boolean',
 null, false, null,
 'no', 'all',
 true, 1, 'Raw boolean form from raw_fields'),

-- ── sugar_cravings (0-5 numeric passthrough) ─────────────────
('arc_core_intake_v1', 'sugar_cravings', '0',
 '0', 'numeric',
 null, null, 0,
 'none', 'all',
 true, 1, null),

('arc_core_intake_v1', 'sugar_cravings', '1',
 '1', 'numeric',
 null, null, 1,
 'minimal', 'all',
 true, 1, null),

('arc_core_intake_v1', 'sugar_cravings', '2',
 '2', 'numeric',
 null, null, 2,
 'mild', 'all',
 true, 1, null),

('arc_core_intake_v1', 'sugar_cravings', '3',
 '3', 'numeric',
 null, null, 3,
 'moderate', 'all',
 true, 1, null),

('arc_core_intake_v1', 'sugar_cravings', '4',
 '4', 'numeric',
 null, null, 4,
 'significant', 'all',
 true, 1, null),

('arc_core_intake_v1', 'sugar_cravings', '5',
 '5', 'numeric',
 null, null, 5,
 'strong', 'all',
 true, 1, null),

-- ── stress_level (0-5 numeric passthrough) ───────────────────
('arc_core_intake_v1', 'stress_level', '0',
 '0', 'numeric',
 null, null, 0,
 'none', 'all',
 true, 1, null),

('arc_core_intake_v1', 'stress_level', '1',
 '1', 'numeric',
 null, null, 1,
 'minimal', 'all',
 true, 1, null),

('arc_core_intake_v1', 'stress_level', '2',
 '2', 'numeric',
 null, null, 2,
 'mild', 'all',
 true, 1, null),

('arc_core_intake_v1', 'stress_level', '3',
 '3', 'numeric',
 null, null, 3,
 'moderate', 'all',
 true, 1, null),

('arc_core_intake_v1', 'stress_level', '4',
 '4', 'numeric',
 null, null, 4,
 'high', 'all',
 true, 1, null),

('arc_core_intake_v1', 'stress_level', '5',
 '5', 'numeric',
 null, null, 5,
 'very_high', 'all',
 true, 1, null),

-- ── stress_type ──────────────────────────────────────────────
('arc_core_intake_v1', 'stress_type', 'Work',
 'work', 'canonical_text',
 null, null, null,
 'work', 'all',
 true, 1, null),

('arc_core_intake_v1', 'stress_type', 'Personal',
 'personal', 'canonical_text',
 null, null, null,
 'personal', 'all',
 true, 1, null),

('arc_core_intake_v1', 'stress_type', 'Physical',
 'physical', 'canonical_text',
 null, null, null,
 'physical', 'all',
 true, 1, 'Physical stressors (training load, illness)'),

('arc_core_intake_v1', 'stress_type', 'Multiple',
 'multiple', 'canonical_text',
 null, null, null,
 'multiple', 'all',
 true, 1, 'Multi-domain stressor load'),

('arc_core_intake_v1', 'stress_type', 'Other',
 'other', 'canonical_text',
 null, null, null,
 'other', 'all',
 true, 1, null),

-- ── sleep_quality (0-5 numeric passthrough, lower = worse) ───
('arc_core_intake_v1', 'sleep_quality', '0',
 '0', 'numeric',
 null, null, 0,
 'very_poor', 'all',
 true, 1, null),

('arc_core_intake_v1', 'sleep_quality', '1',
 '1', 'numeric',
 null, null, 1,
 'poor', 'all',
 true, 1, null),

('arc_core_intake_v1', 'sleep_quality', '2',
 '2', 'numeric',
 null, null, 2,
 'fair', 'all',
 true, 1, null),

('arc_core_intake_v1', 'sleep_quality', '3',
 '3', 'numeric',
 null, null, 3,
 'moderate', 'all',
 true, 1, null),

('arc_core_intake_v1', 'sleep_quality', '4',
 '4', 'numeric',
 null, null, 4,
 'good', 'all',
 true, 1, null),

('arc_core_intake_v1', 'sleep_quality', '5',
 '5', 'numeric',
 null, null, 5,
 'excellent', 'all',
 true, 1, null),

-- ── sleep_latency ────────────────────────────────────────────
('arc_core_intake_v1', 'sleep_latency', 'Under 10 min',
 '0', 'ordinal',
 0, null, null,
 'under_10', 'all',
 true, 1, 'Fast sleep onset; healthy baseline'),

('arc_core_intake_v1', 'sleep_latency', '10-20 min',
 '1', 'ordinal',
 1, null, null,
 '10_20_min', 'all',
 true, 1, 'Normal range'),

('arc_core_intake_v1', 'sleep_latency', '20-30 min',
 '2', 'ordinal',
 2, null, null,
 '20_30_min', 'all',
 true, 1, 'Mildly elevated latency'),

('arc_core_intake_v1', 'sleep_latency', '30-45 min',
 '3', 'ordinal',
 3, null, null,
 '30_45_min', 'all',
 true, 1, 'Clinically notable delayed onset'),

('arc_core_intake_v1', 'sleep_latency', 'Over 45 min',
 '4', 'ordinal',
 4, null, null,
 'over_45', 'all',
 true, 1, 'Significantly delayed sleep onset'),

-- ── night_waking ─────────────────────────────────────────────
('arc_core_intake_v1', 'night_waking', 'Never',
 '0', 'ordinal',
 0, null, null,
 'never', 'all',
 true, 1, null),

('arc_core_intake_v1', 'night_waking', 'Occasionally',
 '1', 'ordinal',
 1, null, null,
 'occasionally', 'all',
 true, 1, null),

('arc_core_intake_v1', 'night_waking', 'Most nights',
 '2', 'ordinal',
 2, null, null,
 'most_nights', 'all',
 true, 1, null),

('arc_core_intake_v1', 'night_waking', 'Every night',
 '3', 'ordinal',
 3, null, null,
 'every_night', 'all',
 true, 1, 'Chronic night waking; high disruption signal'),

-- ── unrefreshing_sleep ───────────────────────────────────────
('arc_core_intake_v1', 'unrefreshing_sleep', 'Never',
 '0', 'ordinal',
 0, null, null,
 'never', 'all',
 true, 1, null),

('arc_core_intake_v1', 'unrefreshing_sleep', 'Sometimes',
 '1', 'ordinal',
 1, null, null,
 'sometimes', 'all',
 true, 1, null),

('arc_core_intake_v1', 'unrefreshing_sleep', 'Often',
 '2', 'ordinal',
 2, null, null,
 'often', 'all',
 true, 1, null),

('arc_core_intake_v1', 'unrefreshing_sleep', 'Almost always',
 '3', 'ordinal',
 3, null, null,
 'almost_always', 'all',
 true, 1, 'Chronic unrefreshing sleep; recovery signal'),

-- ── gut_symptoms ─────────────────────────────────────────────
('arc_core_intake_v1', 'gut_symptoms', 'Never',
 '0', 'ordinal',
 0, null, null,
 'never', 'all',
 true, 1, null),

('arc_core_intake_v1', 'gut_symptoms', 'Occasionally',
 '1', 'ordinal',
 1, null, null,
 'occasionally', 'all',
 true, 1, null),

('arc_core_intake_v1', 'gut_symptoms', 'Weekly',
 '2', 'ordinal',
 2, null, null,
 'weekly', 'all',
 true, 1, null),

('arc_core_intake_v1', 'gut_symptoms', 'Most days',
 '3', 'ordinal',
 3, null, null,
 'most_days', 'all',
 true, 1, null),

('arc_core_intake_v1', 'gut_symptoms', 'Daily',
 '4', 'ordinal',
 4, null, null,
 'daily', 'all',
 true, 1, 'Daily gut symptoms; chronic pattern'),

-- ── bloating ─────────────────────────────────────────────────
('arc_core_intake_v1', 'bloating', 'No',
 '0', 'ordinal',
 0, null, null,
 'no', 'all',
 true, 1, null),

('arc_core_intake_v1', 'bloating', 'Mild',
 '1', 'ordinal',
 1, null, null,
 'mild', 'all',
 true, 1, null),

('arc_core_intake_v1', 'bloating', 'Moderate',
 '2', 'ordinal',
 2, null, null,
 'moderate', 'all',
 true, 1, null),

('arc_core_intake_v1', 'bloating', 'Severe',
 '3', 'ordinal',
 3, null, null,
 'severe', 'all',
 true, 1, 'Significant bloating; gut disruption signal'),

-- ── bowel_changes ─────────────────────────────────────────────
('arc_core_intake_v1', 'bowel_changes', 'No',
 '0', 'ordinal',
 0, null, null,
 'no', 'all',
 true, 1, null),

('arc_core_intake_v1', 'bowel_changes', 'Sometimes',
 '1', 'ordinal',
 1, null, null,
 'sometimes', 'all',
 true, 1, null),

('arc_core_intake_v1', 'bowel_changes', 'Often',
 '2', 'ordinal',
 2, null, null,
 'often', 'all',
 true, 1, null),

-- ── cycle_regularity ─────────────────────────────────────────
('arc_core_intake_v1', 'cycle_regularity', 'Regular',
 '0', 'ordinal',
 0, null, null,
 'regular', 'all',
 true, 1, 'Consistent cycle; low hormonal disruption signal'),

('arc_core_intake_v1', 'cycle_regularity', 'Somewhat irregular',
 '1', 'ordinal',
 1, null, null,
 'somewhat_irregular', 'all',
 true, 1, null),

('arc_core_intake_v1', 'cycle_regularity', 'Irregular',
 '2', 'ordinal',
 2, null, null,
 'irregular', 'all',
 true, 1, null),

('arc_core_intake_v1', 'cycle_regularity', 'No period',
 '3', 'ordinal',
 3, null, null,
 'no_period', 'all',
 true, 1, 'Amenorrhea or post-menopausal; context-dependent'),

('arc_core_intake_v1', 'cycle_regularity', 'Unsure',
 '4', 'ordinal',
 4, null, null,
 'unsure', 'all',
 true, 1, null),

-- ── cycle_linked_symptoms ────────────────────────────────────
('arc_core_intake_v1', 'cycle_linked_symptoms', 'No',
 '0', 'ordinal',
 0, null, null,
 'no', 'all',
 true, 1, null),

('arc_core_intake_v1', 'cycle_linked_symptoms', 'Mild',
 '1', 'ordinal',
 1, null, null,
 'mild', 'all',
 true, 1, null),

('arc_core_intake_v1', 'cycle_linked_symptoms', 'Moderate',
 '2', 'ordinal',
 2, null, null,
 'moderate', 'all',
 true, 1, null),

('arc_core_intake_v1', 'cycle_linked_symptoms', 'Significant',
 '3', 'ordinal',
 3, null, null,
 'significant', 'all',
 true, 1, 'Significant cycle-linked symptoms; hormonal signal'),

-- ── hormone_symptoms ─────────────────────────────────────────
('arc_core_intake_v1', 'hormone_symptoms', 'No',
 '0', 'ordinal',
 0, null, null,
 'no', 'all',
 true, 1, null),

('arc_core_intake_v1', 'hormone_symptoms', 'Mild',
 '1', 'ordinal',
 1, null, null,
 'mild', 'all',
 true, 1, null),

('arc_core_intake_v1', 'hormone_symptoms', 'Moderate',
 '2', 'ordinal',
 2, null, null,
 'moderate', 'all',
 true, 1, null),

('arc_core_intake_v1', 'hormone_symptoms', 'Significant',
 '3', 'ordinal',
 3, null, null,
 'significant', 'all',
 true, 1, 'Significant hormonal symptoms reported'),

-- ── skin_hair_changes ────────────────────────────────────────
('arc_core_intake_v1', 'skin_hair_changes', 'No',
 '0', 'ordinal',
 0, null, null,
 'no', 'all',
 true, 1, null),

('arc_core_intake_v1', 'skin_hair_changes', 'Mild',
 '1', 'ordinal',
 1, null, null,
 'mild', 'all',
 true, 1, null),

('arc_core_intake_v1', 'skin_hair_changes', 'Moderate',
 '2', 'ordinal',
 2, null, null,
 'moderate', 'all',
 true, 1, null),

('arc_core_intake_v1', 'skin_hair_changes', 'Significant',
 '3', 'ordinal',
 3, null, null,
 'significant', 'all',
 true, 1, 'Significant skin/hair changes; micronutrient or hormonal signal'),

-- ── exercise_tolerance ───────────────────────────────────────
('arc_core_intake_v1', 'exercise_tolerance', 'Excellent',
 '0', 'ordinal',
 0, null, null,
 'excellent', 'all',
 true, 1, 'Low signal; high cardiovascular reserve'),

('arc_core_intake_v1', 'exercise_tolerance', 'Good',
 '1', 'ordinal',
 1, null, null,
 'good', 'all',
 true, 1, null),

('arc_core_intake_v1', 'exercise_tolerance', 'Moderate',
 '2', 'ordinal',
 2, null, null,
 'moderate', 'all',
 true, 1, null),

('arc_core_intake_v1', 'exercise_tolerance', 'Poor',
 '3', 'ordinal',
 3, null, null,
 'poor', 'all',
 true, 1, 'Reduced exercise tolerance; recovery or cardiovascular signal'),

('arc_core_intake_v1', 'exercise_tolerance', 'Very poor',
 '4', 'ordinal',
 4, null, null,
 'very_poor', 'all',
 true, 1, 'Severely reduced; high recovery/cardiovascular signal');
