-- CreateEnum
CREATE TYPE "WikiBlockType" AS ENUM ('TEXT', 'CHECKLIST', 'QUOTE', 'CALLOUT', 'CODE', 'IMAGE', 'TABLE');

-- CreateTable
CREATE TABLE "wiki_blocks" (
    "id" TEXT NOT NULL,
    "wiki_page_id" TEXT NOT NULL,
    "block_type" "WikiBlockType" NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wiki_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wiki_favorites" (
    "id" TEXT NOT NULL,
    "wiki_page_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wiki_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wiki_blocks_wiki_page_id_sort_order_idx" ON "wiki_blocks"("wiki_page_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "wiki_favorites_wiki_page_id_user_id_key" ON "wiki_favorites"("wiki_page_id", "user_id");

-- CreateIndex
CREATE INDEX "wiki_favorites_user_id_created_at_idx" ON "wiki_favorites"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "wiki_blocks" ADD CONSTRAINT "wiki_blocks_wiki_page_id_fkey" FOREIGN KEY ("wiki_page_id") REFERENCES "wiki_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiki_favorites" ADD CONSTRAINT "wiki_favorites_wiki_page_id_fkey" FOREIGN KEY ("wiki_page_id") REFERENCES "wiki_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiki_favorites" ADD CONSTRAINT "wiki_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
