-- Engine D — Progress Tracking Engine (progress current state + append-only events + action options)

-- CreateTable
CREATE TABLE "action_options" (
  "id" UUID NOT NULL,
  "option_key" TEXT NOT NULL,
  "label_en" TEXT NOT NULL,
  "label_de" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "action_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "action_options_option_key_unique" ON "action_options"("option_key");

-- CreateTable
CREATE TABLE "recommendation_progress" (
  "id" UUID NOT NULL,
  "user_email" TEXT NOT NULL,
  "recommendation_instance_id" UUID NOT NULL,
  "bundle_key" TEXT NOT NULL,
  "progress_state" TEXT NOT NULL DEFAULT 'not_started',
  "selected_route" TEXT,
  "selected_product_id" UUID,
  "selected_action_option_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "recommendation_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recommendation_progress_instance_unique" ON "recommendation_progress"("recommendation_instance_id");
CREATE INDEX "recommendation_progress_user_email_idx" ON "recommendation_progress"("user_email");
CREATE INDEX "recommendation_progress_bundle_key_idx" ON "recommendation_progress"("bundle_key");
CREATE INDEX "recommendation_progress_progress_state_idx" ON "recommendation_progress"("progress_state");

-- CreateTable
CREATE TABLE "recommendation_progress_events" (
  "id" UUID NOT NULL,
  "user_email" TEXT NOT NULL,
  "recommendation_instance_id" UUID NOT NULL,
  "bundle_key" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "event_payload" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "recommendation_progress_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recommendation_progress_events_user_email_idx" ON "recommendation_progress_events"("user_email");
CREATE INDEX "recommendation_progress_events_instance_idx" ON "recommendation_progress_events"("recommendation_instance_id");
CREATE INDEX "recommendation_progress_events_bundle_key_idx" ON "recommendation_progress_events"("bundle_key");
CREATE INDEX "recommendation_progress_events_created_at_idx" ON "recommendation_progress_events"("created_at");

-- AddForeignKey
ALTER TABLE "recommendation_progress"
  ADD CONSTRAINT "recommendation_progress_recommendation_instance_id_fkey"
  FOREIGN KEY ("recommendation_instance_id") REFERENCES "recommendation_instances"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_progress"
  ADD CONSTRAINT "recommendation_progress_selected_product_id_fkey"
  FOREIGN KEY ("selected_product_id") REFERENCES "catalog_products"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_progress"
  ADD CONSTRAINT "recommendation_progress_selected_action_option_id_fkey"
  FOREIGN KEY ("selected_action_option_id") REFERENCES "action_options"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_progress_events"
  ADD CONSTRAINT "recommendation_progress_events_recommendation_instance_id_fkey"
  FOREIGN KEY ("recommendation_instance_id") REFERENCES "recommendation_instances"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

