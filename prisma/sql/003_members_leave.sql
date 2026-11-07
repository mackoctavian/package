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
