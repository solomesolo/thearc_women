-- ARC enriched recommendation schema — fixed for individualized content, priority caps, and timeline scheduling
-- Generated 2026-04-24T12:17:23+00:00

CREATE TABLE "answer_option_biomarker_rules" (
"question_id" INTEGER,
  "question_text" TEXT,
  "field_key" TEXT,
  "answer_option_id" INTEGER,
  "answer_option" TEXT,
  "test_bundle" TEXT,
  "biomarker_id" INTEGER,
  "biomarker_name" TEXT,
  "biomarker_category" TEXT,
  "biomarker_sub_category" TEXT,
  "matched_tags" TEXT,
  "rule_strength" TEXT,
  "recommended_check" TEXT,
  "recommended_intervention_track" TEXT,
  "customer_logic_explanation" TEXT
);

CREATE TABLE answer_signal_explanations (
    field_key TEXT NOT NULL,
    answer_option TEXT NOT NULL,
    test_bundle TEXT,
    signal_source TEXT NOT NULL,
    signal_label TEXT NOT NULL,
    signal_explanation TEXT NOT NULL,
    default_priority_boost INTEGER DEFAULT 0,
    triggered_check_keys TEXT,
    signal_key TEXT PRIMARY KEY
);

CREATE TABLE "biomarker_coverage" (
"biomarker_id" INTEGER,
  "biomarker_name" TEXT,
  "category" TEXT,
  "sub_category" TEXT,
  "biomarker_tags" TEXT,
  "linked_rule_count" INTEGER,
  "coverage_status" TEXT
);

CREATE TABLE biomarker_priority_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  biomarker_id TEXT NOT NULL,
  biomarker_name TEXT NOT NULL,
  check_key TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  trigger_key TEXT NOT NULL,
  weight INTEGER NOT NULL,
  max_priority_tier TEXT NOT NULL CHECK(max_priority_tier IN ('core_now','high_later','mid_priority','optional_later','context_only')),
  reason_template TEXT NOT NULL,
  is_blood_marker INTEGER NOT NULL DEFAULT 1,
  is_screening INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE "biomarkers" (
"biomarker_id" INTEGER,
  "biomarker_name" TEXT,
  "sample_type" TEXT,
  "category" TEXT,
  "sub_category" TEXT,
  "biomarker_tags" TEXT
);

CREATE TABLE canonical_check_biomarker_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  check_key TEXT NOT NULL UNIQUE,
  min_core INTEGER NOT NULL DEFAULT 1,
  max_core INTEGER NOT NULL DEFAULT 4,
  default_timeframe TEXT NOT NULL,
  overflow_strategy TEXT NOT NULL DEFAULT 'downgrade_to_high_later',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE canonical_check_config (
    check_key TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    short_summary TEXT NOT NULL,
    recommended_timing TEXT NOT NULL,
    priority_rule TEXT NOT NULL,
    what_can_wait TEXT,
    next_action TEXT,
    ui_priority_order INTEGER
, check_name TEXT, short_summary_template TEXT, default_priority_rank INTEGER, category TEXT, max_core_biomarkers INTEGER, default_timeframe TEXT, what_can_wait_template TEXT, description_long TEXT, created_at TEXT, updated_at TEXT);

CREATE TABLE check_included_tests (
    check_key TEXT NOT NULL,
    display_name TEXT NOT NULL,
    included_category TEXT NOT NULL,
    biomarker_id INTEGER NOT NULL,
    biomarker_name TEXT NOT NULL,
    sample_type TEXT,
    biomarker_category TEXT,
    biomarker_sub_category TEXT,
    priority_tier TEXT NOT NULL,
    why_included TEXT NOT NULL,
    source_rule_count INTEGER NOT NULL,
    PRIMARY KEY (check_key, included_category, biomarker_id)
);

CREATE TABLE check_priority_explanations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  check_key TEXT NOT NULL,
  score_min INTEGER NOT NULL,
  score_max INTEGER NOT NULL,
  impact_tier TEXT NOT NULL,
  explanation_template TEXT NOT NULL
);

CREATE TABLE enriched_recommendation_rules (
    question_id INTEGER,
    field_key TEXT,
    answer_option_id INTEGER,
    answer_option TEXT,
    test_bundle TEXT,
    biomarker_id INTEGER,
    biomarker_name TEXT,
    biomarker_category TEXT,
    biomarker_sub_category TEXT,
    matched_tags TEXT,
    rule_strength TEXT,
    internal_recommended_check TEXT,
    check_key TEXT,
    display_name TEXT,
    included_category TEXT,
    recommended_timing TEXT,
    recommended_intervention_track TEXT,
    customer_logic_explanation TEXT,
    why_included TEXT,
    priority_tier TEXT
);

CREATE TABLE internal_check_mapping (
    internal_recommended_check TEXT PRIMARY KEY,
    check_key TEXT NOT NULL,
    display_name TEXT NOT NULL,
    notes TEXT
);

CREATE TABLE recommendation_content_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_type TEXT NOT NULL CHECK(content_type IN ('summary','why','what_now','what_later','priority','timeline')),
  check_key TEXT NOT NULL,
  template TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE screening_timeframe_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  check_key TEXT NOT NULL,
  trigger_type TEXT,
  trigger_key TEXT,
  score_min INTEGER NOT NULL DEFAULT 0,
  score_max INTEGER NOT NULL DEFAULT 999,
  last_test_status TEXT,
  life_stage TEXT,
  age_group TEXT,
  recommended_timeframe TEXT NOT NULL CHECK(recommended_timeframe IN ('current_month','next_3_months','next_6_months','next_year','optional_later')),
  timing_reason_template TEXT NOT NULL
);

CREATE TABLE signal_check_explanation_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  signal_key TEXT NOT NULL,
  signal_label TEXT NOT NULL,
  check_key TEXT NOT NULL,
  template TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  priority_weight INTEGER NOT NULL DEFAULT 1,
  content_priority INTEGER NOT NULL DEFAULT 5,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(signal_key, check_key)
);

CREATE TABLE sqlite_sequence(name,seq);

CREATE TABLE "survey_answer_options" (
"answer_option_id" INTEGER,
  "question_id" INTEGER,
  "question_text" TEXT,
  "field_key" TEXT,
  "answer_option" TEXT,
  "test_bundle" TEXT,
  "rule_domains" TEXT,
  "default_recommended_checks" TEXT,
  "default_intervention_track" TEXT,
  "default_rule_strength" TEXT,
  "default_customer_logic" TEXT
);

CREATE TABLE "survey_questions" (
"question_id" INTEGER,
  "question_text" TEXT,
  "field_key" TEXT,
  "question_type" TEXT,
  "test_bundles" TEXT
);

CREATE TABLE user_pathway_biomarker_selection (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  check_key TEXT NOT NULL,
  biomarker_id TEXT NOT NULL,
  biomarker_name TEXT NOT NULL,
  priority_tier TEXT NOT NULL CHECK(priority_tier IN ('core_now','high_later','mid_priority','optional_later','context_only')),
  timeframe TEXT NOT NULL CHECK(timeframe IN ('current_month','next_3_months','next_6_months','next_year','optional_later')),
  score INTEGER NOT NULL,
  rank_within_check INTEGER NOT NULL,
  rank_global INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE user_pathway_schedule (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  check_key TEXT NOT NULL,
  timeframe TEXT NOT NULL CHECK(timeframe IN ('current_month','next_3_months','next_6_months','next_year','optional_later')),
  calendar_start TEXT NOT NULL,
  calendar_end TEXT NOT NULL,
  priority_rank INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'MISSING' CHECK(status IN ('MISSING','PLANNED','DONE')),
  timing_reason TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, check_key)
);

CREATE VIEW v_recommendation_content_source AS
SELECT e.*, c.short_summary, c.priority_rule, c.what_can_wait, c.next_action, s.signal_source, s.signal_label, s.signal_explanation, s.default_priority_boost
FROM enriched_recommendation_rules e
LEFT JOIN canonical_check_config c ON e.check_key = c.check_key
LEFT JOIN answer_signal_explanations s
  ON e.field_key=s.field_key AND e.answer_option=s.answer_option AND COALESCE(e.test_bundle,'')=COALESCE(s.test_bundle,'');

CREATE VIEW v_recommendation_content_source_fixed AS
SELECT
  r.question_id,
  r.field_key,
  r.answer_option_id,
  r.answer_option,
  r.test_bundle,
  r.biomarker_id,
  r.biomarker_name,
  r.biomarker_category,
  r.biomarker_sub_category,
  r.matched_tags,
  r.rule_strength,
  r.check_key,
  COALESCE(c.check_name, c.display_name, r.display_name) AS check_name,
  c.category AS check_category,
  c.short_summary_template,
  c.default_timeframe,
  c.max_core_biomarkers,
  c.what_can_wait_template,
  r.recommended_intervention_track,
  r.customer_logic_explanation,
  r.why_included,
  r.priority_tier AS source_priority_tier,
  bpr.trigger_type,
  bpr.weight AS biomarker_priority_weight,
  bpr.max_priority_tier,
  bpr.reason_template AS personalized_reason_template,
  sct.template AS signal_check_explanation_template,
  cit.included_category,
  cit.priority_tier AS included_test_default_priority
FROM enriched_recommendation_rules r
LEFT JOIN canonical_check_config c ON c.check_key = r.check_key
LEFT JOIN biomarker_priority_rules bpr
  ON bpr.biomarker_id = r.biomarker_id AND bpr.check_key = r.check_key
LEFT JOIN answer_signal_explanations ase
  ON ase.field_key = r.field_key AND ase.answer_option = r.answer_option AND (ase.test_bundle = r.test_bundle OR ase.test_bundle IS NULL OR r.test_bundle IS NULL)
LEFT JOIN signal_check_explanation_templates sct
  ON sct.signal_key = ase.signal_key AND sct.check_key = r.check_key
LEFT JOIN check_included_tests cit
  ON cit.check_key = r.check_key AND cit.biomarker_id = r.biomarker_id;

CREATE VIEW v_user_recommendation_engine_contract AS
SELECT
  c.check_key,
  COALESCE(c.check_name, c.display_name) AS check_name,
  c.short_summary_template,
  c.category,
  c.max_core_biomarkers,
  s.min_core,
  s.max_core,
  c.default_timeframe,
  c.what_can_wait_template,
  c.description_long,
  c.default_priority_rank,
  s.overflow_strategy
FROM canonical_check_config c
LEFT JOIN canonical_check_biomarker_slots s ON s.check_key = c.check_key;

CREATE INDEX idx_bpr_biomarker ON biomarker_priority_rules(biomarker_id);

CREATE INDEX idx_bpr_check_trigger ON biomarker_priority_rules(check_key, trigger_type, trigger_key);

CREATE INDEX idx_schedule_user_time ON user_pathway_schedule(user_id, timeframe, priority_rank);

CREATE INDEX idx_sct_signal_check ON signal_check_explanation_templates(signal_key, check_key);

CREATE INDEX idx_user_pathway_user ON user_pathway_biomarker_selection(user_id, timeframe, priority_tier);

