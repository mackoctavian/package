-- DMRC English / Swahili support.
-- Adds two tables: translations of admin-managed content, and admin overrides
-- of interface text for the website and the mobile app.
-- Safe to run more than once. Only creates new tables; nothing existing changes.
-- Run in the Supabase SQL editor before (or right as) the PR is merged.
-- Until it runs, the site keeps working in both languages using the built-in
-- text; only saving translations from the admin needs these tables.

CREATE TABLE IF NOT EXISTS "content_translations" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "entity" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "field" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "source_hash" TEXT,
  "updated_by_id" TEXT,
  "updated_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "content_translations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "content_translations_entity_entity_id_locale_field_key"
  ON "content_translations" ("entity", "entity_id", "locale", "field");
CREATE INDEX IF NOT EXISTS "content_translations_entity_locale_idx"
  ON "content_translations" ("entity", "locale");

CREATE TABLE IF NOT EXISTS "ui_translations" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "scope" TEXT NOT NULL DEFAULT 'web',
  "locale" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "updated_by_id" TEXT,
  "updated_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ui_translations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ui_translations_scope_locale_key_key"
  ON "ui_translations" ("scope", "locale", "key");
CREATE INDEX IF NOT EXISTS "ui_translations_scope_locale_idx"
  ON "ui_translations" ("scope", "locale");

-- These tables are only read and written by the server (Prisma), never from
-- the browser, so keep them closed to Supabase's public API like the others.
ALTER TABLE "content_translations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ui_translations" ENABLE ROW LEVEL SECURITY;
