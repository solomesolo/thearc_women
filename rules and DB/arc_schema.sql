CREATE TABLE survey_questions (
  question_id INTEGER PRIMARY KEY,
  question_text TEXT NOT NULL,
  field_key TEXT NOT NULL,
  question_type TEXT NOT NULL,
  test_bundles TEXT
);

CREATE TABLE survey_answer_options (
  answer_option_id INTEGER PRIMARY KEY,
  question_id INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  field_key TEXT NOT NULL,
  answer_option TEXT NOT NULL,
  test_bundle TEXT,
  rule_domains TEXT,
  default_recommended_checks TEXT,
  default_intervention_track TEXT,
  default_rule_strength TEXT,
  default_customer_logic TEXT,
  FOREIGN KEY(question_id) REFERENCES survey_questions(question_id)
);

CREATE TABLE biomarkers (
  biomarker_id INTEGER PRIMARY KEY,
  biomarker_name TEXT NOT NULL,
  sample_type TEXT,
  category TEXT,
  sub_category TEXT,
  biomarker_tags TEXT
);

CREATE TABLE answer_option_biomarker_rules (
  question_id INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  field_key TEXT NOT NULL,
  answer_option_id INTEGER NOT NULL,
  answer_option TEXT NOT NULL,
  test_bundle TEXT,
  biomarker_id INTEGER NOT NULL,
  biomarker_name TEXT NOT NULL,
  biomarker_category TEXT,
  biomarker_sub_category TEXT,
  matched_tags TEXT,
  rule_strength TEXT,
  recommended_check TEXT,
  recommended_intervention_track TEXT,
  customer_logic_explanation TEXT,
  FOREIGN KEY(answer_option_id) REFERENCES survey_answer_options(answer_option_id),
  FOREIGN KEY(biomarker_id) REFERENCES biomarkers(biomarker_id)
);

CREATE TABLE biomarker_coverage (
  biomarker_id INTEGER PRIMARY KEY,
  biomarker_name TEXT NOT NULL,
  category TEXT,
  sub_category TEXT,
  biomarker_tags TEXT,
  linked_rule_count INTEGER NOT NULL,
  coverage_status TEXT NOT NULL,
  FOREIGN KEY(biomarker_id) REFERENCES biomarkers(biomarker_id)
);

CREATE INDEX idx_rules_answer_option ON answer_option_biomarker_rules(answer_option_id);
CREATE INDEX idx_rules_biomarker ON answer_option_biomarker_rules(biomarker_id);
CREATE INDEX idx_rules_field_key ON answer_option_biomarker_rules(field_key);
