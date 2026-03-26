-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('OPEN', 'DECIDED', 'CANCELLED');

-- CreateTable
CREATE TABLE "combat_encounters" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "current_turn" INTEGER NOT NULL DEFAULT 0,
    "round" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "combat_encounters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combatants" (
    "id" TEXT NOT NULL,
    "encounter_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "initiative" INTEGER NOT NULL,
    "hp" INTEGER NOT NULL,
    "max_hp" INTEGER NOT NULL,
    "is_npc" BOOLEAN NOT NULL DEFAULT false,
    "character_id" TEXT,
    "conditions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "combatants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creatures" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "system_id" TEXT NOT NULL,
    "creature_type" TEXT NOT NULL,
    "stats" JSONB NOT NULL,
    "abilities" JSONB NOT NULL,
    "loot" JSONB,
    "xp_reward" INTEGER,
    "description" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_proposals" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "proposed_by" TEXT NOT NULL,
    "dates" TIMESTAMP(3)[],
    "decided_date" TIMESTAMP(3),
    "status" "ProposalStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_votes" (
    "id" TEXT NOT NULL,
    "proposal_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "available" BOOLEAN NOT NULL,

    CONSTRAINT "session_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "combatants_encounter_id_order_idx" ON "combatants"("encounter_id", "order");

-- CreateIndex
CREATE INDEX "creatures_system_id_creature_type_idx" ON "creatures"("system_id", "creature_type");

-- CreateIndex
CREATE UNIQUE INDEX "creatures_system_id_name_key" ON "creatures"("system_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "session_votes_proposal_id_user_id_date_key" ON "session_votes"("proposal_id", "user_id", "date");

-- AddForeignKey
ALTER TABLE "combat_encounters" ADD CONSTRAINT "combat_encounters_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combatants" ADD CONSTRAINT "combatants_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "combat_encounters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combatants" ADD CONSTRAINT "combatants_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creatures" ADD CONSTRAINT "creatures_system_id_fkey" FOREIGN KEY ("system_id") REFERENCES "rpg_systems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creatures" ADD CONSTRAINT "creatures_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_proposals" ADD CONSTRAINT "session_proposals_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_proposals" ADD CONSTRAINT "session_proposals_proposed_by_fkey" FOREIGN KEY ("proposed_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_votes" ADD CONSTRAINT "session_votes_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "session_proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_votes" ADD CONSTRAINT "session_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
