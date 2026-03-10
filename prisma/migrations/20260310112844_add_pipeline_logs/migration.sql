-- CreateTable
CREATE TABLE "pipeline_logs" (
    "id" UUID NOT NULL,
    "event" TEXT NOT NULL,
    "message" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pipeline_logs_pkey" PRIMARY KEY ("id")
);
