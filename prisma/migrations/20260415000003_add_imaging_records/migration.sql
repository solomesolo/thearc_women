-- Add imaging_records for narrative imaging reports

CREATE TABLE IF NOT EXISTS imaging_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid UNIQUE NOT NULL,
  user_email text NOT NULL,
  report_date date NULL,
  modality text NULL,
  body_part text NULL,
  findings text NULL,
  impression text NULL,
  recommendations text NULL,
  diagnoses text[] NOT NULL DEFAULT '{}',
  source text NOT NULL DEFAULT 'extraction',
  parsing_warnings text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- FK to health_uploads(document_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'imaging_records_document_id_fkey'
  ) THEN
    ALTER TABLE imaging_records
      ADD CONSTRAINT imaging_records_document_id_fkey
      FOREIGN KEY (document_id)
      REFERENCES health_uploads(document_id)
      ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS imaging_records_user_date_idx
  ON imaging_records (user_email, report_date);

