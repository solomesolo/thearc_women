-- ============================================================
-- Engine Pipeline Tables — The Arc Woman
-- Migration: 20260326000000
-- Adds 9 rule/config tables + 5 output tables for the
-- deterministic 7-layer interpretation pipeline.
-- ============================================================

-- ── Helpers ──────────────────────────────────────────────────

-- Approved versioned rows helper: engine always selects the
-- highest-version approved row for a given code.

-- ── Layer 1: Survey Answer Normalization ─────────────────────
-- Maps raw survey answer strings → typed canonical values.
-- One row per (survey_version, question_code, raw_value).

create table if not exists survey_answer_normalization (
  id                uuid        primary key default gen_random_uuid(),
  survey_version    text        not null default 'arc_core_intake_v1',
  question_code     text        not null,          -- variable_id from survey JSON
  raw_value         text        not null,          -- exact string to match
  normalized_value  text,                          -- string representation of canonical value
  normalized_type   text        not null,          -- 'boolean' | 'ordinal' | 'numeric' | 'canonical_text' | 'unknown'
  ordinal_value     int,                           -- set when normalized_type = 'ordinal'
  boolean_value     boolean,                       -- set when normalized_type = 'boolean'
  numeric_value     numeric,                       -- set when normalized_type = 'numeric'
  canonical_code    text,                          -- machine-safe code (e.g. 'reproductive', 'most_days')
  life_stage_scope  text        not null default 'all',
  approved          boolean     not null default true,
  version           int         not null default 1,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists san_lookup
  on survey_answer_normalization (survey_version, question_code, raw_value, approved, version desc);

-- ── Layer 2: Derived Signal Flag Rules ───────────────────────
-- Each row defines one signal and its DB-evaluated firing rule.

create table if not exists derived_signal_flags (
  id                    uuid        primary key default gen_random_uuid(),
  signal_code           text        not null,
  signal_name           text        not null,
  domain                text        not null,      -- 'sleep' | 'stress' | 'energy' | 'metabolic' | 'hormonal' | 'gut' | 'meta'
  source_variables      jsonb       not null default '[]',   -- array of question_code strings
  trigger_logic         text,                      -- plain-English description
  rule_json             jsonb       not null,       -- machine-evaluated rule tree
  min_trigger_score     numeric     not null default 0,
  supporting_conditions jsonb,                     -- optional additional conditions
  exclusion_conditions  jsonb,                     -- conditions that suppress this signal
  life_stage_modifier   jsonb,                     -- { scope, threshold_delta, strength_delta }
  default_strength      text        not null default 'mild', -- 'mild' | 'moderate' | 'strong'
  confidence_rule       jsonb,                     -- rules that determine confidence band
  rule_hint             text,
  safe_language_notes   text,
  approved              boolean     not null default true,
  version               int         not null default 1,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists dsf_lookup
  on derived_signal_flags (signal_code, approved, version desc);

-- ── Layer 3: Signal Definitions (content / semantic metadata) ─
-- Already exists as signal_definitions; added here for reference.
-- Engine reads domain/category from here for grouping.

-- ── Layer 4a: Signal → Key Area mappings ────────────────────

create table if not exists signal_to_key_area_map (
  id                uuid        primary key default gen_random_uuid(),
  signal_code       text        not null,
  key_area_code     text        not null,          -- 'sleep' | 'stress' | 'energy' | 'recovery' | 'hormones' | 'cycle' | 'metabolism' | 'nutrition' | 'cardiovascular' | 'gut' | 'skin_hair'
  influence_type    text        not null default 'secondary', -- 'primary' | 'secondary' | 'contextual'
  weight            numeric     not null default 1.0,
  confidence_effect numeric     not null default 0,  -- additive delta to confidence score
  life_stage_scope  text        not null default 'all',
  conditions_json   jsonb,                          -- optional gate for this mapping
  approved          boolean     not null default true,
  version           int         not null default 1,
  created_at        timestamptz not null default now()
);

create index if not exists stka_lookup
  on signal_to_key_area_map (signal_code, key_area_code, approved, version desc);

-- ── Layer 4b: Signal → Body System mappings ─────────────────

create table if not exists signal_to_body_system_map (
  id                uuid        primary key default gen_random_uuid(),
  signal_code       text        not null,
  body_system_code  text        not null,          -- 'SYS_SLEEP' | 'SYS_STRESS' | 'SYS_HORMONAL' | 'SYS_METABOLIC' | 'SYS_GUT' | 'SYS_RECOVERY' | 'SYS_MICRO' | 'SYS_CARDIO' | 'SYS_BONE' | 'SYS_INFLAM_CTX' | 'SYS_NUTRITION' | 'SYS_BIOMARKERS_CTX'
  influence_type    text        not null default 'secondary',
  weight            numeric     not null default 1.0,
  confidence_effect numeric     not null default 0,
  life_stage_scope  text        not null default 'all',
  conditions_json   jsonb,
  approved          boolean     not null default true,
  version           int         not null default 1,
  created_at        timestamptz not null default now()
);

create index if not exists stbs_lookup
  on signal_to_body_system_map (signal_code, body_system_code, approved, version desc);

-- ── Layer 4c: Signal → Hero mappings ────────────────────────

create table if not exists signal_to_hero_map (
  id                  uuid        primary key default gen_random_uuid(),
  signal_code         text        not null,
  hero_code           text        not null,
  weight              numeric     not null default 1.0,
  specificity_score   numeric     not null default 0.5,  -- 0–1; higher = more specific/explanatory
  priority_score      numeric     not null default 0.5,  -- 0–1; higher = prefer over generic
  life_stage_scope    text        not null default 'all',
  conditions_json     jsonb,
  approved            boolean     not null default true,
  version             int         not null default 1,
  created_at          timestamptz not null default now()
);

create index if not exists sth_lookup
  on signal_to_hero_map (signal_code, hero_code, approved, version desc);

-- ── Layer 5: Key Area State Resolution Rules ─────────────────
-- Which state does a key area resolve to, and under what signal conditions?

create table if not exists key_area_state_resolution_rules (
  id                    uuid        primary key default gen_random_uuid(),
  key_area_code         text        not null,
  state_code            text        not null,      -- code from key_area_states content table
  rule_name             text        not null,
  rule_priority         int         not null default 50,  -- higher = checked first
  required_signals      jsonb       not null default '[]', -- signal_codes that MUST be active
  supporting_signals    jsonb       not null default '[]', -- signal_codes that contribute score
  excluded_signals      jsonb       not null default '[]', -- if any of these active → skip this rule
  minimum_total_weight  numeric     not null default 0,
  minimum_confidence    text        not null default 'low',
  life_stage_scope      text        not null default 'all',
  resolution_logic      text,                      -- plain English
  rule_json             jsonb,                     -- optional additional machine-evaluated gate
  approved              boolean     not null default true,
  version               int         not null default 1,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists kasr_lookup
  on key_area_state_resolution_rules (key_area_code, approved, version desc, rule_priority desc);

-- ── Layer 5b: Body System Resolution Rules ───────────────────

create table if not exists body_system_resolution_rules (
  id                    uuid        primary key default gen_random_uuid(),
  body_system_code      text        not null,
  state_code            text        not null,      -- 'stable' | 'variable' | 'needs_attention'
  rule_name             text        not null,
  rule_priority         int         not null default 50,
  required_signals      jsonb       not null default '[]',
  supporting_signals    jsonb       not null default '[]',
  excluded_signals      jsonb       not null default '[]',
  minimum_total_weight  numeric     not null default 0,
  minimum_confidence    text        not null default 'low',
  life_stage_scope      text        not null default 'all',
  resolution_logic      text,
  rule_json             jsonb,
  approved              boolean     not null default true,
  version               int         not null default 1,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists bsrr_lookup
  on body_system_resolution_rules (body_system_code, approved, version desc, rule_priority desc);

-- ── Layer 6: Hero Resolution Rules ──────────────────────────

create table if not exists hero_resolution_rules (
  id                       uuid        primary key default gen_random_uuid(),
  hero_code                text        not null,
  rule_name                text        not null,
  rule_priority            int         not null default 50,
  required_signals         jsonb       not null default '[]',
  supporting_signals       jsonb       not null default '[]',
  excluded_signals         jsonb       not null default '[]',
  minimum_cluster_score    numeric     not null default 0,
  minimum_specificity_score numeric    not null default 0,
  minimum_confidence       text        not null default 'low',
  non_overlap_constraints  jsonb,                  -- array of hero_codes that suppress this
  life_stage_scope         text        not null default 'all',
  resolution_logic         text,
  rule_json                jsonb,
  approved                 boolean     not null default true,
  version                  int         not null default 1,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists hrr_lookup
  on hero_resolution_rules (hero_code, approved, version desc, rule_priority desc);

-- ── Layer 7: Signal Explainer Map ────────────────────────────

create table if not exists signal_explainer_map (
  id                        uuid        primary key default gen_random_uuid(),
  signal_code               text        not null,
  explanation_type          text        not null,  -- 'positive_driver' | 'negative_driver' | 'ruled_out_driver' | 'contextual_modifier'
  template_text             text        not null,  -- may include {{variable}} placeholders
  required_supporting_answers jsonb     not null default '[]', -- question_codes needed for template vars
  conditions_json           jsonb,                 -- gate: only show when this is true
  priority                  int         not null default 50,
  safe_language_notes       text,
  approved                  boolean     not null default true,
  version                   int         not null default 1,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index if not exists sem_lookup
  on signal_explainer_map (signal_code, explanation_type, approved, version desc, priority desc);

-- ════════════════════════════════════════════════════════════
-- OUTPUT TABLES (written per engine run)
-- ════════════════════════════════════════════════════════════

-- ── user_signal_results ──────────────────────────────────────

create table if not exists user_signal_results (
  id                          uuid        primary key default gen_random_uuid(),
  user_id                     uuid        not null,
  run_id                      text        not null,
  signal_code                 text        not null,
  is_active                   boolean     not null default false,
  signal_strength             text,                -- 'mild' | 'moderate' | 'strong' | null
  confidence                  text        not null default 'low',
  life_stage_modifier_applied text,
  supporting_answers_json     jsonb       not null default '[]',
  contradictions_json         jsonb       not null default '[]',
  debug_trace_json            jsonb       not null default '{}',
  trigger_score               numeric     not null default 0,
  engine_version              text        not null,
  created_at                  timestamptz not null default now(),
  unique (user_id, run_id, signal_code, engine_version)
);

create index if not exists usr_run on user_signal_results (user_id, run_id, engine_version);

-- ── user_key_area_results ────────────────────────────────────

create table if not exists user_key_area_results (
  id                            uuid        primary key default gen_random_uuid(),
  user_id                       uuid        not null,
  run_id                        text        not null,
  key_area_code                 text        not null,
  resolved_state_code           text        not null,
  score                         numeric     not null default 0,
  confidence                    text        not null default 'low',
  contributing_signals_json     jsonb       not null default '[]',
  suppressed_state_candidates_json jsonb    not null default '[]',
  explanation_json              jsonb       not null default '{}',
  engine_version                text        not null,
  created_at                    timestamptz not null default now(),
  unique (user_id, run_id, key_area_code, engine_version)
);

create index if not exists ukar_run on user_key_area_results (user_id, run_id, engine_version);

-- ── user_body_system_results ─────────────────────────────────

create table if not exists user_body_system_results (
  id                            uuid        primary key default gen_random_uuid(),
  user_id                       uuid        not null,
  run_id                        text        not null,
  body_system_code              text        not null,
  resolved_state_code           text        not null,
  score                         numeric     not null default 0,
  confidence                    text        not null default 'low',
  contributing_signals_json     jsonb       not null default '[]',
  suppressed_state_candidates_json jsonb    not null default '[]',
  explanation_json              jsonb       not null default '{}',
  engine_version                text        not null,
  created_at                    timestamptz not null default now(),
  unique (user_id, run_id, body_system_code, engine_version)
);

create index if not exists ubsr_run on user_body_system_results (user_id, run_id, engine_version);

-- ── user_hero_result ─────────────────────────────────────────

create table if not exists user_hero_result (
  id                            uuid        primary key default gen_random_uuid(),
  user_id                       uuid        not null,
  run_id                        text        not null,
  hero_code                     text        not null,
  score                         numeric     not null default 0,
  confidence                    text        not null default 'low',
  contributing_signals_json     jsonb       not null default '[]',
  why_selected_json             jsonb       not null default '{}',
  suppressed_hero_candidates_json jsonb     not null default '[]',
  explanation_json              jsonb       not null default '{}',
  engine_version                text        not null,
  created_at                    timestamptz not null default now(),
  unique (user_id, run_id, engine_version)
);

create index if not exists uhr_run on user_hero_result (user_id, run_id, engine_version);

-- ── user_influencer_results ──────────────────────────────────

create table if not exists user_influencer_results (
  id                    uuid        primary key default gen_random_uuid(),
  user_id               uuid        not null,
  run_id                text        not null,
  influencer_code       text        not null,
  score                 numeric     not null default 0,
  confidence            text        not null default 'low',
  source_signal_codes   jsonb       not null default '[]',
  explanation_json      jsonb       not null default '{}',
  engine_version        text        not null,
  created_at            timestamptz not null default now(),
  unique (user_id, run_id, influencer_code, engine_version)
);

create index if not exists uir_run on user_influencer_results (user_id, run_id, engine_version);
