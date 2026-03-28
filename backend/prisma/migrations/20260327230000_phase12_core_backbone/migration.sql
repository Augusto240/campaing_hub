-- CreateEnum
CREATE TYPE "CoreEntityType" AS ENUM ('PAGE', 'CHARACTER', 'SESSION', 'COMPENDIUM_ENTRY', 'VTT_TOKEN', 'LEGACY_ANCHOR');

-- CreateEnum
CREATE TYPE "CoreRelationType" AS ENUM ('PARENT_OF', 'LINKS_TO', 'REFERENCES', 'APPEARS_IN', 'LOCATED_IN');

-- CreateEnum
CREATE TYPE "CompendiumCoreKind" AS ENUM ('CREATURE', 'SPELL', 'ITEM');

-- CreateEnum
CREATE TYPE "CompendiumCoreSource" AS ENUM ('SRD', 'HOMEBREW', 'LEGACY');

-- CreateTable
CREATE TABLE "core_pages" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "wiki_page_id" TEXT,
    "parent_page_id" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "page_type" TEXT NOT NULL DEFAULT 'WIKI',
    "summary" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "core_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_nodes" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "page_id" TEXT,
    "entity_type" "CoreEntityType" NOT NULL,
    "source_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "legacy_anchor" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "core_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_relations" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "relation_type" "CoreRelationType" NOT NULL,
    "source_node_id" TEXT NOT NULL,
    "target_node_id" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "core_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compendium_core_entries" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "system_slug" TEXT NOT NULL,
    "kind" "CompendiumCoreKind" NOT NULL,
    "source" "CompendiumCoreSource" NOT NULL DEFAULT 'HOMEBREW',
    "name" TEXT NOT NULL,
    "summary" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "content" JSONB NOT NULL DEFAULT '{}',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compendium_core_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compendium_core_favorites" (
    "id" TEXT NOT NULL,
    "entry_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compendium_core_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vtt_states" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "session_id" TEXT,
    "map_image_url" TEXT,
    "grid_size" INTEGER NOT NULL DEFAULT 56,
    "tokens" JSONB NOT NULL DEFAULT '[]',
    "fog_state" JSONB NOT NULL DEFAULT '{}',
    "lights" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "updated_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vtt_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "core_pages_wiki_page_id_key" ON "core_pages"("wiki_page_id");

-- CreateIndex
CREATE UNIQUE INDEX "core_pages_campaign_id_slug_key" ON "core_pages"("campaign_id", "slug");

-- CreateIndex
CREATE INDEX "core_pages_campaign_id_parent_page_id_idx" ON "core_pages"("campaign_id", "parent_page_id");

-- CreateIndex
CREATE UNIQUE INDEX "core_nodes_campaign_id_entity_type_source_id_key" ON "core_nodes"("campaign_id", "entity_type", "source_id");

-- CreateIndex
CREATE INDEX "core_nodes_campaign_id_entity_type_idx" ON "core_nodes"("campaign_id", "entity_type");

-- CreateIndex
CREATE UNIQUE INDEX "core_relations_campaign_id_relation_type_source_node_id_target_no_key" ON "core_relations"("campaign_id", "relation_type", "source_node_id", "target_node_id");

-- CreateIndex
CREATE INDEX "core_relations_campaign_id_relation_type_idx" ON "core_relations"("campaign_id", "relation_type");

-- CreateIndex
CREATE INDEX "compendium_core_entries_campaign_id_kind_idx" ON "compendium_core_entries"("campaign_id", "kind");

-- CreateIndex
CREATE INDEX "compendium_core_entries_system_slug_kind_name_idx" ON "compendium_core_entries"("system_slug", "kind", "name");

-- CreateIndex
CREATE UNIQUE INDEX "compendium_core_favorites_entry_id_campaign_id_user_id_key" ON "compendium_core_favorites"("entry_id", "campaign_id", "user_id");

-- CreateIndex
CREATE INDEX "compendium_core_favorites_campaign_id_user_id_idx" ON "compendium_core_favorites"("campaign_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "vtt_states_campaign_id_key" ON "vtt_states"("campaign_id");

-- CreateIndex
CREATE INDEX "vtt_states_session_id_idx" ON "vtt_states"("session_id");

-- AddForeignKey
ALTER TABLE "core_pages" ADD CONSTRAINT "core_pages_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_pages" ADD CONSTRAINT "core_pages_wiki_page_id_fkey" FOREIGN KEY ("wiki_page_id") REFERENCES "wiki_pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_pages" ADD CONSTRAINT "core_pages_parent_page_id_fkey" FOREIGN KEY ("parent_page_id") REFERENCES "core_pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_pages" ADD CONSTRAINT "core_pages_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_nodes" ADD CONSTRAINT "core_nodes_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_nodes" ADD CONSTRAINT "core_nodes_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "core_pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_relations" ADD CONSTRAINT "core_relations_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_relations" ADD CONSTRAINT "core_relations_source_node_id_fkey" FOREIGN KEY ("source_node_id") REFERENCES "core_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_relations" ADD CONSTRAINT "core_relations_target_node_id_fkey" FOREIGN KEY ("target_node_id") REFERENCES "core_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compendium_core_entries" ADD CONSTRAINT "compendium_core_entries_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compendium_core_entries" ADD CONSTRAINT "compendium_core_entries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compendium_core_favorites" ADD CONSTRAINT "compendium_core_favorites_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "compendium_core_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compendium_core_favorites" ADD CONSTRAINT "compendium_core_favorites_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compendium_core_favorites" ADD CONSTRAINT "compendium_core_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vtt_states" ADD CONSTRAINT "vtt_states_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vtt_states" ADD CONSTRAINT "vtt_states_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vtt_states" ADD CONSTRAINT "vtt_states_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
