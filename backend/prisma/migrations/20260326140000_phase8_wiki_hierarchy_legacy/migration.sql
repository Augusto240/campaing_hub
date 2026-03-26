-- Add hierarchy and legacy provenance fields to wiki pages
ALTER TABLE "wiki_pages"
  ADD COLUMN "parent_page_id" TEXT,
  ADD COLUMN "legacy_source" TEXT;

-- Add index to support sidebar/tree queries and legacy seed lookup
CREATE INDEX "wiki_pages_campaign_id_parent_page_id_idx"
  ON "wiki_pages"("campaign_id", "parent_page_id");

CREATE INDEX "wiki_pages_campaign_id_legacy_source_idx"
  ON "wiki_pages"("campaign_id", "legacy_source");

-- Self-relation for nested wiki pages
ALTER TABLE "wiki_pages"
  ADD CONSTRAINT "wiki_pages_parent_page_id_fkey"
  FOREIGN KEY ("parent_page_id") REFERENCES "wiki_pages"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
