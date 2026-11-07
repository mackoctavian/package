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
