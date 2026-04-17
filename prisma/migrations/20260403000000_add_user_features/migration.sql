-- CreateTable: saved_articles
CREATE TABLE IF NOT EXISTS "saved_articles" (
    "id"         SERIAL      NOT NULL,
    "email"      TEXT        NOT NULL,
    "article_id" INTEGER     NOT NULL,
    "saved_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "saved_articles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "saved_articles_email_article_id_key" UNIQUE ("email", "article_id"),
    CONSTRAINT "saved_articles_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "saved_articles_email_idx" ON "saved_articles"("email");

-- CreateTable: article_views
CREATE TABLE IF NOT EXISTS "article_views" (
    "id"         SERIAL      NOT NULL,
    "email"      TEXT        NOT NULL,
    "article_id" INTEGER     NOT NULL,
    "viewed_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "article_views_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "article_views_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "article_views_email_idx" ON "article_views"("email");

-- CreateTable: collections
CREATE TABLE IF NOT EXISTS "collections" (
    "id"         SERIAL      NOT NULL,
    "email"      TEXT        NOT NULL,
    "name"       TEXT        NOT NULL,
    "color_key"  TEXT        NOT NULL DEFAULT 'stone',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "collections_email_idx" ON "collections"("email");

-- CreateTable: collection_articles
CREATE TABLE IF NOT EXISTS "collection_articles" (
    "collection_id" INTEGER NOT NULL,
    "article_id"    INTEGER NOT NULL,
    CONSTRAINT "collection_articles_pkey" PRIMARY KEY ("collection_id", "article_id"),
    CONSTRAINT "collection_articles_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "collection_articles_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable: health_plans
CREATE TABLE IF NOT EXISTS "health_plans" (
    "id"          SERIAL      NOT NULL,
    "email"       TEXT        NOT NULL,
    "name"        TEXT        NOT NULL,
    "status"      TEXT        NOT NULL DEFAULT 'active',
    "source_type" TEXT,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "health_plans_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "health_plans_email_idx" ON "health_plans"("email");

-- CreateTable: plan_items
CREATE TABLE IF NOT EXISTS "plan_items" (
    "id"          SERIAL      NOT NULL,
    "plan_id"     INTEGER     NOT NULL,
    "title"       TEXT        NOT NULL,
    "description" TEXT,
    "timing"      TEXT        NOT NULL DEFAULT 'anytime',
    "sort_order"  INTEGER     NOT NULL DEFAULT 0,
    "is_done"     BOOLEAN     NOT NULL DEFAULT FALSE,
    "article_id"  INTEGER,
    CONSTRAINT "plan_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "plan_items_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "health_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "plan_items_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable: action_logs
CREATE TABLE IF NOT EXISTS "action_logs" (
    "id"        SERIAL      NOT NULL,
    "email"     TEXT        NOT NULL,
    "plan_id"   INTEGER,
    "item_id"   INTEGER,
    "note"      TEXT,
    "logged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "action_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "action_logs_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "health_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "action_logs_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "plan_items"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "action_logs_email_idx" ON "action_logs"("email");

-- CreateTable: user_notifications
CREATE TABLE IF NOT EXISTS "user_notifications" (
    "id"         SERIAL      NOT NULL,
    "email"      TEXT        NOT NULL,
    "type"       TEXT        NOT NULL DEFAULT 'system_reminder',
    "title"      TEXT        NOT NULL,
    "body"       TEXT        NOT NULL,
    "is_read"    BOOLEAN     NOT NULL DEFAULT FALSE,
    "action_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_notifications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "user_notifications_email_idx" ON "user_notifications"("email");
