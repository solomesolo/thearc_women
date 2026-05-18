-- CreateTable: early_access_applicants
CREATE TABLE "early_access_applicants" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "health_answer" TEXT NOT NULL,
    "user_state" TEXT NOT NULL DEFAULT 'applicant',
    "nominated_by" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "early_access_applicants_pkey" PRIMARY KEY ("id")
);

-- CreateTable: invite_codes
CREATE TABLE "invite_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "created_for" TEXT,
    "used_by_email" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used_at" TIMESTAMPTZ,

    CONSTRAINT "invite_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable: nominations
CREATE TABLE "nominations" (
    "id" TEXT NOT NULL,
    "nominator_id" TEXT NOT NULL,
    "friend_name" TEXT NOT NULL,
    "friend_email" TEXT NOT NULL,
    "invite_code" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nominations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "early_access_applicants_email_key" ON "early_access_applicants"("email");

-- CreateIndex
CREATE UNIQUE INDEX "invite_codes_code_key" ON "invite_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "nominations_invite_code_key" ON "nominations"("invite_code");

-- CreateIndex
CREATE INDEX "nominations_nominator_id_idx" ON "nominations"("nominator_id");
