-- DMRC admin rebuild, part C: notes on gifts, Mass intentions and messages,
-- plus scheduling details for Mass intentions.
-- Safe to run more than once. Only adds columns; nothing is dropped or changed.
-- Run in the Supabase SQL editor before (or right as) the PR is merged.

ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "admin_notes" TEXT;

ALTER TABLE "mass_intentions" ADD COLUMN IF NOT EXISTS "scheduled_for" TIMESTAMP(3);
ALTER TABLE "mass_intentions" ADD COLUMN IF NOT EXISTS "celebrant" TEXT;
ALTER TABLE "mass_intentions" ADD COLUMN IF NOT EXISTS "admin_notes" TEXT;

ALTER TABLE "feedback_messages" ADD COLUMN IF NOT EXISTS "admin_notes" TEXT;
