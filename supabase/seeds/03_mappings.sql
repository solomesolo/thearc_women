-- ============================================================
-- Seed: signal_to_key_area_map, signal_to_body_system_map, signal_to_hero_map
-- All 22 signals mapped to key areas, body systems, and heroes.
-- ============================================================

delete from signal_to_key_area_map where approved = true and version = 1;
delete from signal_to_body_system_map where approved = true and version = 1;
delete from signal_to_hero_map where approved = true and version = 1;


-- ════════════════════════════════════════════════════════════
-- signal_to_key_area_map
-- ════════════════════════════════════════════════════════════

insert into signal_to_key_area_map (
  signal_code, key_area_code, influence_type, weight, confidence_effect,
  life_stage_scope, conditions_json, approved, version
) values

-- SIG_SLEEP_DISRUPTION
('SIG_SLEEP_DISRUPTION', 'sleep',           'primary',     2.0, 0.3, 'all', null, true, 1),
('SIG_SLEEP_DISRUPTION', 'recovery',        'secondary',   1.2, 0.1, 'all', null, true, 1),
('SIG_SLEEP_DISRUPTION', 'energy',          'secondary',   1.0, 0.1, 'all', null, true, 1),

-- SIG_SLEEP_LATENCY_PATTERN
('SIG_SLEEP_LATENCY_PATTERN', 'sleep',      'primary',     1.5, 0.2, 'all', null, true, 1),
('SIG_SLEEP_LATENCY_PATTERN', 'stress',     'secondary',   0.8, 0.1, 'all', null, true, 1),

-- SIG_NIGHT_WAKING_PATTERN
('SIG_NIGHT_WAKING_PATTERN', 'sleep',       'primary',     1.8, 0.2, 'all', null, true, 1),
('SIG_NIGHT_WAKING_PATTERN', 'recovery',    'secondary',   1.0, 0.1, 'all', null, true, 1),

-- SIG_UNREFRESHING_SLEEP
('SIG_UNREFRESHING_SLEEP', 'sleep',         'primary',     1.5, 0.2, 'all', null, true, 1),
('SIG_UNREFRESHING_SLEEP', 'recovery',      'primary',     1.5, 0.2, 'all', null, true, 1),
('SIG_UNREFRESHING_SLEEP', 'energy',        'secondary',   1.0, 0.1, 'all', null, true, 1),

-- SIG_STRESS_LOAD
('SIG_STRESS_LOAD', 'stress',               'primary',     2.0, 0.3, 'all', null, true, 1),
('SIG_STRESS_LOAD', 'recovery',             'secondary',   1.2, 0.1, 'all', null, true, 1),
('SIG_STRESS_LOAD', 'hormones',             'contextual',  0.8, 0.0, 'all', null, true, 1),

-- SIG_STRESS_SENSITIVITY
('SIG_STRESS_SENSITIVITY', 'stress',        'primary',     1.8, 0.2, 'all', null, true, 1),
('SIG_STRESS_SENSITIVITY', 'sleep',         'secondary',   1.0, 0.1, 'all', null, true, 1),
('SIG_STRESS_SENSITIVITY', 'energy',        'secondary',   0.9, 0.1, 'all', null, true, 1),

-- SIG_RECOVERY_STRAIN
('SIG_RECOVERY_STRAIN', 'recovery',         'primary',     2.0, 0.3, 'all', null, true, 1),
('SIG_RECOVERY_STRAIN', 'energy',           'secondary',   1.2, 0.1, 'all', null, true, 1),
('SIG_RECOVERY_STRAIN', 'cardiovascular',   'secondary',   1.0, 0.1, 'all', null, true, 1),

-- SIG_ENERGY_VARIABILITY
('SIG_ENERGY_VARIABILITY', 'energy',        'primary',     1.8, 0.2, 'all', null, true, 1),
('SIG_ENERGY_VARIABILITY', 'metabolism',    'secondary',   1.2, 0.1, 'all', null, true, 1),
('SIG_ENERGY_VARIABILITY', 'nutrition',     'contextual',  0.7, 0.0, 'all', null, true, 1),

-- SIG_PERSISTENT_FATIGUE
('SIG_PERSISTENT_FATIGUE', 'energy',        'primary',     2.0, 0.3, 'all', null, true, 1),
('SIG_PERSISTENT_FATIGUE', 'recovery',      'secondary',   1.2, 0.1, 'all', null, true, 1),
('SIG_PERSISTENT_FATIGUE', 'nutrition',     'contextual',  0.8, 0.0, 'all', null, true, 1),

-- SIG_BLOOD_SUGAR_INSTABILITY
('SIG_BLOOD_SUGAR_INSTABILITY', 'metabolism', 'primary',   2.0, 0.3, 'all', null, true, 1),
('SIG_BLOOD_SUGAR_INSTABILITY', 'energy',   'primary',     1.5, 0.2, 'all', null, true, 1),
('SIG_BLOOD_SUGAR_INSTABILITY', 'nutrition', 'secondary',  1.0, 0.1, 'all', null, true, 1),

-- SIG_METABOLIC_VARIABILITY
('SIG_METABOLIC_VARIABILITY', 'metabolism', 'primary',     1.5, 0.2, 'all', null, true, 1),
('SIG_METABOLIC_VARIABILITY', 'energy',     'secondary',   1.0, 0.1, 'all', null, true, 1),
('SIG_METABOLIC_VARIABILITY', 'nutrition',  'contextual',  0.7, 0.0, 'all', null, true, 1),

-- SIG_HORMONAL_VARIABILITY
('SIG_HORMONAL_VARIABILITY', 'hormones',    'primary',     2.0, 0.3, 'all', null, true, 1),
('SIG_HORMONAL_VARIABILITY', 'cycle',       'secondary',   1.2, 0.1, 'all', null, true, 1),
('SIG_HORMONAL_VARIABILITY', 'skin_hair',   'secondary',   1.0, 0.1, 'all', null, true, 1),

-- SIG_CYCLE_LINKED_PATTERN
('SIG_CYCLE_LINKED_PATTERN', 'cycle',       'primary',     2.0, 0.3, 'all', null, true, 1),
('SIG_CYCLE_LINKED_PATTERN', 'hormones',    'primary',     1.5, 0.2, 'all', null, true, 1),
('SIG_CYCLE_LINKED_PATTERN', 'energy',      'contextual',  0.7, 0.0, 'all', null, true, 1),

-- SIG_GUT_DISRUPTION
('SIG_GUT_DISRUPTION', 'gut',               'primary',     2.0, 0.3, 'all', null, true, 1),
('SIG_GUT_DISRUPTION', 'nutrition',         'secondary',   1.2, 0.1, 'all', null, true, 1),
('SIG_GUT_DISRUPTION', 'energy',            'contextual',  0.7, 0.0, 'all', null, true, 1),

-- SIG_APPETITE_INSTABILITY
('SIG_APPETITE_INSTABILITY', 'nutrition',   'primary',     1.8, 0.2, 'all', null, true, 1),
('SIG_APPETITE_INSTABILITY', 'gut',         'secondary',   1.0, 0.1, 'all', null, true, 1),
('SIG_APPETITE_INSTABILITY', 'metabolism',  'secondary',   1.0, 0.1, 'all', null, true, 1),

-- SIG_MICRONUTRIENT_PATTERN
('SIG_MICRONUTRIENT_PATTERN', 'nutrition',  'primary',     1.8, 0.2, 'all', null, true, 1),
('SIG_MICRONUTRIENT_PATTERN', 'energy',     'secondary',   1.2, 0.1, 'all', null, true, 1),
('SIG_MICRONUTRIENT_PATTERN', 'skin_hair',  'secondary',   1.0, 0.1, 'all', null, true, 1),

-- SIG_SKIN_HAIR_PATTERN
('SIG_SKIN_HAIR_PATTERN', 'skin_hair',      'primary',     2.0, 0.3, 'all', null, true, 1),
('SIG_SKIN_HAIR_PATTERN', 'hormones',       'secondary',   1.0, 0.1, 'all', null, true, 1),
('SIG_SKIN_HAIR_PATTERN', 'nutrition',      'contextual',  0.7, 0.0, 'all', null, true, 1),

-- SIG_CARDIO_STRAIN_CONTEXT
('SIG_CARDIO_STRAIN_CONTEXT', 'cardiovascular', 'primary', 1.8, 0.2, 'all', null, true, 1),
('SIG_CARDIO_STRAIN_CONTEXT', 'recovery',    'secondary',  1.2, 0.1, 'all', null, true, 1),
('SIG_CARDIO_STRAIN_CONTEXT', 'stress',      'contextual', 0.7, 0.0, 'all', null, true, 1),

-- SIG_CONTRADICTORY_PATTERN (meta — spread low weight contextually)
('SIG_CONTRADICTORY_PATTERN', 'energy',      'contextual', 0.5, 0.0, 'all', null, true, 1),
('SIG_CONTRADICTORY_PATTERN', 'sleep',       'contextual', 0.5, 0.0, 'all', null, true, 1),

-- SIG_IMPROVING_TREND (meta — light positive weight on recovery + energy)
('SIG_IMPROVING_TREND', 'recovery',          'contextual', 0.5, 0.1, 'all', null, true, 1),
('SIG_IMPROVING_TREND', 'energy',            'contextual', 0.5, 0.1, 'all', null, true, 1),

-- SIG_DECLINING_TREND (meta — contextual weight across multiple areas)
('SIG_DECLINING_TREND', 'energy',            'contextual', 0.8, 0.0, 'all', null, true, 1),
('SIG_DECLINING_TREND', 'recovery',          'contextual', 0.8, 0.0, 'all', null, true, 1),
('SIG_DECLINING_TREND', 'sleep',             'contextual', 0.6, 0.0, 'all', null, true, 1),

-- SIG_LOW_CONTEXT_PATTERN (meta — negligible weight; used for hero routing only)
('SIG_LOW_CONTEXT_PATTERN', 'energy',        'contextual', 0.2, 0.0, 'all', null, true, 1),
('SIG_LOW_CONTEXT_PATTERN', 'sleep',         'contextual', 0.2, 0.0, 'all', null, true, 1);


-- ════════════════════════════════════════════════════════════
-- signal_to_body_system_map
-- ════════════════════════════════════════════════════════════

insert into signal_to_body_system_map (
  signal_code, body_system_code, influence_type, weight, confidence_effect,
  life_stage_scope, conditions_json, approved, version
) values

-- SIG_SLEEP_DISRUPTION
('SIG_SLEEP_DISRUPTION', 'SYS_SLEEP',       'primary',   2.0, 0.3, 'all', null, true, 1),
('SIG_SLEEP_DISRUPTION', 'SYS_RECOVERY',    'secondary', 1.0, 0.1, 'all', null, true, 1),

-- SIG_SLEEP_LATENCY_PATTERN
('SIG_SLEEP_LATENCY_PATTERN', 'SYS_SLEEP',  'primary',   1.5, 0.2, 'all', null, true, 1),
('SIG_SLEEP_LATENCY_PATTERN', 'SYS_STRESS', 'secondary', 0.8, 0.1, 'all', null, true, 1),

-- SIG_NIGHT_WAKING_PATTERN
('SIG_NIGHT_WAKING_PATTERN', 'SYS_SLEEP',   'primary',   1.8, 0.2, 'all', null, true, 1),
('SIG_NIGHT_WAKING_PATTERN', 'SYS_HORMONAL','secondary', 0.8, 0.0, 'all', null, true, 1),

-- SIG_UNREFRESHING_SLEEP
('SIG_UNREFRESHING_SLEEP', 'SYS_SLEEP',     'primary',   1.5, 0.2, 'all', null, true, 1),
('SIG_UNREFRESHING_SLEEP', 'SYS_RECOVERY',  'primary',   1.5, 0.2, 'all', null, true, 1),

-- SIG_STRESS_LOAD
('SIG_STRESS_LOAD', 'SYS_STRESS',           'primary',   2.0, 0.3, 'all', null, true, 1),
('SIG_STRESS_LOAD', 'SYS_HORMONAL',         'secondary', 1.0, 0.1, 'all', null, true, 1),

-- SIG_STRESS_SENSITIVITY
('SIG_STRESS_SENSITIVITY', 'SYS_STRESS',    'primary',   1.8, 0.2, 'all', null, true, 1),
('SIG_STRESS_SENSITIVITY', 'SYS_RECOVERY',  'secondary', 1.0, 0.1, 'all', null, true, 1),

-- SIG_RECOVERY_STRAIN
('SIG_RECOVERY_STRAIN', 'SYS_RECOVERY',     'primary',   2.0, 0.3, 'all', null, true, 1),
('SIG_RECOVERY_STRAIN', 'SYS_CARDIO',       'secondary', 1.0, 0.1, 'all', null, true, 1),

-- SIG_ENERGY_VARIABILITY
('SIG_ENERGY_VARIABILITY', 'SYS_METABOLIC', 'secondary', 1.2, 0.1, 'all', null, true, 1),
('SIG_ENERGY_VARIABILITY', 'SYS_NUTRITION', 'contextual',0.7, 0.0, 'all', null, true, 1),

-- SIG_PERSISTENT_FATIGUE
('SIG_PERSISTENT_FATIGUE', 'SYS_RECOVERY',  'secondary', 1.5, 0.1, 'all', null, true, 1),
('SIG_PERSISTENT_FATIGUE', 'SYS_MICRO',     'contextual',0.8, 0.0, 'all', null, true, 1),

-- SIG_BLOOD_SUGAR_INSTABILITY
('SIG_BLOOD_SUGAR_INSTABILITY', 'SYS_METABOLIC', 'primary',   2.0, 0.3, 'all', null, true, 1),
('SIG_BLOOD_SUGAR_INSTABILITY', 'SYS_BIOMARKERS_CTX', 'secondary', 1.0, 0.2, 'all', null, true, 1),

-- SIG_METABOLIC_VARIABILITY
('SIG_METABOLIC_VARIABILITY', 'SYS_METABOLIC', 'primary', 1.5, 0.2, 'all', null, true, 1),
('SIG_METABOLIC_VARIABILITY', 'SYS_NUTRITION', 'secondary', 0.8, 0.1, 'all', null, true, 1),

-- SIG_HORMONAL_VARIABILITY
('SIG_HORMONAL_VARIABILITY', 'SYS_HORMONAL', 'primary',  2.0, 0.3, 'all', null, true, 1),
('SIG_HORMONAL_VARIABILITY', 'SYS_INFLAM_CTX','contextual',0.6,0.0, 'all', null, true, 1),

-- SIG_CYCLE_LINKED_PATTERN
('SIG_CYCLE_LINKED_PATTERN', 'SYS_HORMONAL', 'primary',  2.0, 0.3, 'all', null, true, 1),
('SIG_CYCLE_LINKED_PATTERN', 'SYS_INFLAM_CTX','secondary',0.8,0.1, 'all', null, true, 1),

-- SIG_GUT_DISRUPTION
('SIG_GUT_DISRUPTION', 'SYS_GUT',           'primary',   2.0, 0.3, 'all', null, true, 1),
('SIG_GUT_DISRUPTION', 'SYS_INFLAM_CTX',    'secondary', 1.0, 0.1, 'all', null, true, 1),

-- SIG_APPETITE_INSTABILITY
('SIG_APPETITE_INSTABILITY', 'SYS_GUT',      'secondary', 1.0, 0.1, 'all', null, true, 1),
('SIG_APPETITE_INSTABILITY', 'SYS_METABOLIC','secondary', 1.0, 0.1, 'all', null, true, 1),

-- SIG_MICRONUTRIENT_PATTERN
('SIG_MICRONUTRIENT_PATTERN', 'SYS_MICRO',   'primary',   2.0, 0.3, 'all', null, true, 1),
('SIG_MICRONUTRIENT_PATTERN', 'SYS_NUTRITION','secondary',1.2, 0.1, 'all', null, true, 1),

-- SIG_SKIN_HAIR_PATTERN
('SIG_SKIN_HAIR_PATTERN', 'SYS_HORMONAL',    'secondary', 1.0, 0.1, 'all', null, true, 1),
('SIG_SKIN_HAIR_PATTERN', 'SYS_MICRO',       'secondary', 1.0, 0.1, 'all', null, true, 1),

-- SIG_CARDIO_STRAIN_CONTEXT
('SIG_CARDIO_STRAIN_CONTEXT', 'SYS_CARDIO',  'primary',   1.8, 0.2, 'all', null, true, 1),
('SIG_CARDIO_STRAIN_CONTEXT', 'SYS_RECOVERY','secondary', 1.0, 0.1, 'all', null, true, 1),

-- SIG_CONTRADICTORY_PATTERN (meta — biomarkers context)
('SIG_CONTRADICTORY_PATTERN', 'SYS_BIOMARKERS_CTX', 'contextual', 0.5, 0.0, 'all', null, true, 1),

-- SIG_IMPROVING_TREND
('SIG_IMPROVING_TREND', 'SYS_RECOVERY',      'contextual', 0.5, 0.1, 'all', null, true, 1),

-- SIG_DECLINING_TREND
('SIG_DECLINING_TREND', 'SYS_RECOVERY',      'contextual', 0.8, 0.0, 'all', null, true, 1),
('SIG_DECLINING_TREND', 'SYS_STRESS',        'contextual', 0.6, 0.0, 'all', null, true, 1),

-- SIG_LOW_CONTEXT_PATTERN
('SIG_LOW_CONTEXT_PATTERN', 'SYS_BIOMARKERS_CTX', 'contextual', 0.2, 0.0, 'all', null, true, 1);


-- ════════════════════════════════════════════════════════════
-- signal_to_hero_map
-- ════════════════════════════════════════════════════════════

insert into signal_to_hero_map (
  signal_code, hero_code, weight, specificity_score, priority_score,
  life_stage_scope, conditions_json, approved, version
) values

-- ── HERO_BLOOD_SUGAR_INSTAB ──────────────────────────────────
('SIG_BLOOD_SUGAR_INSTABILITY',  'HERO_BLOOD_SUGAR_INSTAB', 3.0, 0.95, 0.90, 'all', null, true, 1),
('SIG_METABOLIC_VARIABILITY',    'HERO_BLOOD_SUGAR_INSTAB', 1.5, 0.70, 0.60, 'all', null, true, 1),
('SIG_ENERGY_VARIABILITY',       'HERO_BLOOD_SUGAR_INSTAB', 1.2, 0.60, 0.55, 'all', null, true, 1),
('SIG_APPETITE_INSTABILITY',     'HERO_BLOOD_SUGAR_INSTAB', 1.0, 0.55, 0.50, 'all', null, true, 1),

-- ── HERO_SLEEP_DISRUPTION ────────────────────────────────────
('SIG_SLEEP_DISRUPTION',         'HERO_SLEEP_DISRUPTION',   3.0, 0.95, 0.90, 'all', null, true, 1),
('SIG_NIGHT_WAKING_PATTERN',     'HERO_SLEEP_DISRUPTION',   2.0, 0.85, 0.80, 'all', null, true, 1),
('SIG_UNREFRESHING_SLEEP',       'HERO_SLEEP_DISRUPTION',   1.8, 0.80, 0.75, 'all', null, true, 1),
('SIG_SLEEP_LATENCY_PATTERN',    'HERO_SLEEP_DISRUPTION',   1.5, 0.70, 0.65, 'all', null, true, 1),

-- ── HERO_STRESS_LOAD ─────────────────────────────────────────
('SIG_STRESS_LOAD',              'HERO_STRESS_LOAD',        3.0, 0.95, 0.90, 'all', null, true, 1),
('SIG_STRESS_SENSITIVITY',       'HERO_STRESS_LOAD',        2.0, 0.80, 0.75, 'all', null, true, 1),
('SIG_SLEEP_LATENCY_PATTERN',    'HERO_STRESS_LOAD',        1.2, 0.60, 0.55, 'all', null, true, 1),
('SIG_RECOVERY_STRAIN',          'HERO_STRESS_LOAD',        1.0, 0.55, 0.50, 'all', null, true, 1),

-- ── HERO_IRON_DEPLETION ──────────────────────────────────────
('SIG_PERSISTENT_FATIGUE',       'HERO_IRON_DEPLETION',     2.5, 0.75, 0.70, 'all', null, true, 1),
('SIG_MICRONUTRIENT_PATTERN',    'HERO_IRON_DEPLETION',     3.0, 0.90, 0.85, 'all', null, true, 1),
('SIG_UNREFRESHING_SLEEP',       'HERO_IRON_DEPLETION',     1.2, 0.60, 0.55, 'all', null, true, 1),
('SIG_SKIN_HAIR_PATTERN',        'HERO_IRON_DEPLETION',     1.5, 0.65, 0.60, 'all', null, true, 1),

-- ── HERO_HORMONAL_VARIABILITY ────────────────────────────────
('SIG_HORMONAL_VARIABILITY',     'HERO_HORMONAL_VARIABILITY', 3.0, 0.95, 0.90, 'all', null, true, 1),
('SIG_CYCLE_LINKED_PATTERN',     'HERO_HORMONAL_VARIABILITY', 2.5, 0.90, 0.85, 'all', null, true, 1),
('SIG_SKIN_HAIR_PATTERN',        'HERO_HORMONAL_VARIABILITY', 1.5, 0.65, 0.60, 'all', null, true, 1),
('SIG_NIGHT_WAKING_PATTERN',     'HERO_HORMONAL_VARIABILITY', 1.0, 0.55, 0.50, 'perimenopause', null, true, 1),

-- ── HERO_GUT_PATTERN ─────────────────────────────────────────
('SIG_GUT_DISRUPTION',           'HERO_GUT_PATTERN',        3.0, 0.95, 0.90, 'all', null, true, 1),
('SIG_APPETITE_INSTABILITY',     'HERO_GUT_PATTERN',        1.8, 0.70, 0.65, 'all', null, true, 1),
('SIG_METABOLIC_VARIABILITY',    'HERO_GUT_PATTERN',        1.0, 0.55, 0.50, 'all', null, true, 1),
('SIG_BLOATING',                 'HERO_GUT_PATTERN',        1.5, 0.70, 0.65, 'all', null, true, 1),

-- ── HERO_ENERGY_METABOLIC ────────────────────────────────────
('SIG_ENERGY_VARIABILITY',       'HERO_ENERGY_METABOLIC',   2.5, 0.85, 0.80, 'all', null, true, 1),
('SIG_PERSISTENT_FATIGUE',       'HERO_ENERGY_METABOLIC',   2.0, 0.80, 0.75, 'all', null, true, 1),
('SIG_METABOLIC_VARIABILITY',    'HERO_ENERGY_METABOLIC',   1.5, 0.65, 0.60, 'all', null, true, 1),
('SIG_BLOOD_SUGAR_INSTABILITY',  'HERO_ENERGY_METABOLIC',   1.2, 0.60, 0.55, 'all', null, true, 1),

-- ── HERO_RECOVERY_STRAIN ─────────────────────────────────────
('SIG_RECOVERY_STRAIN',          'HERO_RECOVERY_STRAIN',    3.0, 0.95, 0.90, 'all', null, true, 1),
('SIG_UNREFRESHING_SLEEP',       'HERO_RECOVERY_STRAIN',    2.0, 0.80, 0.75, 'all', null, true, 1),
('SIG_CARDIO_STRAIN_CONTEXT',    'HERO_RECOVERY_STRAIN',    1.5, 0.65, 0.60, 'all', null, true, 1),
('SIG_DECLINING_TREND',          'HERO_RECOVERY_STRAIN',    1.0, 0.50, 0.50, 'all', null, true, 1),

-- ── HERO_BASELINE ────────────────────────────────────────────
('SIG_LOW_CONTEXT_PATTERN',      'HERO_BASELINE',           3.0, 0.85, 0.80, 'all', null, true, 1),
('SIG_IMPROVING_TREND',          'HERO_BASELINE',           2.0, 0.75, 0.70, 'all', null, true, 1),
('SIG_CONTRADICTORY_PATTERN',    'HERO_BASELINE',           0.5, 0.20, 0.20, 'all', null, true, 1);
