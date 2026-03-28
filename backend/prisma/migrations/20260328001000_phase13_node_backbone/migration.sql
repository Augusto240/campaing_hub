-- Add canonical backbone fields to core_nodes while preserving legacy columns.
ALTER TABLE "core_nodes"
ADD COLUMN "type" TEXT NOT NULL DEFAULT 'MEMORY',
ADD COLUMN "title" TEXT NOT NULL DEFAULT 'Untitled',
ADD COLUMN "content" JSONB;

UPDATE "core_nodes"
SET
  "type" = COALESCE("entity_type"::text, 'MEMORY'),
  "title" = COALESCE("label", 'Untitled'),
  "content" = COALESCE("metadata", '{}'::jsonb);

CREATE INDEX "core_nodes_campaign_id_type_idx" ON "core_nodes"("campaign_id", "type");

CREATE TABLE "node_relations" (
  "id" TEXT NOT NULL,
  "from_id" TEXT NOT NULL,
  "to_id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  CONSTRAINT "node_relations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "node_relations_from_id_to_id_type_key"
ON "node_relations"("from_id", "to_id", "type");

CREATE INDEX "node_relations_from_id_idx" ON "node_relations"("from_id");
CREATE INDEX "node_relations_to_id_idx" ON "node_relations"("to_id");

ALTER TABLE "node_relations"
ADD CONSTRAINT "node_relations_from_id_fkey"
FOREIGN KEY ("from_id") REFERENCES "core_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "node_relations"
ADD CONSTRAINT "node_relations_to_id_fkey"
FOREIGN KEY ("to_id") REFERENCES "core_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
