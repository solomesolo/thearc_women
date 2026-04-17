-- Add clinical_notes_records for non-lab, non-imaging clinical documents

CREATE TABLE IF NOT EXISTS clinical_notes_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid UNIQUE NOT NULL,
  user_email text NOT NULL,
  report_date date NULL,
  document_type text NOT NULL,
  summary text NULL,
  diagnoses text[] NOT NULL DEFAULT '{}',
  recommendations text NULL,
  medications jsonb NOT NULL DEFAULT '[]'::jsonb,
  raw_notes text NULL,
  source text NOT NULL DEFAULT 'extraction',
  parsing_warnings text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'clinical_notes_records_document_id_fkey'
  ) THEN
    ALTER TABLE clinical_notes_records
      ADD CONSTRAINT clinical_notes_records_document_id_fkey
      FOREIGN KEY (document_id)
      REFERENCES health_uploads(document_id)
      ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS clinical_notes_records_user_date_idx
  ON clinical_notes_records (user_email, report_date);

