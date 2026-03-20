-- Create enums for RPG item and wiki support
CREATE TYPE "Rarity" AS ENUM ('MUNDANE', 'COMMON', 'UNCOMMON', 'RARE', 'VERY_RARE', 'LEGENDARY', 'ARTIFACT', 'ELDRITCH');
CREATE TYPE "ItemType" AS ENUM ('WEAPON', 'ARMOR', 'POTION', 'SCROLL', 'WAND', 'RING', 'MISC', 'MAGIC_ITEM', 'CONSUMABLE', 'TOME', 'MYTHOS_TOME', 'RELIC');
CREATE TYPE "WikiCategory" AS ENUM ('NPC', 'LOCATION', 'FACTION', 'LORE', 'HOUSE_RULE', 'BESTIARY', 'DEITY', 'MYTHOS', 'SESSION_RECAP');

-- Add columns to existing tables
ALTER TABLE "campaigns" ADD COLUMN "system_id" TEXT;

ALTER TABLE "characters"
  ADD COLUMN "system_id" TEXT,
  ADD COLUMN "attributes" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN "resources" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN "inventory" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "notes" TEXT,
  ADD COLUMN "image_url" TEXT;

ALTER TABLE "sessions"
  ADD COLUMN "narrative_log" TEXT,
  ADD COLUMN "private_gm_notes" TEXT,
  ADD COLUMN "highlights" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "notifications" ADD COLUMN "expires_at" TIMESTAMP(3);

-- Create RPG systems table
CREATE TABLE "rpg_systems" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "dice_formula" TEXT NOT NULL,
  "attribute_schema" JSONB NOT NULL,
  "xp_table" JSONB,
  "has_spell_slots" BOOLEAN NOT NULL DEFAULT false,
  "has_sanity" BOOLEAN NOT NULL DEFAULT false,
  "has_mana" BOOLEAN NOT NULL DEFAULT false,
  "has_hero_points" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "rpg_systems_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "rpg_systems_name_key" ON "rpg_systems"("name");
CREATE UNIQUE INDEX "rpg_systems_slug_key" ON "rpg_systems"("slug");

-- Create rich item catalog
CREATE TABLE "items" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "rarity" "Rarity" NOT NULL DEFAULT 'COMMON',
  "weight" DOUBLE PRECISION,
  "value" INTEGER,
  "item_type" "ItemType" NOT NULL DEFAULT 'MISC',
  "system_id" TEXT,
  "properties" JSONB,
  "image_url" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "loot_items" (
  "id" TEXT NOT NULL,
  "loot_id" TEXT NOT NULL,
  "item_id" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "loot_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "loot_items_loot_id_item_id_key" ON "loot_items"("loot_id", "item_id");

-- Create campaign wiki
CREATE TABLE "wiki_pages" (
  "id" TEXT NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "category" "WikiCategory" NOT NULL,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "created_by" TEXT NOT NULL,
  "is_public" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "wiki_pages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "wiki_pages_campaign_id_category_idx" ON "wiki_pages"("campaign_id", "category");

-- Create persisted dice history
CREATE TABLE "dice_rolls" (
  "id" TEXT NOT NULL,
  "session_id" TEXT,
  "campaign_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "character_id" TEXT,
  "formula" TEXT NOT NULL,
  "result" INTEGER NOT NULL,
  "breakdown" JSONB NOT NULL,
  "label" TEXT,
  "is_private" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "dice_rolls_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "dice_rolls_campaign_id_created_at_idx" ON "dice_rolls"("campaign_id", "created_at");

-- Create Call of Cthulhu sanity tracking
CREATE TABLE "sanity_events" (
  "id" TEXT NOT NULL,
  "character_id" TEXT NOT NULL,
  "session_id" TEXT,
  "trigger" TEXT NOT NULL,
  "sanity_lost" INTEGER NOT NULL,
  "temp_insanity" TEXT,
  "perm_insanity" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sanity_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sanity_events_character_id_created_at_idx" ON "sanity_events"("character_id", "created_at");

-- Create Tormenta20 mana/faith cast tracking
CREATE TABLE "spell_casts" (
  "id" TEXT NOT NULL,
  "character_id" TEXT NOT NULL,
  "session_id" TEXT,
  "spell_name" TEXT NOT NULL,
  "mana_cost" INTEGER NOT NULL,
  "faith_cost" INTEGER NOT NULL DEFAULT 0,
  "result" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "spell_casts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "spell_casts_character_id_created_at_idx" ON "spell_casts"("character_id", "created_at");

-- Foreign keys
ALTER TABLE "campaigns"
  ADD CONSTRAINT "campaigns_system_id_fkey"
  FOREIGN KEY ("system_id") REFERENCES "rpg_systems"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "characters"
  ADD CONSTRAINT "characters_system_id_fkey"
  FOREIGN KEY ("system_id") REFERENCES "rpg_systems"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "items"
  ADD CONSTRAINT "items_system_id_fkey"
  FOREIGN KEY ("system_id") REFERENCES "rpg_systems"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "loot_items"
  ADD CONSTRAINT "loot_items_loot_id_fkey"
  FOREIGN KEY ("loot_id") REFERENCES "loot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "loot_items"
  ADD CONSTRAINT "loot_items_item_id_fkey"
  FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "wiki_pages"
  ADD CONSTRAINT "wiki_pages_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "wiki_pages"
  ADD CONSTRAINT "wiki_pages_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "dice_rolls"
  ADD CONSTRAINT "dice_rolls_session_id_fkey"
  FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "dice_rolls"
  ADD CONSTRAINT "dice_rolls_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "dice_rolls"
  ADD CONSTRAINT "dice_rolls_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "dice_rolls"
  ADD CONSTRAINT "dice_rolls_character_id_fkey"
  FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sanity_events"
  ADD CONSTRAINT "sanity_events_character_id_fkey"
  FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sanity_events"
  ADD CONSTRAINT "sanity_events_session_id_fkey"
  FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "spell_casts"
  ADD CONSTRAINT "spell_casts_character_id_fkey"
  FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "spell_casts"
  ADD CONSTRAINT "spell_casts_session_id_fkey"
  FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
