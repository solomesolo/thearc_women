-- CreateTable
CREATE TABLE IF NOT EXISTS "llm_prompts" (
    "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
    "key"         TEXT        NOT NULL,
    "name"        TEXT        NOT NULL,
    "description" TEXT,
    "content"     TEXT        NOT NULL,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "llm_prompts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "llm_prompts_key_unique" UNIQUE ("key")
);
