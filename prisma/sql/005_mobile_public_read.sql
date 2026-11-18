-- DMRC mobile app: read public content straight from Supabase.
--
-- The members app now reads retreats, news, publications, gallery, ministries
-- and the homepage from Supabase's Data API with the public anon key, instead
-- of going through the website. These policies let that key READ ONLY what the
-- public website already shows. It cannot write anything, and it cannot see
-- bookings, donations, Mass intentions, members or admin data (those tables
-- get no policy, so the anon key sees nothing there).
--
-- Safe to run more than once. Run it in the Supabase SQL editor.
-- The website is not affected: it reads through Prisma, which bypasses RLS.

-- 1. Make sure row level security is on for the tables the app reads.
ALTER TABLE "retreats"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "content_items"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hero_slides"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "testimonials"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ministries"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "content_translations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ui_translations"      ENABLE ROW LEVEL SECURITY;

-- 2. Let the public keys read these tables (RLS below still filters the rows).
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON "retreats", "content_items", "hero_slides", "testimonials", "ministries", "content_translations", "ui_translations"
  TO anon, authenticated;

-- 3. Read policies: only what the public website shows.

-- Retreats are all public (bookings live in another table and stay private).
DROP POLICY IF EXISTS "mobile_public_read" ON "retreats";
CREATE POLICY "mobile_public_read" ON "retreats"
  FOR SELECT TO anon, authenticated
  USING (true);

-- Published news, bookshop items and gallery media. Drafts stay hidden.
DROP POLICY IF EXISTS "mobile_public_read" ON "content_items";
CREATE POLICY "mobile_public_read" ON "content_items"
  FOR SELECT TO anon, authenticated
  USING (status = 'published' AND type IN ('news', 'publications', 'gallery'));

DROP POLICY IF EXISTS "mobile_public_read" ON "hero_slides";
CREATE POLICY "mobile_public_read" ON "hero_slides"
  FOR SELECT TO anon, authenticated
  USING ("isActive" = true);

DROP POLICY IF EXISTS "mobile_public_read" ON "testimonials";
CREATE POLICY "mobile_public_read" ON "testimonials"
  FOR SELECT TO anon, authenticated
  USING ("isActive" = true);

DROP POLICY IF EXISTS "mobile_public_read" ON "ministries";
CREATE POLICY "mobile_public_read" ON "ministries"
  FOR SELECT TO anon, authenticated
  USING ("isActive" = true);

-- Swahili translations, only for content that is itself public.
DROP POLICY IF EXISTS "mobile_public_read" ON "content_translations";
CREATE POLICY "mobile_public_read" ON "content_translations"
  FOR SELECT TO anon, authenticated
  USING (
    entity = 'retreat'
    OR (entity = 'content' AND EXISTS (
      SELECT 1 FROM "content_items" c
      WHERE c.id::text = "content_translations".entity_id
        AND c.status = 'published' AND c.type IN ('news', 'publications', 'gallery')))
    OR (entity = 'ministry' AND EXISTS (
      SELECT 1 FROM "ministries" m WHERE m.id::text = "content_translations".entity_id AND m."isActive" = true))
    OR (entity = 'hero_slide' AND EXISTS (
      SELECT 1 FROM "hero_slides" h WHERE h.id::text = "content_translations".entity_id AND h."isActive" = true))
    OR (entity = 'testimonial' AND EXISTS (
      SELECT 1 FROM "testimonials" t WHERE t.id::text = "content_translations".entity_id AND t."isActive" = true))
  );

-- Interface text the admin changed for the mobile app (not the website's).
DROP POLICY IF EXISTS "mobile_public_read" ON "ui_translations";
CREATE POLICY "mobile_public_read" ON "ui_translations"
  FOR SELECT TO anon, authenticated
  USING (scope = 'mobile');

-- 4. Tell the Data API about the new grants right away.
NOTIFY pgrst, 'reload schema';
