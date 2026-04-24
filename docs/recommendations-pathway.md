# Survey-driven Recommendations (Pathway) — Architecture Notes

## Source of truth

- **Rules DB**: `rules and DB/arc_survey_rule_engine_enriched_cmo_fixed.sqlite`
  - **Canonical spec/workbook**:
    - `rules and DB/arc_relation_table_enriched_cmo_fixed.xlsx`
    - `rules and DB/arc_schema_enriched_cmo_fixed.sql`
  - UI-facing copy & canonical check naming live in:
    - `canonical_check_config`
    - `answer_signal_explanations`
    - `check_included_tests`
    - `enriched_recommendation_rules`

## Backend flow

### 1) Normalize survey answers

- Source: `QuestionnaireAnswer` rows for the latest `QuestionnaireSession`
- Normalization: `lib/recommendations-engine/answerMapper.ts`
  - Maps internal survey keys (e.g. `symptoms: fatigue`) to the exact `answer_option` labels used in SQLite.
  - Handles `last_tests` by collapsing to worst recency (MVP behavior).

### 2) Resolve rules → checks

- Rule resolution: `lib/recommendations-engine/sqliteRules.ts`
  - Matches answers to `enriched_recommendation_rules`
  - Pulls signal explanations from `answer_signal_explanations`
  - Pulls included tests from `check_included_tests`

- Grouping/scoring: `lib/recommendations-engine/checkResolver.ts`
  - Groups matched rule rows by `check_key`
  - Calculates score from rule strength + signal boosts
  - Builds:
    - `includedTestsPreview` (3 items)
    - `includedTestsByCategory` (category → tests)
    - `whyForYou` from selected signal explanations

### 3) Assign time horizons (“pathway”)

- Implemented in `lib/recommendations-engine/recommendationsService.ts`
- Default buckets (MVP):
  - `next_month`: score >= 8 (cap 3)
  - `next_3_months`: score 5–7 (cap 4)
  - `next_6_months`: score 3–4 (cap 4)
  - `next_year`: overflow from above (cap 4)
  - `optional_later`: score <= 2 + remaining overflow

### 4) User state + completeness

User state is stored separately from rules.

- Table: `user_check_statuses`
  - `status`: `missing | reminder_set | planned | completed | result_uploaded`
  - `planned_at` + `completed_at` timestamps

- Completeness score (MVP):  
  \[
  score = round(\frac{completed}{total} \cdot 100)
  \]
  where completed = `completed` or `result_uploaded`.

## API contract

### Read

- `GET /api/recommendations/:userId`
  - Returns:
    - `summary.nextBestAction`
    - `summary.nextMonthCount`, `plannedCount`, `completedCount`, `uploadedResultsCount`, `healthScore`
    - `pathway` buckets

### Mutations

- `PATCH /api/recommendations/:userId/:checkKey/status`
  - Body: `{ "status": "planned" }` (or other allowed status)

- `POST /api/recommendations/:userId/:checkKey/reminder`
  - Body: `{ "remindAt": "<iso>", "timeframe": "next_month" }`

- `DELETE /api/recommendations/:userId/:checkKey/reminder`

- `POST /api/recommendations/:userId/:checkKey/result`
  - MVP: link an existing `/api/upload` document via `documentId` + metadata.

- `GET /api/health-wallet/:userId/results`
  - Returns uploaded result links per user.

## Frontend wiring

- Shared hook: `lib/recommendations/useRecommendations.ts`
  - Used by:
    - `app/app/dashboard/page.tsx`
    - `app/results/action-plan/page.tsx`
    - `app/results/overview/page.tsx` (wallet preview)

## How product edits copy/mappings

- **Check naming + timing + “can wait” copy**: edit `canonical_check_config`
- **User-facing labels & explanations for answers**: edit `answer_signal_explanations`
- **Included test list display**: edit `check_included_tests`

