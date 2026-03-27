-- AlterTable
ALTER TABLE "wiki_pages"
ADD COLUMN "parent_page_id" TEXT;

-- CreateIndex
CREATE INDEX "wiki_pages_campaign_id_parent_page_id_idx" ON "wiki_pages"("campaign_id", "parent_page_id");

-- AddForeignKey
ALTER TABLE "wiki_pages"
ADD CONSTRAINT "wiki_pages_parent_page_id_fkey"
FOREIGN KEY ("parent_page_id") REFERENCES "wiki_pages"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
