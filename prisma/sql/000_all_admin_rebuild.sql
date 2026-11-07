-- DMRC admin rebuild: every database change in one script.
-- Paste the whole file into the Supabase SQL editor and press Run.
--
-- It is safe to run more than once. It only adds tables, columns and indexes;
-- nothing is dropped, renamed or changed, and no existing data is touched.
-- If you already ran some of the parts below (001, 002, 003, 004), running this
-- again simply skips what is already there.
--
--   Part 1 (001): admin access: last sign-in, invitations, activity log
--   Part 2 (002): giving and inbox: office notes, Mass scheduling
--   Part 3 (003): members directory and leave requests
--   Part 4 (004): English / Swahili translations

BEGIN;

-- ====================================================================
-- Part from prisma/sql/001_admin_access.sql
-- ====================================================================

-- DMRC admin rebuild, part A: team invitations, activity log, last sign-in.
-- Safe to run more than once. Only adds; nothing is dropped or changed.
-- Run in the Supabase SQL editor before (or right as) the PR is merged.

ALTER TABLE "admin_users" ADD COLUMN IF NOT EXISTS "last_login_at" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "admin_invites" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "AdminRole" NOT NULL DEFAULT 'EDITOR',
    "allowed_modules" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "token_hash" TEXT NOT NULL,
    "invited_by_id" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admin_invites_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "admin_invites_invited_by_id_fkey" FOREIGN KEY ("invited_by_id")
        REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "admin_invites_token_hash_key" ON "admin_invites"("token_hash");
CREATE INDEX IF NOT EXISTS "admin_invites_email_idx" ON "admin_invites"("email");

CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_name" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs"("created_at");
CREATE INDEX IF NOT EXISTS "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");
CREATE INDEX IF NOT EXISTS "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- The app talks to these tables through the server only. Turning on row level
-- security with no policies keeps them out of Supabase's public REST API.
ALTER TABLE "admin_invites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- Part from prisma/sql/002_giving_inbox.sql
-- ====================================================================

-- DMRC admin rebuild, part C: notes on gifts, Mass intentions and messages,
-- plus scheduling details for Mass intentions.
-- Safe to run more than once. Only adds columns; nothing is dropped or changed.
-- Run in the Supabase SQL editor before (or right as) the PR is merged.

ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "admin_notes" TEXT;

ALTER TABLE "mass_intentions" ADD COLUMN IF NOT EXISTS "scheduled_for" TIMESTAMP(3);
ALTER TABLE "mass_intentions" ADD COLUMN IF NOT EXISTS "celebrant" TEXT;
ALTER TABLE "mass_intentions" ADD COLUMN IF NOT EXISTS "admin_notes" TEXT;

ALTER TABLE "feedback_messages" ADD COLUMN IF NOT EXISTS "admin_notes" TEXT;

-- ====================================================================
-- Part from prisma/sql/003_members_leave.sql
-- ====================================================================

-- DMRC admin rebuild, part D: members directory and leave requests.
-- Safe to run more than once. Only adds tables; nothing is dropped or changed.
-- Run in the Supabase SQL editor before (or right as) the PR is merged.

CREATE TABLE IF NOT EXISTS "members" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "member_type" TEXT NOT NULL DEFAULT 'staff',
    "position" TEXT,
    "department" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "start_date" TIMESTAMP(3),
    "photo_url" TEXT,
    "annual_leave_days" INTEGER NOT NULL DEFAULT 21,
    "notes" TEXT,
    "admin_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "members_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "members_admin_user_id_fkey" FOREIGN KEY ("admin_user_id")
        REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "members_admin_user_id_key" ON "members"("admin_user_id");
CREATE INDEX IF NOT EXISTS "members_status_idx" ON "members"("status");
CREATE INDEX IF NOT EXISTS "members_member_type_idx" ON "members"("member_type");

CREATE TABLE IF NOT EXISTS "leave_requests" (
    "id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "leave_type" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "days" INTEGER NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewed_by_id" TEXT,
    "reviewed_by_name" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "review_note" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "leave_requests_member_id_fkey" FOREIGN KEY ("member_id")
        REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "leave_requests_member_id_idx" ON "leave_requests"("member_id");
CREATE INDEX IF NOT EXISTS "leave_requests_status_idx" ON "leave_requests"("status");
CREATE INDEX IF NOT EXISTS "leave_requests_start_date_end_date_idx" ON "leave_requests"("start_date", "end_date");

-- Server-only tables: keep them out of Supabase's public REST API.
ALTER TABLE "members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "leave_requests" ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- Part from prisma/sql/004_i18n.sql
-- ====================================================================

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

COMMIT;
