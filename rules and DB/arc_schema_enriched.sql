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

CREATE TABLE "biomarkers" (
"biomarker_id" INTEGER,
  "biomarker_name" TEXT,
  "sample_type" TEXT,
  "category" TEXT,
  "sub_category" TEXT,
  "biomarker_tags" TEXT
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
);

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

CREATE VIEW v_recommendation_content_source AS
SELECT e.*, c.short_summary, c.priority_rule, c.what_can_wait, c.next_action, s.signal_source, s.signal_label, s.signal_explanation, s.default_priority_boost
FROM enriched_recommendation_rules e
LEFT JOIN canonical_check_config c ON e.check_key = c.check_key
LEFT JOIN answer_signal_explanations s
  ON e.field_key=s.field_key AND e.answer_option=s.answer_option AND COALESCE(e.test_bundle,'')=COALESCE(s.test_bundle,'');