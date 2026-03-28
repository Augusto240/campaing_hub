-- CreateEnum
CREATE TYPE "GraphNodeType" AS ENUM ('WIKI_PAGE', 'CHARACTER', 'SESSION', 'ITEM', 'CREATURE', 'COMPENDIUM_ENTRY');

-- CreateEnum
CREATE TYPE "GraphEdgeType" AS ENUM ('WIKI_LINK', 'WIKI_MENTION', 'SESSION_COMBATANT', 'CHARACTER_ITEM', 'COMPENDIUM_REFERENCE');

-- CreateTable
CREATE TABLE "knowledge_nodes" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "node_type" "GraphNodeType" NOT NULL,
    "source_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "legacy_anchor" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_edges" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "edge_type" "GraphEdgeType" NOT NULL,
    "source_node_id" TEXT NOT NULL,
    "target_node_id" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_edges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_nodes_campaign_id_node_type_source_id_key" ON "knowledge_nodes"("campaign_id", "node_type", "source_id");

-- CreateIndex
CREATE INDEX "knowledge_nodes_campaign_id_node_type_idx" ON "knowledge_nodes"("campaign_id", "node_type");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_edges_campaign_id_edge_type_source_node_id_target_node_i_key" ON "knowledge_edges"("campaign_id", "edge_type", "source_node_id", "target_node_id");

-- CreateIndex
CREATE INDEX "knowledge_edges_campaign_id_edge_type_idx" ON "knowledge_edges"("campaign_id", "edge_type");

-- AddForeignKey
ALTER TABLE "knowledge_nodes" ADD CONSTRAINT "knowledge_nodes_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_edges" ADD CONSTRAINT "knowledge_edges_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_edges" ADD CONSTRAINT "knowledge_edges_source_node_id_fkey" FOREIGN KEY ("source_node_id") REFERENCES "knowledge_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_edges" ADD CONSTRAINT "knowledge_edges_target_node_id_fkey" FOREIGN KEY ("target_node_id") REFERENCES "knowledge_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
